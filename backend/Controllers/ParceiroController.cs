using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParceiroController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public ParceiroController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Parceiro
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Parceiro>>> GetParceiros()
        {
            try
            {
                // Verificar se a tabela e colunas existem
                await EnsureParceirosTableExists();

                var parceiros = await _context.Parceiros
                    .Include(p => p.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(p => p.Filial)
                    .Where(p => p.Ativo)
                    .ToListAsync();

                // Ordena alfabeticamente por nome
                return parceiros.OrderBy(p => p.PessoaFisica.Nome).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao buscar parceiros: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
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
                    return NotFound("Parceiro não encontrado.");
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
                    return NotFound("Parceiro não encontrado para esta pessoa física.");
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
            try
            {
                // Verificar se a tabela Parceiros existe, se não, criar
                await EnsureParceirosTableExists();

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
                    DataCadastro = DateTime.Now,
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
                    return NotFound("Parceiro não encontrado.");
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
                parceiro.DataAtualizacao = DateTime.Now;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ParceiroExists(id))
                    {
                        return NotFound("Parceiro não encontrado.");
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
                    return NotFound("Parceiro não encontrado.");
                }

                // Soft delete - apenas marca como inativo
                parceiro.Ativo = false;
                parceiro.DataAtualizacao = DateTime.Now;

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

        // POST: api/Parceiro/migrate-columns
        [HttpPost("migrate-columns")]
        public async Task<ActionResult> MigrateColumns()
        {
            try
            {
                await EnsureEmailAndTelefoneColumnsExist();
                return Ok(new { message = "Migração das colunas Email e Telefone concluída com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao executar migração: {ex.Message}");
            }
        }



        private bool ParceiroExists(int id)
        {
            return _context.Parceiros.Any(e => e.Id == id);
        }

        private async Task EnsureParceirosTableExists()
        {
            await CreateTableHelper.CreateParceirosTableIfNotExists(_context);
        }

        private async Task EnsureEmailAndTelefoneColumnsExist()
        {
            try
            {
                Console.WriteLine("Verificando e adicionando campos Email e Telefone à tabela Parceiros...");

                await _context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Parceiros""
                        ADD COLUMN IF NOT EXISTS ""Email"" character varying(100) NULL;

                    ALTER TABLE ""Parceiros""
                        ADD COLUMN IF NOT EXISTS ""Telefone"" character varying(20) NULL;
                ");

                Console.WriteLine("✅ Verificação dos campos Email e Telefone concluída");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro geral ao verificar/adicionar campos Email e Telefone: {ex.Message}");
                throw;
            }
        }
    }
}
