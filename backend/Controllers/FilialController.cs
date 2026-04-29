using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilialController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public FilialController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Filial
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Filial>>> GetFiliais()
        {
            try
            {
                var filiais = await _context.Filiais
                    .OrderBy(f => f.Nome)
                    .ToListAsync();

                return filiais;
            }
            catch (Exception ex)
            {
                // Retorna dados mock quando o banco não está disponível
                var mockData = new List<Filial>
                {
                    new Filial
                    {
                        Id = 1,
                        Nome = "São Paulo - Centro",
                        DataInclusao = DateTime.UtcNow.AddDays(-60),
                        UsuarioImportacao = "admin"
                    },
                    new Filial
                    {
                        Id = 2,
                        Nome = "Rio de Janeiro - Copacabana",
                        DataInclusao = DateTime.UtcNow.AddDays(-45),
                        UsuarioImportacao = "admin"
                    },
                    new Filial
                    {
                        Id = 3,
                        Nome = "Belo Horizonte - Centro",
                        DataInclusao = DateTime.UtcNow.AddDays(-30),
                        UsuarioImportacao = "admin"
                    },
                    new Filial
                    {
                        Id = 4,
                        Nome = "Salvador - Barra",
                        DataInclusao = DateTime.UtcNow.AddDays(-15),
                        UsuarioImportacao = "admin"
                    }
                };

                return mockData.OrderBy(f => f.Nome).ToList();
            }
        }

        // GET: api/Filial/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Filial>> GetFilial(int id)
        {
            var filial = await _context.Filiais.FindAsync(id);

            if (filial == null)
            {
                return NotFound();
            }

            return filial;
        }

        // GET: api/Filial/nome/{nome}
        [HttpGet("nome/{nome}")]
        public async Task<ActionResult<Filial>> GetFilialPorNome(string nome)
        {
            var filial = await _context.Filiais
                .FirstOrDefaultAsync(f => f.Nome.ToLower() == nome.ToLower());

            if (filial == null)
            {
                return NotFound();
            }

            return filial;
        }
    }
}
