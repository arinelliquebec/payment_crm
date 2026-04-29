using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço de Dashboard Financeiro Completo
    /// Fornece dados agregados para gráficos e KPIs financeiros com cache em memória
    /// </summary>
    public interface IDashboardFinanceiroService
    {
        Task<List<EvolucaoMensalDTO>> GetEvolucaoMensalAsync(int meses = 12);
        Task<AgingInadimplenciaDTO> GetAgingInadimplenciaAsync();
        Task<ResumoPeriodoDTO> GetResumoPeriodoAsync(DateTime inicio, DateTime fim);
        Task<DistribuicaoStatusDTO> GetDistribuicaoStatusAsync();
    }

    public class DashboardFinanceiroService : IDashboardFinanceiroService
    {
        private readonly CrmArrighiContext _context;
        private readonly IMemoryCache _cache;
        private readonly ILogger<DashboardFinanceiroService> _logger;

        // Cache keys
        private const string CACHE_EVOLUCAO = "dashboard_fin_evolucao_{0}";
        private const string CACHE_AGING = "dashboard_fin_aging";
        private const string CACHE_DISTRIBUICAO = "dashboard_fin_distribuicao";
        private static readonly TimeSpan CACHE_DURATION = TimeSpan.FromMinutes(5);

        public DashboardFinanceiroService(
            CrmArrighiContext context,
            IMemoryCache cache,
            ILogger<DashboardFinanceiroService> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Evolução mensal da receita nos últimos N meses
        /// Dados para gráfico de linhas/área (Recharts)
        /// </summary>
        public async Task<List<EvolucaoMensalDTO>> GetEvolucaoMensalAsync(int meses = 12)
        {
            var cacheKey = string.Format(CACHE_EVOLUCAO, meses);
            if (_cache.TryGetValue(cacheKey, out List<EvolucaoMensalDTO>? cached) && cached != null)
            {
                _logger.LogInformation("📊 Evolução mensal retornada do cache");
                return cached;
            }

            _logger.LogInformation("📊 Calculando evolução mensal ({Meses} meses)...", meses);

            var hoje = DateTime.UtcNow.Date;
            var inicioMesAtual = new DateTime(hoje.Year, hoje.Month, 1);
            var inicioRange = inicioMesAtual.AddMonths(-(meses - 1));

            // Buscar todos os boletos ativos no range
            var boletos = await _context.Boletos
                .Where(b => b.Ativo && b.DueDate >= inicioRange)
                .Select(b => new
                {
                    b.DueDate,
                    b.NominalValue,
                    b.Status,
                    b.FoiPago,
                    b.DataCadastro
                })
                .ToListAsync();

            var resultado = new List<EvolucaoMensalDTO>();

            for (int i = 0; i < meses; i++)
            {
                var inicioMes = inicioRange.AddMonths(i);
                var fimMes = inicioMes.AddMonths(1);

                var boletosDoMes = boletos
                    .Where(b => b.DueDate >= inicioMes && b.DueDate < fimMes)
                    .ToList();

                var emitido = boletosDoMes.Sum(b => b.NominalValue);
                var recebido = boletosDoMes
                    .Where(b => b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago))
                    .Sum(b => b.NominalValue);
                var vencido = boletosDoMes
                    .Where(b => b.Status == "VENCIDO")
                    .Sum(b => b.NominalValue);
                var pendente = boletosDoMes
                    .Where(b => b.Status == "PENDENTE" || b.Status == "REGISTRADO")
                    .Sum(b => b.NominalValue);

                resultado.Add(new EvolucaoMensalDTO
                {
                    Mes = inicioMes.Month,
                    Ano = inicioMes.Year,
                    NomeMes = inicioMes.ToString("MMM", new System.Globalization.CultureInfo("pt-BR")),
                    NomeMesCompleto = inicioMes.ToString("MMMM yyyy", new System.Globalization.CultureInfo("pt-BR")),
                    Periodo = inicioMes.ToString("yyyy-MM"),
                    ValorEmitido = Math.Round(emitido, 2),
                    ValorRecebido = Math.Round(recebido, 2),
                    ValorVencido = Math.Round(vencido, 2),
                    ValorPendente = Math.Round(pendente, 2),
                    QuantidadeBoletos = boletosDoMes.Count,
                    QuantidadePagos = boletosDoMes.Count(b => b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)),
                    TaxaRecebimento = emitido > 0 ? Math.Round((recebido / emitido) * 100, 1) : 0
                });
            }

            _cache.Set(cacheKey, resultado, CACHE_DURATION);
            _logger.LogInformation("📊 Evolução mensal calculada: {Count} meses", resultado.Count);

            return resultado;
        }

        /// <summary>
        /// Aging de inadimplência - boletos vencidos agrupados por faixa de dias
        /// Dados para gráfico de barras (Recharts)
        /// </summary>
        public async Task<AgingInadimplenciaDTO> GetAgingInadimplenciaAsync()
        {
            if (_cache.TryGetValue(CACHE_AGING, out AgingInadimplenciaDTO? cached) && cached != null)
            {
                _logger.LogInformation("📊 Aging inadimplência retornado do cache");
                return cached;
            }

            _logger.LogInformation("📊 Calculando aging de inadimplência...");

            var hoje = DateTime.UtcNow.Date;

            // Boletos vencidos e ativos
            var boletosVencidos = await _context.Boletos
                .Where(b => b.Ativo &&
                       b.Status == "VENCIDO" &&
                       b.DueDate < hoje)
                .Select(b => new BoletoVencidoResumo
                {
                    DueDate = b.DueDate,
                    NominalValue = b.NominalValue,
                    ContratoId = b.ContratoId
                })
                .ToListAsync();

            // Agrupar por faixas de dias
            var faixas = new List<AgingFaixaDTO>
            {
                CriarFaixa("1-30 dias", boletosVencidos.Where(b => (hoje - b.DueDate).Days >= 1 && (hoje - b.DueDate).Days <= 30), "#f59e0b"),
                CriarFaixa("31-60 dias", boletosVencidos.Where(b => (hoje - b.DueDate).Days >= 31 && (hoje - b.DueDate).Days <= 60), "#f97316"),
                CriarFaixa("61-90 dias", boletosVencidos.Where(b => (hoje - b.DueDate).Days >= 61 && (hoje - b.DueDate).Days <= 90), "#ef4444"),
                CriarFaixa("90+ dias", boletosVencidos.Where(b => (hoje - b.DueDate).Days > 90), "#991b1b")
            };

            var resultado = new AgingInadimplenciaDTO
            {
                Faixas = faixas,
                TotalValorVencido = Math.Round(boletosVencidos.Sum(b => b.NominalValue), 2),
                TotalBoletosVencidos = boletosVencidos.Count,
                ContratosAfetados = boletosVencidos.Select(b => b.ContratoId).Distinct().Count(),
                MediaDiasAtraso = boletosVencidos.Any()
                    ? Math.Round(boletosVencidos.Average(b => (hoje - b.DueDate).Days), 0)
                    : 0,
                DataAnalise = DateTime.UtcNow
            };

            _cache.Set(CACHE_AGING, resultado, CACHE_DURATION);
            _logger.LogInformation("📊 Aging calculado: {Total} boletos vencidos em {Faixas} faixas",
                resultado.TotalBoletosVencidos, faixas.Count);

            return resultado;
        }

        /// <summary>
        /// Resumo de KPIs para um período específico, com comparativo ao período anterior
        /// Alimenta os cards de KPI com setas de tendência
        /// </summary>
        public async Task<ResumoPeriodoDTO> GetResumoPeriodoAsync(DateTime inicio, DateTime fim)
        {
            _logger.LogInformation("📊 Calculando resumo do período {Inicio:yyyy-MM-dd} a {Fim:yyyy-MM-dd}...", inicio, fim);

            var duracao = (fim - inicio).Days;
            var inicioAnterior = inicio.AddDays(-duracao);
            var fimAnterior = inicio;

            // Período atual
            var boletosAtual = await GetBoletosNoPeriodo(inicio, fim);
            var kpiAtual = CalcularKPIs(boletosAtual);

            // Período anterior (para comparação)
            var boletosAnterior = await GetBoletosNoPeriodo(inicioAnterior, fimAnterior);
            var kpiAnterior = CalcularKPIs(boletosAnterior);

            // Contratos do período
            var contratosAtual = await _context.Contratos
                .CountAsync(c => c.Ativo && c.DataCadastro >= inicio && c.DataCadastro < fim);
            var contratosAnterior = await _context.Contratos
                .CountAsync(c => c.Ativo && c.DataCadastro >= inicioAnterior && c.DataCadastro < fimAnterior);

            // Contratos fechados no período
            var contratosFechadosAtual = await _context.Contratos
                .CountAsync(c => c.Ativo &&
                       c.Situacao == "Contrato Assinado" &&
                       c.DataFechamentoContrato >= inicio &&
                       c.DataFechamentoContrato < fim);

            return new ResumoPeriodoDTO
            {
                Inicio = inicio,
                Fim = fim,
                DiasNoPeriodo = duracao,

                // Valores do período atual
                ReceitaTotal = kpiAtual.ReceitaTotal,
                ValorEmitido = kpiAtual.ValorEmitido,
                ValorPendente = kpiAtual.ValorPendente,
                ValorVencido = kpiAtual.ValorVencido,
                TotalBoletos = kpiAtual.TotalBoletos,
                BoletosPagos = kpiAtual.BoletosPagos,
                BoletosVencidos = kpiAtual.BoletosVencidos,
                TaxaRecebimento = kpiAtual.TaxaRecebimento,
                NovosContratos = contratosAtual,
                ContratosFechados = contratosFechadosAtual,

                // Comparativo com período anterior
                ReceitaAnterior = kpiAnterior.ReceitaTotal,
                ValorEmitidoAnterior = kpiAnterior.ValorEmitido,
                BoletosAnterior = kpiAnterior.TotalBoletos,
                ContratosAnterior = contratosAnterior,

                // Variações percentuais
                VariacaoReceita = CalcularVariacao(kpiAtual.ReceitaTotal, kpiAnterior.ReceitaTotal),
                VariacaoEmitido = CalcularVariacao(kpiAtual.ValorEmitido, kpiAnterior.ValorEmitido),
                VariacaoBoletos = CalcularVariacao(kpiAtual.TotalBoletos, kpiAnterior.TotalBoletos),
                VariacaoContratos = CalcularVariacao(contratosAtual, contratosAnterior),

                DataAnalise = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Distribuição atual dos boletos por status
        /// Dados para gráfico de pizza/donut (Recharts)
        /// </summary>
        public async Task<DistribuicaoStatusDTO> GetDistribuicaoStatusAsync()
        {
            if (_cache.TryGetValue(CACHE_DISTRIBUICAO, out DistribuicaoStatusDTO? cached) && cached != null)
            {
                _logger.LogInformation("📊 Distribuição de status retornada do cache");
                return cached;
            }

            _logger.LogInformation("📊 Calculando distribuição de status...");

            var boletos = await _context.Boletos
                .Where(b => b.Ativo)
                .GroupBy(b => b.Status)
                .Select(g => new
                {
                    Status = g.Key,
                    Quantidade = g.Count(),
                    Valor = g.Sum(b => b.NominalValue)
                })
                .ToListAsync();

            var total = boletos.Sum(b => b.Quantidade);
            var coresStatus = new Dictionary<string, string>
            {
                { "PENDENTE", "#f59e0b" },
                { "REGISTRADO", "#3b82f6" },
                { "LIQUIDADO", "#10b981" },
                { "VENCIDO", "#ef4444" },
                { "CANCELADO", "#6b7280" },
                { "BAIXADO", "#8b5cf6" },
                { "ATIVO", "#06b6d4" }
            };

            var resultado = new DistribuicaoStatusDTO
            {
                Itens = boletos.Select(b => new DistribuicaoItemDTO
                {
                    Status = b.Status,
                    Label = FormatarStatusLabel(b.Status),
                    Quantidade = b.Quantidade,
                    Valor = Math.Round(b.Valor, 2),
                    Percentual = total > 0 ? Math.Round((decimal)b.Quantidade / total * 100, 1) : 0,
                    Cor = coresStatus.GetValueOrDefault(b.Status, "#9ca3af")
                }).OrderByDescending(i => i.Quantidade).ToList(),
                TotalBoletos = total,
                ValorTotal = Math.Round(boletos.Sum(b => b.Valor), 2),
                DataAnalise = DateTime.UtcNow
            };

            _cache.Set(CACHE_DISTRIBUICAO, resultado, CACHE_DURATION);
            return resultado;
        }

        // ========== Helpers ==========

        private static AgingFaixaDTO CriarFaixa(string nome, IEnumerable<BoletoVencidoResumo> boletos, string cor)
        {
            var lista = boletos.ToList();
            return new AgingFaixaDTO
            {
                Faixa = nome,
                Quantidade = lista.Count,
                Valor = Math.Round(lista.Sum(b => b.NominalValue), 2),
                Cor = cor
            };
        }

        private async Task<List<BoletoResumo>> GetBoletosNoPeriodo(DateTime inicio, DateTime fim)
        {
            return await _context.Boletos
                .Where(b => b.Ativo && b.DueDate >= inicio && b.DueDate < fim)
                .Select(b => new BoletoResumo
                {
                    NominalValue = b.NominalValue,
                    Status = b.Status,
                    FoiPago = b.FoiPago
                })
                .ToListAsync();
        }

        private KpiInterno CalcularKPIs(List<BoletoResumo> boletos)
        {
            var receitaTotal = boletos
                .Where(b => b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago))
                .Sum(b => b.NominalValue);

            var valorEmitido = boletos.Sum(b => b.NominalValue);
            var valorPendente = boletos
                .Where(b => b.Status == "PENDENTE" || b.Status == "REGISTRADO")
                .Sum(b => b.NominalValue);
            var valorVencido = boletos
                .Where(b => b.Status == "VENCIDO")
                .Sum(b => b.NominalValue);

            return new KpiInterno
            {
                ReceitaTotal = Math.Round(receitaTotal, 2),
                ValorEmitido = Math.Round(valorEmitido, 2),
                ValorPendente = Math.Round(valorPendente, 2),
                ValorVencido = Math.Round(valorVencido, 2),
                TotalBoletos = boletos.Count,
                BoletosPagos = boletos.Count(b => b.Status == "LIQUIDADO" || (b.Status == "BAIXADO" && b.FoiPago)),
                BoletosVencidos = boletos.Count(b => b.Status == "VENCIDO"),
                TaxaRecebimento = valorEmitido > 0 ? Math.Round((receitaTotal / valorEmitido) * 100, 1) : 0
            };
        }

        private static decimal CalcularVariacao(decimal atual, decimal anterior)
        {
            if (anterior == 0) return atual > 0 ? 100 : 0;
            return Math.Round(((atual - anterior) / anterior) * 100, 1);
        }

        private static string FormatarStatusLabel(string status) => status switch
        {
            "PENDENTE" => "Pendentes",
            "REGISTRADO" => "Registrados",
            "LIQUIDADO" => "Liquidados",
            "VENCIDO" => "Vencidos",
            "CANCELADO" => "Cancelados",
            "BAIXADO" => "Baixados",
            "ATIVO" => "Ativos",
            _ => status
        };

        // Classes internas auxiliares
        private class BoletoResumo
        {
            public decimal NominalValue { get; set; }
            public string Status { get; set; } = string.Empty;
            public bool FoiPago { get; set; }
        }

        private class BoletoVencidoResumo
        {
            public DateTime DueDate { get; set; }
            public decimal NominalValue { get; set; }
            public int ContratoId { get; set; }
        }

        private class KpiInterno
        {
            public decimal ReceitaTotal { get; set; }
            public decimal ValorEmitido { get; set; }
            public decimal ValorPendente { get; set; }
            public decimal ValorVencido { get; set; }
            public int TotalBoletos { get; set; }
            public int BoletosPagos { get; set; }
            public int BoletosVencidos { get; set; }
            public decimal TaxaRecebimento { get; set; }
        }
    }

    // ========== DTOs ==========

    public class EvolucaoMensalDTO
    {
        public int Mes { get; set; }
        public int Ano { get; set; }
        public string NomeMes { get; set; } = string.Empty;
        public string NomeMesCompleto { get; set; } = string.Empty;
        public string Periodo { get; set; } = string.Empty;
        public decimal ValorEmitido { get; set; }
        public decimal ValorRecebido { get; set; }
        public decimal ValorVencido { get; set; }
        public decimal ValorPendente { get; set; }
        public int QuantidadeBoletos { get; set; }
        public int QuantidadePagos { get; set; }
        public decimal TaxaRecebimento { get; set; }
    }

    public class AgingInadimplenciaDTO
    {
        public List<AgingFaixaDTO> Faixas { get; set; } = new();
        public decimal TotalValorVencido { get; set; }
        public int TotalBoletosVencidos { get; set; }
        public int ContratosAfetados { get; set; }
        public double MediaDiasAtraso { get; set; }
        public DateTime DataAnalise { get; set; }
    }

    public class AgingFaixaDTO
    {
        public string Faixa { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Valor { get; set; }
        public string Cor { get; set; } = string.Empty;
    }

    public class ResumoPeriodoDTO
    {
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }
        public int DiasNoPeriodo { get; set; }

        // Período atual
        public decimal ReceitaTotal { get; set; }
        public decimal ValorEmitido { get; set; }
        public decimal ValorPendente { get; set; }
        public decimal ValorVencido { get; set; }
        public int TotalBoletos { get; set; }
        public int BoletosPagos { get; set; }
        public int BoletosVencidos { get; set; }
        public decimal TaxaRecebimento { get; set; }
        public int NovosContratos { get; set; }
        public int ContratosFechados { get; set; }

        // Período anterior (comparativo)
        public decimal ReceitaAnterior { get; set; }
        public decimal ValorEmitidoAnterior { get; set; }
        public int BoletosAnterior { get; set; }
        public int ContratosAnterior { get; set; }

        // Variações (%)
        public decimal VariacaoReceita { get; set; }
        public decimal VariacaoEmitido { get; set; }
        public decimal VariacaoBoletos { get; set; }
        public decimal VariacaoContratos { get; set; }

        public DateTime DataAnalise { get; set; }
    }

    public class DistribuicaoStatusDTO
    {
        public List<DistribuicaoItemDTO> Itens { get; set; } = new();
        public int TotalBoletos { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataAnalise { get; set; }
    }

    public class DistribuicaoItemDTO
    {
        public string Status { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Quantidade { get; set; }
        public decimal Valor { get; set; }
        public decimal Percentual { get; set; }
        public string Cor { get; set; } = string.Empty;
    }
}
