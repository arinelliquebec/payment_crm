using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    /// <summary>
    /// Autenticacao do Portal do Cliente.
    /// Endpoints publicos (sem JWT): login, request-access, validate-token, activate.
    /// Endpoint protegido: invite (requer colaborador/admin).
    /// </summary>
    [ApiController]
    [Route("api/portal/auth")]
    public class PortalAuthController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IPortalTokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PortalAuthController> _logger;

        public PortalAuthController(
            CrmArrighiContext context,
            IPortalTokenService tokenService,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<PortalAuthController> logger)
        {
            _context = context;
            _tokenService = tokenService;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        // ─── POST /api/portal/auth/login ────────────────────────────────────

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] PortalLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Documento))
                return BadRequest(new { error = "Documento é obrigatório" });

            var documentoLimpo = dto.Documento.Replace(".", "").Replace("-", "").Replace("/", "").Trim();

            // Buscar cliente pelo documento
            Cliente? cliente = null;
            string? nome = null;
            string? email = null;
            string tipoPessoa;

            if (documentoLimpo.Length == 11)
            {
                // CPF - Pessoa Fisica
                tipoPessoa = "Fisica";
                var pf = await _context.PessoasFisicas
                    .FirstOrDefaultAsync(p => p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == documentoLimpo);

                if (pf == null)
                    return NotFound(new { error = "Cliente não encontrado. Verifique o documento informado." });

                cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.PessoaFisicaId == pf.Id && c.Ativo);

                nome = pf.Nome;
                email = pf.EmailEmpresarial ?? pf.EmailPessoal;
            }
            else if (documentoLimpo.Length == 14)
            {
                // CNPJ - Pessoa Juridica
                tipoPessoa = "Juridica";
                var pj = await _context.PessoasJuridicas
                    .FirstOrDefaultAsync(p => p.Cnpj.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "") == documentoLimpo);

                if (pj == null)
                    return NotFound(new { error = "Empresa não encontrada. Verifique o CNPJ informado." });

                cliente = await _context.Clientes
                    .FirstOrDefaultAsync(c => c.PessoaJuridicaId == pj.Id && c.Ativo);

                nome = pj.RazaoSocial;
                email = pj.Email;
            }
            else
            {
                return BadRequest(new { error = "Documento inválido. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)." });
            }

            if (cliente == null)
                return NotFound(new { error = "Cliente não encontrado no sistema." });

            // Verificar credencial do portal
            var credencial = await _context.CredenciaisPortalCliente
                .FirstOrDefaultAsync(c => c.ClienteId == cliente.Id && c.Ativo);

            if (credencial == null)
                return Unauthorized(new { error = "Conta do portal não ativada. Solicite um convite para criar sua conta." });

            // Validar senha (se fornecida — CNPJ exige senha)
            if (!string.IsNullOrEmpty(dto.Senha))
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Senha, credencial.SenhaHash))
                    return Unauthorized(new { error = "Senha incorreta" });
            }
            else if (tipoPessoa == "Juridica")
            {
                return BadRequest(new { error = "Senha é obrigatória" });
            }

            // Gerar JWT
            var token = GenerateJwt(cliente.Id, credencial.Role);

            _logger.LogInformation("Login portal: Cliente {ClienteId}, Role {Role}", cliente.Id, credencial.Role);

            return Ok(new
            {
                success = true,
                token,
                role = credencial.Role,
                cliente = new
                {
                    id = cliente.Id,
                    tipoPessoa,
                    nome,
                    documento = dto.Documento,
                    email,
                    status = cliente.Status,
                    filialId = cliente.FilialId,
                    dataCadastro = cliente.DataCadastro,
                }
            });
        }

        // ─── POST /api/portal/auth/request-access ───────────────────────────

        [HttpPost("request-access")]
        public async Task<IActionResult> RequestAccess([FromBody] RequestAccessDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Documento))
                return BadRequest(new { error = "CPF ou CNPJ é obrigatório" });

            var documentoLimpo = dto.Documento.Replace(".", "").Replace("-", "").Replace("/", "").Trim();

            // Buscar cliente pelo documento
            int? clienteId = null;
            string? email = null;
            string? nome = null;

            if (documentoLimpo.Length == 11)
            {
                var pf = await _context.PessoasFisicas
                    .FirstOrDefaultAsync(p => p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == documentoLimpo);
                if (pf != null)
                {
                    var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.PessoaFisicaId == pf.Id && c.Ativo);
                    clienteId = cliente?.Id;
                    email = pf.EmailEmpresarial ?? pf.EmailPessoal;
                    nome = pf.Nome;
                }
            }
            else if (documentoLimpo.Length == 14)
            {
                var pj = await _context.PessoasJuridicas
                    .FirstOrDefaultAsync(p => p.Cnpj.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "") == documentoLimpo);
                if (pj != null)
                {
                    var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.PessoaJuridicaId == pj.Id && c.Ativo);
                    clienteId = cliente?.Id;
                    email = pj.Email;
                    nome = pj.RazaoSocial;
                }
            }
            else
            {
                return BadRequest(new { error = "Documento inválido. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)." });
            }

            if (clienteId == null || string.IsNullOrWhiteSpace(email))
                return NotFound(new { error = "Cliente não encontrado. Verifique o documento informado." });

            // Gerar token e enviar email
            var tokenPlain = await _tokenService.GenerateInviteTokenAsync(clienteId.Value, email);

            var portalUrl = _configuration["Portal:BaseUrl"] ?? "https://www.portal.arrighicrm.com";
            var activationLink = $"{portalUrl}/ativar?token={tokenPlain}";

            // Enviar email usando EmailService existente
            var emailSubject = "Ativar conta - Portal do Cliente Arrighi";
            var emailBody = BuildActivationEmailHtml(nome ?? "Cliente", activationLink);
            await _emailService.SendEmail(email, emailSubject, emailBody);

            _logger.LogInformation("Convite de acesso enviado para cliente {ClienteId}", clienteId);

            return Ok(new
            {
                success = true,
                emailMascarado = _tokenService.MaskEmail(email),
            });
        }

        // ─── GET /api/portal/auth/validate-token ────────────────────────────

        [HttpGet("validate-token")]
        public async Task<IActionResult> ValidateToken([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return BadRequest(new { valid = false, error = "Token é obrigatório" });

            var convite = await _tokenService.ValidateTokenAsync(token);

            if (convite == null)
                return Ok(new { valid = false, error = "Token inválido ou expirado" });

            var cliente = convite.Cliente;
            var nome = cliente.PessoaFisica?.Nome ?? cliente.PessoaJuridica?.RazaoSocial ?? "Cliente";
            var documento = cliente.PessoaFisica?.Cpf ?? cliente.PessoaJuridica?.Cnpj ?? "";

            return Ok(new
            {
                valid = true,
                nome,
                documento,
                email = convite.Email,
            });
        }

        // ─── POST /api/portal/auth/activate ─────────────────────────────────

        [HttpPost("activate")]
        public async Task<IActionResult> Activate([FromBody] ActivateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { error = "Token é obrigatório" });

            if (string.IsNullOrWhiteSpace(dto.Senha) || dto.Senha.Length < 6)
                return BadRequest(new { error = "A senha deve ter pelo menos 6 caracteres" });

            var convite = await _tokenService.ValidateTokenAsync(dto.Token);
            if (convite == null)
                return BadRequest(new { error = "Token inválido ou expirado" });

            // Verificar se ja tem credencial
            var existente = await _context.CredenciaisPortalCliente
                .FirstOrDefaultAsync(c => c.ClienteId == convite.ClienteId);

            if (existente != null)
            {
                // Atualizar senha (caso de "esqueci a senha")
                existente.SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha);
                existente.DataAtualizacao = DateTime.UtcNow;
                existente.Ativo = true;
            }
            else
            {
                // Criar nova credencial
                var credencial = new CredencialPortalCliente
                {
                    ClienteId = convite.ClienteId,
                    SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                    Role = "cliente",
                    Ativo = true,
                    DataCadastro = DateTime.UtcNow,
                };
                _context.CredenciaisPortalCliente.Add(credencial);
            }

            // Invalidar token
            await _tokenService.InvalidateTokenAsync(dto.Token);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Conta do portal ativada para cliente {ClienteId}", convite.ClienteId);

            return Created("", new { success = true, message = "Conta ativada com sucesso" });
        }

        // ─── POST /api/portal/auth/invite ───────────────────────────────────

        [HttpPost("invite")]
        public async Task<IActionResult> Invite([FromBody] InviteDto dto)
        {
            // Verificar autenticacao (JWT)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(roleClaim) || (roleClaim != "colaborador" && roleClaim != "admin"))
                return StatusCode(403, new { error = "Sem permissão para enviar convites" });

            if (dto.ClienteId <= 0 || string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { error = "clienteId e email são obrigatórios" });

            // Verificar se cliente existe
            var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
            if (cliente == null)
                return NotFound(new { error = "Cliente não encontrado" });

            int? criadoPorId = int.TryParse(userIdClaim, out var uid) ? uid : null;

            // Gerar token e enviar email
            var tokenPlain = await _tokenService.GenerateInviteTokenAsync(dto.ClienteId, dto.Email, criadoPorId);

            var portalUrl = _configuration["Portal:BaseUrl"] ?? "https://www.portal.arrighicrm.com";
            var activationLink = $"{portalUrl}/ativar?token={tokenPlain}";

            var emailBody = BuildActivationEmailHtml("Cliente", activationLink);
            await _emailService.SendEmail(dto.Email, "Convite - Portal do Cliente Arrighi", emailBody);

            _logger.LogInformation("Convite enviado por usuario {UserId} para cliente {ClienteId}",
                userIdClaim, dto.ClienteId);

            return Created("", new { success = true, message = "Convite enviado com sucesso" });
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        private string GenerateJwt(int clienteId, string role)
        {
            var key = _configuration["Jwt:Key"] ?? "arrighi-portal-jwt-secret-key-2026-min-32-chars!";
            var issuer = _configuration["Jwt:Issuer"] ?? "arrighi-crm";
            var audience = _configuration["Jwt:Audience"] ?? "arrighi-portal";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, clienteId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim("portal", "true"),
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string BuildActivationEmailHtml(string nome, string link)
        {
            return $@"
<!DOCTYPE html>
<html lang='pt-BR'>
<head><meta charset='UTF-8'></head>
<body style='font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f7fa; padding: 20px;'>
  <div style='max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;'>
    <div style='background: linear-gradient(135deg, #1e3a5f, #2c5282); padding: 32px; text-align: center;'>
      <h1 style='color: #fff; font-size: 24px; margin: 0;'>Portal do Cliente</h1>
      <p style='color: #bfdbfe; font-size: 14px; margin-top: 8px;'>Arrighi Advogados</p>
    </div>
    <div style='padding: 32px;'>
      <p style='font-size: 18px; color: #1e3a5f; font-weight: 600;'>Olá, {nome}!</p>
      <p style='color: #374151; font-size: 15px; margin: 16px 0;'>
        Você foi convidado(a) a criar sua conta no Portal do Cliente da Arrighi Advogados.
        Clique no botão abaixo para definir sua senha e ativar o acesso.
      </p>
      <div style='text-align: center; margin: 32px 0;'>
        <a href='{link}' style='display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #1a1a1a; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;'>
          Ativar Minha Conta
        </a>
      </div>
      <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 6px 6px 0; margin: 24px 0;'>
        <p style='color: #92400e; font-size: 14px; margin: 0;'><strong>Importante:</strong> Este link expira em 1 hora.</p>
      </div>
      <div style='background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px; color: #2563eb; text-align: center;'>
        {link}
      </div>
      <p style='color: #6b7280; font-size: 13px;'>Se você não solicitou este acesso, ignore este email.</p>
    </div>
    <div style='text-align: center; padding: 24px; background: #1e3a5f; font-size: 12px; color: #bfdbfe;'>
      <p style='margin: 0;'>© 2026 Arrighi Advogados</p>
    </div>
  </div>
</body>
</html>";
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────

    public class PortalLoginDto
    {
        public string Documento { get; set; } = string.Empty;
        public string? TipoDocumento { get; set; }
        public string? Senha { get; set; }
    }

    public class RequestAccessDto
    {
        public string Documento { get; set; } = string.Empty;
    }

    public class ActivateDto
    {
        public string Token { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }

    public class InviteDto
    {
        public int ClienteId { get; set; }
        public string Email { get; set; } = string.Empty;
    }
}
