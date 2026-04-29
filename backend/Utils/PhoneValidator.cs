using System.Text.RegularExpressions;

namespace CrmArrighi.Utils
{
    public static class PhoneValidator
    {
        // Regex para telefones brasileiros (celular e fixo)
        private static readonly Regex CelularRegex = new Regex(@"^\(?(\d{2})\)?\s?9\d{4}-?\d{4}$");
        private static readonly Regex FixoRegex = new Regex(@"^\(?(\d{2})\)?\s?[2-5]\d{3}-?\d{4}$");

        /// <summary>
        /// Valida se o telefone brasileiro é válido
        /// </summary>
        public static bool IsValid(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return false;

            // Remove formatação
            string cleanPhone = Clean(phone);

            // Verifica se tem 10 ou 11 dígitos
            if (cleanPhone.Length != 10 && cleanPhone.Length != 11)
                return false;

            // Se tem 11 dígitos, deve ser celular (9 como terceiro dígito)
            if (cleanPhone.Length == 11)
            {
                return CelularRegex.IsMatch(phone);
            }

            // Se tem 10 dígitos, deve ser fixo
            return FixoRegex.IsMatch(phone);
        }

        /// <summary>
        /// Formata o telefone para o padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        /// </summary>
        public static string Format(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;

            string cleanPhone = Clean(phone);

            if (cleanPhone.Length == 11)
            {
                // Celular: (XX) 9XXXX-XXXX
                return $"({cleanPhone.Substring(0, 2)}) {cleanPhone.Substring(2, 5)}-{cleanPhone.Substring(7, 4)}";
            }
            else if (cleanPhone.Length == 10)
            {
                // Fixo: (XX) XXXX-XXXX
                return $"({cleanPhone.Substring(0, 2)}) {cleanPhone.Substring(2, 4)}-{cleanPhone.Substring(6, 4)}";
            }

            return phone;
        }

        /// <summary>
        /// Remove a formatação do telefone, deixando apenas números
        /// </summary>
        public static string Clean(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return string.Empty;

            return Regex.Replace(phone, @"[^\d]", "");
        }

        /// <summary>
        /// Verifica se é um telefone celular
        /// </summary>
        public static bool IsCelular(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone))
                return false;

            string cleanPhone = Clean(phone);
            return cleanPhone.Length == 11 && cleanPhone[2] == '9';
        }
    }
}
