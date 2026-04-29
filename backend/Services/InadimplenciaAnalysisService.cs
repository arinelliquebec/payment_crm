using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço de análise de risco de inadimplência usando algoritmo de scoring
    /// </summary>
    public interface IInadimplenciaAnalysisService
    {
        Task<List<ClienteRiscoDTO>> GetClientesComRiscoAsync();
        Task<ClienteRiscoDetalhadoDTO?> GetRiscoClienteAsync(int clienteId);
        Task<ResumoRiscoDTO> GetResumoRiscoAsync();
    }

    public class InadimplenciaAnalysisService : IInadimplenciaAnalysisService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<InadimplenciaAnalysisService> _logger;

        public InadimplenciaAnalysisService(CrmArrighiContext context, ILogger<InadimplenciaAnalysisService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Retorna lista de clientes ordenados por risco de inadimplência
        /// </summary>
        public async Task<List<ClienteRiscoDTO>> GetClientesComRiscoAsync()
        {
            _logger.LogInformation("🔍 Iniciando análise de risco de inadimplência...");

            var resultado = new List<ClienteRiscoDTO>();

            // Buscar todos os clientes ativos
            var clientes = await _context.Clientes
                .Where(c => c.Ativo)
                .Include(c => c.PessoaFisica)
                .Include(c => c.PessoaJuridica)
                .ToListAsync();

            // Buscar todos os contratos com seus boletos
            var contratos = await _context.Contratos
                .Where(c => c.Ativo)
                .ToListAsync();

            // Buscar todos os boletos
            var boletos = await _context.Boletos
                .Include(b => b.Contrato)
                .ToListAsync();

            foreach (var cliente in clientes)
            {
                // Buscar contratos do cliente
                var contratosCliente = contratos.Where(c => c.ClienteId == cliente.Id).ToList();
                var contratosIds = contratosCliente.Select(c => c.Id).ToList();

                // Buscar boletos do cliente através dos contratos
                var boletosCliente = boletos.Where(b => contratosIds.Contains(b.ContratoId)).ToList();

                if (!boletosCliente.Any()) continue; // Pular clientes sem boletos

                var analise = CalcularRiscoCliente(cliente, boletosCliente);
                resultado.Add(analise);
            }

            // Ordenar por score de risco (maior primeiro)
            return resultado.OrderByDescending(r => r.ScoreRisco).ToList();
        }

        /// <summary>
        /// Retorna análise detalhada de risco de um cliente específico
        /// </summary>
        public async Task<ClienteRiscoDetalhadoDTO?> GetRiscoClienteAsync(int clienteId)
        {
            var cliente = await _context.Clientes
                .Where(c => c.Id == clienteId)
                .Include(c => c.PessoaFisica)
                .Include(c => c.PessoaJuridica)
                .FirstOrDefaultAsync();

            if (cliente == null) return null;

            // Buscar contratos do cliente
            var contratosCliente = await _context.Contratos
                .Where(c => c.ClienteId == clienteId && c.Ativo)
                .ToListAsync();
            var contratosIds = contratosCliente.Select(c => c.Id).ToList();

            var boletosCliente = await _context.Boletos
                .Where(b => contratosIds.Contains(b.ContratoId))
                .OrderByDescending(b => b.DueDate)
                .ToListAsync();

            var analiseBasica = CalcularRiscoCliente(cliente, boletosCliente);

            return new ClienteRiscoDetalhadoDTO
            {
                ClienteId = analiseBasica.ClienteId,
                NomeCliente = analiseBasica.NomeCliente,
                Documento = analiseBasica.Documento,
                TipoPessoa = analiseBasica.TipoPessoa,
                ScoreRisco = analiseBasica.ScoreRisco,
                NivelRisco = analiseBasica.NivelRisco,
                CorRisco = analiseBasica.CorRisco,
                TotalBoletos = analiseBasica.TotalBoletos,
                BoletosAtrasados = analiseBasica.BoletosAtrasados,
                BoletosPagos = analiseBasica.BoletosPagos,
                ValorTotalDevido = analiseBasica.ValorTotalDevido,
                ValorEmAtraso = analiseBasica.ValorEmAtraso,
                DiasAtrasoMedio = analiseBasica.DiasAtrasoMedio,
                UltimoPagamento = analiseBasica.UltimoPagamento,
                FatoresRisco = analiseBasica.FatoresRisco,
                Recomendacoes = GerarRecomendacoes(analiseBasica),
                HistoricoBoletos = boletosCliente.Take(10).Select(b => new BoletoHistoricoDTO
                {
                    Id = b.Id,
                    Valor = b.NominalValue,
                    DataVencimento = b.DueDate,
                    Status = b.Status,
                    DiasAtraso = CalcularDiasAtraso(b)
                }).ToList()
            };
        }

        /// <summary>
        /// Retorna resumo geral de risco da carteira
        /// </summary>
        public async Task<ResumoRiscoDTO> GetResumoRiscoAsync()
        {
            var clientesComRisco = await GetClientesComRiscoAsync();

            return new ResumoRiscoDTO
            {
                TotalClientesAnalisados = clientesComRisco.Count,
                ClientesAltoRisco = clientesComRisco.Count(c => c.NivelRisco == "Alto"),
                ClientesMedioRisco = clientesComRisco.Count(c => c.NivelRisco == "Médio"),
                ClientesBaixoRisco = clientesComRisco.Count(c => c.NivelRisco == "Baixo"),
                ValorTotalEmRisco = clientesComRisco.Where(c => c.NivelRisco != "Baixo").Sum(c => c.ValorEmAtraso),
                Top5ClientesRisco = clientesComRisco.Take(5).ToList(),
                DataAnalise = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Algoritmo de scoring de risco de inadimplência
        /// Score de 0 a 100 (quanto maior, maior o risco)
        /// </summary>
        private ClienteRiscoDTO CalcularRiscoCliente(Cliente cliente, List<Boleto> boletos)
        {
            double score = 0;
            var fatoresRisco = new List<string>();

            var hoje = DateTime.UtcNow.Date;

            // Métricas básicas
            var totalBoletos = boletos.Count;
            var boletosPagos = boletos.Count(b => b.Status == "LIQUIDADO" || b.Status == "BAIXADO");
            var boletosAtrasados = boletos.Count(b =>
                (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "VENCIDO") &&
                b.DueDate.Date < hoje);
            var boletosPendentes = boletos.Count(b =>
                (b.Status == "REGISTRADO" || b.Status == "ATIVO") &&
                b.DueDate.Date >= hoje);

            var valorTotalDevido = boletos
                .Where(b => b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "VENCIDO")
                .Sum(b => b.NominalValue);

            var valorEmAtraso = boletos
                .Where(b => (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "VENCIDO") && b.DueDate.Date < hoje)
                .Sum(b => b.NominalValue);

            // Calcular dias de atraso médio
            var boletosComAtraso = boletos
                .Where(b => (b.Status == "REGISTRADO" || b.Status == "ATIVO" || b.Status == "VENCIDO") && b.DueDate.Date < hoje)
                .ToList();

            var diasAtrasoMedio = boletosComAtraso.Any()
                ? boletosComAtraso.Average(b => (hoje - b.DueDate.Date).Days)
                : 0;

            // Último pagamento
            var ultimoPagamento = boletos
                .Where(b => b.Status == "LIQUIDADO" || b.Status == "BAIXADO")
                .OrderByDescending(b => b.DueDate)
                .FirstOrDefault()?.DueDate;

            // ========== FATORES DE RISCO ==========

            // 1. Taxa de inadimplência histórica (peso: 25 pontos)
            if (totalBoletos > 0)
            {
                var taxaInadimplencia = (double)boletosAtrasados / totalBoletos * 100;
                if (taxaInadimplencia > 50)
                {
                    score += 25;
                    fatoresRisco.Add($"Alta taxa de inadimplência: {taxaInadimplencia:F0}% dos boletos atrasados");
                }
                else if (taxaInadimplencia > 30)
                {
                    score += 15;
                    fatoresRisco.Add($"Taxa de inadimplência moderada: {taxaInadimplencia:F0}%");
                }
                else if (taxaInadimplencia > 10)
                {
                    score += 8;
                    fatoresRisco.Add($"Taxa de inadimplência baixa: {taxaInadimplencia:F0}%");
                }
            }

            // 2. Dias de atraso atual (peso: 25 pontos)
            if (diasAtrasoMedio > 90)
            {
                score += 25;
                fatoresRisco.Add($"Atraso crítico: média de {diasAtrasoMedio:F0} dias");
            }
            else if (diasAtrasoMedio > 60)
            {
                score += 20;
                fatoresRisco.Add($"Atraso grave: média de {diasAtrasoMedio:F0} dias");
            }
            else if (diasAtrasoMedio > 30)
            {
                score += 15;
                fatoresRisco.Add($"Atraso moderado: média de {diasAtrasoMedio:F0} dias");
            }
            else if (diasAtrasoMedio > 15)
            {
                score += 10;
                fatoresRisco.Add($"Atraso leve: média de {diasAtrasoMedio:F0} dias");
            }
            else if (diasAtrasoMedio > 0)
            {
                score += 5;
                fatoresRisco.Add($"Pequeno atraso: média de {diasAtrasoMedio:F0} dias");
            }

            // 3. Valor em atraso (peso: 20 pontos)
            if (valorEmAtraso > 50000)
            {
                score += 20;
                fatoresRisco.Add($"Alto valor em atraso: R$ {valorEmAtraso:N2}");
            }
            else if (valorEmAtraso > 20000)
            {
                score += 15;
                fatoresRisco.Add($"Valor significativo em atraso: R$ {valorEmAtraso:N2}");
            }
            else if (valorEmAtraso > 5000)
            {
                score += 10;
                fatoresRisco.Add($"Valor moderado em atraso: R$ {valorEmAtraso:N2}");
            }
            else if (valorEmAtraso > 0)
            {
                score += 5;
                fatoresRisco.Add($"Pequeno valor em atraso: R$ {valorEmAtraso:N2}");
            }

            // 4. Tempo desde último pagamento (peso: 15 pontos)
            if (ultimoPagamento.HasValue)
            {
                var diasDesdeUltimoPagamento = (hoje - ultimoPagamento.Value.Date).Days;
                if (diasDesdeUltimoPagamento > 180)
                {
                    score += 15;
                    fatoresRisco.Add($"Sem pagamento há {diasDesdeUltimoPagamento} dias");
                }
                else if (diasDesdeUltimoPagamento > 90)
                {
                    score += 10;
                    fatoresRisco.Add($"Último pagamento há {diasDesdeUltimoPagamento} dias");
                }
                else if (diasDesdeUltimoPagamento > 60)
                {
                    score += 5;
                }
            }
            else if (totalBoletos > 0)
            {
                score += 15;
                fatoresRisco.Add("Nenhum pagamento registrado");
            }

            // 5. Quantidade de boletos em atraso (peso: 15 pontos)
            if (boletosAtrasados >= 5)
            {
                score += 15;
                fatoresRisco.Add($"Múltiplos boletos em atraso: {boletosAtrasados}");
            }
            else if (boletosAtrasados >= 3)
            {
                score += 10;
                fatoresRisco.Add($"Vários boletos em atraso: {boletosAtrasados}");
            }
            else if (boletosAtrasados >= 1)
            {
                score += 5;
                fatoresRisco.Add($"Boleto(s) em atraso: {boletosAtrasados}");
            }

            // Garantir que o score está entre 0 e 100
            score = Math.Min(100, Math.Max(0, score));

            // Determinar nível de risco
            string nivelRisco;
            string corRisco;
            if (score >= 60)
            {
                nivelRisco = "Alto";
                corRisco = "#EF4444"; // Vermelho
            }
            else if (score >= 30)
            {
                nivelRisco = "Médio";
                corRisco = "#F59E0B"; // Amarelo/Laranja
            }
            else
            {
                nivelRisco = "Baixo";
                corRisco = "#10B981"; // Verde
            }

            // Nome do cliente
            var nomeCliente = cliente.PessoaFisica?.Nome
                ?? cliente.PessoaJuridica?.RazaoSocial
                ?? $"Cliente #{cliente.Id}";

            var documento = cliente.PessoaFisica?.Cpf
                ?? cliente.PessoaJuridica?.Cnpj
                ?? "";

            return new ClienteRiscoDTO
            {
                ClienteId = cliente.Id,
                NomeCliente = nomeCliente,
                Documento = documento,
                TipoPessoa = cliente.PessoaFisica != null ? "PF" : "PJ",
                ScoreRisco = (int)score,
                NivelRisco = nivelRisco,
                CorRisco = corRisco,
                TotalBoletos = totalBoletos,
                BoletosAtrasados = boletosAtrasados,
                BoletosPagos = boletosPagos,
                ValorTotalDevido = valorTotalDevido,
                ValorEmAtraso = valorEmAtraso,
                DiasAtrasoMedio = (int)diasAtrasoMedio,
                UltimoPagamento = ultimoPagamento,
                FatoresRisco = fatoresRisco
            };
        }

        private int CalcularDiasAtraso(Boleto boleto)
        {
            if (boleto.Status == "LIQUIDADO" || boleto.Status == "BAIXADO" || boleto.Status == "CANCELADO")
                return 0;

            var hoje = DateTime.UtcNow.Date;
            var vencimento = boleto.DueDate.Date;

            if (vencimento >= hoje)
                return 0;

            return (hoje - vencimento).Days;
        }

        private List<string> GerarRecomendacoes(ClienteRiscoDTO analise)
        {
            var recomendacoes = new List<string>();

            if (analise.NivelRisco == "Alto")
            {
                recomendacoes.Add("⚠️ Entrar em contato urgente com o cliente");
                recomendacoes.Add("📞 Agendar reunião para renegociação");
                if (analise.DiasAtrasoMedio > 90)
                    recomendacoes.Add("⚖️ Avaliar medidas jurídicas");
            }
            else if (analise.NivelRisco == "Médio")
            {
                recomendacoes.Add("📧 Enviar lembrete de pagamento");
                recomendacoes.Add("📅 Agendar contato preventivo");
            }
            else
            {
                recomendacoes.Add("✅ Cliente em dia - manter acompanhamento regular");
            }

            if (analise.BoletosAtrasados > 0)
            {
                recomendacoes.Add($"💰 Negociar parcelamento dos {analise.BoletosAtrasados} boleto(s) em atraso");
            }

            return recomendacoes;
        }
    }

    // ========== DTOs ==========

    public class ClienteRiscoDTO
    {
        public int ClienteId { get; set; }
        public string NomeCliente { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string TipoPessoa { get; set; } = string.Empty;
        public int ScoreRisco { get; set; }
        public string NivelRisco { get; set; } = string.Empty;
        public string CorRisco { get; set; } = string.Empty;
        public int TotalBoletos { get; set; }
        public int BoletosAtrasados { get; set; }
        public int BoletosPagos { get; set; }
        public decimal ValorTotalDevido { get; set; }
        public decimal ValorEmAtraso { get; set; }
        public int DiasAtrasoMedio { get; set; }
        public DateTime? UltimoPagamento { get; set; }
        public List<string> FatoresRisco { get; set; } = new();
    }

    public class ClienteRiscoDetalhadoDTO : ClienteRiscoDTO
    {
        public List<string> Recomendacoes { get; set; } = new();
        public List<BoletoHistoricoDTO> HistoricoBoletos { get; set; } = new();
    }

    public class BoletoHistoricoDTO
    {
        public int Id { get; set; }
        public decimal Valor { get; set; }
        public DateTime DataVencimento { get; set; }
        public string Status { get; set; } = string.Empty;
        public int DiasAtraso { get; set; }
    }

    public class ResumoRiscoDTO
    {
        public int TotalClientesAnalisados { get; set; }
        public int ClientesAltoRisco { get; set; }
        public int ClientesMedioRisco { get; set; }
        public int ClientesBaixoRisco { get; set; }
        public decimal ValorTotalEmRisco { get; set; }
        public List<ClienteRiscoDTO> Top5ClientesRisco { get; set; } = new();
        public DateTime DataAnalise { get; set; }
    }
}
