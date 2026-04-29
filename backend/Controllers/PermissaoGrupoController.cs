using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermissaoGrupoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public PermissaoGrupoController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        [HttpGet("grupo/{grupoId}")]
        public async Task<ActionResult<IEnumerable<PermissaoGrupo>>> GetPermissoesPorGrupo(int grupoId)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Visualizar"))
            //     return Forbid();

            var permissoesGrupo = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Include(pg => pg.GrupoAcesso)
                .Where(pg => pg.GrupoAcessoId == grupoId)
                .ToListAsync();

            return permissoesGrupo;
        }

        [HttpGet("permissao/{permissaoId}")]
        public async Task<ActionResult<IEnumerable<PermissaoGrupo>>> GetGruposPorPermissao(int permissaoId)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Visualizar"))
            //     return Forbid();

            var permissoesGrupo = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Include(pg => pg.GrupoAcesso)
                .Where(pg => pg.PermissaoId == permissaoId)
                .ToListAsync();

            return permissoesGrupo;
        }

        [HttpPost]
        public async Task<ActionResult<PermissaoGrupo>> PostPermissaoGrupo(PermissaoGrupo permissaoGrupo)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Incluir"))
            //     return Forbid();

            // Verificar se já existe
            var existe = await _context.PermissoesGrupos
                .AnyAsync(pg => pg.GrupoAcessoId == permissaoGrupo.GrupoAcessoId && 
                               pg.PermissaoId == permissaoGrupo.PermissaoId);

            if (existe)
            {
                return BadRequest("Esta permissão já está associada ao grupo.");
            }

            permissaoGrupo.DataCadastro = DateTime.UtcNow;

            _context.PermissoesGrupos.Add(permissaoGrupo);
            await _context.SaveChangesAsync();

            // Retornar com as entidades relacionadas
            var permissaoGrupoCompleta = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Include(pg => pg.GrupoAcesso)
                .FirstOrDefaultAsync(pg => pg.Id == permissaoGrupo.Id);

            return CreatedAtAction("GetPermissaoGrupo", new { id = permissaoGrupo.Id }, permissaoGrupoCompleta);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPermissaoGrupo(int id, PermissaoGrupo permissaoGrupo)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Editar"))
            //     return Forbid();

            if (id != permissaoGrupo.Id)
            {
                return BadRequest();
            }

            _context.Entry(permissaoGrupo).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PermissaoGrupoExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePermissaoGrupo(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Excluir"))
            //     return Forbid();

            var permissaoGrupo = await _context.PermissoesGrupos.FindAsync(id);
            if (permissaoGrupo == null)
            {
                return NotFound();
            }

            _context.PermissoesGrupos.Remove(permissaoGrupo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PermissaoGrupo>> GetPermissaoGrupo(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "PermissaoGrupo", "Visualizar"))
            //     return Forbid();

            var permissaoGrupo = await _context.PermissoesGrupos
                .Include(pg => pg.Permissao)
                .Include(pg => pg.GrupoAcesso)
                .FirstOrDefaultAsync(pg => pg.Id == id);

            if (permissaoGrupo == null)
            {
                return NotFound();
            }

            return permissaoGrupo;
        }

        private bool PermissaoGrupoExists(int id)
        {
            return _context.PermissoesGrupos.Any(e => e.Id == id);
        }
    }
}
