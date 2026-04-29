using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    /// <summary>
    /// Controller do Dashboard Financeiro Completo
    /// Endpoints dedicados para gráficos e KPIs com dados agregados
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardFinanceiroController : ControllerBase
    {
        private readonly IDashboardFinanceiroService _service;
        private readonly ILogger<DashboardFinanceiroController> _logger;

        public DashboardFinanceiroController(
            IDashboardFinanceiroService service,
            ILogger<DashboardFinanceiroController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Evolução mensal da receita (últimos N meses)
        /// Alimenta gráfico de linhas/área
        /// </summary>
        [HttpGet("evolucao-mensal")]
        public async Task<ActionResult<List<EvolucaoMensalDTO>>> GetEvolucaoMensal([FromQuery] int meses = 12)
        {
            try
            {
                _logger.LogInformation("📊 Buscando evolução mensal ({Meses} meses)...", meses);

                if (meses < 1 || meses > 36)
                {
                    return BadRequest("O parâmetro 'meses' deve ser entre 1 e 36.");
                }

                var resultado = await _service.GetEvolucaoMensalAsync(meses);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar evolução mensal");
                return StatusCode(500, new { error = "Erro ao calcular evolução mensal" });
            }
        }

        /// <summary>
        /// Aging de inadimplência - boletos vencidos por faixa de dias
        /// Alimenta gráfico de barras
        /// </summary>
        [HttpGet("aging-inadimplencia")]
        public async Task<ActionResult<AgingInadimplenciaDTO>> GetAgingInadimplencia()
        {
            try
            {
                _logger.LogInformation("📊 Buscando aging de inadimplência...");
                var resultado = await _service.GetAgingInadimplenciaAsync();
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar aging de inadimplência");
                return StatusCode(500, new { error = "Erro ao calcular aging de inadimplência" });
            }
        }

        /// <summary>
        /// Resumo de KPIs para um período específico com comparativo
        /// Alimenta cards de KPI com tendências
        /// </summary>
        [HttpGet("resumo-periodo")]
        public async Task<ActionResult<ResumoPeriodoDTO>> GetResumoPeriodo(
            [FromQuery] DateTime? inicio,
            [FromQuery] DateTime? fim)
        {
            try
            {
                // Default: mês atual
                var dataInicio = inicio ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var dataFim = fim ?? DateTime.UtcNow.Date.AddDays(1);

                _logger.LogInformation("📊 Buscando resumo do período {Inicio:yyyy-MM-dd} a {Fim:yyyy-MM-dd}...",
                    dataInicio, dataFim);

                if (dataFim <= dataInicio)
                {
                    return BadRequest("A data de fim deve ser posterior à data de início.");
                }

                if ((dataFim - dataInicio).Days > 365)
                {
                    return BadRequest("O período máximo é de 365 dias.");
                }

                var resultado = await _service.GetResumoPeriodoAsync(dataInicio, dataFim);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar resumo do período");
                return StatusCode(500, new { error = "Erro ao calcular resumo do período" });
            }
        }

        /// <summary>
        /// Distribuição de boletos por status
        /// Alimenta gráfico de pizza/donut
        /// </summary>
        [HttpGet("distribuicao-status")]
        public async Task<ActionResult<DistribuicaoStatusDTO>> GetDistribuicaoStatus()
        {
            try
            {
                _logger.LogInformation("📊 Buscando distribuição de status...");
                var resultado = await _service.GetDistribuicaoStatusAsync();
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar distribuição de status");
                return StatusCode(500, new { error = "Erro ao calcular distribuição de status" });
            }
        }
    }
}
