using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GroupAccessController : ControllerBase
    {
        private readonly IGroupAccessService _groupAccessService;

        public GroupAccessController(IGroupAccessService groupAccessService)
        {
            _groupAccessService = groupAccessService;
        }

        /// <summary>
        /// Obtém informações completas sobre o acesso do usuário baseado no seu grupo
        /// </summary>
        [HttpGet("user-info")]
        public async Task<ActionResult<GroupAccessInfo>> GetUserGroupAccessInfo()
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var groupInfo = await _groupAccessService.GetGroupAccessInfoAsync(usuarioId.Value);
                return Ok(groupInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao obter informações do grupo: {ex.Message}");
            }
        }

        /// <summary>
        /// Verifica se o usuário pode acessar um módulo específico
        /// </summary>
        [HttpGet("can-access-module/{modulo}")]
        public async Task<ActionResult<bool>> CanAccessModule(string modulo)
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var canAccess = await _groupAccessService.CanAccessModuleAsync(usuarioId.Value, modulo);
                return Ok(canAccess);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao verificar acesso ao módulo: {ex.Message}");
            }
        }

        /// <summary>
        /// Verifica se o usuário pode acessar uma tela específica
        /// </summary>
        [HttpGet("can-access-screen/{screenName}")]
        public async Task<ActionResult<bool>> CanAccessScreen(string screenName)
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var canAccess = await _groupAccessService.CanAccessScreenAsync(usuarioId.Value, screenName);
                return Ok(canAccess);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao verificar acesso à tela: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtém lista de módulos que o usuário pode acessar
        /// </summary>
        [HttpGet("accessible-modules")]
        public async Task<ActionResult<List<string>>> GetAccessibleModules()
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var modules = await _groupAccessService.GetAccessibleModulesAsync(usuarioId.Value);
                return Ok(modules);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao obter módulos acessíveis: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtém lista de telas que o usuário pode acessar
        /// </summary>
        [HttpGet("accessible-screens")]
        public async Task<ActionResult<List<string>>> GetAccessibleScreens()
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var screens = await _groupAccessService.GetAccessibleScreensAsync(usuarioId.Value);
                return Ok(screens);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao obter telas acessíveis: {ex.Message}");
            }
        }

        /// <summary>
        /// Verifica se um módulo está oculto para o usuário
        /// </summary>
        [HttpGet("is-module-hidden/{modulo}")]
        public async Task<ActionResult<bool>> IsModuleHidden(string modulo)
        {
            try
            {
                var usuarioId = GetUsuarioIdFromHeader();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não identificado");
                }

                var isHidden = await _groupAccessService.IsModuleHiddenAsync(usuarioId.Value, modulo);
                return Ok(isHidden);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao verificar se módulo está oculto: {ex.Message}");
            }
        }

        private int? GetUsuarioIdFromHeader()
        {
            if (Request.Headers.TryGetValue("X-Usuario-Id", out var usuarioIdHeader))
            {
                if (int.TryParse(usuarioIdHeader, out var usuarioId))
                {
                    return usuarioId;
                }
            }
            return null;
        }
    }
}
