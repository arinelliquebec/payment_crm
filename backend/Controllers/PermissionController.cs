using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using CrmArrighi.Attributes;
using System.Security.Claims;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermissionController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IPermissionService _permissionService;

        public PermissionController(CrmArrighiContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        [HttpGet("user-status")]
        public async Task<ActionResult<object>> GetUserStatus()
        {
            // Obter ID do usuário do header X-Usuario-Id
            if (!Request.Headers.TryGetValue("X-Usuario-Id", out var userIdHeader) ||
                !int.TryParse(userIdHeader.FirstOrDefault(), out int userId))
            {
                return Unauthorized("Usuário não identificado");
            }

            var usuario = await _context.Usuarios
                .Include(u => u.GrupoAcesso)
                .Include(u => u.Filial)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (usuario == null)
            {
                return NotFound("Usuário não encontrado");
            }

            var grupoNome = await _permissionService.GetUserGroupNameAsync(userId);
            var permissoes = await _permissionService.GetUserPermissionsAsync(userId);

            // Se é usuário sem grupo, retornar mensagem específica
            if (grupoNome == "Usuario")
            {
            return Ok(new
            {
                usuarioId = usuario.Id,
                nome = usuario.Login, // Usando Login como nome
                login = usuario.Login,
                grupo = grupoNome,
                filial = usuario.Filial?.Nome,
                semPermissao = true,
                mensagem = "Sem grupo de acesso não terá permissão. Contate um administrador.",
                permissoes = new List<string>()
            });
            }

            return Ok(new
            {
                usuarioId = usuario.Id,
                nome = usuario.Login, // Usando Login como nome
                login = usuario.Login,
                grupo = grupoNome,
                filial = usuario.Filial?.Nome,
                semPermissao = false,
                permissoes = permissoes
            });
        }

        [HttpGet("check-permission/{modulo}/{acao}")]
        public async Task<ActionResult<bool>> CheckPermission(string modulo, string acao)
        {
            // Obter ID do usuário do header X-Usuario-Id
            if (!Request.Headers.TryGetValue("X-Usuario-Id", out var userIdHeader) ||
                !int.TryParse(userIdHeader.FirstOrDefault(), out int userId))
            {
                return Unauthorized("Usuário não identificado");
            }

            var hasPermission = await _permissionService.HasPermissionAsync(userId, modulo, acao);
            return Ok(hasPermission);
        }

        [HttpGet("user-permissions")]
        public async Task<ActionResult<List<string>>> GetUserPermissions()
        {
            // Obter ID do usuário do header X-Usuario-Id
            if (!Request.Headers.TryGetValue("X-Usuario-Id", out var userIdHeader) ||
                !int.TryParse(userIdHeader.FirstOrDefault(), out int userId))
            {
                return Unauthorized("Usuário não identificado");
            }

            var permissoes = await _permissionService.GetUserPermissionsAsync(userId);
            return Ok(permissoes);
        }

        [HttpGet("can-access/{modulo}/{recordId}")]
        public async Task<ActionResult<bool>> CanAccessRecord(string modulo, int recordId)
        {
            // Obter ID do usuário do header X-Usuario-Id
            if (!Request.Headers.TryGetValue("X-Usuario-Id", out var userIdHeader) ||
                !int.TryParse(userIdHeader.FirstOrDefault(), out int userId))
            {
                return Unauthorized("Usuário não identificado");
            }

            var canAccess = await _permissionService.CanAccessRecordAsync(userId, modulo, recordId);
            return Ok(canAccess);
        }

        [HttpGet("grupos")]
        [AuthorizeGroup("Administrador", "Faturamento")]
        public async Task<ActionResult<IEnumerable<object>>> GetGrupos()
        {
            var grupos = await _context.GruposAcesso
                .Include(g => g.Permissoes)
                    .ThenInclude(pg => pg.Permissao)
                .Where(g => g.Ativo)
                .Select(g => new
                {
                    g.Id,
                    g.Nome,
                    g.Descricao,
                    totalPermissoes = g.Permissoes.Count,
                    permissoes = g.Permissoes.Select(pg => new
                    {
                        pg.Permissao.Modulo,
                        pg.Permissao.Acao,
                        pg.ApenasFilial,
                        pg.ApenasLeitura,
                        pg.IncluirSituacoesEspecificas,
                        pg.SituacoesEspecificas
                    })
                })
                .ToListAsync();

            return Ok(grupos);
        }

        [HttpGet("permissoes")]
        [AuthorizeGroup("Administrador", "Faturamento")]
        public async Task<ActionResult<IEnumerable<object>>> GetPermissoes()
        {
            var permissoes = await _context.Permissoes
                .Where(p => p.Ativo)
                .GroupBy(p => p.Modulo)
                .Select(g => new
                {
                    modulo = g.Key,
                    acoes = g.Select(p => new
                    {
                        p.Id,
                        p.Nome,
                        p.Acao,
                        p.Descricao
                    })
                })
                .ToListAsync();

            return Ok(permissoes);
        }
    }
}
