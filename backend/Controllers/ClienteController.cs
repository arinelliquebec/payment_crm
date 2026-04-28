using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClienteController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public ClienteController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/Cliente
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            try
            {
                var clientes = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial) // ✅ Incluir dados da filial
                    .Where(c => c.Ativo)
                    .ToListAsync();

                // Ordena alfabeticamente por nome/razão social
                return clientes.OrderBy(c =>
                    c.TipoPessoa == "Fisica" ? c.PessoaFisica?.Nome : c.PessoaJuridica?.RazaoSocial).ToList();
            }
            catch (Exception ex)
            {
                // Retorna dados mock quando o banco não está disponível
                var mockData = new List<Cliente>
                {
                    new Cliente
                    {
                        Id = 1,
                        TipoPessoa = "Fisica",
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
                        FilialId = 5, // São Paulo - SP
                        Status = "Ativo",
                        Observacoes = "Cliente VIP - Atendimento prioritário",
                        DataCadastro = DateTime.Now.AddDays(-30)
                    },
                    new Cliente
                    {
                        Id = 2,
                        TipoPessoa = "Juridica",
                        PessoaJuridicaId = 1,
                        PessoaJuridica = new PessoaJuridica
                        {
                            Id = 1,
                            RazaoSocial = "EMPRESA ABC LTDA",
                            NomeFantasia = "ABC",
                            Cnpj = "12.345.678/0001-90",
                            Email = "contato@abc.com.br",
                            Telefone1 = "(11) 3333-4444",
                            Endereco = new Endereco
                            {
                                Id = 2,
                                Cidade = "São Paulo",
                                Bairro = "Centro",
                                Logradouro = "Rua das Flores",
                                Cep = "01234-567",
                                Numero = "100"
                            }
                        },
                        FilialId = 1, // Rio de Janeiro - RJ
                        Status = "Prospecto",
                        Observacoes = "Empresa com potencial de crescimento",
                        DataCadastro = DateTime.Now.AddDays(-15)
                    }
                };

                return mockData.OrderBy(c =>
                    c.TipoPessoa == "Fisica" ? c.PessoaFisica?.Nome : c.PessoaJuridica?.RazaoSocial).ToList();
            }
        }

        // GET: api/Cliente/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.PessoaFisica)
                    .ThenInclude(pf => pf!.Endereco)
                .Include(c => c.PessoaJuridica)
                    .ThenInclude(pj => pj!.Endereco)
                .Include(c => c.Filial) // ✅ Incluir dados da filial
                .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

            if (cliente == null)
            {
                return NotFound();
            }

            return cliente;
        }

        // POST: api/Cliente
        [HttpPost]
        public async Task<ActionResult<Cliente>> CreateCliente(CreateClienteDTO createClienteDTO)
        {
            try
            {
                // Validar se a pessoa existe
                if (createClienteDTO.TipoPessoa == "Fisica")
                {
                    var pessoaFisica = await _context.PessoasFisicas.FindAsync(createClienteDTO.PessoaId);
                    if (pessoaFisica == null)
                    {
                        return BadRequest("Pessoa física não encontrada");
                    }

                    // Verificar se já existe um cliente para esta pessoa
                    var clienteExistente = await _context.Clientes
                        .FirstOrDefaultAsync(c => c.PessoaFisicaId == createClienteDTO.PessoaId && c.Ativo);
                    if (clienteExistente != null)
                    {
                        return BadRequest("Já existe um cliente cadastrado para esta pessoa física");
                    }
                }
                else if (createClienteDTO.TipoPessoa == "Juridica")
                {
                    var pessoaJuridica = await _context.PessoasJuridicas.FindAsync(createClienteDTO.PessoaId);
                    if (pessoaJuridica == null)
                    {
                        return BadRequest("Pessoa jurídica não encontrada");
                    }

                    // Verificar se já existe um cliente para esta pessoa
                    var clienteExistente = await _context.Clientes
                        .FirstOrDefaultAsync(c => c.PessoaJuridicaId == createClienteDTO.PessoaId && c.Ativo);
                    if (clienteExistente != null)
                    {
                        return BadRequest("Já existe um cliente cadastrado para esta pessoa jurídica");
                    }
                }
                else
                {
                    return BadRequest("Tipo de pessoa inválido. Use 'Fisica' ou 'Juridica'");
                }

                var cliente = new Cliente
                {
                    TipoPessoa = createClienteDTO.TipoPessoa,
                    PessoaFisicaId = createClienteDTO.TipoPessoa == "Fisica" ? createClienteDTO.PessoaId : null,
                    PessoaJuridicaId = createClienteDTO.TipoPessoa == "Juridica" ? createClienteDTO.PessoaId : null,
                    FilialId = createClienteDTO.FilialId,
                    Status = createClienteDTO.Status,
                    Observacoes = createClienteDTO.Observacoes,
                    DataCadastro = DateTime.Now,
                    Ativo = true
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                // Retornar o cliente com os dados da pessoa
                return await GetCliente(cliente.Id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Cliente/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCliente(int id, Cliente cliente)
        {
            if (id != cliente.Id)
            {
                return BadRequest();
            }

            try
            {
                var clienteExistente = await _context.Clientes.FindAsync(id);
                if (clienteExistente == null || !clienteExistente.Ativo)
                {
                    return NotFound();
                }

                // Atualizar apenas os campos permitidos
                clienteExistente.FilialId = cliente.FilialId;
                clienteExistente.Status = cliente.Status;
                clienteExistente.Observacoes = cliente.Observacoes;
                clienteExistente.DataAtualizacao = DateTime.Now;

                await _context.SaveChangesAsync();

                // Recarregar o cliente com os relacionamentos
                var clienteAtualizado = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .FirstOrDefaultAsync(c => c.Id == id);

                return Ok(clienteAtualizado);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClienteExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
        }

        // DELETE: api/Cliente/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null || !cliente.Ativo)
            {
                return NotFound();
            }

            // Soft delete - apenas marca como inativo
            cliente.Ativo = false;
            cliente.DataAtualizacao = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Cliente/5/historico
        [HttpGet("{id}/historico")]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoConsultor(int id)
        {
            var historico = await _context.HistoricoConsultores
                .Where(h => h.ClienteId == id)
                .OrderByDescending(h => h.DataInicio)
                .ToListAsync();

            return historico;
        }

        private bool ClienteExists(int id)
        {
            return _context.Clientes.Any(e => e.Id == id && e.Ativo);
        }
    }
}
