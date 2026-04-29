using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface IPortalTokenService
    {
        /// <summary>
        /// Gera token de convite, salva hash no banco e retorna o token plain (para enviar por email).
        /// </summary>
        Task<string> GenerateInviteTokenAsync(int clienteId, string email, int? criadoPorId = null);

        /// <summary>
        /// Valida token: existe, nao expirado, nao usado. Retorna o convite ou null.
        /// </summary>
        Task<ConvitePortal?> ValidateTokenAsync(string tokenPlain);

        /// <summary>
        /// Marca token como usado (apos ativacao de conta).
        /// </summary>
        Task InvalidateTokenAsync(string tokenPlain);

        /// <summary>
        /// Mascara email para exibicao (ex: c****o@emp****.com.br)
        /// </summary>
        string MaskEmail(string email);

        /// <summary>
        /// Hash SHA-256 do token.
        /// </summary>
        string HashToken(string token);
    }
}
