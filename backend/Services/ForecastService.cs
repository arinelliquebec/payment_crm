using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço de Previsão de Receita (Forecast)
    /// Analisa contratos, boletos e histórico para projetar receitas futuras
    /// </summary>
    public interface IForecastService
    {
        Task<ForecastResumoDTO> GetForecastResumoAsync();
        Task<List<ForecastMensalDTO>> GetForecastMensalAsync(int meses = 12);
        Task<ForecastPipelineDTO> GetForecastPipelineAsync();
        Task<List<ForecastBoletoDTO>> GetBoletosAVencerAsync(int dias = 90);
    }

    public class ForecastService : IForecastService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<ForecastService> _logger;

        public ForecastService(CrmArrighiContext context, ILogger<ForecastService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retorna resumo geral do forecast
        /// </summary>
        public async Task<ForecastResumoDTO> GetForecastResumoAsync()
        {
            _logger.LogInformation("📊 Calculando forecast de receita...");

            var hoje = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
            var fimMes = inicioMes.AddMonths(1).AddDays(-1);
            var inicioProximoMes = inicioMes.AddMonths(1);
            var fimProximoMes = inicioProximoMes.AddMonths(1).AddDays(-1);
            var inicioTrimestre = inicioMes.AddMonths(3);

            // Boletos a vencer este mês
            var boletosEsteMes = await _context.Boletos
                .Where(b => b.Ativo &&
                       (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "PENDENTE") &&
                       b.DueDate >= hoje && b.DueDate <= fimMes)
                .ToListAsync();

            // Boletos a vencer próximo mês
            var boletosProximoMes = await _context.Boletos
                .Where(b => b.Ativo &&
                       (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "PENDENTE") &&
                       b.DueDate >= inicioProximoMes && b.DueDate <= fimProximoMes)
                .ToListAsync();

            // Boletos a vencer no trimestre
            var boletosTrimestre = await _context.Boletos
                .Where(b => b.Ativo &&
                       (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "PENDENTE") &&
                       b.DueDate >= hoje && b.DueDate < inicioTrimestre)
                .ToListAsync();

            // Contratos em negociação (pipeline)
            var contratosEmNegociacao = await _context.Contratos
                .Where(c => c.Ativo &&
                       (c.Situacao == "Prospecto" || c.Situacao == "Contrato Enviado"))
                .ToListAsync();

            // Calcular receita esperada do pipeline (com probabilidade)
            var receitaPipelineEstimada = contratosEmNegociacao.Sum(c =>
            {
                var valor = c.ValorNegociado ?? c.ValorDevido ?? 0;
                var probabilidade = c.Situacao == "Contrato Enviado" ? 0.7m : 0.3m; // 70% se enviado, 30% se prospecto
                return valor * probabilidade;
            });

            // Histórico - receita realizada nos últimos 3 meses
            var inicio3Meses = inicioMes.AddMonths(-3);
            var receitaUltimos3Meses = await _context.Boletos
                .Where(b => b.Status == "LIQUIDADO" &&
                       b.DueDate >= inicio3Meses && b.DueDate < inicioMes)
                .SumAsync(b => b.NominalValue);

            var mediaReceitaMensal = receitaUltimos3Meses / 3;

            // Taxa de conversão histórica
            var contratosTotal = await _context.Contratos.CountAsync(c => c.Ativo);
            var contratosFechados = await _context.Contratos
                .CountAsync(c => c.Ativo && c.Situacao == "Contrato Assinado");
            var taxaConversao = contratosTotal > 0 ? (decimal)contratosFechados / contratosTotal * 100 : 0;

            return new ForecastResumoDTO
            {
                ReceitaEsperadaMesAtual = boletosEsteMes.Sum(b => b.NominalValue),
                ReceitaEsperadaProximoMes = boletosProximoMes.Sum(b => b.NominalValue),
                ReceitaEsperadaTrimestre = boletosTrimestre.Sum(b => b.NominalValue),
                ReceitaPipelineEstimada = receitaPipelineEstimada,
                MediaReceitaMensal = mediaReceitaMensal,
                TaxaConversaoHistorica = Math.Round(taxaConversao, 1),
                TotalBoletosAVencer = boletosTrimestre.Count,
                TotalContratosEmNegociacao = contratosEmNegociacao.Count,
                DataAnalise = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Retorna forecast mensal para os próximos N meses
        /// </summary>
        public async Task<List<ForecastMensalDTO>> GetForecastMensalAsync(int meses = 12)
        {
            var resultado = new List<ForecastMensalDTO>();
            var hoje = DateTime.UtcNow.Date;
            var inicioMesAtual = new DateTime(hoje.Year, hoje.Month, 1);

            // Buscar todos os boletos ativos a vencer
            var todosBoletos = await _context.Boletos
                .Where(b => b.Ativo &&
                       (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "PENDENTE") &&
                       b.DueDate >= hoje)
                .ToListAsync();

            // Buscar histórico de boletos liquidados (últimos 12 meses)
            var inicio12Meses = inicioMesAtual.AddMonths(-12);
            var boletosLiquidados = await _context.Boletos
                .Where(b => b.Status == "LIQUIDADO" && b.DueDate >= inicio12Meses)
                .ToListAsync();

            // Calcular média histórica por mês para projeção
            var mediaHistoricaPorMes = new Dictionary<int, decimal>();
            for (int i = 1; i <= 12; i++)
            {
                var boletosDoMes = boletosLiquidados.Where(b => b.DueDate.Month == i);
                mediaHistoricaPorMes[i] = boletosDoMes.Any() ? boletosDoMes.Average(b => b.NominalValue) * boletosDoMes.Count() : 0;
            }

            for (int i = 0; i < meses; i++)
            {
                var inicioMes = inicioMesAtual.AddMonths(i);
                var fimMes = inicioMes.AddMonths(1).AddDays(-1);

                // Boletos confirmados para este mês
                var boletosDoMes = todosBoletos
                    .Where(b => b.DueDate >= inicioMes && b.DueDate <= fimMes)
                    .ToList();

                var receitaConfirmada = boletosDoMes.Sum(b => b.NominalValue);
                var quantidadeBoletos = boletosDoMes.Count;

                // Projeção baseada em histórico (para meses sem boletos confirmados)
                var receitaProjetada = receitaConfirmada;
                if (receitaConfirmada == 0 && mediaHistoricaPorMes.ContainsKey(inicioMes.Month))
                {
                    receitaProjetada = mediaHistoricaPorMes[inicioMes.Month];
                }

                // Calcular tendência (comparação com mesmo mês ano anterior)
                var mesmoMesAnoAnterior = inicioMes.AddYears(-1);
                var receitaMesmoMesAnterior = boletosLiquidados
                    .Where(b => b.DueDate.Month == mesmoMesAnoAnterior.Month &&
                           b.DueDate.Year == mesmoMesAnoAnterior.Year)
                    .Sum(b => b.NominalValue);

                var tendencia = receitaMesmoMesAnterior > 0
                    ? ((receitaProjetada - receitaMesmoMesAnterior) / receitaMesmoMesAnterior) * 100
                    : 0;

                resultado.Add(new ForecastMensalDTO
                {
                    Mes = inicioMes.Month,
                    Ano = inicioMes.Year,
                    NomeMes = inicioMes.ToString("MMMM", new System.Globalization.CultureInfo("pt-BR")),
                    ReceitaConfirmada = receitaConfirmada,
                    ReceitaProjetada = receitaProjetada,
                    QuantidadeBoletos = quantidadeBoletos,
                    Tendencia = Math.Round(tendencia, 1),
                    Confiabilidade = receitaConfirmada > 0 ? "Alta" : (i < 3 ? "Média" : "Baixa")
                });
            }

            return resultado;
        }

        /// <summary>
        /// Retorna análise do pipeline de vendas
        /// </summary>
        public async Task<ForecastPipelineDTO> GetForecastPipelineAsync()
        {
            var contratos = await _context.Contratos
                .Where(c => c.Ativo)
                .ToListAsync();

            // Agrupar por situação
            var leads = contratos.Where(c => c.Situacao == "Lead" || c.Situacao == "Leed").ToList();
            var prospectos = contratos.Where(c => c.Situacao == "Prospecto").ToList();
            var enviados = contratos.Where(c => c.Situacao == "Contrato Enviado").ToList();
            var assinados = contratos.Where(c => c.Situacao == "Contrato Assinado").ToList();
            var retornar = contratos.Where(c => c.Situacao == "Retornar").ToList();

            // Calcular valores por etapa
            decimal CalcularValor(List<Contrato> lista) =>
                lista.Sum(c => c.ValorNegociado ?? c.ValorDevido ?? 0);

            // Probabilidades de conversão por etapa
            var probabilidades = new Dictionary<string, decimal>
            {
                { "Lead", 0.10m },      // 10%
                { "Prospecto", 0.30m }, // 30%
                { "Contrato Enviado", 0.70m }, // 70%
                { "Retornar", 0.20m }   // 20%
            };

            var etapas = new List<PipelineEtapaDTO>
            {
                new PipelineEtapaDTO
                {
                    Etapa = "Lead",
                    Quantidade = leads.Count,
                    ValorTotal = CalcularValor(leads),
                    ValorPonderado = CalcularValor(leads) * probabilidades["Lead"],
                    Probabilidade = 10,
                    Cor = "#94a3b8" // Cinza
                },
                new PipelineEtapaDTO
                {
                    Etapa = "Prospecto",
                    Quantidade = prospectos.Count,
                    ValorTotal = CalcularValor(prospectos),
                    ValorPonderado = CalcularValor(prospectos) * probabilidades["Prospecto"],
                    Probabilidade = 30,
                    Cor = "#f59e0b" // Amarelo
                },
                new PipelineEtapaDTO
                {
                    Etapa = "Contrato Enviado",
                    Quantidade = enviados.Count,
                    ValorTotal = CalcularValor(enviados),
                    ValorPonderado = CalcularValor(enviados) * probabilidades["Contrato Enviado"],
                    Probabilidade = 70,
                    Cor = "#3b82f6" // Azul
                },
                new PipelineEtapaDTO
                {
                    Etapa = "Contrato Assinado",
                    Quantidade = assinados.Count,
                    ValorTotal = CalcularValor(assinados),
                    ValorPonderado = CalcularValor(assinados), // 100%
                    Probabilidade = 100,
                    Cor = "#10b981" // Verde
                },
                new PipelineEtapaDTO
                {
                    Etapa = "Retornar",
                    Quantidade = retornar.Count,
                    ValorTotal = CalcularValor(retornar),
                    ValorPonderado = CalcularValor(retornar) * probabilidades["Retornar"],
                    Probabilidade = 20,
                    Cor = "#8b5cf6" // Roxo
                }
            };

            return new ForecastPipelineDTO
            {
                Etapas = etapas,
                ValorTotalPipeline = etapas.Sum(e => e.ValorTotal),
                ValorPonderadoTotal = etapas.Sum(e => e.ValorPonderado),
                TotalContratos = contratos.Count
            };
        }

        /// <summary>
        /// Retorna lista de boletos a vencer nos próximos N dias
        /// </summary>
        public async Task<List<ForecastBoletoDTO>> GetBoletosAVencerAsync(int dias = 90)
        {
            var hoje = DateTime.UtcNow.Date;
            var dataLimite = hoje.AddDays(dias);

            var boletos = await _context.Boletos
                .Where(b => b.Ativo &&
                       (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "PENDENTE") &&
                       b.DueDate >= hoje && b.DueDate <= dataLimite)
                .Include(b => b.Contrato)
                    .ThenInclude(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                .Include(b => b.Contrato)
                    .ThenInclude(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                .OrderBy(b => b.DueDate)
                .Take(100)
                .ToListAsync();

            return boletos.Select(b => new ForecastBoletoDTO
            {
                BoletoId = b.Id,
                ContratoId = b.ContratoId,
                NomeCliente = b.Contrato?.Cliente?.PessoaFisica?.Nome
                    ?? b.Contrato?.Cliente?.PessoaJuridica?.RazaoSocial
                    ?? b.PayerName,
                Valor = b.NominalValue,
                DataVencimento = b.DueDate,
                DiasParaVencer = (b.DueDate.Date - hoje).Days,
                Status = b.Status
            }).ToList();
        }
    }

    // ========== DTOs ==========

    public class ForecastResumoDTO
    {
        public decimal ReceitaEsperadaMesAtual { get; set; }
        public decimal ReceitaEsperadaProximoMes { get; set; }
        public decimal ReceitaEsperadaTrimestre { get; set; }
        public decimal ReceitaPipelineEstimada { get; set; }
        public decimal MediaReceitaMensal { get; set; }
        public decimal TaxaConversaoHistorica { get; set; }
        public int TotalBoletosAVencer { get; set; }
        public int TotalContratosEmNegociacao { get; set; }
        public DateTime DataAnalise { get; set; }
    }

    public class ForecastMensalDTO
    {
        public int Mes { get; set; }
        public int Ano { get; set; }
        public string NomeMes { get; set; } = string.Empty;
        public decimal ReceitaConfirmada { get; set; }
        public decimal ReceitaProjetada { get; set; }
        public int QuantidadeBoletos { get; set; }
        public decimal Tendencia { get; set; }
        public string Confiabilidade { get; set; } = string.Empty;
    }

    public class ForecastPipelineDTO
    {
        public List<PipelineEtapaDTO> Etapas { get; set; } = new();
        public decimal ValorTotalPipeline { get; set; }
        public decimal ValorPonderadoTotal { get; set; }
        public int TotalContratos { get; set; }
    }

    public class PipelineEtapaDTO
    {
        public string Etapa { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal ValorPonderado { get; set; }
        public int Probabilidade { get; set; }
        public string Cor { get; set; } = string.Empty;
    }

    public class ForecastBoletoDTO
    {
        public int BoletoId { get; set; }
        public int ContratoId { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public decimal Valor { get; set; }
        public DateTime DataVencimento { get; set; }
        public int DiasParaVencer { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
