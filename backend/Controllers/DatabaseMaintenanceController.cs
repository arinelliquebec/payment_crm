using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    /// <summary>
    /// Controller para manutenção do banco de dados
    /// ⚠️ USAR APENAS EM DESENVOLVIMENTO OU COM AUTORIZAÇÃO
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseMaintenanceController : ControllerBase
    {
        private readonly DatabaseIndexService _indexService;
        private readonly ILogger<DatabaseMaintenanceController> _logger;
        private readonly IConfiguration _configuration;

        public DatabaseMaintenanceController(
            DatabaseIndexService indexService,
            ILogger<DatabaseMaintenanceController> logger,
            IConfiguration configuration)
        {
            _indexService = indexService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Cria todos os índices de performance
        /// GET: api/DatabaseMaintenance/criar-indices
        /// </summary>
        [HttpPost("criar-indices")]
        public async Task<IActionResult> CriarIndices()
        {
            try
            {
                // ⚠️ SEGURANÇA: Verificar se está em desenvolvimento ou se tem permissão
                if (!PodeExecutarManutencao())
                {
                    return Forbid("Operação não permitida em produção sem autorização");
                }

                _logger.LogInformation("🚀 Iniciando criação de índices via API...");

                var sucesso = await _indexService.CriarTodosIndicesAsync();

                if (sucesso)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "✅ Todos os índices foram criados com sucesso!",
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "⚠️ Alguns índices falharam. Verifique os logs.",
                        timestamp = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar índices via API");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"❌ Erro: {ex.Message}",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Lista todos os índices customizados
        /// GET: api/DatabaseMaintenance/listar-indices
        /// </summary>
        [HttpGet("listar-indices")]
        public async Task<IActionResult> ListarIndices()
        {
            try
            {
                var indices = await _indexService.ListarIndicesAsync();

                return Ok(new
                {
                    success = true,
                    count = indices.Count,
                    indices = indices,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao listar índices");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"❌ Erro: {ex.Message}",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Remove todos os índices (CUIDADO!)
        /// DELETE: api/DatabaseMaintenance/remover-indices
        /// </summary>
        [HttpDelete("remover-indices")]
        public async Task<IActionResult> RemoverIndices([FromQuery] string confirmacao)
        {
            try
            {
                // ⚠️ SEGURANÇA: Exigir confirmação explícita
                if (confirmacao != "CONFIRMO_REMOCAO_INDICES")
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "⚠️ Confirmação necessária. Use: ?confirmacao=CONFIRMO_REMOCAO_INDICES"
                    });
                }

                // ⚠️ SEGURANÇA: Verificar ambiente
                if (!PodeExecutarManutencao())
                {
                    return Forbid("Operação não permitida em produção sem autorização");
                }

                _logger.LogWarning("⚠️ Removendo todos os índices via API...");

                var sucesso = await _indexService.RemoverTodosIndicesAsync();

                if (sucesso)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "✅ Todos os índices foram removidos",
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "⚠️ Erro ao remover alguns índices. Verifique os logs.",
                        timestamp = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao remover índices");
                return StatusCode(500, new
                {
                    success = false,
                    message = $"❌ Erro: {ex.Message}",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Verifica se pode executar operações de manutenção
        /// </summary>
        private bool PodeExecutarManutencao()
        {
            // Opção 1: Apenas em desenvolvimento
            var ambiente = _configuration["ASPNETCORE_ENVIRONMENT"];
            if (ambiente == "Development")
            {
                return true;
            }

            // Opção 2: Verificar flag de configuração
            var manutencaoPermitida = _configuration.GetValue<bool>("AllowDatabaseMaintenance", false);
            if (manutencaoPermitida)
            {
                _logger.LogWarning("⚠️ Manutenção de banco permitida via configuração");
                return true;
            }

            // Opção 3: Verificar header especial (para produção controlada)
            var authHeader = Request.Headers["X-Maintenance-Key"].FirstOrDefault();
            var maintenanceKey = _configuration["MaintenanceKey"];
            if (!string.IsNullOrEmpty(authHeader) &&
                !string.IsNullOrEmpty(maintenanceKey) &&
                authHeader == maintenanceKey)
            {
                _logger.LogWarning("⚠️ Manutenção autorizada via chave especial");
                return true;
            }

            return false;
        }

        /// <summary>
        /// Endpoint de status/saúde
        /// GET: api/DatabaseMaintenance/status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var indices = await _indexService.ListarIndicesAsync();
                var ambiente = _configuration["ASPNETCORE_ENVIRONMENT"];

                return Ok(new
                {
                    ambiente = ambiente,
                    totalIndices = indices.Count,
                    manutencaoPermitida = PodeExecutarManutencao(),
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = $"❌ Erro: {ex.Message}"
                });
            }
        }
    }
}
