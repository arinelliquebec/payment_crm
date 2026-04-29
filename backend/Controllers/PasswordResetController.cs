using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using System.Security.Cryptography;
using System.Text;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PasswordResetController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<PasswordResetController> _logger;
        private readonly IConfiguration _configuration;

        public PasswordResetController(
            CrmArrighiContext context,
            IEmailService emailService,
            ILogger<PasswordResetController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Obtém a URL do frontend baseada na configuração ou no request HTTP
        /// </summary>
        private string GetFrontendUrl()
        {
            // 1. Tentar obter da configuração
            var configUrl = _configuration["Frontend:Url"];
            if (!string.IsNullOrEmpty(configUrl) && !configUrl.Contains("localhost"))
            {
                _logger.LogInformation("🌐 URL do frontend obtida da configuração: {Url}", configUrl);
                return configUrl;
            }

            // 2. Tentar obter do header Origin do request
            if (Request.Headers.TryGetValue("Origin", out var origin) && !string.IsNullOrEmpty(origin.ToString()))
            {
                var originUrl = origin.ToString();
                if (!originUrl.Contains("localhost"))
                {
                    _logger.LogInformation("🌐 URL do frontend obtida do Origin header: {Url}", originUrl);
                    return originUrl;
                }
            }

            // 3. Tentar obter do header Referer
            if (Request.Headers.TryGetValue("Referer", out var referer) && !string.IsNullOrEmpty(referer.ToString()))
            {
                var refererUrl = referer.ToString();
                var uri = new Uri(refererUrl);
                var baseUrl = $"{uri.Scheme}://{uri.Host}{(uri.Port != 80 && uri.Port != 443 ? $":{uri.Port}" : "")}";

                if (!baseUrl.Contains("localhost"))
                {
                    _logger.LogInformation("🌐 URL do frontend obtida do Referer header: {Url}", baseUrl);
                    return baseUrl;
                }
            }

            // 4. Fallback para localhost (desenvolvimento)
            _logger.LogWarning("⚠️ Usando URL localhost (desenvolvimento). Configure Frontend:Url no appsettings.Production.json para produção!");
            return configUrl ?? "http://localhost:3000";
        }

        // POST: api/PasswordReset/request
        [HttpPost("request")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDTO request)
        {
            try
            {
                _logger.LogInformation("📧 Solicitação de reset de senha para: {Email}", request.Email);

                // Buscar usuário pelo email
                var usuario = await _context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .FirstOrDefaultAsync(u => u.Email == request.Email && u.Ativo);

                if (usuario == null)
                {
                    _logger.LogWarning("⚠️ Usuário não encontrado ou inativo: {Email}", request.Email);
                    // Por segurança, retornar sucesso mesmo que usuário não exista
                    return Ok(new { message = "Se o email existir em nossa base, você receberá instruções para resetar sua senha." });
                }

                // Gerar token único
                var token = GenerateSecureToken();

                // Criar registro de password reset
                var passwordReset = new PasswordReset
                {
                    UsuarioId = usuario.Id,
                    Token = token,
                    DataExpiracao = DateTime.UtcNow.AddHours(24), // Expira em 24 horas
                    Utilizado = false
                };

                _context.PasswordResets.Add(passwordReset);
                await _context.SaveChangesAsync();

                // Gerar link de reset usando URL inteligente
                var frontendUrl = GetFrontendUrl();
                var resetLink = $"{frontendUrl}/reset-senha?token={token}";

                _logger.LogInformation("🔗 Link de reset gerado: {Link}", resetLink);

                // Obter nome do usuário
                var userName = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? usuario.Login;

                // Enviar email
                var emailEnviado = await _emailService.SendPasswordResetEmail(usuario.Email, userName, resetLink);

                if (!emailEnviado)
                {
                    _logger.LogWarning("⚠️ Falha ao enviar email, mas token foi criado: {Token}", token);
                }

                _logger.LogInformation("✅ Token de reset criado para usuário: {UserId}, Token: {Token}", usuario.Id, token);

                return Ok(new { message = "Se o email existir em nossa base, você receberá instruções para resetar sua senha." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar solicitação de reset de senha");
                return StatusCode(500, new { message = "Erro ao processar solicitação" });
            }
        }

        // POST: api/PasswordReset/reset
        [HttpPost("reset")]
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDTO resetDTO)
        {
            try
            {
                _logger.LogInformation("🔐 Tentativa de reset de senha com token");

                // Buscar token válido
                var passwordReset = await _context.PasswordResets
                    .Include(pr => pr.Usuario)
                    .FirstOrDefaultAsync(pr => pr.Token == resetDTO.Token);

                if (passwordReset == null)
                {
                    _logger.LogWarning("⚠️ Token não encontrado");
                    return BadRequest(new { message = "Token inválido ou expirado" });
                }

                // Verificar se já foi utilizado
                if (passwordReset.Utilizado)
                {
                    _logger.LogWarning("⚠️ Token já utilizado: {Token}", resetDTO.Token);
                    return BadRequest(new { message = "Este link de reset já foi utilizado" });
                }

                // Verificar se expirou
                if (DateTime.UtcNow > passwordReset.DataExpiracao)
                {
                    _logger.LogWarning("⚠️ Token expirado: {Token}, Expiração: {Expiracao}, Agora: {Agora}",
                        resetDTO.Token, passwordReset.DataExpiracao, DateTime.UtcNow);
                    return BadRequest(new { message = "Este link de reset expirou. Solicite um novo" });
                }

                // Atualizar senha do usuário
                passwordReset.Usuario.Senha = resetDTO.NovaSenha;
                passwordReset.Utilizado = true;
                passwordReset.DataUtilizacao = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Senha resetada com sucesso para usuário: {UserId}", passwordReset.UsuarioId);

                return Ok(new { message = "Senha alterada com sucesso!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao resetar senha");
                return StatusCode(500, new { message = "Erro ao processar reset de senha" });
            }
        }

        // POST: api/PasswordReset/admin-reset/{usuarioId}
        [HttpPost("admin-reset/{usuarioId}")]
        public async Task<IActionResult> AdminResetPassword(int usuarioId)
        {
            try
            {
                _logger.LogInformation("🔑 Admin solicitou reset de senha para usuário: {UserId}", usuarioId);

                var usuario = await _context.Usuarios
                    .Include(u => u.PessoaFisica)
                    .Include(u => u.PessoaJuridica)
                    .FirstOrDefaultAsync(u => u.Id == usuarioId);

                if (usuario == null)
                {
                    return NotFound(new { message = "Usuário não encontrado" });
                }

                if (!usuario.Ativo)
                {
                    return BadRequest(new { message = "Usuário inativo" });
                }

                // Gerar token único
                var token = GenerateSecureToken();

                // Criar registro de password reset
                var passwordReset = new PasswordReset
                {
                    UsuarioId = usuario.Id,
                    Token = token,
                    DataExpiracao = DateTime.UtcNow.AddHours(24), // Expira em 24 horas
                    Utilizado = false
                };

                _context.PasswordResets.Add(passwordReset);
                await _context.SaveChangesAsync();

                // Gerar link de reset usando URL inteligente
                var frontendUrl = GetFrontendUrl();
                var resetLink = $"{frontendUrl}/reset-senha?token={token}";

                _logger.LogInformation("🔗 Link de reset gerado: {Link}", resetLink);

                // Obter nome do usuário
                var userName = usuario.PessoaFisica?.Nome ?? usuario.PessoaJuridica?.RazaoSocial ?? usuario.Login;

                // Enviar email
                await _emailService.SendPasswordResetEmail(usuario.Email, userName, resetLink);

                _logger.LogInformation("✅ Email de reset enviado para: {Email}", usuario.Email);

                return Ok(new {
                    message = $"Email de reset de senha enviado para {usuario.Email}",
                    resetLink = resetLink // Em desenvolvimento, retornar o link
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao processar reset de senha pelo admin");
                return StatusCode(500, new { message = "Erro ao processar solicitação" });
            }
        }

        private string GenerateSecureToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }

    // DTOs
    public class PasswordResetRequestDTO
    {
        public string Email { get; set; } = string.Empty;
    }

    public class PasswordResetDTO
    {
        public string Token { get; set; } = string.Empty;
        public string NovaSenha { get; set; } = string.Empty;
    }
}

