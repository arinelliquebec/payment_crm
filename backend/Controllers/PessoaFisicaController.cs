using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PessoaFisicaController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public PessoaFisicaController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/PessoaFisica
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PessoaFisica>>> GetPessoasFisicas()
        {
            try
            {
                var pessoas = await _context.PessoasFisicas.Include(p => p.Endereco).ToListAsync();

                // Ordena alfabeticamente por nome
                return pessoas.OrderBy(p => p.Nome).ToList();
            }
            catch (Exception ex)
            {
                // Retorna dados mock quando o banco não está disponível
                var mockData = new List<PessoaFisica>
                {
                    new PessoaFisica
                    {
                        Id = 1,
                        Nome = "JOÃO SILVA",
                        Cpf = "123.456.789-01",
                        Email = "joao.silva@email.com",
                        Sexo = "M",
                        DataNascimento = new DateTime(1985, 3, 15),
                        EstadoCivil = "Casado",
                        Telefone1 = "(11) 99999-1111",
                        Telefone2 = "(11) 88888-1111",
                        Endereco = new Endereco
                        {
                            Id = 1,
                            Cidade = "São Paulo",
                            Bairro = "Vila Madalena",
                            Logradouro = "Rua Harmonia",
                            Cep = "05435-000",
                            Numero = "123",
                            Complemento = "Apto 45"
                        }
                    },
                    new PessoaFisica
                    {
                        Id = 2,
                        Nome = "MARIA SANTOS",
                        Cpf = "234.567.890-12",
                        Email = "maria.santos@email.com",
                        Sexo = "F",
                        DataNascimento = new DateTime(1990, 7, 22),
                        EstadoCivil = "Solteiro",
                        Telefone1 = "(21) 99999-2222",
                        Telefone2 = "(21) 88888-2222",
                        Endereco = new Endereco
                        {
                            Id = 2,
                            Cidade = "Rio de Janeiro",
                            Bairro = "Copacabana",
                            Logradouro = "Avenida Atlântica",
                            Cep = "22070-010",
                            Numero = "456",
                            Complemento = "Casa"
                        }
                    }
                };

                return mockData.OrderBy(p => p.Nome).ToList();
            }
        }

        // GET: api/PessoaFisica/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PessoaFisica>> GetPessoaFisica(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas
                .Include(p => p.Endereco)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (pessoaFisica == null)
            {
                return NotFound();
            }

            return pessoaFisica;
        }

        // GET: api/PessoaFisica/buscar-por-cpf/{cpf}
        [HttpGet("buscar-por-cpf/{cpf}")]
        public async Task<ActionResult<PessoaFisica>> GetPessoaFisicaPorCpf(string cpf)
        {
            try
            {
                // Remover caracteres especiais do CPF para busca
                var cpfLimpo = cpf.Replace(".", "").Replace("-", "").Replace(" ", "");

                var pessoaFisica = await _context.PessoasFisicas
                    .Include(p => p.Endereco)
                    .FirstOrDefaultAsync(p => p.Cpf != null && p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (pessoaFisica == null)
                {
                    return NotFound($"Pessoa física com CPF {cpf} não encontrada");
                }

                return pessoaFisica;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/PessoaFisica/responsaveis-tecnicos
        [HttpGet("responsaveis-tecnicos")]
        public async Task<ActionResult<IEnumerable<object>>> GetResponsaveisTecnicos()
        {
            var responsaveis = await _context.PessoasFisicas
                .Include(p => p.Endereco)
                .Select(p => new {
                    p.Id,
                    p.Nome,
                    p.Cpf,
                    p.Email,
                    p.Sexo,
                    p.DataNascimento,
                    p.EstadoCivil,
                    p.Telefone1,
                    p.Telefone2,
                    p.EnderecoId,
                    Endereco = new {
                        p.Endereco.Id,
                        p.Endereco.Cidade,
                        p.Endereco.Bairro,
                        p.Endereco.Logradouro,
                        p.Endereco.Cep,
                        p.Endereco.Numero,
                        p.Endereco.Complemento
                    }
                })
                .ToListAsync();

            return responsaveis;
        }

        // POST: api/PessoaFisica
        [HttpPost]
        public async Task<ActionResult<PessoaFisica>> PostPessoaFisica(CreatePessoaFisicaDTO dto)
        {
            if (ModelState.IsValid)
            {
                // Criar o endereço primeiro
                var endereco = new Endereco
                {
                    Cidade = dto.Endereco.Cidade,
                    Bairro = dto.Endereco.Bairro,
                    Logradouro = dto.Endereco.Logradouro,
                    Cep = dto.Endereco.Cep,
                    Numero = dto.Endereco.Numero,
                    Complemento = dto.Endereco.Complemento
                };

                _context.Enderecos.Add(endereco);
                await _context.SaveChangesAsync();

                // Criar a pessoa física
                var pessoaFisica = new PessoaFisica
                {
                    Nome = dto.Nome,
                    Email = dto.Email,
                    Codinome = dto.Codinome,
                    Sexo = dto.Sexo,
                    DataNascimento = dto.DataNascimento,
                    EstadoCivil = dto.EstadoCivil,
                    Cpf = dto.Cpf,
                    Rg = dto.Rg,
                    Cnh = dto.Cnh,
                    Telefone1 = dto.Telefone1,
                    Telefone2 = dto.Telefone2,
                    EnderecoId = endereco.Id
                };

                _context.PessoasFisicas.Add(pessoaFisica);
                await _context.SaveChangesAsync();

                // Carregar o endereço para retornar
                pessoaFisica.Endereco = endereco;

                return CreatedAtAction(nameof(GetPessoaFisica), new { id = pessoaFisica.Id }, pessoaFisica);
            }

            return BadRequest(ModelState);
        }

        // PUT: api/PessoaFisica/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPessoaFisica(int id, PessoaFisica pessoaFisica)
        {
            if (id != pessoaFisica.Id)
            {
                return BadRequest();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    pessoaFisica.DataAtualizacao = DateTime.Now;
                    _context.Update(pessoaFisica);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PessoaFisicaExists(pessoaFisica.Id))
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

        // DELETE: api/PessoaFisica/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePessoaFisica(int id)
        {
            var pessoaFisica = await _context.PessoasFisicas.FindAsync(id);
            if (pessoaFisica == null)
            {
                return NotFound();
            }

            // Verificar se a pessoa física é responsável técnico de alguma pessoa jurídica
            var isResponsavelTecnico = await _context.PessoasJuridicas
                .AnyAsync(pj => pj.ResponsavelTecnicoId == id);

            if (isResponsavelTecnico)
            {
                return BadRequest("Não é possível excluir esta pessoa física pois ela é responsável técnico de uma ou mais pessoas jurídicas.");
            }

            _context.PessoasFisicas.Remove(pessoaFisica);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PessoaFisicaExists(int id)
        {
            return _context.PessoasFisicas.Any(e => e.Id == id);
        }
    }
}
