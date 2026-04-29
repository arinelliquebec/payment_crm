using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

// Última atualização: 08/10/2025
// Melhorias: Ordenação alfabética, logs detalhados PDF, validação de documentos anexados
namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContratoController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;
        private readonly IAzureBlobStorageService _blobStorageService;
        private readonly IAuditService _auditService;

        public ContratoController(
            CrmArrighiContext context,
            IAuthorizationService authorizationService,
            IAzureBlobStorageService blobStorageService,
            IAuditService auditService)
        {
            _context = context;
            _authorizationService = authorizationService;
            _blobStorageService = blobStorageService;
            _auditService = auditService;
        }

        // Método auxiliar para registrar histórico no cliente quando há alterações em contratos
        private async Task RegistrarHistoricoClienteAsync(int clienteId, int contratoId, string tipoAcao, string descricao, string? dadosAnteriores = null, string? dadosNovos = null, int? usuarioId = null)
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
                    }
                    else
                    {
                        // Tentar obter do token JWT
                        var userIdClaim = User.FindFirst("UsuarioId") ?? User.FindFirst("sub") ?? User.FindFirst("id");
                        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int claimId))
                        {
                            usuarioIdFinal = claimId;
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
                    }
                    else
                    {
                        Console.WriteLine("❌ Nenhum usuário ativo encontrado no sistema. Histórico não será registrado.");
                        return;
                    }
                }

                // Verificar se o usuário existe e obter o nome
                var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioIdFinal.Value);
                if (usuario == null)
                {
                    Console.WriteLine($"❌ Usuário {usuarioIdFinal} não encontrado no banco de dados. Histórico não será registrado.");
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
                    NomeUsuario = usuario.Login,
                    DataHora = DateTime.Now,
                    EnderecoIP = HttpContext.Connection.RemoteIpAddress?.ToString()
                };

                _context.HistoricoClientes.Add(historico);
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Histórico registrado no cliente {clienteId}: {tipoAcao} - Contrato {contratoId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao registrar histórico para cliente {clienteId}: {ex.Message}");
            }
        }

        // GET: api/Contrato
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratos()
        {
            try
            {
                Console.WriteLine("🔍 GetContratos: Buscando contratos reais no banco de dados");

                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    Console.WriteLine("❌ GetContratos: Usuário não identificado");
                    return Unauthorized("Usuário não autenticado");
                }

                Console.WriteLine($"🔍 GetContratos: Usuário identificado: {usuarioId}");

                // Buscar informações do usuário para debug
                var usuario = await _authorizationService.GetUsuarioAsync(usuarioId.Value);
                if (usuario == null)
                {
                    Console.WriteLine($"❌ GetContratos: Usuário {usuarioId} não encontrado no banco");
                    return Unauthorized("Usuário não encontrado");
                }

                Console.WriteLine($"🔍 GetContratos: Usuário: {usuario.Login}, Grupo: {usuario.GrupoAcesso?.Nome}, ConsultorId: {usuario.ConsultorId}");

                // Buscar contratos base com includes
                var contratosQuery = _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Where(c => c.Ativo);

                // Aplicar filtro de autorização baseado no grupo do usuário
                var contratosFiltrados = await _authorizationService.FilterContratosByUserAsync(usuarioId.Value, contratosQuery);
                var contratos = await contratosFiltrados.ToListAsync();

                Console.WriteLine($"✅ GetContratos: Encontrados {contratos.Count} contratos para o usuário {usuarioId} (Grupo: {usuario.GrupoAcesso?.Nome})");

                // Log dos IDs de contratos retornados (para debug de produção)
                if (contratos.Any())
                {
                    var primeiros10Ids = string.Join(", ", contratos.Take(10).Select(c => c.Id));
                    Console.WriteLine($"📊 GetContratos: Primeiros 10 IDs: {primeiros10Ids}");
                    Console.WriteLine($"📊 GetContratos: ID Mínimo: {contratos.Min(c => c.Id)}, ID Máximo: {contratos.Max(c => c.Id)}");
                }

                // Log detalhado dos contratos para debug
                foreach (var contrato in contratos.Take(3)) // Log apenas os primeiros 3
                {
                    Console.WriteLine($"🔍 Contrato {contrato.Id}: DataUltimoContato={contrato.DataUltimoContato}, DataProximoContato={contrato.DataProximoContato}");
                    Console.WriteLine($"🔍 Contrato {contrato.Id}: TipoServico={contrato.TipoServico}, DataFechamentoContrato={contrato.DataFechamentoContrato}");
                    Console.WriteLine($"🔍 Contrato {contrato.Id}: ValorEntrada={contrato.ValorEntrada}, ValorParcela={contrato.ValorParcela}, NumeroParcelas={contrato.NumeroParcelas}");
                    Console.WriteLine($"🔍 Contrato {contrato.Id}: Comissão={contrato.Comissao}, AnexoDocumento={contrato.AnexoDocumento}");
                    Console.WriteLine($"🔍 Contrato {contrato.Id}: Pendências={contrato.Pendencias}");
                }

                return Ok(contratos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ GetContratos: Erro ao buscar contratos: {ex.Message}");
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Contrato>> GetContrato(int id)
        {
            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode visualizar este contrato
                var canView = await _authorizationService.CanViewContratoAsync(usuarioId.Value, id);
                if (!canView)
                {
                    return Forbid("Você não tem permissão para visualizar este contrato");
                }

                // Buscar o contrato com todos os dados relacionados
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (contrato == null)
                {
                    return NotFound(new {
                        recurso = "Contrato",
                        id = id,
                        mensagem = $"Contrato #{id} não foi encontrado"
                    });
                }

                // Log detalhado para debug de TODOS os campos
                Console.WriteLine($"🔍 GetContrato {id} - DADOS COMPLETOS:");
                Console.WriteLine($"  TipoServico: '{contrato.TipoServico}'");
                Console.WriteLine($"  DataFechamentoContrato: '{contrato.DataFechamentoContrato}'");
                Console.WriteLine($"  ValorEntrada: '{contrato.ValorEntrada}'");
                Console.WriteLine($"  ValorParcela: '{contrato.ValorParcela}'");
                Console.WriteLine($"  NumeroParcelas: '{contrato.NumeroParcelas}'");
                Console.WriteLine($"  PrimeiroVencimento: '{contrato.PrimeiroVencimento}'");
                Console.WriteLine($"  Comissão: '{contrato.Comissao}'");
                Console.WriteLine($"  AnexoDocumento: '{contrato.AnexoDocumento}'");
                Console.WriteLine($"  Pendencias: '{contrato.Pendencias}'");
                Console.WriteLine($"  NumeroPasta: '{contrato.NumeroPasta}'");
                Console.WriteLine($"  ObjetoContrato: '{contrato.ObjetoContrato}'");
                Console.WriteLine($"  ValorDevido: '{contrato.ValorDevido}'");
                Console.WriteLine($"  Situacao: '{contrato.Situacao}'");

                // Verificar se há problemas na serialização
                try
                {
                    var jsonResult = System.Text.Json.JsonSerializer.Serialize(contrato, new System.Text.Json.JsonSerializerOptions
                    {
                        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
                        WriteIndented = true,
                        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                    });

                    Console.WriteLine($"🔍 GetContrato {id} - JSON SERIALIZADO:");
                    Console.WriteLine(jsonResult.Substring(0, Math.Min(1000, jsonResult.Length)));
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"🔍 GetContrato {id} - ERRO NA SERIALIZAÇÃO: {ex.Message}");
                }

                return Ok(contrato);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/cliente/5
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorCliente(int clienteId)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockContratos = new List<Contrato>
                {
                    new Contrato
                    {
                        Id = 1,
                        ClienteId = clienteId,
                        Cliente = new Cliente
                        {
                            Id = clienteId,
                            TipoPessoa = "Fisica",
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "João Silva",
                                Cpf = "12345678901"
                            },
                            FilialId = 5
                        },
                        ConsultorId = 1,
                        Consultor = new Consultor
                        {
                            Id = 1,
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "Maria Santos",
                                Cpf = "98765432100"
                            },
                            FilialId = 1
                        },
                        Situacao = "Leed",
                        DataUltimoContato = DateTime.UtcNow.AddDays(-2),
                        DataProximoContato = DateTime.UtcNow.AddDays(5),
                        ValorDevido = 50000.00m,
                        ValorNegociado = 45000.00m,
                        Observacoes = "Cliente interessado em plano empresarial",
                        DataCadastro = DateTime.UtcNow.AddDays(-10)
                    }
                };

                return Ok(mockContratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/debug-usuario
        [HttpGet("debug-usuario")]
        public async Task<ActionResult<object>> DebugUsuario()
        {
            try
            {
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Ok(new {
                        error = "Usuário não identificado",
                        headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
                    });
                }

                var usuario = await _authorizationService.GetUsuarioAsync(usuarioId.Value);
                if (usuario == null)
                {
                    return Ok(new {
                        error = $"Usuário {usuarioId} não encontrado no banco",
                        usuarioId = usuarioId
                    });
                }

                // Buscar contratos totais e filtrados para comparação
                var totalContratos = await _context.Contratos.Where(c => c.Ativo).CountAsync();
                var contratosFiltrados = await _authorizationService.FilterContratosByUserAsync(usuarioId.Value, _context.Contratos.Where(c => c.Ativo));
                var contratosFiltradosCount = await contratosFiltrados.CountAsync();

                return Ok(new {
                    usuario = new {
                        id = usuario.Id,
                        login = usuario.Login,
                        email = usuario.Email,
                        grupoAcessoId = usuario.GrupoAcessoId,
                        grupoAcessoNome = usuario.GrupoAcesso?.Nome,
                        consultorId = usuario.ConsultorId,
                        filialId = usuario.FilialId,
                        ativo = usuario.Ativo
                    },
                    contratos = new {
                        total = totalContratos,
                        filtrados = contratosFiltradosCount,
                        diferenca = totalContratos - contratosFiltradosCount
                    },
                    headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // GET: api/Contrato/meus-contratos
        [HttpGet("meus-contratos")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetMeusContratos()
        {
            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Obter ID do consultor do usuário
                var usuario = await _authorizationService.GetUsuarioAsync(usuarioId.Value);
                if (usuario?.ConsultorId == null)
                {
                    return Forbid("Usuário não está vinculado a um consultor");
                }

                // Buscar contratos do consultor com filtro de autorização
                var contratosQuery = _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Where(c => c.ConsultorId == usuario.ConsultorId && c.Ativo);

                // Aplicar filtro de autorização
                var contratosFiltrados = await _authorizationService.FilterContratosByUserAsync(usuarioId.Value, contratosQuery);
                var contratos = await contratosFiltrados.ToListAsync();

                Console.WriteLine($"✅ GetMeusContratos: Encontrados {contratos.Count} contratos para o consultor {usuario.ConsultorId}");

                return Ok(contratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/consultor/5
        [HttpGet("consultor/{consultorId}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorConsultor(int consultorId)
        {
            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode visualizar consultores
                var canViewConsultor = await _authorizationService.CanViewConsultorAsync(usuarioId.Value, consultorId);
                if (!canViewConsultor)
                {
                    return Forbid("Você não tem permissão para visualizar contratos deste consultor");
                }

                // Buscar contratos do consultor com filtro de autorização
                var contratosQuery = _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Where(c => c.ConsultorId == consultorId && c.Ativo);

                // Aplicar filtro de autorização
                var contratosFiltrados = await _authorizationService.FilterContratosByUserAsync(usuarioId.Value, contratosQuery);
                var contratos = await contratosFiltrados.ToListAsync();

                return Ok(contratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // GET: api/Contrato/situacao/Leed
        [HttpGet("situacao/{situacao}")]
        public async Task<ActionResult<IEnumerable<Contrato>>> GetContratosPorSituacao(string situacao)
        {
            try
            {
                // Mock data para desenvolvimento
                var mockContratos = new List<Contrato>
                {
                    new Contrato
                    {
                        Id = 1,
                        ClienteId = 1,
                        Cliente = new Cliente
                        {
                            Id = 1,
                            TipoPessoa = "Fisica",
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "João Silva",
                                Cpf = "12345678901"
                            },
                            FilialId = 5
                        },
                        ConsultorId = 1,
                        Consultor = new Consultor
                        {
                            Id = 1,
                            PessoaFisicaId = 1,
                            PessoaFisica = new PessoaFisica
                            {
                                Id = 1,
                                Nome = "Maria Santos",
                                Cpf = "98765432100"
                            },
                            FilialId = 1
                        },
                        Situacao = situacao,
                        DataUltimoContato = DateTime.UtcNow.AddDays(-2),
                        DataProximoContato = DateTime.UtcNow.AddDays(5),
                        ValorDevido = 50000.00m,
                        ValorNegociado = 45000.00m,
                        Observacoes = "Cliente interessado em plano empresarial",
                        DataCadastro = DateTime.UtcNow.AddDays(-10)
                    }
                };

                return Ok(mockContratos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // POST: api/Contrato
        [HttpPost]
        public async Task<IActionResult> CreateContrato(CreateContratoDTO createContratoDTO)
        {
            try
            {
                // ✅ VALIDAÇÃO DO MODELSTATE - Retorna erros de validação em formato amigável
                if (!ModelState.IsValid)
                {
                    var erros = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value!.Errors.Select(e => new {
                            campo = x.Key,
                            mensagem = e.ErrorMessage
                        }))
                        .ToList();

                    Console.WriteLine($"❌ CreateContrato: Erros de validação: {System.Text.Json.JsonSerializer.Serialize(erros)}");

                    return BadRequest(new {
                        sucesso = false,
                        mensagem = "Erro de validação nos dados enviados",
                        erros = erros,
                        // Mensagem amigável para exibição direta
                        mensagemUsuario = string.Join(" | ", erros.Select(e => e.mensagem))
                    });
                }

                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode criar contratos
                var canCreate = await _authorizationService.HasPermissionAsync(usuarioId.Value, "Contrato", "Incluir");
                if (!canCreate)
                {
                    return Forbid("Você não tem permissão para criar contratos");
                }

                // Verificar se o usuário pode acessar o consultor especificado
                var canAccessConsultor = await _authorizationService.CanAccessAsync(usuarioId.Value, "Contrato", "Incluir", consultorId: createContratoDTO.ConsultorId);
                if (!canAccessConsultor)
                {
                    return Forbid("Você não tem permissão para criar contratos para este consultor");
                }

                // ✅ VALIDAÇÕES DE NEGÓCIO - Todas retornam formato estruturado
                // Validar valores monetários
                if (createContratoDTO.ValorDevido.HasValue && createContratoDTO.ValorDevido < 0)
                {
                    return BadRequest(CriarErroValidacao("ValorDevido", "Valor devido não pode ser negativo"));
                }

                if (createContratoDTO.ValorNegociado.HasValue && createContratoDTO.ValorNegociado < 0)
                {
                    return BadRequest(CriarErroValidacao("ValorNegociado", "Valor negociado não pode ser negativo"));
                }

                if (createContratoDTO.ValorNegociado.HasValue &&
                    createContratoDTO.ValorDevido.HasValue &&
                    createContratoDTO.ValorNegociado > createContratoDTO.ValorDevido)
                {
                    return BadRequest(CriarErroValidacao("ValorNegociado", "Valor negociado não pode ser maior que o valor devido"));
                }

                if (createContratoDTO.Comissao.HasValue && createContratoDTO.Comissao < 0)
                {
                    return BadRequest(CriarErroValidacao("Comissao", "Comissão não pode ser negativa"));
                }

                if (createContratoDTO.Comissao.HasValue &&
                    createContratoDTO.ValorNegociado.HasValue &&
                    createContratoDTO.Comissao > createContratoDTO.ValorNegociado)
                {
                    return BadRequest(CriarErroValidacao("Comissao", "Comissão não pode ser maior que o valor negociado"));
                }

                // Validar parcelas
                if (createContratoDTO.NumeroParcelas.HasValue && createContratoDTO.NumeroParcelas <= 0)
                {
                    return BadRequest(CriarErroValidacao("NumeroParcelas", "Número de parcelas deve ser maior que zero"));
                }

                if (createContratoDTO.ValorParcela.HasValue && createContratoDTO.ValorParcela <= 0)
                {
                    return BadRequest(CriarErroValidacao("ValorParcela", "Valor da parcela deve ser maior que zero"));
                }

                if (createContratoDTO.ValorEntrada.HasValue && createContratoDTO.ValorEntrada < 0)
                {
                    return BadRequest(CriarErroValidacao("ValorEntrada", "Valor de entrada não pode ser negativo"));
                }

                // Validar soma de parcelas + entrada = valor negociado
                if (createContratoDTO.NumeroParcelas.HasValue &&
                    createContratoDTO.NumeroParcelas > 0 &&
                    createContratoDTO.ValorParcela.HasValue &&
                    createContratoDTO.ValorNegociado.HasValue)
                {
                    var totalParcelas = createContratoDTO.NumeroParcelas.Value * createContratoDTO.ValorParcela.Value;
                    var valorEntrada = createContratoDTO.ValorEntrada ?? 0;
                    var totalCalculado = totalParcelas + valorEntrada;
                    var diferenca = Math.Abs(totalCalculado - createContratoDTO.ValorNegociado.Value);

                    // Permitir diferença de até 0.01 (1 centavo) por questões de arredondamento
                    if (diferenca > 0.01m)
                    {
                        return BadRequest(CriarErroValidacao("ValorNegociado",
                            $"A soma das parcelas ({totalParcelas:C}) + entrada ({valorEntrada:C}) = {totalCalculado:C} não corresponde ao valor negociado ({createContratoDTO.ValorNegociado:C}). Verifique os valores informados."));
                    }
                }

                // Validar datas
                if (createContratoDTO.DataFechamentoContrato.HasValue &&
                    createContratoDTO.DataFechamentoContrato.Value > DateTime.UtcNow.AddDays(1))
                {
                    return BadRequest(CriarErroValidacao("DataFechamentoContrato", "A data de fechamento do contrato não pode estar no futuro"));
                }

                if (createContratoDTO.PrimeiroVencimento.HasValue &&
                    createContratoDTO.DataFechamentoContrato.HasValue &&
                    createContratoDTO.PrimeiroVencimento.Value < createContratoDTO.DataFechamentoContrato.Value)
                {
                    return BadRequest(CriarErroValidacao("PrimeiroVencimento",
                        $"A data do primeiro vencimento ({createContratoDTO.PrimeiroVencimento.Value:dd/MM/yyyy}) não pode ser anterior à data de fechamento do contrato ({createContratoDTO.DataFechamentoContrato.Value:dd/MM/yyyy})"));
                }

                // Buscar dados reais do cliente e consultor
                var cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Id == createContratoDTO.ClienteId);

                if (cliente == null)
                {
                    return NotFound(new {
                        recurso = "Cliente",
                        id = createContratoDTO.ClienteId,
                        mensagem = $"Cliente #{createContratoDTO.ClienteId} não foi encontrado"
                    });
                }

                Console.WriteLine($"🔍 Validando consultor ID: {createContratoDTO.ConsultorId}");

                var consultor = await _context.Consultores
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.Filial)
                    .FirstOrDefaultAsync(c => c.Id == createContratoDTO.ConsultorId);

                if (consultor == null)
                {
                    Console.WriteLine($"❌ Consultor #{createContratoDTO.ConsultorId} NÃO ENCONTRADO no banco");
                    return NotFound(new {
                        recurso = "Consultor",
                        id = createContratoDTO.ConsultorId,
                        mensagem = $"Consultor #{createContratoDTO.ConsultorId} não foi encontrado"
                    });
                }

                // ✅ REMOVIDO: Validação de consultor ativo/inativo
                // Agora permite criar contratos com consultores inativos
                if (!consultor.Ativo)
                {
                    Console.WriteLine($"⚠️ AVISO: Consultor #{createContratoDTO.ConsultorId} está INATIVO, mas permitindo continuar");
                }
                else
                {
                    Console.WriteLine($"✅ Consultor #{createContratoDTO.ConsultorId} validado: {consultor.PessoaFisica?.Nome}");
                }

                // ✅ Validar parceiro se fornecido
                if (createContratoDTO.ParceiroId.HasValue)
                {
                    var parceiro = await _context.Parceiros
                        .FirstOrDefaultAsync(p => p.Id == createContratoDTO.ParceiroId.Value && p.Ativo);

                    if (parceiro == null)
                    {
                        return NotFound(new {
                            recurso = "Parceiro",
                            id = createContratoDTO.ParceiroId.Value,
                            mensagem = $"Parceiro #{createContratoDTO.ParceiroId.Value} não foi encontrado ou está inativo"
                        });
                    }
                }

                // ✅ Upload do arquivo PDF para Azure Blob Storage (se fornecido)
                string? nomeArquivoBlobStorage = null;
                string? urlArquivo = null;

                if (!string.IsNullOrWhiteSpace(createContratoDTO.AnexoDocumento))
                {
                    try
                    {
                        Console.WriteLine($"📤 Upload de PDF: Iniciando upload para Azure Blob Storage...");

                        // Gerar nome único para o arquivo
                        nomeArquivoBlobStorage = $"contrato_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.pdf";

                        // Fazer upload do base64 para o Azure Blob Storage
                        urlArquivo = await _blobStorageService.UploadBase64FileAsync(nomeArquivoBlobStorage, createContratoDTO.AnexoDocumento);

                        Console.WriteLine($"✅ Upload de PDF: Arquivo '{nomeArquivoBlobStorage}' enviado com sucesso!");
                        Console.WriteLine($"   URL: {urlArquivo}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Upload de PDF: Erro ao fazer upload: {ex.Message}");
                        // Continuar mesmo se o upload falhar, mas logar o erro
                        return StatusCode(500, new {
                            mensagem = "Erro ao fazer upload do arquivo PDF",
                            detalhes = ex.Message,
                            stackTrace = ex.StackTrace
                        });
                    }
                }

                // Criar contrato real no banco de dados
                var novoContrato = new Contrato
                {
                    ClienteId = createContratoDTO.ClienteId,
                    ConsultorId = createContratoDTO.ConsultorId,
                    ParceiroId = createContratoDTO.ParceiroId,
                    Situacao = createContratoDTO.Situacao,
                    DataUltimoContato = createContratoDTO.DataUltimoContato ?? DateTime.UtcNow.AddDays(-2),
                    DataProximoContato = createContratoDTO.DataProximoContato ?? DateTime.UtcNow.AddDays(5),
                    ValorDevido = createContratoDTO.ValorDevido,
                    ValorNegociado = createContratoDTO.ValorNegociado,
                    Observacoes = createContratoDTO.Observacoes,

                    // Novos campos de pagamento e outros
                    NumeroPasta = createContratoDTO.NumeroPasta,
                    DataFechamentoContrato = createContratoDTO.DataFechamentoContrato,
                    TipoServico = createContratoDTO.TipoServico,
                    ObjetoContrato = createContratoDTO.ObjetoContrato,
                    Comissao = createContratoDTO.Comissao,
                    ValorEntrada = createContratoDTO.ValorEntrada,
                    ValorParcela = createContratoDTO.ValorParcela,
                    NumeroParcelas = createContratoDTO.NumeroParcelas,
                    PrimeiroVencimento = createContratoDTO.PrimeiroVencimento,

                    // ✅ Salvar APENAS o nome do arquivo no banco (não o base64)
                    AnexoDocumento = nomeArquivoBlobStorage,

                    Pendencias = createContratoDTO.Pendencias,

                    // Método de pagamento (Boleto padrão ou Pix)
                    MetodoPagamento = createContratoDTO.MetodoPagamento ?? "Boleto",

                    DataCadastro = DateTime.UtcNow, // ✅ Usar UTC para consistência
                    Ativo = true
                };

                // Log dos dados que estão sendo salvos
                Console.WriteLine($"🔧 CreateContrato: Salvando contrato com dados:");
                Console.WriteLine($"  TipoServico: '{createContratoDTO.TipoServico}'");
                Console.WriteLine($"  DataFechamentoContrato: '{createContratoDTO.DataFechamentoContrato}'");
                Console.WriteLine($"  ValorEntrada: '{createContratoDTO.ValorEntrada}'");
                Console.WriteLine($"  ValorParcela: '{createContratoDTO.ValorParcela}'");
                Console.WriteLine($"  NumeroParcelas: '{createContratoDTO.NumeroParcelas}'");
                Console.WriteLine($"  Comissao: '{createContratoDTO.Comissao}'");
                Console.WriteLine($"  AnexoDocumento: '{createContratoDTO.AnexoDocumento}'");
                Console.WriteLine($"  Pendencias: '{createContratoDTO.Pendencias}'");
                Console.WriteLine($"  NumeroPasta: '{createContratoDTO.NumeroPasta}'");
                Console.WriteLine($"  ObjetoContrato: '{createContratoDTO.ObjetoContrato}'");

                // ✅ Usar transação para garantir atomicidade
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                // Salvar no banco de dados
                _context.Contratos.Add(novoContrato);
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ CreateContrato: Contrato criado com ID {novoContrato.Id} no banco de dados");

                // Buscar o contrato criado com todos os dados relacionados
                var contratoCompleto = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .FirstOrDefaultAsync(c => c.Id == novoContrato.Id);

                    if (contratoCompleto == null)
                    {
                        Console.WriteLine($"❌ CreateContrato: Erro ao buscar contrato completo após criação");
                        await transaction.RollbackAsync();
                        return StatusCode(500, "Erro ao buscar contrato após criação");
                    }

                    // ✅ Commit da transação apenas se tudo deu certo
                    await transaction.CommitAsync();
                    Console.WriteLine($"✅ CreateContrato: Transação commitada com sucesso");

                    // Registrar no histórico do cliente
                    var nomeCliente = contratoCompleto.Cliente?.PessoaFisica?.Nome ??
                                      contratoCompleto.Cliente?.PessoaJuridica?.RazaoSocial ??
                                      "Cliente não identificado";
                    var dadosContrato = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        contratoCompleto.Id,
                        contratoCompleto.Situacao,
                        contratoCompleto.TipoServico,
                        contratoCompleto.ValorDevido,
                        contratoCompleto.ValorNegociado,
                        contratoCompleto.NumeroParcelas
                    });

                    await RegistrarHistoricoClienteAsync(
                        contratoCompleto.ClienteId,
                        contratoCompleto.Id,
                        "Criacao",
                        $"Novo contrato criado (ID: {contratoCompleto.Id}) - Situação: {contratoCompleto.Situacao}",
                        null,
                        dadosContrato,
                        usuarioId
                    );

                    var nomeConsultor = contratoCompleto.Consultor?.PessoaFisica?.Nome ?? "N/A";
                    await _auditService.LogAsync(
                        usuarioId ?? 0, "Create", "Contrato", contratoCompleto.Id,
                        $"Contrato #{contratoCompleto.Id} criado | Cliente: {nomeCliente} | Consultor: {nomeConsultor} | Situação: {contratoCompleto.Situacao} | Serviço: {contratoCompleto.TipoServico ?? "N/A"} | Valor: R$ {contratoCompleto.ValorDevido:N2}",
                        "Contratos",
                        valorNovo: new {
                            contratoCompleto.Id,
                            Cliente = nomeCliente,
                            Consultor = nomeConsultor,
                            contratoCompleto.Situacao,
                            contratoCompleto.TipoServico,
                            contratoCompleto.ValorDevido,
                            contratoCompleto.ValorNegociado,
                            contratoCompleto.NumeroParcelas,
                            contratoCompleto.NumeroPasta,
                            contratoCompleto.ObjetoContrato
                        },
                        httpContext: HttpContext);

                return CreatedAtAction(nameof(GetContrato), new { id = contratoCompleto.Id }, contratoCompleto);
                }
                catch (Exception innerEx)
                {
                    Console.WriteLine($"❌ CreateContrato: Erro durante transação: {innerEx.Message}");
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ CreateContrato: Erro geral: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");

                // Verificar se é erro de banco de dados (truncation, constraint, etc.)
                var mensagemErro = ex.Message;
                var innerMessage = ex.InnerException?.Message ?? "";

                // Detectar erros comuns e traduzir para mensagens amigáveis
                string mensagemUsuario = "Ocorreu um erro ao salvar o contrato. Por favor, tente novamente.";

                if (innerMessage.Contains("String or binary data would be truncated") ||
                    mensagemErro.Contains("String or binary data would be truncated"))
                {
                    mensagemUsuario = "Um dos campos excede o limite de caracteres permitido. Verifique os campos de texto e reduza o tamanho.";
                }
                else if (innerMessage.Contains("FOREIGN KEY constraint") ||
                         mensagemErro.Contains("FOREIGN KEY constraint"))
                {
                    mensagemUsuario = "Referência inválida: verifique se o cliente, consultor ou parceiro selecionado existe.";
                }
                else if (innerMessage.Contains("UNIQUE constraint") ||
                         mensagemErro.Contains("UNIQUE constraint"))
                {
                    mensagemUsuario = "Já existe um registro com essas informações. Verifique os dados duplicados.";
                }

                return StatusCode(500, new {
                    sucesso = false,
                    mensagem = "Erro interno do servidor",
                    mensagemUsuario = mensagemUsuario,
                    detalhes = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/Contrato/5/situacao
        [HttpPut("{id}/situacao")]
        public async Task<IActionResult> UpdateSituacaoContrato(int id, UpdateSituacaoContratoDTO updateDTO)
        {
            // Validação do ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validação de negócio
            if (id <= 0)
            {
                return BadRequest(new { erro = "ID do contrato inválido" });
            }

            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode editar este contrato
                var canEdit = await _authorizationService.CanEditContratoAsync(usuarioId.Value, id);
                if (!canEdit)
                {
                    return Forbid("Você não tem permissão para editar este contrato");
                }

                Console.WriteLine($"🔍 UpdateSituacaoContrato: Buscando contrato com ID {id}");

                // Buscar o contrato existente com todos os dados relacionados
                var contratoExistente = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (contratoExistente == null)
                {
                    Console.WriteLine($"❌ UpdateSituacaoContrato: Contrato com ID {id} não encontrado na tabela");
                    return NotFound(new {
                        recurso = "Contrato",
                        id = id,
                        mensagem = $"Contrato #{id} não foi encontrado"
                    });
                }

                Console.WriteLine($"✅ UpdateSituacaoContrato: Contrato encontrado - Cliente: {contratoExistente.Cliente?.PessoaFisica?.Nome ?? contratoExistente.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A"}, Consultor: {contratoExistente.Consultor?.PessoaFisica?.Nome ?? "N/A"}");

                // IMPORTANTE: Salvar a situação anterior ANTES de alterar
                var situacaoAnterior = contratoExistente.Situacao;
                Console.WriteLine($"📝 UpdateSituacaoContrato: Situação anterior: {situacaoAnterior}, Nova: {updateDTO.NovaSituacao}");

                // Criar registro no histórico ANTES de alterar o contrato
                var historico = new HistoricoSituacaoContrato
                {
                    ContratoId = id,
                    SituacaoAnterior = situacaoAnterior, // ✅ Situação ANTES da mudança
                    NovaSituacao = updateDTO.NovaSituacao,
                    MotivoMudanca = updateDTO.MotivoMudanca,
                    DataMudanca = DateTime.UtcNow
                };

                _context.HistoricoSituacaoContratos.Add(historico);

                // Agora sim, atualizar os campos do contrato
                contratoExistente.Situacao = updateDTO.NovaSituacao;
                contratoExistente.DataUltimoContato = updateDTO.DataUltimoContato;
                contratoExistente.DataProximoContato = updateDTO.DataProximoContato;

                // ✅ Manter valor original se não informado (ValorDevido é NOT NULL no banco)
                if (updateDTO.ValorDevido.HasValue)
                {
                    contratoExistente.ValorDevido = updateDTO.ValorDevido;
                }

                if (updateDTO.ValorNegociado.HasValue)
                {
                    contratoExistente.ValorNegociado = updateDTO.ValorNegociado;
                }

                if (!string.IsNullOrEmpty(updateDTO.Observacoes))
                {
                    contratoExistente.Observacoes = updateDTO.Observacoes;
                }

                contratoExistente.DataAtualizacao = DateTime.UtcNow;

                // Salvar tudo de uma vez (contrato + histórico)
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ UpdateSituacaoContrato: Situação atualizada com sucesso para contrato ID {id}");

                // Registrar no histórico do cliente
                var dadosMudancaSituacao = System.Text.Json.JsonSerializer.Serialize(new
                {
                    ContratoId = id,
                    SituacaoAnterior = situacaoAnterior,
                    NovaSituacao = updateDTO.NovaSituacao,
                    MotivoMudanca = updateDTO.MotivoMudanca,
                    ValorDevido = contratoExistente.ValorDevido,
                    ValorNegociado = contratoExistente.ValorNegociado
                });

                await RegistrarHistoricoClienteAsync(
                    contratoExistente.ClienteId,
                    id,
                    "MudancaStatus",
                    $"Situação do contrato alterada de '{situacaoAnterior}' para '{updateDTO.NovaSituacao}' (Contrato ID: {id}){(!string.IsNullOrEmpty(updateDTO.MotivoMudanca) ? $" - Motivo: {updateDTO.MotivoMudanca}" : "")}",
                    null,
                    dadosMudancaSituacao,
                    usuarioId
                );

                var nomeClienteSit = contratoExistente.Cliente?.PessoaFisica?.Nome
                    ?? contratoExistente.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                await _auditService.LogAsync(
                    usuarioId ?? 0, "StatusChange", "Contrato", id,
                    $"Situação do contrato #{id} alterada de '{situacaoAnterior}' para '{updateDTO.NovaSituacao}' | Cliente: {nomeClienteSit}{(!string.IsNullOrEmpty(updateDTO.MotivoMudanca) ? $" | Motivo: {updateDTO.MotivoMudanca}" : "")}",
                    "Contratos",
                    valorAnterior: new { Situacao = situacaoAnterior },
                    valorNovo: new {
                        Situacao = updateDTO.NovaSituacao,
                        MotivoMudanca = updateDTO.MotivoMudanca,
                        Cliente = nomeClienteSit,
                        contratoExistente.ValorDevido,
                        contratoExistente.ValorNegociado
                    },
                    camposAlterados: "Situacao",
                    httpContext: HttpContext);

                // Usar o contrato já carregado que já tem todas as relações
                // Criar DTO de resposta sem referências circulares
                var contratoDTO = new
                {
                    id = contratoExistente.Id,
                    numeroPasta = contratoExistente.NumeroPasta,
                    clienteId = contratoExistente.ClienteId,
                    clienteNome = contratoExistente.Cliente?.PessoaFisica?.Nome
                        ?? contratoExistente.Cliente?.PessoaJuridica?.RazaoSocial
                        ?? "Cliente não informado",
                    clienteDocumento = contratoExistente.Cliente?.PessoaFisica?.Cpf
                        ?? contratoExistente.Cliente?.PessoaJuridica?.Cnpj
                        ?? "",
                    consultorId = contratoExistente.ConsultorId,
                    consultorNome = contratoExistente.Consultor?.PessoaFisica?.Nome ?? "Não informado",
                    parceiroId = contratoExistente.ParceiroId,
                    parceiroNome = contratoExistente.Parceiro?.PessoaFisica?.Nome,
                    filialId = contratoExistente.Consultor?.FilialId,
                    filialNome = contratoExistente.Consultor?.Filial?.Nome,
                    situacao = contratoExistente.Situacao,
                    valorDevido = contratoExistente.ValorDevido,
                    valorNegociado = contratoExistente.ValorNegociado,
                    valorEntrada = contratoExistente.ValorEntrada,
                    valorParcela = contratoExistente.ValorParcela,
                    numeroParcelas = contratoExistente.NumeroParcelas,
                    comissao = contratoExistente.Comissao,
                    dataUltimoContato = contratoExistente.DataUltimoContato,
                    dataProximoContato = contratoExistente.DataProximoContato,
                    observacoes = contratoExistente.Observacoes,
                    tipoServico = contratoExistente.TipoServico,
                    objetoContrato = contratoExistente.ObjetoContrato,
                    dataFechamentoContrato = contratoExistente.DataFechamentoContrato,
                    primeiroVencimento = contratoExistente.PrimeiroVencimento,
                    dataCadastro = contratoExistente.DataCadastro,
                    dataAtualizacao = contratoExistente.DataAtualizacao,
                    ativo = contratoExistente.Ativo
                };

                Console.WriteLine($"📦 UpdateSituacaoContrato: DTO criado com ID {contratoDTO.id}");

                return Ok(new { contrato = contratoDTO, historico });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ UpdateSituacaoContrato: Erro ao atualizar situação");
                Console.WriteLine($"   • Mensagem: {ex.Message}");

                string innerMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"   • InnerException: {ex.InnerException.Message}");
                    innerMessage += $" | Inner: {ex.InnerException.Message}";

                    if (ex.InnerException.InnerException != null)
                    {
                        Console.WriteLine($"   • InnerException 2: {ex.InnerException.InnerException.Message}");
                        innerMessage += $" | Inner2: {ex.InnerException.InnerException.Message}";
                    }
                }

                Console.WriteLine($"   • StackTrace: {ex.StackTrace}");

                return StatusCode(500, $"Erro interno do servidor: {innerMessage}");
            }
        }

        // PUT: api/Contrato/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContrato(int id, CreateContratoDTO updateDTO)
        {
            try
            {
                // ✅ VALIDAÇÃO DO MODELSTATE - Retorna erros de validação em formato amigável
                if (!ModelState.IsValid)
                {
                    var erros = ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x => x.Value!.Errors.Select(e => new {
                            campo = x.Key,
                            mensagem = e.ErrorMessage
                        }))
                        .ToList();

                    Console.WriteLine($"❌ UpdateContrato: Erros de validação: {System.Text.Json.JsonSerializer.Serialize(erros)}");

                    return BadRequest(new {
                        sucesso = false,
                        mensagem = "Erro de validação nos dados enviados",
                        erros = erros,
                        mensagemUsuario = string.Join(" | ", erros.Select(e => e.mensagem))
                    });
                }

                Console.WriteLine($"📝 UpdateContrato: Atualizando contrato {id}");
                Console.WriteLine($"   - ClienteId: {updateDTO.ClienteId}");
                Console.WriteLine($"   - ConsultorId: {updateDTO.ConsultorId}");
                Console.WriteLine($"   - ParceiroId: {updateDTO.ParceiroId}");
                Console.WriteLine($"   - Situacao: {updateDTO.Situacao}");
                Console.WriteLine($"   - ValorDevido: {updateDTO.ValorDevido}");
                Console.WriteLine($"   - ValorNegociado: {updateDTO.ValorNegociado}");
                Console.WriteLine($"   - Observacoes: {updateDTO.Observacoes?.Substring(0, Math.Min(50, updateDTO.Observacoes?.Length ?? 0))}...");

                // Buscar contrato existente
                var contratoExistente = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contratoExistente == null)
                {
                    return NotFound(new {
                        recurso = "Contrato",
                        id = id,
                        mensagem = $"Contrato #{id} não foi encontrado"
                    });
                }

                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar permissões
                var canEdit = await _authorizationService.CanEditContratoAsync(usuarioId.Value, id);
                if (!canEdit)
                {
                    return Forbid("Você não tem permissão para atualizar este contrato");
                }

                // Validar se o cliente existe
                if (updateDTO.ClienteId != contratoExistente.ClienteId)
                {
                    var clienteExiste = await _context.Clientes.AnyAsync(c => c.Id == updateDTO.ClienteId && c.Ativo);
                    if (!clienteExiste)
                    {
                        return BadRequest(new { message = "Cliente não encontrado ou inativo" });
                    }
                }

                // Validar se o consultor existe
                // Não bloquear por situação do contrato nem por consultor inativo na edição.
                if (updateDTO.ConsultorId != contratoExistente.ConsultorId)
                {
                    var consultor = await _context.Consultores
                        .FirstOrDefaultAsync(c => c.Id == updateDTO.ConsultorId);
                    if (consultor == null)
                    {
                        return BadRequest(new { message = "Consultor não encontrado" });
                    }

                    if (!consultor.Ativo)
                    {
                        Console.WriteLine($"⚠️ AVISO: Consultor #{updateDTO.ConsultorId} está INATIVO, mas permitindo continuar na atualização");
                    }
                }

                // Validar parceiro se fornecido
                if (updateDTO.ParceiroId.HasValue && updateDTO.ParceiroId.Value > 0)
                {
                    var parceiroExiste = await _context.Parceiros.AnyAsync(p => p.Id == updateDTO.ParceiroId.Value && p.Ativo);
                    if (!parceiroExiste)
                    {
                        return BadRequest(new { message = "Parceiro não encontrado ou inativo" });
                    }
                }

                // Atualizar campos
                Console.WriteLine($"🔄 Valores ANTES da atualização:");
                Console.WriteLine($"   - Situacao: {contratoExistente.Situacao} -> {updateDTO.Situacao}");
                Console.WriteLine($"   - ValorDevido: {contratoExistente.ValorDevido} -> {updateDTO.ValorDevido}");
                Console.WriteLine($"   - Observacoes: {contratoExistente.Observacoes?.Substring(0, Math.Min(30, contratoExistente.Observacoes?.Length ?? 0))} -> {updateDTO.Observacoes?.Substring(0, Math.Min(30, updateDTO.Observacoes?.Length ?? 0))}");

                // Atualizar campos básicos
                contratoExistente.ClienteId = updateDTO.ClienteId;
                contratoExistente.ConsultorId = updateDTO.ConsultorId;
                contratoExistente.ParceiroId = updateDTO.ParceiroId;
                contratoExistente.Situacao = updateDTO.Situacao;
                contratoExistente.DataUltimoContato = updateDTO.DataUltimoContato;
                contratoExistente.DataProximoContato = updateDTO.DataProximoContato;
                contratoExistente.ValorDevido = updateDTO.ValorDevido;
                contratoExistente.ValorNegociado = updateDTO.ValorNegociado;
                contratoExistente.Observacoes = updateDTO.Observacoes;

                // Atualizar campos adicionais
                contratoExistente.NumeroPasta = updateDTO.NumeroPasta;
                contratoExistente.DataFechamentoContrato = updateDTO.DataFechamentoContrato;
                contratoExistente.TipoServico = updateDTO.TipoServico;
                contratoExistente.ObjetoContrato = updateDTO.ObjetoContrato;
                contratoExistente.Comissao = updateDTO.Comissao;

                // Atualizar dados de pagamento
                contratoExistente.ValorEntrada = updateDTO.ValorEntrada;
                contratoExistente.ValorParcela = updateDTO.ValorParcela;
                contratoExistente.NumeroParcelas = updateDTO.NumeroParcelas;
                contratoExistente.PrimeiroVencimento = updateDTO.PrimeiroVencimento;

                // ✅ Upload do arquivo PDF para Azure Blob Storage (se fornecido)
                Console.WriteLine($"📋 Verificando AnexoDocumento:");
                Console.WriteLine($"   - updateDTO.AnexoDocumento: {(updateDTO.AnexoDocumento != null ? $"Presente ({updateDTO.AnexoDocumento.Length} chars)" : "null")}");
                Console.WriteLine($"   - contratoExistente.AnexoDocumento: {(contratoExistente.AnexoDocumento != null ? $"'{contratoExistente.AnexoDocumento}'" : "null")}");

                if (!string.IsNullOrEmpty(updateDTO.AnexoDocumento))
                {
                    // Verificar se é base64 (novo upload) ou apenas nome do arquivo (já existente)
                    // Observação: base64 pode conter '/' e '+'; usar apenas o tamanho como heurística
                    bool isBase64 = updateDTO.AnexoDocumento.Length > 500;
                    Console.WriteLine($"   - Detectado como base64 (heurística por tamanho > 500): {isBase64}");

                    if (isBase64)
                    {
                        try
                        {
                            Console.WriteLine($"📤 Upload de PDF: Iniciando upload para Azure Blob Storage (atualização)...");

                            // Gerar nome único para o arquivo
                            string nomeArquivoBlobStorage = $"contrato_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.pdf";

                            // Fazer upload do base64 para o Azure Blob Storage
                            string urlArquivo = await _blobStorageService.UploadBase64FileAsync(nomeArquivoBlobStorage, updateDTO.AnexoDocumento);

                            Console.WriteLine($"✅ Upload de PDF: Arquivo '{nomeArquivoBlobStorage}' enviado com sucesso!");
                            Console.WriteLine($"   URL: {urlArquivo}");

                            // Deletar arquivo antigo se existir
                            if (!string.IsNullOrEmpty(contratoExistente.AnexoDocumento))
                            {
                                try
                                {
                                    await _blobStorageService.DeleteFileAsync(contratoExistente.AnexoDocumento);
                                    Console.WriteLine($"🗑️ Arquivo antigo deletado: {contratoExistente.AnexoDocumento}");
                                }
                                catch (Exception delEx)
                                {
                                    Console.WriteLine($"⚠️ Erro ao deletar arquivo antigo: {delEx.Message}");
                                    // Continuar mesmo se falhar ao deletar o antigo
                                }
                            }

                            // Atualizar com o nome do novo arquivo
                            contratoExistente.AnexoDocumento = nomeArquivoBlobStorage;
                            Console.WriteLine($"   - AnexoDocumento atualizado para: {nomeArquivoBlobStorage}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"❌ Upload de PDF: Erro ao fazer upload: {ex.Message}");
                            Console.WriteLine($"   Stack trace: {ex.StackTrace}");
                            return StatusCode(500, new {
                                mensagem = "Erro ao fazer upload do arquivo PDF",
                                detalhes = ex.Message,
                                stackTrace = ex.StackTrace
                            });
                        }
                    }
                    else
                    {
                        // É apenas o nome do arquivo (não houve mudança de arquivo)
                        Console.WriteLine($"   - Mantendo anexo existente: {updateDTO.AnexoDocumento}");
                        contratoExistente.AnexoDocumento = updateDTO.AnexoDocumento;
                    }
                }
                else
                {
                    Console.WriteLine($"   - AnexoDocumento está vazio, não alterando campo");
                    // Se não veio no DTO, não alterar o campo no banco (manter o valor existente)
                }

                contratoExistente.Pendencias = updateDTO.Pendencias;

                contratoExistente.DataAtualizacao = DateTime.UtcNow;

                Console.WriteLine($"🔄 Valores DEPOIS da atualização (antes do SaveChanges):");
                Console.WriteLine($"   - Situacao: {contratoExistente.Situacao}");
                Console.WriteLine($"   - ValorDevido: {contratoExistente.ValorDevido}");

                _context.Entry(contratoExistente).State = EntityState.Modified;
                var changesCount = await _context.SaveChangesAsync();
                Console.WriteLine($"✅ SaveChanges executado. Registros afetados: {changesCount}");

                // Buscar contrato atualizado com todos os relacionamentos
                var contratoAtualizado = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                    .FirstOrDefaultAsync(c => c.Id == id);

                Console.WriteLine($"✅ UpdateContrato: Contrato {id} atualizado com sucesso");

                // Registrar no histórico do cliente
                var dadosContratoAtualizado = System.Text.Json.JsonSerializer.Serialize(new
                {
                    contratoAtualizado.Id,
                    contratoAtualizado.Situacao,
                    contratoAtualizado.TipoServico,
                    contratoAtualizado.ValorDevido,
                    contratoAtualizado.ValorNegociado,
                    contratoAtualizado.NumeroParcelas,
                    contratoAtualizado.Observacoes
                });

                await RegistrarHistoricoClienteAsync(
                    contratoAtualizado.ClienteId,
                    contratoAtualizado.Id,
                    "Atualizacao",
                    $"Contrato atualizado (ID: {contratoAtualizado.Id}) - Situação: {contratoAtualizado.Situacao}",
                    null,
                    dadosContratoAtualizado,
                    usuarioId
                );

                var nomeClienteUpd = contratoAtualizado.Cliente?.PessoaFisica?.Nome
                    ?? contratoAtualizado.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                var nomeConsultorUpd = contratoAtualizado.Consultor?.PessoaFisica?.Nome ?? "N/A";
                await _auditService.LogAsync(
                    usuarioId ?? 0, "Update", "Contrato", contratoAtualizado.Id,
                    $"Contrato #{contratoAtualizado.Id} atualizado | Cliente: {nomeClienteUpd} | Consultor: {nomeConsultorUpd} | Situação: {contratoAtualizado.Situacao} | Valor: R$ {contratoAtualizado.ValorDevido:N2}",
                    "Contratos",
                    valorNovo: new {
                        contratoAtualizado.Id,
                        Cliente = nomeClienteUpd,
                        Consultor = nomeConsultorUpd,
                        contratoAtualizado.Situacao,
                        contratoAtualizado.TipoServico,
                        contratoAtualizado.ValorDevido,
                        contratoAtualizado.ValorNegociado,
                        contratoAtualizado.NumeroParcelas,
                        contratoAtualizado.NumeroPasta,
                        contratoAtualizado.Observacoes
                    },
                    httpContext: HttpContext);

                return Ok(contratoAtualizado);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                Console.WriteLine($"❌ UpdateContrato: Erro de concorrência: {ex.Message}");
                return StatusCode(409, new { message = "Erro de concorrência ao atualizar contrato" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ UpdateContrato: Erro: {ex.Message}");
                Console.WriteLine($"   Stack trace: {ex.StackTrace}");

                // Detectar erros comuns e traduzir para mensagens amigáveis
                var innerMessage = ex.InnerException?.Message ?? "";
                string mensagemUsuario = "Ocorreu um erro ao atualizar o contrato. Por favor, tente novamente.";

                if (innerMessage.Contains("String or binary data would be truncated") ||
                    ex.Message.Contains("String or binary data would be truncated"))
                {
                    mensagemUsuario = "Um dos campos excede o limite de caracteres permitido. Verifique os campos de texto e reduza o tamanho.";
                }
                else if (innerMessage.Contains("FOREIGN KEY constraint") ||
                         ex.Message.Contains("FOREIGN KEY constraint"))
                {
                    mensagemUsuario = "Referência inválida: verifique se o cliente, consultor ou parceiro selecionado existe.";
                }

                return StatusCode(500, new {
                    sucesso = false,
                    message = $"Erro ao atualizar contrato: {ex.Message}",
                    mensagemUsuario = mensagemUsuario,
                    detalhes = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // DELETE: api/Contrato/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContrato(int id)
        {
            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode excluir este contrato
                var canDelete = await _authorizationService.CanDeleteContratoAsync(usuarioId.Value, id);
                if (!canDelete)
                {
                    return Forbid("Você não tem permissão para excluir este contrato");
                }

                // Buscar o contrato
                var contrato = await _context.Contratos.FirstOrDefaultAsync(c => c.Id == id && c.Ativo);
                if (contrato == null)
                {
                    return NotFound(new {
                        recurso = "Contrato",
                        id = id,
                        mensagem = $"Contrato #{id} não foi encontrado ou está inativo"
                    });
                }

                // Marcar como inativo (soft delete)
                contrato.Ativo = false;
                contrato.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Registrar no histórico do cliente
                var dadosContratoExcluido = System.Text.Json.JsonSerializer.Serialize(new
                {
                    contrato.Id,
                    contrato.Situacao,
                    contrato.TipoServico,
                    contrato.ValorDevido,
                    contrato.ValorNegociado,
                    Ativo = false
                });

                await RegistrarHistoricoClienteAsync(
                    contrato.ClienteId,
                    contrato.Id,
                    "Exclusao",
                    $"Contrato excluído/inativado (ID: {contrato.Id})",
                    null,
                    dadosContratoExcluido,
                    usuarioId
                );

                var nomeClienteDel = contrato.Cliente?.PessoaFisica?.Nome
                    ?? contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "N/A";
                await _auditService.LogAsync(
                    usuarioId ?? 0, "Delete", "Contrato", id,
                    $"Contrato #{id} excluído | Cliente: {nomeClienteDel} | Situação: {contrato.Situacao} | Valor: R$ {contrato.ValorDevido:N2}",
                    "Contratos",
                    valorAnterior: new {
                        contrato.Id,
                        Cliente = nomeClienteDel,
                        contrato.Situacao,
                        contrato.TipoServico,
                        contrato.ValorDevido,
                        contrato.ValorNegociado
                    },
                    severidade: "Warning",
                    httpContext: HttpContext);

                return Ok(new { message = $"Contrato {id} removido com sucesso" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // Método auxiliar para obter o ID do usuário logado
        // GET: api/Contrato/{id}/pdf
        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> DownloadContratoPDF(int id)
        {
            try
            {
                Console.WriteLine($"");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                Console.WriteLine($"📥 DownloadContratoPDF: REQUISIÇÃO RECEBIDA para contrato ID {id}");
                Console.WriteLine($"📥 Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                Console.WriteLine($"🔍 UsuarioId obtido: {usuarioId}");

                if (usuarioId == null)
                {
                    Console.WriteLine("❌ DownloadContratoPDF: Usuário não autenticado");
                    return Unauthorized("Usuário não autenticado");
                }

                // Buscar usuário para verificar permissões
                var usuario = await _authorizationService.GetUsuarioAsync(usuarioId.Value);
                if (usuario == null)
                {
                    Console.WriteLine($"❌ DownloadContratoPDF: Usuário {usuarioId} não encontrado no banco");
                    return Unauthorized("Usuário não encontrado");
                }

                Console.WriteLine($"✅ Usuário encontrado: {usuario.Login} (ID: {usuario.Id})");
                Console.WriteLine($"🔐 Grupo de Acesso: {usuario.GrupoAcesso?.Nome ?? "NULL"}");

                // Verificar se o usuário tem permissão para baixar PDF
                var gruposPermitidos = new[] { "Administrador", "Faturamento", "Cobrança e Financeiro" };
                if (usuario.GrupoAcesso == null || !gruposPermitidos.Contains(usuario.GrupoAcesso.Nome))
                {
                    Console.WriteLine($"❌ DownloadContratoPDF: Usuário {usuarioId} não tem permissão");
                    Console.WriteLine($"   Grupo do usuário: '{usuario.GrupoAcesso?.Nome}'");
                    Console.WriteLine($"   Grupos permitidos: {string.Join(", ", gruposPermitidos)}");
                    return Forbid("Você não tem permissão para baixar PDF de contratos");
                }

                Console.WriteLine($"✅ Permissão verificada com sucesso");

                // Buscar contrato
                Console.WriteLine($"🔍 Buscando contrato {id} no banco de dados...");
                var contrato = await _context.Contratos
                    .Where(c => c.Id == id && c.Ativo)
                    .FirstOrDefaultAsync();

                if (contrato == null)
                {
                    Console.WriteLine($"❌ CONTRATO ID={id} NÃO ENCONTRADO ou INATIVO!");
                    return NotFound(new
                    {
                        mensagem = "Contrato não encontrado",
                        detalhes = $"O contrato com ID {id} não existe ou está inativo"
                    });
                }

                Console.WriteLine($"✅ Contrato {id} encontrado");

                // Verificar se há documento anexado
                if (string.IsNullOrWhiteSpace(contrato.AnexoDocumento))
                {
                    Console.WriteLine($"⚠️ Contrato {id} NÃO possui documento anexado!");
                    return NotFound(new
                    {
                        mensagem = "Não há documento anexado",
                        detalhes = $"O contrato com ID {id} não possui documento PDF anexado",
                        contratoId = id,
                        semDocumento = true
                    });
                }

                Console.WriteLine($"✅ Documento anexado encontrado: {contrato.AnexoDocumento}");

                // ✅ Baixar o PDF do Azure Blob Storage
                byte[] pdfBytes;
                try
                {
                    Console.WriteLine($"📥 Baixando arquivo do Azure Blob Storage: {contrato.AnexoDocumento}");

                    pdfBytes = await _blobStorageService.DownloadFileAsync(contrato.AnexoDocumento);

                    Console.WriteLine($"✅ Arquivo baixado com sucesso - {pdfBytes.Length} bytes ({pdfBytes.Length / 1024.0:F2} KB)");
                }
                catch (FileNotFoundException fnfEx)
                {
                    Console.WriteLine($"❌ Arquivo não encontrado no Azure Blob Storage: {contrato.AnexoDocumento}");
                    Console.WriteLine($"   Mensagem: {fnfEx.Message}");
                    return NotFound(new {
                        mensagem = "Arquivo PDF não encontrado no armazenamento",
                        detalhes = $"O arquivo '{contrato.AnexoDocumento}' não foi encontrado no Azure Blob Storage",
                        contratoId = id,
                        nomeArquivo = contrato.AnexoDocumento
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Erro ao baixar documento do Azure Blob Storage: {ex.Message}");
                    Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                    return StatusCode(500, new {
                        mensagem = "Erro ao baixar documento do armazenamento",
                        detalhes = ex.Message,
                        contratoId = id,
                        nomeArquivo = contrato.AnexoDocumento
                    });
                }

                // Retornar o PDF
                var fileName = $"Contrato_{id:D4}_{DateTime.Now:yyyyMMdd}.pdf";
                Console.WriteLine($"✅ Retornando PDF: {fileName}");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                Console.WriteLine($"");

                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DownloadContratoPDF: Erro ao baixar PDF do contrato {id}");
                Console.WriteLine($"   Mensagem: {ex.Message}");
                Console.WriteLine($"   Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { mensagem = "Erro ao baixar PDF do contrato", detalhes = ex.Message });
            }
        }

        // GET: api/Contrato/{id}/relatorio
        [HttpGet("{id}/relatorio")]
        public async Task<IActionResult> DownloadRelatorioContrato(int id)
        {
            try
            {
                Console.WriteLine($"");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                Console.WriteLine($"📊 DownloadRelatorioContrato: REQUISIÇÃO RECEBIDA para contrato ID {id}");
                Console.WriteLine($"📊 Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                // Obter número sequencial do header (se fornecido)
                var numeroSequencialHeader = Request.Headers["X-Numero-Sequencial"].FirstOrDefault();
                int? numeroSequencialFrontend = null;
                if (!string.IsNullOrEmpty(numeroSequencialHeader) && int.TryParse(numeroSequencialHeader, out int numSeq))
                {
                    numeroSequencialFrontend = numSeq;
                    Console.WriteLine($"📊 Número sequencial recebido do frontend: {numeroSequencialFrontend}");
                }

                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                Console.WriteLine($"🔍 UsuarioId obtido: {usuarioId}");

                if (usuarioId == null)
                {
                    Console.WriteLine("❌ DownloadRelatorioContrato: Usuário não autenticado");
                    return Unauthorized("Usuário não autenticado");
                }

                // Buscar usuário para verificar permissões
                var usuario = await _authorizationService.GetUsuarioAsync(usuarioId.Value);
                if (usuario == null)
                {
                    Console.WriteLine($"❌ DownloadRelatorioContrato: Usuário {usuarioId} não encontrado no banco");
                    return Unauthorized("Usuário não encontrado");
                }

                Console.WriteLine($"✅ Usuário encontrado: {usuario.Login} (ID: {usuario.Id})");
                Console.WriteLine($"🔐 Grupo de Acesso: {usuario.GrupoAcesso?.Nome ?? "NULL"}");

                // Verificar se o usuário tem permissão para baixar relatório
                var gruposPermitidos = new[] { "Administrador", "Faturamento", "Cobrança e Financeiro" };
                if (usuario.GrupoAcesso == null || !gruposPermitidos.Contains(usuario.GrupoAcesso.Nome))
                {
                    Console.WriteLine($"❌ DownloadRelatorioContrato: Usuário {usuarioId} não tem permissão");
                    return Forbid("Você não tem permissão para baixar relatório de contratos");
                }

                Console.WriteLine($"✅ Permissão verificada com sucesso");

                // Buscar contrato com relacionamentos
                Console.WriteLine($"🔍 Buscando contrato {id} no banco de dados...");
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.Filial)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .Where(c => c.Id == id && c.Ativo)
                    .FirstOrDefaultAsync();

                if (contrato == null)
                {
                    Console.WriteLine($"❌ CONTRATO ID={id} NÃO ENCONTRADO ou INATIVO!");
                    return NotFound(new
                    {
                        mensagem = "Contrato não encontrado",
                        detalhes = $"O contrato com ID {id} não existe ou está inativo"
                    });
                }

                Console.WriteLine($"✅ Contrato {id} encontrado");

                // Calcular número sequencial se não foi fornecido
                int numeroSequencial;
                if (numeroSequencialFrontend.HasValue)
                {
                    numeroSequencial = numeroSequencialFrontend.Value;
                    Console.WriteLine($"📊 Usando número sequencial do frontend: {numeroSequencial}");
                }
                else
                {
                    numeroSequencial = await _context.Contratos
                        .Where(c => c.Id <= id && c.Ativo)
                        .CountAsync();
                    Console.WriteLine($"📊 Número sequencial calculado: {numeroSequencial}");
                }

                // Gerar HTML do relatório
                Console.WriteLine($"📄 Gerando HTML do relatório...");
                var html = GerarHTMLContrato(contrato, numeroSequencial);
                Console.WriteLine($"✅ HTML gerado! Tamanho: {html.Length} caracteres");

                var htmlBytes = System.Text.Encoding.UTF8.GetBytes(html);
                var nomeArquivo = $"Relatorio_Contrato_{numeroSequencial}.html";

                Console.WriteLine($"📦 Nome do arquivo: {nomeArquivo}");
                Console.WriteLine($"✅ Retornando HTML para conversão no frontend");
                Console.WriteLine($"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                Console.WriteLine($"");

                // Adicionar headers para conversão no frontend
                Response.Headers["X-Convert-To-PDF"] = "true";
                Response.Headers["X-Document-Title"] = $"Relatorio_Contrato_{numeroSequencial}";

                return File(htmlBytes, "text/html", nomeArquivo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ DownloadRelatorioContrato: Erro ao gerar relatório do contrato {id}");
                Console.WriteLine($"   Mensagem: {ex.Message}");
                Console.WriteLine($"   Stack Trace: {ex.StackTrace}");
                return StatusCode(500, new { mensagem = "Erro ao gerar relatório do contrato", detalhes = ex.Message });
            }
        }

        private string LimparTexto(string texto)
        {
            if (string.IsNullOrEmpty(texto)) return "";

            // Remover acentos e caracteres especiais
            var normalizado = texto
                .Replace("á", "a").Replace("à", "a").Replace("ã", "a").Replace("â", "a")
                .Replace("é", "e").Replace("ê", "e")
                .Replace("í", "i")
                .Replace("ó", "o").Replace("ô", "o").Replace("õ", "o")
                .Replace("ú", "u").Replace("ü", "u")
                .Replace("ç", "c")
                .Replace("Á", "A").Replace("À", "A").Replace("Ã", "A").Replace("Â", "A")
                .Replace("É", "E").Replace("Ê", "E")
                .Replace("Í", "I")
                .Replace("Ó", "O").Replace("Ô", "O").Replace("Õ", "O")
                .Replace("Ú", "U").Replace("Ü", "U")
                .Replace("Ç", "C")
                .Replace("'", "'").Replace("'", "'").Replace(""", "\"").Replace(""", "\"")
                .Replace("–", "-").Replace("—", "-")
                .Replace("\r", " ").Replace("\n", " ")
                .Replace("\t", " ");

            return System.Net.WebUtility.HtmlEncode(normalizado);
        }

        private string GerarHTMLContrato(Contrato contrato, int numeroSequencial)
        {
            var nomeCliente = LimparTexto(contrato.Cliente?.PessoaFisica?.Nome ??
                              contrato.Cliente?.PessoaJuridica?.RazaoSocial ??
                              "Cliente nao identificado");

            var cpfCnpj = LimparTexto(contrato.Cliente?.PessoaFisica?.Cpf ??
                          contrato.Cliente?.PessoaJuridica?.Cnpj ??
                          "N/A");

            var nomeConsultor = LimparTexto(contrato.Consultor?.PessoaFisica?.Nome ?? "Nao informado");
            var filialConsultor = LimparTexto(contrato.Consultor?.Filial?.Nome ?? "Nao informada");

            var sb = new System.Text.StringBuilder();

            // Construir HTML
            sb.Append("<!DOCTYPE html>");
            sb.Append("<html><head><meta charset=\"UTF-8\">");
            sb.Append("<title>Contrato ").Append(numeroSequencial).Append("</title>");
            sb.Append("<style>");
            sb.Append("*{margin:0;padding:0;box-sizing:border-box}");
            sb.Append("body{font-family:Arial,sans-serif;padding:15px;color:#1f2937;background:#fff;font-size:22px;width:100%}");
            sb.Append(".header{background:#2563eb;color:white;padding:65px 45px;margin:-15px -15px 50px -15px;text-align:center}");
            sb.Append(".header h1{font-size:68px;margin-bottom:20px;font-weight:700}");
            sb.Append(".header p{font-size:34px;margin:12px 0;font-weight:600}");
            sb.Append(".info-badge{display:inline-block;background:rgba(255,255,255,0.2);padding:14px 28px;border-radius:20px;font-size:24px;margin-top:16px;font-weight:600}");
            sb.Append(".section{margin-bottom:45px;background:#f8fafc;padding:48px;border-radius:12px;border-left:7px solid #2563eb}");
            sb.Append(".section-title{font-size:38px;font-weight:700;color:#1e40af;margin-bottom:32px;padding-bottom:16px;border-bottom:4px solid #3b82f6}");
            sb.Append(".field{margin-bottom:24px;display:flex;padding:22px;background:white;border-radius:8px}");
            sb.Append(".field-label{font-weight:700;color:#475569;min-width:350px;font-size:26px}");
            sb.Append(".field-value{color:#1f2937;font-size:26px;font-weight:600;flex:1}");
            sb.Append(".field-value strong{color:#10b981;font-size:32px;font-weight:700}");
            sb.Append(".footer{margin-top:60px;text-align:center;color:#94a3b8;font-size:20px;padding-top:32px;border-top:2px solid #e2e8f0}");
            sb.Append(".text-content{background:white;padding:35px;border-radius:8px;border-left:5px solid #2563eb;margin-top:20px;font-size:24px;line-height:1.9}");
            sb.Append("</style></head><body>");

            // Header
            sb.Append("<div class=\"header\">");
            sb.Append("<h1>CONTRATO CRM ARRIGHI</h1>");
            sb.Append("<p>Contrato numero ").Append(numeroSequencial).Append("</p>");
            sb.Append("<span class=\"info-badge\">Gerado em ").Append(System.Net.WebUtility.HtmlEncode(DateTime.Now.ToString("dd/MM/yyyy HH:mm"))).Append("</span>");
            sb.Append("</div>");

            // Cliente
            sb.Append("<div class=\"section\">");
            sb.Append("<div class=\"section-title\">INFORMACOES DO CLIENTE</div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Nome/Razao Social:</span><span class=\"field-value\">").Append(nomeCliente).Append("</span></div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">CPF/CNPJ:</span><span class=\"field-value\">").Append(cpfCnpj).Append("</span></div>");
            sb.Append("</div>");

            // Consultor
            sb.Append("<div class=\"section\">");
            sb.Append("<div class=\"section-title\">INFORMACOES DO CONSULTOR</div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Consultor:</span><span class=\"field-value\">").Append(nomeConsultor).Append("</span></div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Filial:</span><span class=\"field-value\">").Append(filialConsultor).Append("</span></div>");
            sb.Append("</div>");

            // Status e Datas
            sb.Append("<div class=\"section\">");
            sb.Append("<div class=\"section-title\">STATUS E DATAS</div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Situacao:</span><span class=\"field-value\"><strong>").Append(LimparTexto(contrato.Situacao)).Append("</strong></span></div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Data Ultimo Contato:</span><span class=\"field-value\">").Append(contrato.DataUltimoContato?.ToString("dd/MM/yyyy") ?? "N/A").Append("</span></div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Data Proximo Contato:</span><span class=\"field-value\">").Append(contrato.DataProximoContato?.ToString("dd/MM/yyyy") ?? "N/A").Append("</span></div>");
            if (!string.IsNullOrEmpty(contrato.TipoServico))
                sb.Append("<div class=\"field\"><span class=\"field-label\">Tipo de Servico:</span><span class=\"field-value\">").Append(LimparTexto(contrato.TipoServico)).Append("</span></div>");
            if (contrato.DataFechamentoContrato.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Data de Fechamento:</span><span class=\"field-value\">").Append(contrato.DataFechamentoContrato.Value.ToString("dd/MM/yyyy")).Append("</span></div>");
            sb.Append("</div>");

            // Valores
            sb.Append("<div class=\"section\">");
            sb.Append("<div class=\"section-title\">VALORES FINANCEIROS</div>");
            sb.Append("<div class=\"field\"><span class=\"field-label\">Valor Devido:</span><span class=\"field-value\"><strong>").Append(System.Net.WebUtility.HtmlEncode(contrato.ValorDevido?.ToString("C2") ?? "R$ 0,00")).Append("</strong></span></div>");
            if (contrato.ValorNegociado.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Valor Negociado:</span><span class=\"field-value\">").Append(System.Net.WebUtility.HtmlEncode(contrato.ValorNegociado.Value.ToString("C2"))).Append("</span></div>");
            if (contrato.ValorEntrada.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Valor de Entrada:</span><span class=\"field-value\">").Append(System.Net.WebUtility.HtmlEncode(contrato.ValorEntrada.Value.ToString("C2"))).Append("</span></div>");
            if (contrato.ValorParcela.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Valor da Parcela:</span><span class=\"field-value\">").Append(System.Net.WebUtility.HtmlEncode(contrato.ValorParcela.Value.ToString("C2"))).Append("</span></div>");
            if (contrato.NumeroParcelas.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Numero de Parcelas:</span><span class=\"field-value\">").Append(contrato.NumeroParcelas.Value).Append("x</span></div>");
            if (contrato.Comissao.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Comissao:</span><span class=\"field-value\">").Append(System.Net.WebUtility.HtmlEncode(contrato.Comissao.Value.ToString("F2"))).Append("%</span></div>");
            if (contrato.PrimeiroVencimento.HasValue)
                sb.Append("<div class=\"field\"><span class=\"field-label\">Primeiro Vencimento:</span><span class=\"field-value\">").Append(System.Net.WebUtility.HtmlEncode(contrato.PrimeiroVencimento.Value.ToString("dd/MM/yyyy"))).Append("</span></div>");
            sb.Append("</div>");

            // Objeto do Contrato
            if (!string.IsNullOrEmpty(contrato.ObjetoContrato))
            {
                sb.Append("<div class=\"section\">");
                sb.Append("<div class=\"section-title\">OBJETO DO CONTRATO</div>");
                sb.Append("<div class=\"text-content\">").Append(LimparTexto(contrato.ObjetoContrato)).Append("</div>");
                sb.Append("</div>");
            }

            // Observações
            if (!string.IsNullOrEmpty(contrato.Observacoes))
            {
                sb.Append("<div class=\"section\">");
                sb.Append("<div class=\"section-title\">OBSERVACOES</div>");
                sb.Append("<div class=\"text-content\">").Append(LimparTexto(contrato.Observacoes)).Append("</div>");
                sb.Append("</div>");
            }

            // Pendências
            if (!string.IsNullOrEmpty(contrato.Pendencias))
            {
                sb.Append("<div class=\"section\">");
                sb.Append("<div class=\"section-title\">PENDENCIAS</div>");
                sb.Append("<div class=\"text-content\">").Append(LimparTexto(contrato.Pendencias)).Append("</div>");
                sb.Append("</div>");
            }

            // Footer
            sb.Append("<div class=\"footer\">");
            sb.Append("<p><strong>Documento gerado automaticamente pelo CRM Arrighi</strong></p>");
            sb.Append("<p>Data de Cadastro: ").Append(System.Net.WebUtility.HtmlEncode(contrato.DataCadastro.ToString("dd/MM/yyyy HH:mm"))).Append("</p>");
            if (contrato.DataAtualizacao.HasValue)
                sb.Append("<p>Ultima Atualizacao: ").Append(System.Net.WebUtility.HtmlEncode(contrato.DataAtualizacao.Value.ToString("dd/MM/yyyy HH:mm"))).Append("</p>");
            sb.Append("</div>");

            sb.Append("</body></html>");

            return sb.ToString();
        }

        // Método auxiliar para criar resposta de erro de validação padronizada
        private object CriarErroValidacao(string campo, string mensagem)
        {
            Console.WriteLine($"❌ Erro de validação - Campo: {campo}, Mensagem: {mensagem}");
            return new {
                sucesso = false,
                mensagem = "Erro de validação",
                erros = new[] { new { campo, mensagem } },
                mensagemUsuario = mensagem
            };
        }

        // POST: api/Contrato/5/analisar
        [HttpPost("{id}/analisar")]
        public async Task<IActionResult> AnalisarContrato(int id)
        {
            try
            {
                // Obter ID do usuário logado
                var usuarioId = GetCurrentUserId();
                if (usuarioId == null)
                {
                    return Unauthorized("Usuário não autenticado");
                }

                // Verificar se o usuário pode visualizar este contrato
                var canView = await _authorizationService.CanViewContratoAsync(usuarioId.Value, id);
                if (!canView)
                {
                    return Forbid("Você não tem permissão para visualizar este contrato");
                }

                Console.WriteLine($"🤖 AnalisarContrato: Iniciando análise do contrato {id} para usuário {usuarioId}");

                // Buscar o contrato com todos os dados relacionados
                var contrato = await _context.Contratos
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(cl => cl.PessoaJuridica)
                    .Include(c => c.Consultor)
                        .ThenInclude(co => co.PessoaFisica)
                    .Include(c => c.Parceiro)
                        .ThenInclude(p => p.PessoaFisica)
                    .FirstOrDefaultAsync(c => c.Id == id && c.Ativo);

                if (contrato == null)
                {
                    return NotFound(new {
                        recurso = "Contrato",
                        id = id,
                        mensagem = $"Contrato #{id} não foi encontrado"
                    });
                }

                // Construir informações do contrato para análise
                var clienteNome = contrato.Cliente?.PessoaFisica?.Nome ?? contrato.Cliente?.PessoaJuridica?.RazaoSocial ?? "Não informado";
                var clienteDocumento = contrato.Cliente?.PessoaFisica?.Cpf ?? contrato.Cliente?.PessoaJuridica?.Cnpj ?? "Não informado";
                var tipoPessoa = contrato.Cliente?.TipoPessoa ?? "Não informado";
                var consultorNome = contrato.Consultor?.PessoaFisica?.Nome ?? "Não informado";
                var parceiroNome = contrato.Parceiro?.PessoaFisica?.Nome ?? "Nenhum";

                // Criar prompt customizado para análise jurídica
                var systemPrompt = @"Você é um assistente jurídico especializado em análise de contratos para escritórios de advocacia.
Sua função é analisar contratos e fornecer insights valiosos para advogados e gestores.

Ao analisar um contrato, você deve:

1. **Resumo Executivo**: Forneça um resumo claro e conciso do contrato em 2-3 parágrafos.

2. **Informações Principais**:
   - Partes envolvidas
   - Objeto do contrato
   - Valor total e condições de pagamento
   - Prazo de vigência
   - Principais obrigações de cada parte

3. **Análise Financeira**:
   - Avalie a viabilidade do valor negociado vs valor devido
   - Analise a estrutura de pagamento (entrada + parcelas)
   - Calcule a taxa de desconto/negociação
   - Avalie o risco de inadimplência baseado nos valores

4. **Análise de Riscos**:
   - Liste potenciais riscos contratuais
   - Classifique cada risco (Alto, Médio, Baixo)
   - Sugira mitigações quando possível

5. **Pontos de Atenção**:
   - Situação atual do contrato
   - Pendências identificadas
   - Prazos importantes
   - Sugestões de melhorias

6. **Recomendações**:
   - Ações recomendadas para o consultor
   - Pontos a negociar (se aplicável)
   - Próximos passos sugeridos

Formate sua resposta de forma clara e organizada, usando markdown.
Seja objetivo e profissional. Use linguagem jurídica quando apropriado, mas explique termos complexos.
Responda sempre em português brasileiro.";

                var userPrompt = $@"Analise o seguinte contrato com base nas informações fornecidas:

**Informações do Contrato:**
- **ID do Contrato**: {contrato.Id}
- **Número da Pasta**: {contrato.NumeroPasta ?? "Não informado"}
- **Cliente**: {clienteNome}
- **Tipo de Pessoa**: {tipoPessoa}
- **CPF/CNPJ**: {clienteDocumento}
- **Situação Atual**: {contrato.Situacao}
- **Tipo de Serviço**: {contrato.TipoServico ?? "Não informado"}
- **Objeto do Contrato**: {contrato.ObjetoContrato ?? "Não informado"}

**Valores Financeiros:**
- **Valor Devido**: {(contrato.ValorDevido.HasValue ? $"R$ {contrato.ValorDevido.Value:N2}" : "Não informado")}
- **Valor Negociado**: {(contrato.ValorNegociado.HasValue ? $"R$ {contrato.ValorNegociado.Value:N2}" : "Não negociado")}
- **Valor de Entrada**: {(contrato.ValorEntrada.HasValue ? $"R$ {contrato.ValorEntrada.Value:N2}" : "Não informado")}
- **Número de Parcelas**: {contrato.NumeroParcelas ?? 0}
- **Valor da Parcela**: {(contrato.ValorParcela.HasValue ? $"R$ {contrato.ValorParcela.Value:N2}" : "Não informado")}
- **Comissão**: {(contrato.Comissao.HasValue ? $"{contrato.Comissao.Value}%" : "Não informada")}

**Datas Importantes:**
- **Data de Cadastro**: {contrato.DataCadastro:dd/MM/yyyy}
- **Data de Fechamento**: {(contrato.DataFechamentoContrato.HasValue ? contrato.DataFechamentoContrato.Value.ToString("dd/MM/yyyy") : "Não informada")}
- **Primeiro Vencimento**: {(contrato.PrimeiroVencimento.HasValue ? contrato.PrimeiroVencimento.Value.ToString("dd/MM/yyyy") : "Não informado")}
- **Último Contato**: {(contrato.DataUltimoContato.HasValue ? contrato.DataUltimoContato.Value.ToString("dd/MM/yyyy") : "Não informada")}
- **Próximo Contato**: {(contrato.DataProximoContato.HasValue ? contrato.DataProximoContato.Value.ToString("dd/MM/yyyy") : "Não informada")}

**Equipe:**
- **Consultor Responsável**: {consultorNome}
- **Parceiro**: {parceiroNome}

**Pendências**: {contrato.Pendencias ?? "Nenhuma registrada"}
**Observações**: {contrato.Observacoes ?? "Nenhuma"}

Por favor, forneça uma análise completa considerando:
1. A situação atual do contrato e recomendações de próximos passos
2. Análise de risco considerando os valores e situação
3. Sugestões para melhorar a taxa de conversão/fechamento
4. Pontos de atenção específicos para este tipo de serviço jurídico
5. Análise da estrutura de pagamento e viabilidade financeira";

                // Chamar o Azure OpenAI Service
                var azureOpenAIService = HttpContext.RequestServices.GetRequiredService<IAzureOpenAIService>();

                Console.WriteLine($"🤖 AnalisarContrato: Enviando para Azure OpenAI...");
                var analise = await azureOpenAIService.GenerateResponseAsync(userPrompt, systemPrompt);
                Console.WriteLine($"✅ AnalisarContrato: Análise recebida ({analise.Length} caracteres)");

                // Registrar no histórico do cliente
                await RegistrarHistoricoClienteAsync(
                    contrato.ClienteId,
                    contrato.Id,
                    "AnaliseIA",
                    $"Análise de contrato realizada via IA (Contrato ID: {contrato.Id})",
                    null,
                    System.Text.Json.JsonSerializer.Serialize(new { ContratoId = contrato.Id, TamanhoAnalise = analise.Length }),
                    usuarioId
                );

                return Ok(new {
                    success = true,
                    contratoId = contrato.Id,
                    analise = analise,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ AnalisarContrato: Erro ao analisar contrato {id}: {ex.Message}");
                return StatusCode(500, new {
                    success = false,
                    mensagem = "Erro ao analisar contrato",
                    detalhes = ex.Message
                });
            }
        }

        private int? GetCurrentUserId()
        {
            // Obter ID do usuário do header (conforme implementação do sistema)
            var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
            if (int.TryParse(usuarioIdHeader, out int usuarioId))
            {
                Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via header: {usuarioId}");
                return usuarioId;
            }

            // Fallback: tentar obter do JWT token se disponível
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userIdFromClaim))
            {
                Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via JWT: {userIdFromClaim}");
                return userIdFromClaim;
            }

            // Fallback: tentar obter do NameIdentifier
            var nameIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (nameIdClaim != null && int.TryParse(nameIdClaim.Value, out int nameId))
            {
                Console.WriteLine($"🔍 GetCurrentUserId: Usuário identificado via NameIdentifier: {nameId}");
                return nameId;
            }

            Console.WriteLine($"❌ GetCurrentUserId: Nenhum usuário identificado. Headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");
            return null;
        }
    }
}
// Forçar mudança para deploy Wed Oct  8 17:32:01 -03 2025
