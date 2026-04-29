using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public class PortalTokenService : IPortalTokenService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<PortalTokenService> _logger;

        public PortalTokenService(CrmArrighiContext context, ILogger<PortalTokenService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GenerateInviteTokenAsync(int clienteId, string email, int? criadoPorId = null)
        {
            // Gerar token unico: UUID + 16 bytes hex aleatorios
            var tokenPlain = Guid.NewGuid().ToString("N") + RandomHex(16);
            var tokenHash = HashToken(tokenPlain);

            var convite = new ConvitePortal
            {
                TokenHash = tokenHash,
                ClienteId = clienteId,
                Email = email,
                CriadoPorId = criadoPorId,
                CriadoEm = DateTime.UtcNow,
                ExpiraEm = DateTime.UtcNow.AddHours(1),
                Usado = false,
            };

            _context.ConvitesPortal.Add(convite);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Token de convite gerado para cliente {ClienteId}, email {Email}",
                clienteId, MaskEmail(email));

            return tokenPlain;
        }

        public async Task<ConvitePortal?> ValidateTokenAsync(string tokenPlain)
        {
            var tokenHash = HashToken(tokenPlain);

            var convite = await _context.ConvitesPortal
                .Include(c => c.Cliente)
                    .ThenInclude(c => c.PessoaFisica)
                .Include(c => c.Cliente)
                    .ThenInclude(c => c.PessoaJuridica)
                .FirstOrDefaultAsync(c => c.TokenHash == tokenHash);

            if (convite == null)
            {
                _logger.LogWarning("Token de convite nao encontrado");
                return null;
            }

            if (convite.Usado)
            {
                _logger.LogWarning("Token de convite ja foi usado (ID: {Id})", convite.Id);
                return null;
            }

            if (convite.ExpiraEm < DateTime.UtcNow)
            {
                _logger.LogWarning("Token de convite expirado (ID: {Id}, ExpiraEm: {ExpiraEm})",
                    convite.Id, convite.ExpiraEm);
                return null;
            }

            return convite;
        }

        public async Task InvalidateTokenAsync(string tokenPlain)
        {
            var tokenHash = HashToken(tokenPlain);

            var convite = await _context.ConvitesPortal
                .FirstOrDefaultAsync(c => c.TokenHash == tokenHash);

            if (convite != null)
            {
                convite.Usado = true;
                convite.UsadoEm = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Token de convite invalidado (ID: {Id})", convite.Id);
            }
        }

        public string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return "***@***.***";

            var parts = email.Split('@');
            var local = parts[0];
            var domain = parts[1];

            var maskedLocal = local.Length <= 2
                ? local[0] + "****"
                : local[0] + new string('*', Math.Min(local.Length - 2, 4)) + local[^1];

            var domainParts = domain.Split('.');
            var maskedDomain = domainParts[0].Length <= 2
                ? domainParts[0][0] + "****"
                : domainParts[0][0] + new string('*', Math.Min(domainParts[0].Length - 2, 4)) + domainParts[0][^1];

            var tld = string.Join(".", domainParts.Skip(1));

            return $"{maskedLocal}@{maskedDomain}.{tld}";
        }

        public string HashToken(string token)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexStringLower(bytes);
        }

        private static string RandomHex(int bytes)
        {
            var buffer = RandomNumberGenerator.GetBytes(bytes);
            return Convert.ToHexStringLower(buffer);
        }
    }
}
