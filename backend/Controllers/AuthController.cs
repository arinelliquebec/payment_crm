using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAuthorizationService _authorizationService;
        private readonly IAuditService _auditService;

        public AuthController(CrmArrighiContext context, IAuthorizationService authorizationService, IAuditService auditService)
        {
            _context = context;
            _authorizationService = authorizationService;
            _auditService = auditService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDTO>> Login(LoginDTO loginDTO)
        {
            try
            {
                // Validar dados de entrada
                if (string.IsNullOrWhiteSpace(loginDTO.Login) || string.IsNullOrWhiteSpace(loginDTO.Senha))
                {
                    return BadRequest("Login e senha são obrigatórios");
                }

                // Buscar usuário
                var usuario = await _context.Usuarios
                    .Include(u => u.GrupoAcesso)
                    .Include(u => u.Filial)
                    .Include(u => u.Consultor)
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .FirstOrDefaultAsync(u => u.Ativo &&
                        (u.Login == loginDTO.Login ||
                         (u.PessoaFisica != null && u.PessoaFisica.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == loginDTO.Login) ||
                         (u.PessoaJuridica != null && u.PessoaJuridica.Cnpj.Replace(".", "").Replace("/", "").Replace("-", "").Replace(" ", "") == loginDTO.Login)));

                if (usuario == null)
                {
                    await _auditService.LogAsync(0, "Login", "Usuario", null,
                        $"Tentativa de login falhou | Login: {loginDTO.Login} | Motivo: Usuário não encontrado",
                        "Autenticação", severidade: "Warning", httpContext: HttpContext);
                    return BadRequest("Login ou senha incorretos");
                }

                // Verificar senha com BCrypt (novo padrão) ou texto plano (legado - migração automática)
                bool senhaValida = false;
                if (BCrypt.Net.BCrypt.Verify(loginDTO.Senha, usuario.Senha))
                {
                    senhaValida = true;
                }
                else if (usuario.Senha == loginDTO.Senha)
                {
                    // Senha em texto plano (legado) - migrar para hash automaticamente
                    senhaValida = true;
                    usuario.Senha = BCrypt.Net.BCrypt.HashPassword(loginDTO.Senha);
                }

                if (!senhaValida)
                {
                    var nomeUsuarioFalha = usuario.PessoaFisica?.Nome ?? usuario.Login;
                    await _auditService.LogAsync(usuario.Id, "Login", "Usuario", usuario.Id,
                        $"Tentativa de login falhou | Login: {loginDTO.Login} | Nome: {nomeUsuarioFalha} | Grupo: {usuario.GrupoAcesso?.Nome ?? "N/A"} | Motivo: Senha incorreta",
                        "Autenticação", severidade: "Warning", httpContext: HttpContext);
                    return BadRequest("Login ou senha incorretos");
                }

                // Guardar último acesso anterior (antes de atualizar)
                var ultimoAcessoAnterior = usuario.UltimoAcesso;

                // Atualizar último acesso (salvar em UTC)
                usuario.UltimoAcesso = DateTime.UtcNow;
                usuario.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Retornar dados do usuário
                var response = new LoginResponseDTO
                {
                    UsuarioId = usuario.Id,
                    Login = usuario.Login,
                    Email = usuario.Email,
                    Nome = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? "Usuário",
                    GrupoAcesso = usuario.GrupoAcesso?.Nome ?? "Usuário",
                    GrupoAcessoId = usuario.GrupoAcessoId,
                    FilialId = usuario.FilialId,
                    FilialNome = usuario.Filial?.Nome,
                    ConsultorId = usuario.ConsultorId,
                    TipoPessoa = usuario.TipoPessoa,
                    Ativo = usuario.Ativo,
                    UltimoAcesso = usuario.UltimoAcesso,
                    UltimoAcessoAnterior = ultimoAcessoAnterior
                };

                var nomeUsuario = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? usuario.Login;
                await _auditService.LogAsync(
                    usuario.Id, "Login", "Usuario", usuario.Id,
                    $"Login realizado | Nome: {nomeUsuario} | Login: {usuario.Login} | Grupo: {usuario.GrupoAcesso?.Nome ?? "N/A"} | Filial: {usuario.Filial?.Nome ?? "N/A"}",
                    "Autenticação",
                    valorNovo: new {
                        usuario.Id,
                        Nome = nomeUsuario,
                        usuario.Login,
                        Grupo = usuario.GrupoAcesso?.Nome,
                        Filial = usuario.Filial?.Nome,
                        usuario.UltimoAcesso
                    },
                    httpContext: HttpContext);

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("usuario/{id}/permissoes")]
        public async Task<ActionResult<UsuarioPermissoesDTO>> GetUsuarioPermissoes(int id)
        {
            try
            {
                var usuario = await _authorizationService.GetUsuarioAsync(id);
                if (usuario == null)
                {
                    return NotFound("Usuário não encontrado");
                }

                var permissoes = await _context.PermissoesGrupos
                    .Include(pg => pg.Permissao)
                    .Where(pg => pg.GrupoAcessoId == usuario.GrupoAcessoId)
                    .Select(pg => new PermissaoDTO
                    {
                        Id = pg.Permissao.Id,
                        Nome = pg.Permissao.Nome,
                        Modulo = pg.Permissao.Modulo,
                        Acao = pg.Permissao.Acao,
                        ApenasProprios = pg.ApenasProprios,
                        ApenasFilial = pg.ApenasFilial,
                        ApenasLeitura = pg.ApenasLeitura,
                        IncluirSituacoesEspecificas = pg.IncluirSituacoesEspecificas,
                        SituacoesEspecificas = pg.SituacoesEspecificas
                    })
                    .ToListAsync();

                var response = new UsuarioPermissoesDTO
                {
                    UsuarioId = usuario.Id,
                    Login = usuario.Login,
                    Nome = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? "Usuário",
                    GrupoAcesso = usuario.GrupoAcesso?.Nome ?? "Usuário",
                    FilialId = usuario.FilialId,
                    FilialNome = usuario.Filial?.Nome,
                    ConsultorId = usuario.ConsultorId,
                    Permissoes = permissoes
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpPost("heartbeat/{usuarioId}")]
        public async Task<ActionResult> UpdateHeartbeat(int usuarioId)
        {
            try
            {
                var usuario = await _context.Usuarios.FindAsync(usuarioId);
                if (usuario == null || !usuario.Ativo)
                {
                    return NotFound("Usuário não encontrado ou inativo");
                }

                usuario.UltimoAcesso = DateTime.UtcNow;
                usuario.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Heartbeat atualizado", ultimoAcesso = usuario.UltimoAcesso });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("sessoes-ativas")]
        public async Task<ActionResult<SessoesAtivasDTO>> GetSessoesAtivas()
        {
            try
            {
                // Considerar usuário ativo se teve login nos últimos 15 minutos
                var thresholdTime = DateTime.UtcNow.AddMinutes(-15);

                var usuariosAtivos = await _context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .Include(u => u.GrupoAcesso)
                    .Include(u => u.Filial)
                    .Where(u => u.Ativo &&
                               u.UltimoAcesso.HasValue &&
                               u.UltimoAcesso.Value >= thresholdTime)
                    .OrderByDescending(u => u.UltimoAcesso)
                    .ToListAsync();

                var sessoes = usuariosAtivos.Select(u => new SessaoAtivaDTO
                {
                    UsuarioId = u.Id,
                    Login = u.Login,
                    Nome = u.PessoaFisica?.Nome ?? u.PessoaJuridica?.RazaoSocial ?? "Usuário",
                    Email = u.Email,
                    GrupoAcesso = u.GrupoAcesso?.Nome ?? "Usuário",
                    FilialNome = u.Filial?.Nome,
                    UltimoAcesso = u.UltimoAcesso.Value,
                    TipoPessoa = u.TipoPessoa,
                    MinutosOnline = u.UltimoAcesso.HasValue ? (int)Math.Round((DateTime.UtcNow - u.UltimoAcesso.Value).TotalMinutes) : 0
                }).ToList();

                var response = new SessoesAtivasDTO
                {
                    TotalSessoes = sessoes.Count,
                    DataConsulta = DateTime.UtcNow,
                    Sessoes = sessoes
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        [HttpGet("usuario/{id}/menu")]
        public async Task<ActionResult<MenuUsuarioDTO>> GetMenuUsuario(int id)
        {
            try
            {
                var usuario = await _authorizationService.GetUsuarioAsync(id);
                if (usuario == null)
                {
                    return NotFound("Usuário não encontrado");
                }

                var grupoNome = usuario.GrupoAcesso?.Nome ?? "Usuário";
                var menu = new List<MenuItemDTO>();

                switch (grupoNome)
                {
                    case "Administrador":
                        menu = GetMenuAdministrador();
                        break;
                    case "Faturamento":
                        menu = GetMenuFaturamento();
                        break;
                    case "Cobrança/Financeiro":
                        menu = GetMenuCobrancaFinanceiro();
                        break;
                    case "Gestor de Filial":
                        menu = GetMenuGestorFilial();
                        break;
                    case "Administrativo de Filial":
                        menu = GetMenuAdministrativoFilial();
                        break;
                    case "Consultores":
                        menu = GetMenuConsultores();
                        break;
                    case "Usuário":
                        menu = GetMenuUsuario();
                        break;
                    default:
                        menu = GetMenuUsuario();
                        break;
                }

                var response = new MenuUsuarioDTO
                {
                    UsuarioId = usuario.Id,
                    Nome = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? "Usuário",
                    GrupoAcesso = grupoNome,
                    FilialNome = usuario.Filial?.Nome,
                    Menu = menu
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        private List<MenuItemDTO> GetMenuAdministrador()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Consultores", Rota = "/consultores", Icone = "support_agent" },
                new MenuItemDTO { Nome = "Parceiros", Rota = "/parceiros", Icone = "handshake" },
                new MenuItemDTO { Nome = "Filiais", Rota = "/filiais", Icone = "location_on" },
                new MenuItemDTO { Nome = "Usuários", Rota = "/usuarios", Icone = "admin_panel_settings" },
                new MenuItemDTO { Nome = "Grupos de Acesso", Rota = "/grupos-acesso", Icone = "security" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" },
                new MenuItemDTO { Nome = "Relatórios", Rota = "/relatorios", Icone = "assessment" }
            };
        }

        private List<MenuItemDTO> GetMenuFaturamento()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Consultores", Rota = "/consultores", Icone = "support_agent" },
                new MenuItemDTO { Nome = "Parceiros", Rota = "/parceiros", Icone = "handshake" },
                new MenuItemDTO { Nome = "Filiais", Rota = "/filiais", Icone = "location_on" },
                new MenuItemDTO { Nome = "Usuários", Rota = "/usuarios", Icone = "admin_panel_settings" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" },
                new MenuItemDTO { Nome = "Relatórios", Rota = "/relatorios", Icone = "assessment" }
            };
        }

        private List<MenuItemDTO> GetMenuCobrancaFinanceiro()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Consultores", Rota = "/consultores", Icone = "support_agent" },
                new MenuItemDTO { Nome = "Parceiros", Rota = "/parceiros", Icone = "handshake" },
                new MenuItemDTO { Nome = "Filiais", Rota = "/filiais", Icone = "location_on" },
                new MenuItemDTO { Nome = "Usuários", Rota = "/usuarios", Icone = "admin_panel_settings" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" },
                new MenuItemDTO { Nome = "Relatórios", Rota = "/relatorios", Icone = "assessment" }
            };
        }

        private List<MenuItemDTO> GetMenuGestorFilial()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Consultores", Rota = "/consultores", Icone = "support_agent" },
                new MenuItemDTO { Nome = "Parceiros", Rota = "/parceiros", Icone = "handshake" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" },
                new MenuItemDTO { Nome = "Relatórios", Rota = "/relatorios", Icone = "assessment" }
            };
        }

        private List<MenuItemDTO> GetMenuAdministrativoFilial()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Consultores", Rota = "/consultores", Icone = "support_agent" },
                new MenuItemDTO { Nome = "Parceiros", Rota = "/parceiros", Icone = "handshake" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" },
                new MenuItemDTO { Nome = "Relatórios", Rota = "/relatorios", Icone = "assessment" }
            };
        }

        private List<MenuItemDTO> GetMenuConsultores()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Dashboard", Rota = "/dashboard", Icone = "dashboard" },
                new MenuItemDTO { Nome = "Pessoas Físicas", Rota = "/pessoas-fisicas", Icone = "person" },
                new MenuItemDTO { Nome = "Pessoas Jurídicas", Rota = "/pessoas-juridicas", Icone = "business" },
                new MenuItemDTO { Nome = "Clientes", Rota = "/clientes", Icone = "people" },
                new MenuItemDTO { Nome = "Contratos", Rota = "/contratos", Icone = "description" },
                new MenuItemDTO { Nome = "Boletos", Rota = "/boletos", Icone = "receipt" }
            };
        }

        private List<MenuItemDTO> GetMenuUsuario()
        {
            return new List<MenuItemDTO>
            {
                new MenuItemDTO { Nome = "Aguardando Alocação", Rota = "/aguardando", Icone = "hourglass_empty" }
            };
        }
    }

    public class LoginDTO
    {
        public string Login { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }

    public class LoginResponseDTO
    {
        public int UsuarioId { get; set; }
        public string Login { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string GrupoAcesso { get; set; } = string.Empty;
        public int? GrupoAcessoId { get; set; }
        public int? FilialId { get; set; }
        public string? FilialNome { get; set; }
        public int? ConsultorId { get; set; }
        public string TipoPessoa { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime? UltimoAcesso { get; set; }
        public DateTime? UltimoAcessoAnterior { get; set; }
    }

    public class UsuarioPermissoesDTO
    {
        public int UsuarioId { get; set; }
        public string Login { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string GrupoAcesso { get; set; } = string.Empty;
        public int? FilialId { get; set; }
        public string? FilialNome { get; set; }
        public int? ConsultorId { get; set; }
        public List<PermissaoDTO> Permissoes { get; set; } = new List<PermissaoDTO>();
    }

    public class PermissaoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Modulo { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public bool ApenasProprios { get; set; }
        public bool ApenasFilial { get; set; }
        public bool ApenasLeitura { get; set; }
        public bool IncluirSituacoesEspecificas { get; set; }
        public string? SituacoesEspecificas { get; set; }
    }

    public class MenuUsuarioDTO
    {
        public int UsuarioId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string GrupoAcesso { get; set; } = string.Empty;
        public string? FilialNome { get; set; }
        public List<MenuItemDTO> Menu { get; set; } = new List<MenuItemDTO>();
    }

    public class MenuItemDTO
    {
        public string Nome { get; set; } = string.Empty;
        public string Rota { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
    }

    public class SessoesAtivasDTO
    {
        public int TotalSessoes { get; set; }
        public DateTime DataConsulta { get; set; }
        public List<SessaoAtivaDTO> Sessoes { get; set; } = new List<SessaoAtivaDTO>();
    }

    public class SessaoAtivaDTO
    {
        public int UsuarioId { get; set; }
        public string Login { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string GrupoAcesso { get; set; } = string.Empty;
        public string? FilialNome { get; set; }
        public DateTime UltimoAcesso { get; set; }
        public string TipoPessoa { get; set; } = string.Empty;
        public int MinutosOnline { get; set; }
    }
}
