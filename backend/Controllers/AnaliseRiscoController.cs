using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnaliseRiscoController : ControllerBase
    {
        private readonly IInadimplenciaAnalysisService _analiseService;
        private readonly ILogger<AnaliseRiscoController> _logger;

        public AnaliseRiscoController(
            IInadimplenciaAnalysisService analiseService,
            ILogger<AnaliseRiscoController> logger)
        {
            _analiseService = analiseService;
            _logger = logger;
        }

        /// <summary>
        /// Retorna resumo geral de risco de inadimplência da carteira
        /// </summary>
        [HttpGet("resumo")]
        public async Task<ActionResult<ResumoRiscoDTO>> GetResumoRisco()
        {
            try
            {
                _logger.LogInformation("📊 Buscando resumo de risco de inadimplência...");
                var resumo = await _analiseService.GetResumoRiscoAsync();
                _logger.LogInformation($"✅ Resumo gerado: {resumo.TotalClientesAnalisados} clientes analisados, {resumo.ClientesAltoRisco} em alto risco");
                return Ok(resumo);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar resumo de risco: {ex.Message}");
                return StatusCode(500, "Erro ao analisar risco de inadimplência");
            }
        }

        /// <summary>
        /// Retorna lista completa de clientes ordenados por risco
        /// </summary>
        [HttpGet("clientes")]
        public async Task<ActionResult<List<ClienteRiscoDTO>>> GetClientesComRisco()
        {
            try
            {
                _logger.LogInformation("📊 Buscando lista de clientes com risco...");
                var clientes = await _analiseService.GetClientesComRiscoAsync();
                _logger.LogInformation($"✅ {clientes.Count} clientes analisados");
                return Ok(clientes);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar clientes com risco: {ex.Message}");
                return StatusCode(500, "Erro ao analisar risco de inadimplência");
            }
        }

        /// <summary>
        /// Retorna análise detalhada de risco de um cliente específico
        /// </summary>
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<ClienteRiscoDetalhadoDTO>> GetRiscoCliente(int clienteId)
        {
            try
            {
                _logger.LogInformation($"📊 Buscando análise de risco do cliente {clienteId}...");
                var analise = await _analiseService.GetRiscoClienteAsync(clienteId);

                if (analise == null)
                {
                    return NotFound($"Cliente {clienteId} não encontrado");
                }

                _logger.LogInformation($"✅ Análise do cliente {clienteId}: Score {analise.ScoreRisco} ({analise.NivelRisco})");
                return Ok(analise);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Erro ao buscar risco do cliente {clienteId}: {ex.Message}");
                return StatusCode(500, "Erro ao analisar risco do cliente");
            }
        }
    }
}
