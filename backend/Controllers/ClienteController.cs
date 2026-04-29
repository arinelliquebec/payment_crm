using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using Microsoft.Extensions.Caching.Memory;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClienteController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<ClienteController> _logger;
        private readonly IMemoryCache _cache;
        private readonly IAuditService _auditService;

        public ClienteController(CrmArrighiContext context, ILogger<ClienteController> logger, IMemoryCache cache, IAuditService auditService)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
            _auditService = auditService;
        }

        // Método auxiliar para registrar histórico
        private async Task RegistrarHistoricoAsync(int clienteId, string tipoAcao, string descricao, string? dadosAnteriores = null, string? dadosNovos = null, int? usuarioId = null)
        {
            try
            {
                // Obter usuário ID do contexto de autenticação
                int? usuarioIdFinal = usuarioId;

                if (!usuarioIdFinal.HasValue)
                {
                    // Tentar obter do header X-Usuario-Id
                    if (HttpContext.Request.Headers.TryGetValue("X-Usuario-Id", out var headerValue) &&
                        int.TryParse(headerValue.FirstOrDefault(), out int parsedId))
                    {
                        usuarioIdFinal = parsedId;
                        _logger.LogInformation($"🔧 UsuarioId obtido do header: {usuarioIdFinal}");
                    }
                    else
                    {
                        // Tentar obter do token JWT
                        var userIdClaim = User.FindFirst("UsuarioId") ?? User.FindFirst("sub") ?? User.FindFirst("id");
                        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int claimId))
                        {
                            usuarioIdFinal = claimId;
                            _logger.LogInformation($"🔧 UsuarioId obtido do token JWT: {usuarioIdFinal}");
                        }
                    }
                }

                // Se ainda não tiver usuário, buscar o primeiro usuário ativo no sistema
                if (!usuarioIdFinal.HasValue)
                {
                    var primeiroUsuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Ativo);
                    if (primeiroUsuario != null)
                    {
                        usuarioIdFinal = primeiroUsuario.Id;
                        _logger.LogWarning($"⚠️ UsuarioId não fornecido, usando primeiro usuário ativo: {usuarioIdFinal}");
                    }
                    else
                    {
                        _logger.LogError("❌ Nenhum usuário ativo encontrado no sistema. Histórico não será registrado.");
                        return;
                    }
                }

                // Verificar se o usuário existe e obter o nome
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioIdFinal.Value);
                if (usuario == null)
                {
                    _logger.LogError($"❌ Usuário {usuarioIdFinal} não encontrado no banco de dados. Histórico não será registrado.");
                    return;
                }

                var historico = new HistoricoCliente
                {
                    ClienteId = clienteId,
                    TipoAcao = tipoAcao,
                    Descricao = descricao,
                    DadosAnteriores = dadosAnteriores,
                    DadosNovos = dadosNovos,
                    UsuarioId = usuarioIdFinal.Value,
                    NomeUsuario = usuario.Login, // Armazenar o nome do usuário
                    DataHora = DateTime.Now,
                    EnderecoIP = HttpContext.Connection.RemoteIpAddress?.ToString()
                };

                _context.HistoricoClientes.Add(historico);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"✅ Histórico registrado com sucesso: {tipoAcao} - Cliente {clienteId} - Usuário {usuarioIdFinal}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao registrar histórico para cliente {clienteId}: {ex.Message}");
                _logger.LogError($"❌ Stack trace: {ex.StackTrace}");
            }
        }

        // GET: api/Cliente
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            try
            {
                Console.WriteLine("🔍 GetClientes: Buscando clientes ativos");

                // RETORNAR APENAS CLIENTES ATIVOS (soft delete)
                var clientes = await _context.Clientes
                    .Where(c => c.Ativo) // 🔥 Filtrar apenas clientes ativos
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .ToListAsync();

                Console.WriteLine($"✅ GetClientes: Retornando {clientes.Count} clientes ativos");

                return Ok(clientes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetClientes: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/buscar-por-cpf/{cpf}
        [HttpGet("buscar-por-cpf/{cpf}")]
        public async Task<ActionResult<Cliente>> GetClientePorCpf(string cpf)
        {
            try
            {
                Console.WriteLine($"🔍 GetClientePorCpf: Buscando cliente com CPF: {cpf}");

                // Remover caracteres especiais do CPF para busca
                var cpfLimpo = cpf.Replace(".", "").Replace("-", "").Replace(" ", "");
                Console.WriteLine($"🔍 GetClientePorCpf: CPF limpo: {cpfLimpo}");

                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.PessoaFisica != null &&
                        c.PessoaFisica.Cpf != null &&
                        c.PessoaFisica.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);

                if (cliente == null)
                {
                    Console.WriteLine($"❌ GetClientePorCpf: Cliente com CPF {cpf} não encontrado");
                    return NotFound($"Cliente com CPF {cpf} não encontrado");
                }

                Console.WriteLine($"✅ GetClientePorCpf: Cliente encontrado: {cliente.PessoaFisica?.Nome} (ID: {cliente.Id})");
                return Ok(cliente);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetClientePorCpf: Erro: {ex.Message}");
                Console.WriteLine($"❌ GetClientePorCpf: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/buscar-por-cnpj/{cnpj}
        [HttpGet("buscar-por-cnpj/{cnpj}")]
        public async Task<ActionResult<Cliente>> GetClientePorCnpj(string cnpj)
        {
            try
            {
                Console.WriteLine($"🔍 GetClientePorCnpj: Buscando cliente com CNPJ: {cnpj}");

                // Remover caracteres especiais do CNPJ para busca
                var cnpjLimpo = cnpj.Replace(".", "").Replace("/", "").Replace("-", "").Replace(" ", "");
                Console.WriteLine($"🔍 GetClientePorCnpj: CNPJ limpo: {cnpjLimpo}");

                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj.ResponsavelTecnico)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.PessoaJuridica != null &&
                        c.PessoaJuridica.Cnpj != null &&
                        c.PessoaJuridica.Cnpj.Replace(".", "").Replace("/", "").Replace("-", "").Replace(" ", "") == cnpjLimpo);

                if (cliente == null)
                {
                    Console.WriteLine($"❌ GetClientePorCnpj: Cliente com CNPJ {cnpj} não encontrado");
                    return NotFound($"Cliente com CNPJ {cnpj} não encontrado");
                }

                Console.WriteLine($"✅ GetClientePorCnpj: Cliente encontrado: {cliente.PessoaJuridica?.RazaoSocial} (ID: {cliente.Id})");
                return Ok(cliente);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetClientePorCnpj: Erro: {ex.Message}");
                Console.WriteLine($"❌ GetClientePorCnpj: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/buscar-por-documento/{documento}
        [HttpGet("buscar-por-documento/{documento}")]
        public async Task<ActionResult<Cliente>> GetClientePorDocumento(string documento)
        {
            try
            {
                Console.WriteLine($"🔍 GetClientePorDocumento: Buscando cliente com documento: {documento}");

                // Remover caracteres especiais do documento para busca
                var documentoLimpo = documento.Replace(".", "").Replace("/", "").Replace("-", "").Replace(" ", "");
                Console.WriteLine($"🔍 GetClientePorDocumento: Documento limpo: {documentoLimpo}");

                // Buscar tanto por CPF quanto por CNPJ
                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj.ResponsavelTecnico)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c =>
                        (c.PessoaFisica != null &&
                         c.PessoaFisica.Cpf != null &&
                         c.PessoaFisica.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == documentoLimpo) ||
                        (c.PessoaJuridica != null &&
                         c.PessoaJuridica.Cnpj != null &&
                         c.PessoaJuridica.Cnpj.Replace(".", "").Replace("/", "").Replace("-", "").Replace(" ", "") == documentoLimpo));

                if (cliente == null)
                {
                    Console.WriteLine($"❌ GetClientePorDocumento: Cliente com documento {documento} não encontrado");
                    return NotFound($"Cliente com documento {documento} não encontrado");
                }

                var nomeCliente = cliente.PessoaFisica?.Nome ?? cliente.PessoaJuridica?.RazaoSocial ?? "Nome não encontrado";
                Console.WriteLine($"✅ GetClientePorDocumento: Cliente encontrado: {nomeCliente} (ID: {cliente.Id})");
                return Ok(cliente);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetClientePorDocumento: Erro: {ex.Message}");
                Console.WriteLine($"❌ GetClientePorDocumento: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .Include(c => c.PessoaFisica)
                    .ThenInclude(pf => pf!.Endereco)
                .Include(c => c.PessoaJuridica)
                    .ThenInclude(pj => pj!.Endereco)
                .Include(c => c.Filial)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null)
            {
                return NotFound($"Cliente com ID {id} não encontrado.");
            }

            return cliente;
        }

        // POST: api/Cliente/test
        [HttpPost("test")]
        public async Task<ActionResult<string>> TestPost()
        {
            return Ok("POST funcionando!");
        }

        // POST: api/Cliente
        [HttpPost]
        public async Task<ActionResult<Cliente>> PostCliente(CreateClienteDTO createDto)
        {
            // Validação do ModelState
            if (!ModelState.IsValid)
            {
                Console.WriteLine("❌ PostCliente: Dados inválidos recebidos");
                return BadRequest(ModelState);
            }

            // Validações de negócio
            if (string.IsNullOrWhiteSpace(createDto.TipoPessoa))
            {
                return BadRequest(new { erro = "Tipo de pessoa é obrigatório (fisica ou juridica)" });
            }

            if (createDto.PessoaId <= 0)
            {
                return BadRequest(new { erro = "ID da pessoa deve ser maior que zero" });
            }

            try
            {
                Console.WriteLine($"🔍 PostCliente: Iniciando criação de cliente");
                Console.WriteLine($"🔍 PostCliente: TipoPessoa: {createDto.TipoPessoa}, PessoaId: {createDto.PessoaId}");

                // Validar se a pessoa existe
                if (createDto.TipoPessoa.ToLower() == "fisica")
                {
                    var pessoaFisica = await _context.PessoasFisicas.FindAsync(createDto.PessoaId);
                    if (pessoaFisica == null)
                    {
                        return BadRequest($"Pessoa física com ID {createDto.PessoaId} não encontrada.");
                    }
                }
                else if (createDto.TipoPessoa.ToLower() == "juridica")
                {
                    var pessoaJuridica = await _context.PessoasJuridicas.FindAsync(createDto.PessoaId);
                    if (pessoaJuridica == null)
                    {
                        return BadRequest($"Pessoa jurídica com ID {createDto.PessoaId} não encontrada.");
                    }
                }
                else
                {
                    return BadRequest("TipoPessoa deve ser 'Fisica' ou 'Juridica'.");
                }

                // Verificar se já existe cliente para esta pessoa
                var clienteExistente = await _context.Clientes
                    .Where(c => (createDto.TipoPessoa.ToLower() == "fisica" && c.PessoaFisicaId == createDto.PessoaId) ||
                               (createDto.TipoPessoa.ToLower() == "juridica" && c.PessoaJuridicaId == createDto.PessoaId))
                    .FirstOrDefaultAsync();

                if (clienteExistente != null)
                {
                    return BadRequest("Já existe um cliente cadastrado para esta pessoa.");
                }

                // Validar filial se fornecida
                if (createDto.FilialId.HasValue)
                {
                    var filial = await _context.Filiais.FindAsync(createDto.FilialId.Value);
                    if (filial == null)
                    {
                        return BadRequest($"Filial com ID {createDto.FilialId} não encontrada.");
                    }
                }

                // Criar o cliente
                var cliente = new Cliente
                {
                    PessoaFisicaId = createDto.TipoPessoa.ToLower() == "fisica" ? createDto.PessoaId : null,
                    PessoaJuridicaId = createDto.TipoPessoa.ToLower() == "juridica" ? createDto.PessoaId : null,
                    FilialId = createDto.FilialId,
                    Status = createDto.Status ?? "Ativo",
                    Observacoes = createDto.Observacoes,
                    EmailAlternativo = createDto.EmailAlternativo,
                    DataCadastro = DateTime.UtcNow
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ PostCliente: Cliente criado com ID {cliente.Id}");

                // Registrar no histórico
                var nomeCliente = cliente.PessoaFisicaId.HasValue
                    ? (await _context.PessoasFisicas.FindAsync(cliente.PessoaFisicaId))?.Nome
                    : (await _context.PessoasJuridicas.FindAsync(cliente.PessoaJuridicaId))?.RazaoSocial;

                await RegistrarHistoricoAsync(
                    cliente.Id,
                    "Criacao",
                    $"Cliente criado: {nomeCliente}",
                    null,
                    System.Text.Json.JsonSerializer.Serialize(new { cliente.Id, cliente.Status, cliente.FilialId })
                );

                // Auditoria de criação de cliente
                var usuarioIdHeaderCreate = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderCreate, out int usuarioIdCreate);
                var filialNome = cliente.FilialId.HasValue
                    ? (await _context.Filiais.FindAsync(cliente.FilialId))?.Nome ?? "N/A"
                    : "N/A";
                await _auditService.LogAsync(
                    usuarioIdCreate, "Create", "Cliente", cliente.Id,
                    $"Cliente #{cliente.Id} criado | Nome: {nomeCliente} | Tipo: {cliente.TipoPessoa} | Status: {cliente.Status} | Filial: {filialNome}",
                    "Clientes",
                    valorNovo: new {
                        cliente.Id,
                        Nome = nomeCliente,
                        cliente.TipoPessoa,
                        cliente.Status,
                        Filial = filialNome,
                        cliente.FilialId
                    },
                    httpContext: HttpContext);

                // Retornar o cliente criado com includes
                var clienteCriado = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == cliente.Id);

                return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, clienteCriado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ PostCliente: Erro: {ex.Message}");
                Console.WriteLine($"❌ PostCliente: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/Cliente/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, CreateClienteDTO updateDto)
        {
            try
            {
                Console.WriteLine($"🔍 PutCliente: Atualizando cliente ID {id}");

                var clienteExistente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (clienteExistente == null)
                {
                    return NotFound($"Cliente com ID {id} não encontrado.");
                }

                // Guardar status anterior para detectar mudança de status
                var statusAnterior = clienteExistente.Status;

                // Guardar dados anteriores para histórico
                var dadosAnteriores = System.Text.Json.JsonSerializer.Serialize(new
                {
                    clienteExistente.Status,
                    clienteExistente.FilialId,
                    clienteExistente.Observacoes,
                    PessoaFisica = clienteExistente.PessoaFisica,
                    PessoaJuridica = clienteExistente.PessoaJuridica
                });

                // Atualizar campos do Cliente
                bool statusMudou = false;
                if (!string.IsNullOrEmpty(updateDto.Status) && updateDto.Status != clienteExistente.Status)
                {
                    clienteExistente.Status = updateDto.Status;
                    statusMudou = true;
                }

                if (updateDto.FilialId.HasValue)
                {
                    var filial = await _context.Filiais.FindAsync(updateDto.FilialId.Value);
                    if (filial == null)
                    {
                        return BadRequest($"Filial com ID {updateDto.FilialId} não encontrada.");
                    }
                    clienteExistente.FilialId = updateDto.FilialId;
                }

                clienteExistente.Observacoes = updateDto.Observacoes;
                clienteExistente.EmailAlternativo = updateDto.EmailAlternativo;
                clienteExistente.DataAtualizacao = DateTime.UtcNow;

                // Atualizar dados da Pessoa Física
                if (clienteExistente.TipoPessoa == "Fisica" && clienteExistente.PessoaFisica != null)
                {
                    if (!string.IsNullOrEmpty(updateDto.Nome))
                        clienteExistente.PessoaFisica.Nome = updateDto.Nome;
                    if (!string.IsNullOrEmpty(updateDto.EmailEmpresarial))
                        clienteExistente.PessoaFisica.EmailEmpresarial = updateDto.EmailEmpresarial;
                    if (!string.IsNullOrEmpty(updateDto.EmailPessoal))
                        clienteExistente.PessoaFisica.EmailPessoal = updateDto.EmailPessoal;
                    if (!string.IsNullOrEmpty(updateDto.Telefone1))
                        clienteExistente.PessoaFisica.Telefone1 = updateDto.Telefone1;
                    if (!string.IsNullOrEmpty(updateDto.Telefone2))
                        clienteExistente.PessoaFisica.Telefone2 = updateDto.Telefone2;
                    if (updateDto.DataNascimento.HasValue)
                        clienteExistente.PessoaFisica.DataNascimento = updateDto.DataNascimento;
                    if (!string.IsNullOrEmpty(updateDto.EstadoCivil))
                        clienteExistente.PessoaFisica.EstadoCivil = updateDto.EstadoCivil;
                    if (!string.IsNullOrEmpty(updateDto.Sexo))
                        clienteExistente.PessoaFisica.Sexo = updateDto.Sexo;

                    clienteExistente.PessoaFisica.DataAtualizacao = DateTime.UtcNow;

                    // Atualizar endereço se existir
                    if (clienteExistente.PessoaFisica.Endereco != null)
                    {
                        if (!string.IsNullOrEmpty(updateDto.Logradouro))
                            clienteExistente.PessoaFisica.Endereco.Logradouro = updateDto.Logradouro;
                        if (!string.IsNullOrEmpty(updateDto.Numero))
                            clienteExistente.PessoaFisica.Endereco.Numero = updateDto.Numero;
                        if (!string.IsNullOrEmpty(updateDto.Complemento))
                            clienteExistente.PessoaFisica.Endereco.Complemento = updateDto.Complemento;
                        if (!string.IsNullOrEmpty(updateDto.Bairro))
                            clienteExistente.PessoaFisica.Endereco.Bairro = updateDto.Bairro;
                        if (!string.IsNullOrEmpty(updateDto.Cidade))
                            clienteExistente.PessoaFisica.Endereco.Cidade = updateDto.Cidade;
                        if (!string.IsNullOrEmpty(updateDto.Cep))
                            clienteExistente.PessoaFisica.Endereco.Cep = updateDto.Cep;
                    }
                }
                // Atualizar dados da Pessoa Jurídica
                else if (clienteExistente.TipoPessoa == "Juridica" && clienteExistente.PessoaJuridica != null)
                {
                    if (!string.IsNullOrEmpty(updateDto.RazaoSocial))
                        clienteExistente.PessoaJuridica.RazaoSocial = updateDto.RazaoSocial;
                    if (!string.IsNullOrEmpty(updateDto.NomeFantasia))
                        clienteExistente.PessoaJuridica.NomeFantasia = updateDto.NomeFantasia;
                    if (!string.IsNullOrEmpty(updateDto.Email))
                        clienteExistente.PessoaJuridica.Email = updateDto.Email;
                    if (!string.IsNullOrEmpty(updateDto.Telefone1))
                        clienteExistente.PessoaJuridica.Telefone1 = updateDto.Telefone1;
                    if (!string.IsNullOrEmpty(updateDto.Telefone2))
                        clienteExistente.PessoaJuridica.Telefone2 = updateDto.Telefone2;
                    if (!string.IsNullOrEmpty(updateDto.Telefone3))
                        clienteExistente.PessoaJuridica.Telefone3 = updateDto.Telefone3;
                    if (!string.IsNullOrEmpty(updateDto.Telefone4))
                        clienteExistente.PessoaJuridica.Telefone4 = updateDto.Telefone4;

                    clienteExistente.PessoaJuridica.DataAtualizacao = DateTime.UtcNow;

                    // Atualizar endereço se existir
                    if (clienteExistente.PessoaJuridica.Endereco != null)
                    {
                        if (!string.IsNullOrEmpty(updateDto.Logradouro))
                            clienteExistente.PessoaJuridica.Endereco.Logradouro = updateDto.Logradouro;
                        if (!string.IsNullOrEmpty(updateDto.Numero))
                            clienteExistente.PessoaJuridica.Endereco.Numero = updateDto.Numero;
                        if (!string.IsNullOrEmpty(updateDto.Complemento))
                            clienteExistente.PessoaJuridica.Endereco.Complemento = updateDto.Complemento;
                        if (!string.IsNullOrEmpty(updateDto.Bairro))
                            clienteExistente.PessoaJuridica.Endereco.Bairro = updateDto.Bairro;
                        if (!string.IsNullOrEmpty(updateDto.Cidade))
                            clienteExistente.PessoaJuridica.Endereco.Cidade = updateDto.Cidade;
                        if (!string.IsNullOrEmpty(updateDto.Cep))
                            clienteExistente.PessoaJuridica.Endereco.Cep = updateDto.Cep;
                    }
                }

                await _context.SaveChangesAsync();

                // Registrar no histórico
                var nomeCliente = clienteExistente.TipoPessoa == "Fisica"
                    ? clienteExistente.PessoaFisica?.Nome
                    : clienteExistente.PessoaJuridica?.RazaoSocial;

                var dadosNovos = System.Text.Json.JsonSerializer.Serialize(new
                {
                    clienteExistente.Status,
                    clienteExistente.FilialId,
                    clienteExistente.Observacoes,
                    PessoaFisica = clienteExistente.PessoaFisica,
                    PessoaJuridica = clienteExistente.PessoaJuridica
                });

                // Registrar histórico apropriado baseado na mudança
                if (statusMudou)
                {
                    await RegistrarHistoricoAsync(
                        id,
                        "MudancaStatus",
                        $"Status alterado de '{statusAnterior}' para '{clienteExistente.Status}' - Cliente: {nomeCliente}",
                        dadosAnteriores,
                        dadosNovos
                    );
                }
                else
                {
                    await RegistrarHistoricoAsync(
                        id,
                        "Atualizacao",
                        $"Cliente atualizado: {nomeCliente}",
                        dadosAnteriores,
                        dadosNovos
                    );
                }

                Console.WriteLine($"✅ PutCliente: Cliente {id} atualizado com sucesso");

                // Auditoria de atualização de cliente
                var usuarioIdHeaderUpdate = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderUpdate, out int usuarioIdUpdate);
                await _auditService.LogAsync(
                    usuarioIdUpdate, "Update", "Cliente", id,
                    $"Cliente #{id} atualizado | Nome: {nomeCliente} | Status: {clienteExistente.Status}{(statusMudou ? $" (alterado de '{statusAnterior}')" : "")}",
                    "Clientes",
                    valorNovo: new {
                        clienteExistente.Id,
                        Nome = nomeCliente,
                        clienteExistente.Status,
                        clienteExistente.TipoPessoa,
                        StatusMudou = statusMudou,
                        StatusAnterior = statusMudou ? statusAnterior : null
                    },
                    camposAlterados: statusMudou ? "Status" : null,
                    httpContext: HttpContext);

                // Retornar cliente atualizado completo
                var clienteAtualizado = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                        .ThenInclude(pf => pf!.Endereco)
                    .Include(c => c.PessoaJuridica)
                        .ThenInclude(pj => pj!.Endereco)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id);

                return Ok(clienteAtualizado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ PutCliente: Erro: {ex.Message}");
                Console.WriteLine($"❌ PutCliente: StackTrace: {ex.StackTrace}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // DELETE: api/Cliente/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                Console.WriteLine($"🔍 DeleteCliente: Deletando cliente ID {id}");

                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (cliente == null)
                {
                    return NotFound($"Cliente com ID {id} não encontrado.");
                }

                // Soft delete - apenas marcar como inativo
                cliente.Ativo = false;
                cliente.DataAtualizacao = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Registrar no histórico
                var nomeCliente = cliente.TipoPessoa == "Fisica"
                    ? cliente.PessoaFisica?.Nome
                    : cliente.PessoaJuridica?.RazaoSocial;

                await RegistrarHistoricoAsync(
                    id,
                    "Exclusao",
                    $"Cliente inativado: {nomeCliente}",
                    System.Text.Json.JsonSerializer.Serialize(new { Ativo = true }),
                    System.Text.Json.JsonSerializer.Serialize(new { Ativo = false })
                );

                // Auditoria de exclusão de cliente
                var usuarioIdHeaderDelete = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeaderDelete, out int usuarioIdDelete);
                await _auditService.LogAsync(
                    usuarioIdDelete, "Delete", "Cliente", id,
                    $"Cliente #{id} excluído | Nome: {nomeCliente} | Tipo: {cliente.TipoPessoa}",
                    "Clientes",
                    valorAnterior: new {
                        cliente.Id,
                        Nome = nomeCliente,
                        cliente.TipoPessoa,
                        cliente.Status,
                        Ativo = true
                    },
                    severidade: "Warning",
                    httpContext: HttpContext);

                Console.WriteLine($"✅ DeleteCliente: Cliente {id} inativado com sucesso");
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DeleteCliente: Erro: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Cliente/{id}/portal-dados
        // Endpoint otimizado para o Portal do Cliente - retorna todos os dados em uma única query
        [HttpGet("{id}/portal-dados")]
        public async Task<ActionResult<object>> GetPortalClienteDados(int id)
        {
            try
            {
                // ============================================================================
                // 💾 CACHE: Tentar buscar dados do cache primeiro
                // ============================================================================
                var cacheKey = $"portal-cliente-{id}";

                if (_cache.TryGetValue(cacheKey, out object? cachedData))
                {
                    _logger.LogInformation($"💾 Portal Cliente: Dados do cliente {id} retornados do CACHE");
                    return Ok(cachedData);
                }

                _logger.LogInformation($"🔍 Portal Cliente: Buscando dados completos do cliente {id} no BANCO");

                // Buscar cliente com todos os relacionamentos necessários
                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (cliente == null)
                {
                    _logger.LogWarning($"❌ Portal Cliente: Cliente {id} não encontrado");
                    return NotFound(new { error = "Cliente não encontrado" });
                }

                // Buscar TODOS os contratos do cliente
                var contratos = await _context.Contratos
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Where(c => c.ClienteId == id && c.Ativo)
                    .OrderByDescending(c => c.DataCadastro)
                    .ToListAsync();

                _logger.LogInformation($"✅ Portal Cliente: {contratos.Count} contratos encontrados");

                // Buscar TODOS os boletos dos contratos em uma única query
                var contratoIds = contratos.Select(c => c.Id).ToList();
                var boletos = await _context.Boletos
                    .Where(b => contratoIds.Contains(b.ContratoId) && b.Ativo)
                    .OrderByDescending(b => b.DueDate)
                    .ToListAsync();

                _logger.LogInformation($"✅ Portal Cliente: {boletos.Count} boletos encontrados");

                // Processar dados em memória (muito mais rápido que múltiplas queries)
                var contratosFormatados = contratos.Select(c => {
                    var boletosContrato = boletos.Where(b => b.ContratoId == c.Id).ToList();
                    var valorPago = boletosContrato
                        .Where(b => b.FoiPago || b.Status == "PAID" || b.Status == "LIQUIDADO")
                        .Sum(b => b.ValorPago ?? b.NominalValue);

                    var proximoVencimento = boletosContrato
                        .Where(b => !b.FoiPago && b.DueDate >= DateTime.Today)
                        .OrderBy(b => b.DueDate)
                        .FirstOrDefault()?.DueDate;

                    return new {
                        id = c.Id,
                        numeroPasta = c.NumeroPasta ?? $"#{c.Id}",
                        tipoServico = c.TipoServico ?? "Não especificado",
                        situacao = c.Situacao ?? "Em andamento",
                        valorTotal = c.ValorNegociado ?? (c.ValorParcela * (c.NumeroParcelas ?? 1)),
                        valorPago = valorPago,
                        dataInicio = c.DataFechamentoContrato ?? c.DataCadastro,
                        consultorNome = c.Consultor?.PessoaFisica?.Nome ?? "Não atribuído",
                        consultorId = c.ConsultorId,
                        proximoVencimento = proximoVencimento,
                        observacoes = c.Observacoes,
                        pendencias = c.Pendencias
                    };
                }).ToList();

                // Processar todos os boletos
                var todosBoletos = boletos.Select(b => {
                    var contrato = contratos.FirstOrDefault(c => c.Id == b.ContratoId);
                    return new {
                        id = b.Id,
                        contratoId = b.ContratoId,
                        contratoNumero = contrato?.NumeroPasta ?? $"#{b.ContratoId}",
                        valor = b.NominalValue,
                        dataVencimento = b.DueDate,
                        dataPagamento = b.DataPagamento,
                        status = GetStatusBoleto(b),
                        tipo = "boleto",
                        codigoBarras = b.BarCode,
                        linkBoleto = b.PdfBlobUrl,
                        numeroParcela = b.NumeroParcela
                    };
                }).ToList();

                _logger.LogInformation($"✅ Portal Cliente: {todosBoletos.Count} boletos processados");

                // Calcular resumo
                var contratosAtivos = contratosFormatados
                    .Where(c => !new[] { "Quitado", "RESCINDIDO", "RESCINDIDO COM DEBITO" }.Contains(c.situacao))
                    .ToList();

                var boletosPendentes = todosBoletos.Where(b => b.status == "pendente").ToList();
                var boletosVencidos = todosBoletos.Where(b => b.status == "vencido").ToList();
                var proximoPagamento = boletosPendentes
                    .OrderBy(b => b.dataVencimento)
                    .FirstOrDefault();

                var resumo = new {
                    totalContratos = contratosFormatados.Count,
                    contratosAtivos = contratosAtivos.Count,
                    valorTotalContratos = contratosFormatados.Sum(c => c.valorTotal),
                    valorTotalPago = contratosFormatados.Sum(c => c.valorPago),
                    boletosPendentes = boletosPendentes.Count,
                    boletosVencidos = boletosVencidos.Count,
                    proximoPagamento = proximoPagamento
                };

                _logger.LogInformation($"✅ Portal Cliente: Dados completos retornados - {resumo.totalContratos} contratos, {todosBoletos.Count} boletos");

                // ============================================================================
                // 💾 CACHE: Salvar dados no cache por 5 minutos
                // ============================================================================
                var responseData = new {
                    contratos = contratosFormatados,
                    pagamentos = todosBoletos,
                    resumo = resumo
                };

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

                _cache.Set(cacheKey, responseData, cacheOptions);
                _logger.LogInformation($"💾 Portal Cliente: Dados do cliente {id} salvos no CACHE (5 minutos)");

                return Ok(responseData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Portal Cliente: Erro ao buscar dados do cliente {id}");
                return StatusCode(500, new { error = "Erro interno do servidor", detalhes = ex.Message });
            }
        }

        // Método auxiliar para determinar status do boleto
        private string GetStatusBoleto(Boleto boleto)
        {
            if (boleto.FoiPago || boleto.Status == "PAID" || boleto.Status == "LIQUIDADO" || boleto.DataPagamento.HasValue)
            {
                return "pago";
            }

            var hoje = DateTime.Today;
            if (boleto.DueDate.Date < hoje)
            {
                return "vencido";
            }

            return "pendente";
        }

    }
}
