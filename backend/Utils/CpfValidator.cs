using System.Text.RegularExpressions;

namespace CrmArrighi.Utils
{
    public static class CpfValidator
    {
        /// <summary>
        /// Valida se o CPF é válido usando o algoritmo dos dígitos verificadores
        /// </summary>
        public static bool IsValid(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return false;

            // Remove formatação
            cpf = Regex.Replace(cpf, @"[^\d]", "");

            // Verifica se tem 11 dígitos
            if (cpf.Length != 11)
                return false;

            // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
            if (cpf.All(c => c == cpf[0]))
                return false;

            // Calcula o primeiro dígito verificador
            int soma = 0;
            for (int i = 0; i < 9; i++)
            {
                soma += int.Parse(cpf[i].ToString()) * (10 - i);
            }
            int primeiroDigito = soma % 11;
            primeiroDigito = primeiroDigito < 2 ? 0 : 11 - primeiroDigito;

            // Verifica o primeiro dígito
            if (int.Parse(cpf[9].ToString()) != primeiroDigito)
                return false;

            // Calcula o segundo dígito verificador
            soma = 0;
            for (int i = 0; i < 10; i++)
            {
                soma += int.Parse(cpf[i].ToString()) * (11 - i);
            }
            int segundoDigito = soma % 11;
            segundoDigito = segundoDigito < 2 ? 0 : 11 - segundoDigito;

            // Verifica o segundo dígito
            return int.Parse(cpf[10].ToString()) == segundoDigito;
        }

        /// <summary>
        /// Formata o CPF para o padrão XXX.XXX.XXX-XX
        /// </summary>
        public static string Format(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return string.Empty;

            cpf = Regex.Replace(cpf, @"[^\d]", "");

            if (cpf.Length != 11)
                return cpf;

            return $"{cpf.Substring(0, 3)}.{cpf.Substring(3, 3)}.{cpf.Substring(6, 3)}-{cpf.Substring(9, 2)}";
        }

        /// <summary>
        /// Remove a formatação do CPF, deixando apenas números
        /// </summary>
        public static string Clean(string cpf)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                return string.Empty;

            return Regex.Replace(cpf, @"[^\d]", "");
        }
    }
}
