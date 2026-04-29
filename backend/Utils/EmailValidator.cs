using System.Text.RegularExpressions;

namespace CrmArrighi.Utils
{
    public static class EmailValidator
    {
        // Regex robusta para validação de e-mail
        private static readonly Regex EmailRegex = new Regex(
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase
        );

        // Domínios temporários/descartáveis conhecidos
        private static readonly HashSet<string> DisposableEmailDomains = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.org",
            "yopmail.com", "temp-mail.org", "throwaway.email", "getnada.com"
        };

        /// <summary>
        /// Valida se o e-mail tem formato válido
        /// </summary>
        public static bool IsValid(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            email = email.Trim().ToLowerInvariant();

            // Verifica formato básico
            if (!EmailRegex.IsMatch(email))
                return false;

            // Verifica comprimento
            if (email.Length > 254)
                return false;

            // Verifica se a parte local não excede 64 caracteres
            string[] parts = email.Split('@');
            if (parts[0].Length > 64)
                return false;

            return true;
        }

        /// <summary>
        /// Verifica se o e-mail é de um domínio temporário/descartável
        /// </summary>
        public static bool IsDisposableEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            string[] parts = email.Split('@');
            if (parts.Length != 2)
                return false;

            string domain = parts[1].ToLowerInvariant();
            return DisposableEmailDomains.Contains(domain);
        }

        /// <summary>
        /// Normaliza o e-mail (trim, lowercase)
        /// </summary>
        public static string Normalize(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return string.Empty;

            return email.Trim().ToLowerInvariant();
        }

        /// <summary>
        /// Verifica se é um e-mail corporativo (não gmail, yahoo, etc.)
        /// </summary>
        public static bool IsCorporateEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            string[] parts = email.Split('@');
            if (parts.Length != 2)
                return false;

            string domain = parts[1].ToLowerInvariant();

            // Domínios pessoais conhecidos
            var personalDomains = new HashSet<string>
            {
                "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
                "bol.com.br", "uol.com.br", "terra.com.br", "ig.com.br",
                "globo.com", "r7.com", "live.com", "msn.com"
            };

            return !personalDomains.Contains(domain);
        }
    }
}
