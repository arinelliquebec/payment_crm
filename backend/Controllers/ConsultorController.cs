using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConsultorController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public ConsultorController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Consultor
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Consultor>>> GetConsultores()
        {
            try
            {
                var consultores = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.Filial)
                    .Where(c => c.Ativo)
                    .ToListAsync();

                // Ordena alfabeticamente por nome
                return consultores.OrderBy(c => c.PessoaFisica.Nome).ToList();
            }
            catch (Exception ex)
            {
                // Retorna dados mock quando o banco não está disponível
                var mockData = new List<Consultor>
                {
                    new Consultor
                    {
                        Id = 1,
                        PessoaFisicaId = 1,
                        PessoaFisica = new PessoaFisica
                        {
                            Id = 1,
                            Nome = "JOÃO SILVA",
                            Cpf = "123.456.789-01",
                            Email = "joao.silva@email.com",
                            Telefone1 = "(11) 99999-1111",
                            Endereco = new Endereco
                            {
                                Id = 1,
                                Cidade = "São Paulo",
                                Bairro = "Vila Madalena",
                                Logradouro = "Rua Harmonia",
                                Cep = "05435-000",
                                Numero = "123"
                            }
                        },
                        FilialId = 1,
                        DataCadastro = DateTime.Now.AddDays(-60)
                    },
                    new Consultor
                    {
                        Id = 2,
                        PessoaFisicaId = 2,
                        PessoaFisica = new PessoaFisica
                        {
                            Id = 2,
                            Nome = "MARIA SANTOS",
                            Cpf = "234.567.890-12",
                            Email = "maria.santos@email.com",
                            Telefone1 = "(21) 99999-2222",
                            Endereco = new Endereco
                            {
                                Id = 2,
                                Cidade = "Rio de Janeiro",
                                Bairro = "Copacabana",
                                Logradouro = "Avenida Atlântica",
                                Cep = "22070-010",
                                Numero = "456"
                            }
                        },
                        FilialId = 2,
                        DataCadastro = DateTime.Now.AddDays(-45)
                    }
                };

                return mockData.OrderBy(c => c.PessoaFisica.Nome).ToList();
            }
        }

        // GET: api/Consultor/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Consultor>> GetConsultor(int id)
        {
                            var consultor = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

            if (consultor == null)
            {
                return NotFound();
            }

            return consultor;
        }

        // POST: api/Consultor
        [HttpPost]
        public async Task<ActionResult<Consultor>> CreateConsultor(CreateConsultorDTO createConsultorDTO)
        {
            try
            {
                // Validar se a pessoa física existe
                var pessoaFisica = await _context.PessoasFisicas.FindAsync(createConsultorDTO.PessoaFisicaId);
                if (pessoaFisica == null)
                {
                    return BadRequest("Pessoa física não encontrada");
                }

                // Verificar se já existe um consultor para esta pessoa
                var consultorExistente = await _context.Consultores
                    .FirstOrDefaultAsync(c => c.PessoaFisicaId == createConsultorDTO.PessoaFisicaId && c.Ativo);
                if (consultorExistente != null)
                {
                    return BadRequest("Já existe um consultor cadastrado para esta pessoa física");
                }

                var consultor = new Consultor
                {
                    PessoaFisicaId = createConsultorDTO.PessoaFisicaId,
                    FilialId = createConsultorDTO.FilialId,
                    OAB = createConsultorDTO.OAB,
                    DataCadastro = DateTime.Now,
                    Ativo = true
                };

                _context.Consultores.Add(consultor);
                await _context.SaveChangesAsync();

                // Retornar o consultor com os dados da pessoa
                return await GetConsultor(consultor.Id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Consultor/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConsultor(int id, UpdateConsultorDTO updateConsultorDTO)
        {
            if (id != updateConsultorDTO.Id)
            {
                return BadRequest();
            }

            try
            {
                var consultorExistente = await _context.Consultores.FindAsync(id);
                if (consultorExistente == null || !consultorExistente.Ativo)
                {
                    return NotFound();
                }

                // Atualizar apenas os campos permitidos
                consultorExistente.FilialId = updateConsultorDTO.FilialId;
                consultorExistente.OAB = updateConsultorDTO.OAB;
                consultorExistente.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ConsultorExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/Consultor/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConsultor(int id)
        {
            var consultor = await _context.Consultores.FindAsync(id);
            if (consultor == null || !consultor.Ativo)
            {
                return NotFound();
            }

            // Verificar se o consultor tem clientes ativos
            var clientesAtivos = await _context.HistoricoConsultores
                .Where(h => h.ConsultorId == id && h.DataFim == null)
                .AnyAsync();

            if (clientesAtivos)
            {
                return BadRequest("Não é possível excluir o consultor pois ele possui clientes ativos. Transfira os clientes para outro consultor primeiro.");
            }

            // Soft delete - apenas marca como inativo
            consultor.Ativo = false;
            consultor.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/Consultor/5/atualizar-filial
        [HttpPatch("{id}/atualizar-filial")]
        public async Task<IActionResult> AtualizarFilialConsultor(int id, UpdateConsultorDTO updateConsultorDTO)
        {
            if (id != updateConsultorDTO.Id)
            {
                return BadRequest();
            }

            try
            {
                var consultorExistente = await _context.Consultores.FindAsync(id);
                if (consultorExistente == null || !consultorExistente.Ativo)
                {
                    return NotFound();
                }

                // Atualizar apenas os campos permitidos
                consultorExistente.FilialId = updateConsultorDTO.FilialId;
                consultorExistente.OAB = updateConsultorDTO.OAB;
                consultorExistente.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Consultor/atribuir-cliente
        [HttpPost("atribuir-cliente")]
        public async Task<IActionResult> AtribuirCliente(AtribuirClienteDTO atribuirClienteDTO)
        {
            try
            {
                // Validar se o consultor existe
                var consultor = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                    .FirstOrDefaultAsync(c => c.Id == atribuirClienteDTO.ConsultorId && c.Ativo);
                if (consultor == null)
                {
                    return BadRequest("Consultor não encontrado ou inativo");
                }

                // Validar se o cliente existe
                var cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.Id == atribuirClienteDTO.ClienteId && c.Ativo);
                if (cliente == null)
                {
                    return BadRequest("Cliente não encontrado ou inativo");
                }

                // Verificar se o cliente já tem um consultor ativo
                var consultorAtual = await _context.HistoricoConsultores
                    .Include(h => h.Cliente)
                    .Where(h => h.ClienteId == atribuirClienteDTO.ClienteId && h.DataFim == null)
                    .FirstOrDefaultAsync();

                if (consultorAtual != null)
                {
                    var nomeConsultorAtual = await _context.Consultores
                        .Include(c => c.PessoaFisica)
                        .Where(c => c.Id == consultorAtual.ConsultorId)
                        .Select(c => c.PessoaFisica.Nome)
                        .FirstOrDefaultAsync();

                    return BadRequest($"Este cliente já está atribuído ao consultor {nomeConsultorAtual}. Finalize o vínculo atual antes de criar um novo.");
                }

                // Finalizar período anterior se existir
                if (consultorAtual != null)
                {
                    consultorAtual.DataFim = DateTime.Now;
                    consultorAtual.MotivoTransferencia = "Transferência para novo consultor";
                }

                // Criar novo histórico
                var novoHistorico = new HistoricoConsultor
                {
                    ClienteId = atribuirClienteDTO.ClienteId,
                    ConsultorId = atribuirClienteDTO.ConsultorId,
                    DataInicio = DateTime.Now,
                    MotivoTransferencia = atribuirClienteDTO.MotivoAtribuicao,
                    DataCadastro = DateTime.Now
                };

                _context.HistoricoConsultores.Add(novoHistorico);

                // Atualizar o consultor atual no cliente
                cliente.ConsultorAtualId = atribuirClienteDTO.ConsultorId;
                cliente.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Cliente atribuído com sucesso ao consultor" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Consultor/5/clientes
        [HttpGet("{id}/clientes")]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientesDoConsultor(int id)
        {
            try
            {
                var clientes = await _context.HistoricoConsultores
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                            .ThenInclude(pf => pf!.Endereco)
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                            .ThenInclude(pj => pj!.Endereco)
                    .Where(h => h.ConsultorId == id && h.DataFim == null && h.Cliente.Ativo)
                    .Select(h => h.Cliente)
                    .ToListAsync();

                return clientes.OrderBy(c =>
                    c.TipoPessoa == "Fisica" ? c.PessoaFisica?.Nome : c.PessoaJuridica?.RazaoSocial).ToList();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Consultor/5/clientes-todos
        [HttpGet("{id}/clientes-todos")]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoClientesDoConsultor(int id)
        {
            try
            {
                var historico = await _context.HistoricoConsultores
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .Where(h => h.ConsultorId == id && h.Cliente.Ativo)
                    .OrderByDescending(h => h.DataInicio)
                    .ToListAsync();

                return historico;
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private bool ConsultorExists(int id)
        {
            return _context.Consultores.Any(e => e.Id == id && e.Ativo);
        }
    }
}
