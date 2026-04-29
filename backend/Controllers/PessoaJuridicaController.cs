using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PessoaJuridicaController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;

        public PessoaJuridicaController(CrmArrighiContext context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        // GET: api/PessoaJuridica
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaJuridica>>> GetPessoasJuridicas()
        {
            try
            {
                Console.WriteLine("🔍 GetPessoasJuridicas: Buscando pessoas jurídicas no banco SQL Server Azure");

                // SEMPRE retornar todos os dados ordenados alfabeticamente por razão social - SEM AUTENTICAÇÃO
                var todasPessoas = await _context.PessoasJuridicas
                    .Include(p => p.Endereco)
                    .Include(p => p.ResponsavelTecnico)
                    .OrderBy(p => p.RazaoSocial)
                    .ToListAsync();

                Console.WriteLine($"✅ GetPessoasJuridicas: Retornando {todasPessoas.Count} pessoas jurídicas do banco SQL Server Azure (ordenadas por razão social, com endereços)");
                return Ok(todasPessoas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetPessoasJuridicas: Erro ao acessar banco: {ex.Message}");
                return StatusCode(500, $"Erro ao acessar banco de dados: {ex.Message}");
            }
        }

        // GET: api/PessoaJuridica/count - Contar total de pessoas jurídicas
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetPessoasJuridicasCount()
        {
            try
            {
                var count = await _context.PessoasJuridicas.CountAsync();
                Console.WriteLine($"📊 GetPessoasJuridicasCount: Total de {count} pessoas jurídicas");
                return Ok(count);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetPessoasJuridicasCount: Erro: {ex.Message}");
                return StatusCode(500, new { message = "Erro ao contar pessoas jurídicas" });
            }
        }

        // GET: api/PessoaJuridica/buscar?termo=xxx&limit=10
        [HttpGet("buscar")]
        public async Task<ActionResult<IEnumerable<PessoaJuridica>>> BuscarPessoasJuridicas([FromQuery] string? termo, [FromQuery] int limit = 50)
        {
            try
            {
                Console.WriteLine($"🔍 BuscarPessoasJuridicas: Buscando com termo: {termo}, limit: {limit}");

                IQueryable<PessoaJuridica> query = _context.PessoasJuridicas
                    .Include(p => p.Endereco)
                    .Include(p => p.ResponsavelTecnico);

                // Se houver termo de busca, aplicar filtros
                if (!string.IsNullOrWhiteSpace(termo))
                {
                    var termoLower = termo.ToLower().Trim();
                    var termoLimpo = termo.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "");

                    query = query.Where(p =>
                        (p.RazaoSocial != null && p.RazaoSocial.ToLower().Contains(termoLower)) ||
                        (p.NomeFantasia != null && p.NomeFantasia.ToLower().Contains(termoLower)) ||
                        (p.Email != null && p.Email.ToLower().Contains(termoLower)) ||
                        (p.Cnpj != null && p.Cnpj.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "").Contains(termoLimpo))
                    );
                }

                // Ordenar PRIMEIRO (usa índice), depois limitar para performance
                var pessoas = await query
                    .OrderBy(p => p.RazaoSocial)
                    .Take(limit)
                    .ToListAsync();

                Console.WriteLine($"✅ BuscarPessoasJuridicas: Encontradas {pessoas.Count} pessoas");
                return Ok(pessoas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ BuscarPessoasJuridicas: Erro: {ex.Message}");
                return StatusCode(500, $"Erro ao buscar pessoas jurídicas: {ex.Message}");
            }
        }

        // GET: api/PessoaJuridica/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PessoaJuridica>> GetPessoaJuridica(int id)
        {
            var pessoaJuridica = await _context.PessoasJuridicas
                .Include(p => p.Endereco)
                .Include(p => p.ResponsavelTecnico)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (pessoaJuridica == null)
            {
                return NotFound();
            }

            return pessoaJuridica;
        }

        // GET: api/PessoaJuridica/buscar-por-cnpj/{cnpj}
        [HttpGet("buscar-por-cnpj/{cnpj}")]
        public async Task<ActionResult<PessoaJuridica>> GetPessoaJuridicaPorCnpj(string cnpj)
        {
            var pessoaJuridica = await _context.PessoasJuridicas
                .Include(p => p.Endereco)
                .Include(p => p.ResponsavelTecnico)
                .FirstOrDefaultAsync(p => p.Cnpj == cnpj);

            if (pessoaJuridica == null)
            {
                return NotFound();
            }

            return pessoaJuridica;
        }

        // POST: api/PessoaJuridica
        [HttpPost]
        public async Task<ActionResult<PessoaJuridica>> PostPessoaJuridica(PessoaJuridica pessoaJuridica)
        {
            // Verificar se o responsável técnico existe
            var responsavelTecnico = await _context.PessoasFisicas.FindAsync(pessoaJuridica.ResponsavelTecnicoId);
            if (responsavelTecnico == null)
            {
                return BadRequest("Responsável técnico não encontrado. É necessário cadastrar uma pessoa física primeiro.");
            }

            // Verificar se CNPJ já existe
            if (!string.IsNullOrWhiteSpace(pessoaJuridica.Cnpj))
            {
                var cnpjLimpo = pessoaJuridica.Cnpj.Replace(".", string.Empty)
                                                    .Replace("-", string.Empty)
                                                    .Replace("/", string.Empty)
                                                    .Replace(" ", string.Empty);

                var cnpjJaExiste = await _context.PessoasJuridicas
                    .AnyAsync(p => p.Cnpj != null &&
                        p.Cnpj.Replace(".", string.Empty)
                             .Replace("-", string.Empty)
                             .Replace("/", string.Empty)
                             .Replace(" ", string.Empty) == cnpjLimpo);

                if (cnpjJaExiste)
                {
                    return Conflict(new { message = "CNPJ já cadastrado.", field = "cnpj" });
                }
            }

            if (ModelState.IsValid)
            {
                _context.PessoasJuridicas.Add(pessoaJuridica);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPessoaJuridica), new { id = pessoaJuridica.Id }, pessoaJuridica);
            }

            return BadRequest(ModelState);
        }

        // PUT: api/PessoaJuridica/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPessoaJuridica(int id, PessoaJuridica pessoaJuridica)
        {
            if (id != pessoaJuridica.Id)
            {
                return BadRequest();
            }

            // Verificar se o responsável técnico existe
            var responsavelTecnico = await _context.PessoasFisicas.FindAsync(pessoaJuridica.ResponsavelTecnicoId);
            if (responsavelTecnico == null)
            {
                return BadRequest("Responsável técnico não encontrado. É necessário cadastrar uma pessoa física primeiro.");
            }

            if (ModelState.IsValid)
            {
                try
                {
                    pessoaJuridica.DataAtualizacao = DateTime.UtcNow;
                    _context.Update(pessoaJuridica);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PessoaJuridicaExists(pessoaJuridica.Id))
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

            return BadRequest(ModelState);
        }

        // DELETE: api/PessoaJuridica/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePessoaJuridica(int id)
        {
            var pessoaJuridica = await _context.PessoasJuridicas.FindAsync(id);
            if (pessoaJuridica == null)
            {
                return NotFound();
            }

            _context.PessoasJuridicas.Remove(pessoaJuridica);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PessoaJuridicaExists(int id)
        {
            return _context.PessoasJuridicas.Any(e => e.Id == id);
        }
    }
}
