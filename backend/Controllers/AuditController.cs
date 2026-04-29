using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;
using CrmArrighi.Models;
using IAuthorizationService = CrmArrighi.Services.IAuthorizationService;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;
        private readonly IAuthorizationService _authorizationService;
        private readonly ILogger<AuditController> _logger;

        public AuditController(
            IAuditService auditService,
            IAuthorizationService authorizationService,
            ILogger<AuditController> logger)
        {
            _auditService = auditService;
            _authorizationService = authorizationService;
            _logger = logger;
        }

        private int? GetUsuarioId()
        {
            var header = Request.Headers["X-Usuario-Id"].FirstOrDefault();
            return int.TryParse(header, out int id) ? id : null;
        }

        /// <summary>
        /// Lista logs de auditoria com filtros e paginação.
        /// Apenas Administradores podem acessar.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<AuditLogPagedResult>> GetLogs(
            [FromQuery] int? usuarioId,
            [FromQuery] string? acao,
            [FromQuery] string? entidade,
            [FromQuery] int? entidadeId,
            [FromQuery] string? modulo,
            [FromQuery] string? severidade,
            [FromQuery] DateTime? dataInicio,
            [FromQuery] DateTime? dataFim,
            [FromQuery] string? busca,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 50)
        {
            try
            {
                var reqUsuarioId = GetUsuarioId();
                if (!reqUsuarioId.HasValue)
                    return Unauthorized("Usuário não identificado");

                // Apenas administradores podem ver auditoria
                var hasPermission = await _authorizationService.HasPermissionAsync(
                    reqUsuarioId.Value, "Auditoria", "Visualizar");
                if (!hasPermission)
                    return Forbid();

                var filtro = new AuditLogFilterDTO
                {
                    UsuarioId = usuarioId,
                    Acao = acao,
                    Entidade = entidade,
                    EntidadeId = entidadeId,
                    Modulo = modulo,
                    Severidade = severidade,
                    DataInicio = dataInicio,
                    DataFim = dataFim,
                    Busca = busca,
                    Pagina = pagina,
                    TamanhoPagina = Math.Min(tamanhoPagina, 100),
                };

                var result = await _auditService.GetLogsAsync(filtro);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar logs de auditoria");
                return StatusCode(500, new { error = "Erro ao buscar logs de auditoria" });
            }
        }

        /// <summary>
        /// Retorna resumo estatístico da auditoria.
        /// </summary>
        [HttpGet("resumo")]
        public async Task<ActionResult<AuditLogResumo>> GetResumo()
        {
            try
            {
                var reqUsuarioId = GetUsuarioId();
                if (!reqUsuarioId.HasValue)
                    return Unauthorized("Usuário não identificado");

                var hasPermission = await _authorizationService.HasPermissionAsync(
                    reqUsuarioId.Value, "Auditoria", "Visualizar");
                if (!hasPermission)
                    return Forbid();

                var resumo = await _auditService.GetResumoAsync();
                return Ok(resumo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar resumo de auditoria");
                return StatusCode(500, new { error = "Erro ao buscar resumo de auditoria" });
            }
        }

        /// <summary>
        /// Retorna detalhes de um log específico.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<AuditLogDTO>> GetById(int id)
        {
            try
            {
                var reqUsuarioId = GetUsuarioId();
                if (!reqUsuarioId.HasValue)
                    return Unauthorized("Usuário não identificado");

                var hasPermission = await _authorizationService.HasPermissionAsync(
                    reqUsuarioId.Value, "Auditoria", "Visualizar");
                if (!hasPermission)
                    return Forbid();

                var log = await _auditService.GetByIdAsync(id);
                if (log == null)
                    return NotFound();

                return Ok(log);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar log de auditoria {Id}", id);
                return StatusCode(500, new { error = "Erro ao buscar log de auditoria" });
            }
        }
    }
}
