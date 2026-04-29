using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortalController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<PortalController> _logger;
        private readonly IEmailService _emailService;

        public PortalController(
            CrmArrighiContext context,
            ILogger<PortalController> logger,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        // ─── DTOs ────────────────────────────────────────────────────────────

        public class VerificarDocumentoDTO
        {
            public string Documento { get; set; } = string.Empty;
        }

        public class LoginPortalDTO
        {
            public string Documento { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }

        public class SolicitarAcessoDTO
        {
            public string Documento { get; set; } = string.Empty;
        }

        public class VerificarCodigoDTO
        {
            public string Documento { get; set; } = string.Empty;
            public string Codigo { get; set; } = string.Empty;
        }

        public class DefinirSenhaDTO
        {
            public string Documento { get; set; } = string.Empty;
            public string Codigo { get; set; } = string.Empty;
            public string Senha { get; set; } = string.Empty;
        }

        // ─── POST /api/Portal/verificar-documento ────────────────────────────
        /// <summary>
        /// Verifica se o documento (CPF/CNPJ) já tem senha cadastrada no portal.
        /// </summary>
        [HttpPost("verificar-documento")]
        public async Task<IActionResult> VerificarDocumento([FromBody] VerificarDocumentoDTO dto)
        {
            try
            {
                var docLimpo = LimparDocumento(dto.Documento);

                if (docLimpo.Length != 11 && docLimpo.Length != 14)
                    return BadRequest(new { error = "Documento inválido." });

                var credencial = await _context.CredenciaisPortalCliente
                    .FirstOrDefaultAsync(c => c.Documento == docLimpo && c.Ativo);

                if (credencial != null && credencial.PrimeiroAcessoRealizado)
                {
                    return Ok(new
                    {
                        encontrado = true,
                        temSenha = true,
                        nomeCliente = credencial.NomeExibicao ?? "Cliente",
                        emailMascarado = MascararEmail(credencial.Email),
                    });
                }

                var (cliente, email, nome) = await BuscarClientePorDocumento(docLimpo);

                if (cliente == null)
                {
                    return NotFound(new
                    {
                        error = docLimpo.Length == 11
                            ? "Você ainda não possui cadastro como cliente. Entre em contato conosco."
                            : "Sua empresa ainda não possui cadastro como cliente. Entre em contato conosco.",
                    });
                }

                return Ok(new
                {
                    encontrado = true,
                    temSenha = false,
                    nomeCliente = nome,
                    emailMascarado = MascararEmail(email),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar documento no portal");
                return StatusCode(500, new { error = "Erro interno do servidor." });
            }
        }

        // ─── POST /api/Portal/login ──────────────────────────────────────────
        /// <summary>
        /// Login com documento + senha.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginPortalDTO dto)
        {
            try
            {
                var docLimpo = LimparDocumento(dto.Documento);

                if (string.IsNullOrWhiteSpace(docLimpo) || string.IsNullOrWhiteSpace(dto.Senha))
                    return BadRequest(new { error = "Documento e senha são obrigatórios." });

                var credencial = await _context.CredenciaisPortalCliente
                    .Include(c => c.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Documento == docLimpo && c.Ativo);

                if (credencial == null || !credencial.PrimeiroAcessoRealizado)
                {
                    return BadRequest(new { error = "Credenciais inválidas. Se é seu primeiro acesso, solicite um código de verificação." });
                }

                if (!BCrypt.Net.BCrypt.Verify(dto.Senha, credencial.SenhaHash))
                {
                    return BadRequest(new { error = "Documento ou senha incorretos." });
                }

                credencial.UltimoAcesso = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var clienteResp = MontarClienteResponse(credencial.Cliente, docLimpo);

                _logger.LogInformation("Portal: Login bem-sucedido para documento {Doc}", docLimpo);

                return Ok(new
                {
                    success = true,
                    cliente = clienteResp,
                    role = "cliente",
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no login do portal");
                return StatusCode(500, new { error = "Erro interno do servidor." });
            }
        }

        // ─── POST /api/Portal/solicitar-acesso ───────────────────────────────
        /// <summary>
        /// Gera código de 6 dígitos e envia por email.
        /// Usado para primeiro acesso e recuperação de senha.
        /// </summary>
        [HttpPost("solicitar-acesso")]
        public async Task<IActionResult> SolicitarAcesso([FromBody] SolicitarAcessoDTO dto)
        {
            try
            {
                var docLimpo = LimparDocumento(dto.Documento);

                if (docLimpo.Length != 11 && docLimpo.Length != 14)
                    return BadRequest(new { error = "Documento inválido." });

                var (cliente, email, nome) = await BuscarClientePorDocumento(docLimpo);

                if (cliente == null)
                {
                    return NotFound(new
                    {
                        error = docLimpo.Length == 11
                            ? "Você ainda não possui cadastro como cliente. Entre em contato conosco."
                            : "Sua empresa ainda não possui cadastro como cliente. Entre em contato conosco.",
                    });
                }

                if (string.IsNullOrWhiteSpace(email))
                {
                    return UnprocessableEntity(new
                    {
                        error = "Não encontramos um email cadastrado para este documento. Entre em contato com a equipe Arrighi para atualizar seu cadastro.",
                    });
                }

                // Gerar código de 6 dígitos
                var codigo = Random.Shared.Next(100000, 999999).ToString();
                var codigoExpiracao = DateTime.UtcNow.AddMinutes(30);

                var credencial = await _context.CredenciaisPortalCliente
                    .FirstOrDefaultAsync(c => c.Documento == docLimpo);

                if (credencial != null)
                {
                    credencial.TokenAcesso = codigo;
                    credencial.TokenExpiracao = codigoExpiracao;
                    credencial.Email = email;
                    credencial.NomeExibicao = nome;
                }
                else
                {
                    credencial = new CredencialPortalCliente
                    {
                        ClienteId = cliente.Id,
                        Documento = docLimpo,
                        Email = email,
                        SenhaHash = "",
                        NomeExibicao = nome,
                        TokenAcesso = codigo,
                        TokenExpiracao = codigoExpiracao,
                        PrimeiroAcessoRealizado = false,
                    };
                    _context.CredenciaisPortalCliente.Add(credencial);
                }

                await _context.SaveChangesAsync();

                // Enviar email com código
                var emailHtml = MontarEmailCodigo(nome, codigo);
                var emailEnviado = await _emailService.SendEmail(
                    email,
                    "Código de verificação — Portal Arrighi Advogados",
                    emailHtml
                );

                if (!emailEnviado)
                {
                    _logger.LogWarning("Portal: Falha ao enviar email para {Email}", email);
                }

                _logger.LogInformation("Portal: Código gerado para {Doc}, email: {Email}", docLimpo, MascararEmail(email));

                return Ok(new
                {
                    success = true,
                    emailMascarado = MascararEmail(email),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao solicitar acesso ao portal");
                return StatusCode(500, new { error = "Erro interno do servidor." });
            }
        }

        // ─── POST /api/Portal/verificar-codigo ────────────────────────────────
        /// <summary>
        /// Verifica se o código de 6 dígitos é válido (sem consumir).
        /// Recebe documento + código.
        /// </summary>
        [HttpPost("verificar-codigo")]
        public async Task<IActionResult> VerificarCodigo([FromBody] VerificarCodigoDTO dto)
        {
            try
            {
                var docLimpo = LimparDocumento(dto.Documento);

                if (string.IsNullOrWhiteSpace(docLimpo))
                    return BadRequest(new { valid = false, error = "Documento é obrigatório." });

                if (string.IsNullOrWhiteSpace(dto.Codigo) || dto.Codigo.Length != 6)
                    return BadRequest(new { valid = false, error = "Código de verificação inválido." });

                var credencial = await _context.CredenciaisPortalCliente
                    .FirstOrDefaultAsync(c => c.Documento == docLimpo && c.Ativo);

                if (credencial == null)
                    return BadRequest(new { valid = false, error = "Documento não encontrado." });

                if (credencial.TokenAcesso != dto.Codigo)
                    return BadRequest(new { valid = false, error = "Código incorreto. Verifique o código recebido por email." });

                if (credencial.TokenExpiracao.HasValue && credencial.TokenExpiracao < DateTime.UtcNow)
                    return BadRequest(new { valid = false, error = "Código expirado. Solicite um novo código." });

                return Ok(new
                {
                    valid = true,
                    nomeCliente = credencial.NomeExibicao ?? "Cliente",
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar código do portal");
                return StatusCode(500, new { valid = false, error = "Erro interno do servidor." });
            }
        }

        // ─── POST /api/Portal/definir-senha ──────────────────────────────────
        /// <summary>
        /// Valida código de 6 dígitos e define a senha do cliente.
        /// Recebe documento + código + senha.
        /// </summary>
        [HttpPost("definir-senha")]
        public async Task<IActionResult> DefinirSenha([FromBody] DefinirSenhaDTO dto)
        {
            try
            {
                var docLimpo = LimparDocumento(dto.Documento);

                if (string.IsNullOrWhiteSpace(docLimpo))
                    return BadRequest(new { error = "Documento é obrigatório." });

                if (string.IsNullOrWhiteSpace(dto.Codigo) || dto.Codigo.Length != 6)
                    return BadRequest(new { error = "Código de verificação inválido." });

                if (string.IsNullOrWhiteSpace(dto.Senha) || dto.Senha.Length < 6)
                    return BadRequest(new { error = "A senha deve ter pelo menos 6 caracteres." });

                var credencial = await _context.CredenciaisPortalCliente
                    .Include(c => c.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(c => c.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c => c.Documento == docLimpo && c.Ativo);

                if (credencial == null)
                {
                    return BadRequest(new { error = "Documento não encontrado." });
                }

                // Verificar código
                if (credencial.TokenAcesso != dto.Codigo)
                {
                    return BadRequest(new { error = "Código incorreto. Verifique o código recebido por email." });
                }

                // Verificar expiração
                if (credencial.TokenExpiracao.HasValue && credencial.TokenExpiracao < DateTime.UtcNow)
                {
                    return BadRequest(new { error = "Código expirado. Solicite um novo código." });
                }

                // Hash da senha com BCrypt
                credencial.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
                credencial.PrimeiroAcessoRealizado = true;
                credencial.TokenAcesso = null;
                credencial.TokenExpiracao = null;
                credencial.UltimoAcesso = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var clienteResp = MontarClienteResponse(credencial.Cliente, credencial.Documento);

                _logger.LogInformation("Portal: Senha definida para cliente {Id} ({Doc})",
                    credencial.ClienteId, credencial.Documento);

                return Ok(new
                {
                    success = true,
                    cliente = clienteResp,
                    role = "cliente",
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao definir senha no portal");
                return StatusCode(500, new { error = "Erro interno do servidor." });
            }
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        private static string LimparDocumento(string? documento)
        {
            return documento?.Replace(".", "").Replace("-", "").Replace("/", "").Trim() ?? "";
        }

        private async Task<(Cliente? cliente, string email, string nome)> BuscarClientePorDocumento(string docLimpo)
        {
            Cliente? cliente = null;
            string email = "";
            string nome = "Cliente";

            if (docLimpo.Length == 11)
            {
                cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c =>
                        c.Ativo &&
                        c.PessoaFisica != null &&
                        c.PessoaFisica.Cpf == docLimpo);

                if (cliente?.PessoaFisica != null)
                {
                    nome = cliente.PessoaFisica.Nome ?? "Cliente";
                    email = cliente.PessoaFisica.EmailEmpresarial ?? cliente.PessoaFisica.EmailPessoal ?? "";
                }
            }
            else if (docLimpo.Length == 14)
            {
                cliente = await _context.Clientes
                    .Include(c => c.PessoaFisica)
                    .Include(c => c.PessoaJuridica)
                    .FirstOrDefaultAsync(c =>
                        c.Ativo &&
                        c.PessoaJuridica != null &&
                        c.PessoaJuridica.Cnpj == docLimpo);

                if (cliente?.PessoaJuridica != null)
                {
                    nome = cliente.PessoaJuridica.RazaoSocial ?? cliente.PessoaJuridica.NomeFantasia ?? "Empresa";
                    email = cliente.PessoaJuridica.Email ?? "";
                }
            }

            return (cliente, email, nome);
        }

        private object MontarClienteResponse(Cliente cliente, string documento)
        {
            var tipoDoc = documento.Length == 11 ? "Fisica" : "Juridica";

            if (tipoDoc == "Fisica" && cliente.PessoaFisica != null)
            {
                var pf = cliente.PessoaFisica;
                return new
                {
                    id = cliente.Id,
                    tipoPessoa = "Fisica",
                    nome = pf.Nome ?? "Cliente",
                    documento = FormatarDocumento(documento),
                    email = pf.EmailEmpresarial ?? pf.EmailPessoal ?? "",
                    telefone = pf.Telefone1,
                    pessoaFisica = pf,
                    filialId = cliente.FilialId,
                    dataCadastro = cliente.DataCadastro,
                };
            }
            else if (tipoDoc == "Juridica" && cliente.PessoaJuridica != null)
            {
                var pj = cliente.PessoaJuridica;
                return new
                {
                    id = cliente.Id,
                    tipoPessoa = "Juridica",
                    nome = pj.RazaoSocial ?? pj.NomeFantasia ?? "Empresa",
                    documento = FormatarDocumento(documento),
                    email = pj.Email ?? "",
                    telefone = pj.Telefone1,
                    pessoaJuridica = pj,
                    filialId = cliente.FilialId,
                    dataCadastro = cliente.DataCadastro,
                };
            }

            return new
            {
                id = cliente.Id,
                tipoPessoa = tipoDoc,
                nome = "Cliente",
                documento = FormatarDocumento(documento),
                email = "",
                filialId = cliente.FilialId,
                dataCadastro = cliente.DataCadastro,
            };
        }

        private static string FormatarDocumento(string doc)
        {
            if (doc.Length == 11)
                return $"{doc[..3]}.{doc[3..6]}.{doc[6..9]}-{doc[9..]}";
            if (doc.Length == 14)
                return $"{doc[..2]}.{doc[2..5]}.{doc[5..8]}/{doc[8..12]}-{doc[12..]}";
            return doc;
        }

        private static string MascararEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return "***@***.com";

            var parts = email.Split('@');
            var local = parts[0];
            var domain = parts[1];

            if (local.Length <= 2)
                return $"{local[0]}***@{domain}";

            return $"{local[..2]}***@{domain}";
        }

        private static string MontarEmailCodigo(string nome, string codigo)
        {
            return $@"
<!DOCTYPE html>
<html lang=""pt-BR"">
<head><meta charset=""utf-8""/><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/></head>
<body style=""margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"">
<table role=""presentation"" style=""width:100%;background-color:#0a0a0a;padding:40px 20px;"">
<tr><td align=""center"">
<table role=""presentation"" style=""max-width:480px;width:100%;background-color:#171717;border-radius:16px;border:1px solid #262626;overflow:hidden;"">
<tr><td style=""background:linear-gradient(135deg,#171717,#1a1a1a);padding:40px 32px;text-align:center;border-bottom:1px solid #262626;"">
<div style=""display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:14px;line-height:56px;font-size:24px;margin-bottom:16px;"">&#128274;</div>
<h1 style=""margin:0;font-size:24px;font-weight:600;color:#f59e0b;"">Portal do Cliente</h1>
<p style=""margin:8px 0 0;font-size:13px;color:#737373;"">Arrighi Advogados</p>
</td></tr>
<tr><td style=""padding:32px;"">
<p style=""margin:0 0 8px;font-size:16px;color:#d4d4d4;"">Olá, <strong style=""color:#f5f5f5;"">{nome}</strong></p>
<p style=""margin:0 0 24px;font-size:14px;color:#a3a3a3;line-height:1.6;"">
Use o código abaixo para acessar o Portal do Cliente e criar sua senha:
</p>
<table role=""presentation"" style=""width:100%;""><tr><td align=""center"">
<div style=""display:inline-block;padding:20px 40px;background:linear-gradient(135deg,#1a1a1a,#171717);border:2px solid #f59e0b;border-radius:16px;"">
<span style=""font-size:36px;font-weight:700;color:#f59e0b;letter-spacing:12px;font-family:'Courier New',monospace;"">{codigo}</span>
</div>
</td></tr></table>
<div style=""margin-top:24px;padding:16px;background-color:#1a1a1a;border:1px solid #262626;border-radius:10px;"">
<p style=""margin:0;font-size:12px;color:#737373;line-height:1.5;"">
&#9203; Este código expira em <strong style=""color:#f59e0b;"">30 minutos</strong>.<br/>
Digite-o na página do portal para continuar.<br/>
Se você não solicitou este acesso, ignore este email.
</p></div>
</td></tr>
<tr><td style=""padding:24px 32px;border-top:1px solid #262626;text-align:center;"">
<p style=""margin:0;font-size:11px;color:#525252;"">© {DateTime.UtcNow.Year} Arrighi Advogados. Todos os direitos reservados.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>";
        }
    }
}
