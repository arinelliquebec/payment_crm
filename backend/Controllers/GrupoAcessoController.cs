using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GrupoAcessoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public GrupoAcessoController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetGruposAcesso()
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Visualizar"))
            //     return Forbid();

            var grupos = await _context.GruposAcesso
                .Where(g => g.Ativo)
                .Select(g => new
                {
                    g.Id,
                    g.Nome,
                    g.Descricao,
                    g.Ativo,
                    g.DataCadastro,
                    g.DataAtualizacao
                })
                .ToListAsync();

            return Ok(grupos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetGrupoAcesso(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Visualizar"))
            //     return Forbid();

            var grupoAcesso = await _context.GruposAcesso
                .Where(g => g.Id == id && g.Ativo)
                .Select(g => new
                {
                    g.Id,
                    g.Nome,
                    g.Descricao,
                    g.Ativo,
                    g.DataCadastro,
                    g.DataAtualizacao
                })
                .FirstOrDefaultAsync();

            if (grupoAcesso == null)
            {
                return NotFound();
            }

            return grupoAcesso;
        }

        [HttpPost]
        public async Task<ActionResult<GrupoAcesso>> PostGrupoAcesso(GrupoAcesso grupoAcesso)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Incluir"))
            //     return Forbid();

            grupoAcesso.DataCadastro = DateTime.UtcNow;
            grupoAcesso.Ativo = true;

            _context.GruposAcesso.Add(grupoAcesso);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetGrupoAcesso", new { id = grupoAcesso.Id }, new
            {
                grupoAcesso.Id,
                grupoAcesso.Nome,
                grupoAcesso.Descricao,
                grupoAcesso.Ativo,
                grupoAcesso.DataCadastro,
                grupoAcesso.DataAtualizacao
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutGrupoAcesso(int id, GrupoAcesso grupoAcesso)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Editar"))
            //     return Forbid();

            if (id != grupoAcesso.Id)
            {
                return BadRequest();
            }

            grupoAcesso.DataAtualizacao = DateTime.UtcNow;

            _context.Entry(grupoAcesso).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GrupoAcessoExists(id))
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
        public async Task<IActionResult> DeleteGrupoAcesso(int id)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Excluir"))
            //     return Forbid();

            var grupoAcesso = await _context.GruposAcesso.FindAsync(id);
            if (grupoAcesso == null)
            {
                return NotFound();
            }

            // Soft delete
            grupoAcesso.Ativo = false;
            grupoAcesso.DataAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/permissoes")]
        public async Task<ActionResult> AdicionarPermissao(int id, [FromBody] AdicionarPermissaoDTO dto)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Editar"))
            //     return Forbid();

            var grupoAcesso = await _context.GruposAcesso.FindAsync(id);
            if (grupoAcesso == null)
            {
                return NotFound("Grupo de acesso não encontrado");
            }

            var permissao = await _context.Permissoes.FindAsync(dto.PermissaoId);
            if (permissao == null)
            {
                return NotFound("Permissão não encontrada");
            }

            var permissaoGrupo = new PermissaoGrupo
            {
                GrupoAcessoId = id,
                PermissaoId = dto.PermissaoId,
                ApenasProprios = dto.ApenasProprios,
                ApenasFilial = dto.ApenasFilial,
                ApenasLeitura = dto.ApenasLeitura,
                IncluirSituacoesEspecificas = dto.IncluirSituacoesEspecificas,
                SituacoesEspecificas = dto.SituacoesEspecificas,
                DataCadastro = DateTime.UtcNow
            };

            _context.PermissoesGrupos.Add(permissaoGrupo);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}/permissoes/{permissaoId}")]
        public async Task<IActionResult> RemoverPermissao(int id, int permissaoId)
        {
            // TODO: Implementar verificação de permissão quando o sistema de autenticação estiver pronto
            // var usuarioId = GetCurrentUserId();
            // if (!await _authorizationService.HasPermissionAsync(usuarioId, "GrupoAcesso", "Editar"))
            //     return Forbid();

            var permissaoGrupo = await _context.PermissoesGrupos
                .FirstOrDefaultAsync(pg => pg.GrupoAcessoId == id && pg.PermissaoId == permissaoId);

            if (permissaoGrupo == null)
            {
                return NotFound();
            }

            _context.PermissoesGrupos.Remove(permissaoGrupo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool GrupoAcessoExists(int id)
        {
            return _context.GruposAcesso.Any(e => e.Id == id);
        }
    }

    public class AdicionarPermissaoDTO
    {
        public int PermissaoId { get; set; }
        public bool ApenasProprios { get; set; }
        public bool ApenasFilial { get; set; }
        public bool ApenasLeitura { get; set; }
        public bool IncluirSituacoesEspecificas { get; set; }
        public string? SituacoesEspecificas { get; set; }
    }
}
