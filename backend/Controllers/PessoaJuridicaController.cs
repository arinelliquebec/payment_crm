using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PessoaJuridicaController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public PessoaJuridicaController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/PessoaJuridica
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaJuridica>>> GetPessoasJuridicas()
        {
            var pessoas = await _context.PessoasJuridicas
                .Include(p => p.Endereco)
                .Include(p => p.ResponsavelTecnico)
                .ToListAsync();

            // Ordena alfabeticamente por razão social
            return pessoas.OrderBy(p => p.RazaoSocial).ToList();
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
                    pessoaJuridica.DataAtualizacao = DateTime.Now;
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
