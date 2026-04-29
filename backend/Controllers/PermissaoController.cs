using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PermissaoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public PermissaoController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Permissao>>> GetPermissoes()
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Visualizar"))
            //     return Forbid();

            return await _context.Permissoes
                .Where(p => p.Ativo)
                .OrderBy(p => p.Modulo)
                .ThenBy(p => p.Acao)
                .ToListAsync();
        }

        [HttpGet("por-modulo")]
        public async Task<ActionResult<Dictionary<string, List<Permissao>>>> GetPermissoesPorModulo()
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Visualizar"))
            //     return Forbid();

            var permissoes = await _context.Permissoes
                .Where(p => p.Ativo)
                .OrderBy(p => p.Modulo)
                .ThenBy(p => p.Acao)
                .ToListAsync();

            var permissoesPorModulo = permissoes
                .GroupBy(p => p.Modulo)
                .ToDictionary(g => g.Key, g => g.ToList());

            return permissoesPorModulo;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Permissao>> GetPermissao(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Visualizar"))
            //     return Forbid();

            var permissao = await _context.Permissoes
                .FirstOrDefaultAsync(p => p.Id == id && p.Ativo);

            if (permissao == null)
            {
                return NotFound();
            }

            return permissao;
        }

        [HttpPost]
        public async Task<ActionResult<Permissao>> PostPermissao(Permissao permissao)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Incluir"))
            //     return Forbid();

            permissao.DataCadastro = DateTime.UtcNow;
            permissao.Ativo = true;

            _context.Permissoes.Add(permissao);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPermissao", new { id = permissao.Id }, permissao);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPermissao(int id, Permissao permissao)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Editar"))
            //     return Forbid();

            if (id != permissao.Id)
            {
                return BadRequest();
            }

            _context.Entry(permissao).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PermissaoExists(id))
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
        public async Task<IActionResult> DeletePermissao(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "Permissao", "Excluir"))
            //     return Forbid();

            var permissao = await _context.Permissoes.FindAsync(id);
            if (permissao == null)
            {
                return NotFound();
            }

            // Soft delete
            permissao.Ativo = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PermissaoExists(int id)
        {
            return _context.Permissoes.Any(e => e.Id == id);
        }
    }
}
