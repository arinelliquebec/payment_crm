using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParceiroController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public ParceiroController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        // GET: api/Parceiro/count - Contar total de parceiros
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetParceirosCount()
        {
            try
            {
                var count = await _context.Parceiros.Where(p => p.Ativo).CountAsync();
                Console.WriteLine($"📊 GetParceirosCount: Total de {count} parceiros ativos");
                return Ok(count);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetParceirosCount: Erro: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao contar parceiros" });
            }
        }

        // GET: api/Parceiro/buscar?termo=xxx&limit=50
        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<Parceiro>>> BuscarParceiros([FromQuery] string? termo, [FromQuery] int limit = 50)
        {
            try
            {
                Console.WriteLine($"🔍 BuscarParceiros: Buscando com termo: {termo}, limit: {limit}");

                IQueryable<Parceiro> query = _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .Where(p => p.Ativo);

                // Se houver termo de busca, aplicar filtros
                if (!string.IsNullOrWhiteSpace(termo))
                {
                    var termoLower = termo.ToLower().Trim();
                    query = query.Where(p =>
                        (p.PessoaFisica != null && p.PessoaFisica.Nome != null && p.PessoaFisica.Nome.ToLower().Contains(termoLower)) ||
                        (p.PessoaFisica != null && p.PessoaFisica.EmailEmpresarial != null && p.PessoaFisica.EmailEmpresarial.ToLower().Contains(termoLower)) ||
                        (p.OAB != null && p.OAB.ToLower().Contains(termoLower)) ||
                        (p.Filial != null && p.Filial.Nome != null && p.Filial.Nome.ToLower().Contains(termoLower))
                    );
                }

                // Ordenar PRIMEIRO (usa índice), depois limitar para performance
                var parceiros = await query
                    .OrderBy(p => p.PessoaFisica != null ? p.PessoaFisica.Nome : "")
                    .Take(limit)
                    .ToListAsync();

                Console.WriteLine($"✅ BuscarParceiros: Encontrados {parceiros.Count} parceiros");
                return Ok(parceiros);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ BuscarParceiros: Erro: {ex.Message}");
                return StatusCode(500, $"Erro ao buscar parceiros: {ex.Message}");
            }
        }

        // GET: api/Parceiro
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Parceiro>>> GetParceiros()
        {
            try
            {
                // Obter usuário logado para aplicar filtragem por filial
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    return Unauthorized("Usuário não identificado na requisição.");
                }

                var parceirosQuery = _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .Where(p => p.Ativo);

                // Aplicar filtragem por permissões de usuário (incluindo filial para Gestor de Filial)
                var parceirosFiltrados = await _authorizationService.FilterParceirosByUserAsync(usuarioId, parceirosQuery);
                var parceiros = await parceirosFiltrados.ToListAsync();

                Console.WriteLine($"✅ GetParceiros: Encontrados {parceiros.Count} parceiros para usuário {usuarioId}");

                // Ordena alfabeticamente por nome
                return parceiros.OrderBy(p => p.PessoaFisica.Nome).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao buscar parceiros: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // Método auxiliar para validar permissões
        private async Task<bool> ValidarPermissaoEdicao(int usuarioId, int? targetId, string acao)
        {
            switch (acao.ToLower())
            {
                case "criar":
                    return await _authorizationService.CanEditParceiroAsync(usuarioId, 0);
                case "editar":
                    return targetId.HasValue && await _authorizationService.CanEditParceiroAsync(usuarioId, targetId.Value);
                default:
                    return false;
            }
        }

        // GET: api/Parceiro/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Parceiro>> GetParceiro(int id)
        {
            try
            {
                var parceiro = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .FirstOrDefaultAsync(p => p.Id == id && p.Ativo);

                if (parceiro == null)
                {
                    return NotFound(new {
                        recurso = "Parceiro",
                        id = id,
                        mensagem = $"Parceiro #{id} não foi encontrado"
                    });
                }

                return parceiro;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Parceiro/por-filial/5
        [HttpGet("por-filial/{filialId}")]
        public async Task<ActionResult<IEnumerable<Parceiro>>> GetParceirosPorFilial(int filialId)
        {
            try
            {
                var parceiros = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .Where(p => p.FilialId == filialId && p.Ativo)
                    .ToListAsync();

                return parceiros.OrderBy(p => p.PessoaFisica.Nome).ToList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Parceiro/por-pessoa-fisica/5
        [HttpGet("por-pessoa-fisica/{pessoaFisicaId}")]
        public async Task<ActionResult<Parceiro>> GetParceiroPorPessoaFisica(int pessoaFisicaId)
        {
            try
            {
                var parceiro = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .FirstOrDefaultAsync(p => p.PessoaFisicaId == pessoaFisicaId && p.Ativo);

                if (parceiro == null)
                {
                    return NotFound(new {
                        recurso = "Parceiro",
                        pessoaFisicaId = pessoaFisicaId,
                        mensagem = $"Parceiro vinculado à Pessoa Física #{pessoaFisicaId} não foi encontrado"
                    });
                }

                return parceiro;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Parceiro
        [HttpPost]
        public async Task<ActionResult<Parceiro>> CreateParceiro(CreateParceiroDTO createParceiroDTO)
        {
            // Validar permissões - Administrativo de Filial não pode criar
            var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
            if (int.TryParse(usuarioIdHeader, out int usuarioId))
            {
                var canEdit = await ValidarPermissaoEdicao(usuarioId, null, "criar");
                if (!canEdit)
                {
                    Console.WriteLine($"❌ CreateParceiro: Usuário {usuarioId} não tem permissão para criar parceiros");
                    return Forbid("Você não tem permissão para criar parceiros.");
                }
            }
            else
            {
                return Unauthorized("Usuário não identificado na requisição.");
            }

            try
            {
                // Verificar se a pessoa física existe
                var pessoaFisica = await _context.PessoasFisicas.FindAsync(createParceiroDTO.PessoaFisicaId);
                if (pessoaFisica == null)
                {
                    return BadRequest("Pessoa física não encontrada.");
                }

                // Verificar se a filial existe
                var filial = await _context.Filiais.FindAsync(createParceiroDTO.FilialId);
                if (filial == null)
                {
                    return BadRequest("Filial não encontrada.");
                }

                // Verificar se já existe um parceiro ativo para esta pessoa física
                var parceiroExistente = await _context.Parceiros
                    .FirstOrDefaultAsync(p => p.PessoaFisicaId == createParceiroDTO.PessoaFisicaId && p.Ativo);

                if (parceiroExistente != null)
                {
                    return BadRequest("Já existe um parceiro ativo para esta pessoa física.");
                }

                var parceiro = new Parceiro
                {
                    PessoaFisicaId = createParceiroDTO.PessoaFisicaId,
                    FilialId = createParceiroDTO.FilialId,
                    OAB = createParceiroDTO.OAB,
                    Email = createParceiroDTO.Email,
                    Telefone = createParceiroDTO.Telefone,
                    DataCadastro = DateTime.UtcNow,
                    Ativo = true
                };

                _context.Parceiros.Add(parceiro);
                await _context.SaveChangesAsync();

                // Retorna o parceiro criado com dados relacionados
                var parceiroCriado = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .FirstOrDefaultAsync(p => p.Id == parceiro.Id);

                return CreatedAtAction(nameof(GetParceiro), new { id = parceiro.Id }, parceiroCriado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Parceiro/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateParceiro(int id, UpdateParceiroDTO updateParceiroDTO)
        {
            try
            {
                if (id != updateParceiroDTO.Id)
                {
                    return BadRequest("ID do parceiro não confere.");
                }

                var parceiro = await _context.Parceiros.FindAsync(id);
                if (parceiro == null)
                {
                    return NotFound(new {
                        recurso = "Parceiro",
                        id = id,
                        mensagem = $"Parceiro #{id} não foi encontrado"
                    });
                }

                // Verificar se a filial existe
                var filial = await _context.Filiais.FindAsync(updateParceiroDTO.FilialId);
                if (filial == null)
                {
                    return BadRequest("Filial não encontrada.");
                }

                // Atualizar campos
                parceiro.FilialId = updateParceiroDTO.FilialId;
                parceiro.OAB = updateParceiroDTO.OAB;
                parceiro.Email = updateParceiroDTO.Email;
                parceiro.Telefone = updateParceiroDTO.Telefone;
                parceiro.DataAtualizacao = DateTime.UtcNow;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ParceiroExists(id))
                    {
                        return NotFound(new {
                            recurso = "Parceiro",
                            id = id,
                            mensagem = $"Parceiro #{id} não foi encontrado"
                        });
                    }
                    else
                    {
                        throw;
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/Parceiro/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteParceiro(int id)
        {
            try
            {
                var parceiro = await _context.Parceiros.FindAsync(id);
                if (parceiro == null)
                {
                    return NotFound(new {
                        recurso = "Parceiro",
                        id = id,
                        mensagem = $"Parceiro #{id} não foi encontrado"
                    });
                }

                // Soft delete - apenas marca como inativo
                parceiro.Ativo = false;
                parceiro.DataAtualizacao = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Parceiro/responsaveis-tecnicos
        [HttpGet("responsaveis-tecnicos")]
        public async Task<ActionResult<IEnumerable<object>>> GetResponsaveisTecnicos()
        {
            try
            {
                var responsaveis = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                    .Where(p => p.Ativo)
                    .Select(p => new
                    {
                        p.Id,
                        p.PessoaFisicaId,
                        Nome = p.PessoaFisica.Nome,
                        p.OAB
                    })
                    .OrderBy(p => p.Nome)
                    .ToListAsync();

                return responsaveis;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private bool ParceiroExists(int id)
        {
            return _context.Parceiros.Any(e => e.Id == id);
        }
    }
}
