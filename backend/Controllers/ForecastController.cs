using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForecastController : ControllerBase
    {
        private readonly IForecastService _forecastService;
        private readonly ILogger<ForecastController> _logger;

        public ForecastController(
            IForecastService forecastService,
            ILogger<ForecastController> logger)
        {
            _forecastService = forecastService;
            _logger = logger;
        }

        /// <summary>
        /// Retorna resumo geral do forecast de receita
        /// </summary>
        [HttpGet("resumo")]
        public async Task<ActionResult<ForecastResumoDTO>> GetResumo()
        {
            try
            {
                _logger.LogInformation("📊 Buscando resumo de forecast...");
                var resumo = await _forecastService.GetForecastResumoAsync();
                return Ok(resumo);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar forecast: {ex.Message}");
                return StatusCode(500, "Erro ao calcular previsão de receita");
            }
        }

        /// <summary>
        /// Retorna forecast mensal para os próximos N meses
        /// </summary>
        [HttpGet("mensal")]
        public async Task<ActionResult<List<ForecastMensalDTO>>> GetMensal([FromQuery] int meses = 12)
        {
            try
            {
                _logger.LogInformation($"📊 Buscando forecast mensal para {meses} meses...");
                var forecast = await _forecastService.GetForecastMensalAsync(meses);
                return Ok(forecast);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar forecast mensal: {ex.Message}");
                return StatusCode(500, "Erro ao calcular previsão mensal");
            }
        }

        /// <summary>
        /// Retorna análise do pipeline de vendas
        /// </summary>
        [HttpGet("pipeline")]
        public async Task<ActionResult<ForecastPipelineDTO>> GetPipeline()
        {
            try
            {
                _logger.LogInformation("📊 Buscando análise de pipeline...");
                var pipeline = await _forecastService.GetForecastPipelineAsync();
                return Ok(pipeline);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar pipeline: {ex.Message}");
                return StatusCode(500, "Erro ao analisar pipeline");
            }
        }

        /// <summary>
        /// Retorna lista de boletos a vencer nos próximos N dias
        /// </summary>
        [HttpGet("boletos-a-vencer")]
        public async Task<ActionResult<List<ForecastBoletoDTO>>> GetBoletosAVencer([FromQuery] int dias = 90)
        {
            try
            {
                _logger.LogInformation($"📊 Buscando boletos a vencer em {dias} dias...");
                var boletos = await _forecastService.GetBoletosAVencerAsync(dias);
                return Ok(boletos);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar boletos a vencer: {ex.Message}");
                return StatusCode(500, "Erro ao buscar boletos");
            }
        }
    }
}
