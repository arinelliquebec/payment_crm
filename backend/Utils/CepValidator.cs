using System.Text.RegularExpressions;
using System.Text.Json;

namespace CrmArrighi.Utils
{
    public static class CepValidator
    {
        private static readonly Regex CepRegex = new Regex(@"^\d{5}-?\d{3}$");
        private static readonly HttpClient HttpClient = new HttpClient();

        /// <summary>
        /// Valida se o CEP tem formato válido
        /// </summary>
        public static bool IsValidFormat(string cep)
        {
            if (string.IsNullOrWhiteSpace(cep))
                return false;

            return CepRegex.IsMatch(cep);
        }

        /// <summary>
        /// Formata o CEP para o padrão XXXXX-XXX
        /// </summary>
        public static string Format(string cep)
        {
            if (string.IsNullOrWhiteSpace(cep))
                return string.Empty;

            string cleanCep = Clean(cep);

            if (cleanCep.Length != 8)
                return cep;

            return $"{cleanCep.Substring(0, 5)}-{cleanCep.Substring(5, 3)}";
        }

        /// <summary>
        /// Remove a formatação do CEP, deixando apenas números
        /// </summary>
        public static string Clean(string cep)
        {
            if (string.IsNullOrWhiteSpace(cep))
                return string.Empty;

            return Regex.Replace(cep, @"[^\d]", "");
        }

        /// <summary>
        /// Consulta o CEP na API do ViaCEP
        /// </summary>
        public static async Task<CepInfo?> GetCepInfoAsync(string cep)
        {
            try
            {
                if (!IsValidFormat(cep))
                    return null;

                string cleanCep = Clean(cep);
                string url = $"https://viacep.com.br/ws/{cleanCep}/json/";

                var response = await HttpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                    return null;

                var json = await response.Content.ReadAsStringAsync();
                var cepData = JsonSerializer.Deserialize<ViaCepResponse>(json);

                if (cepData?.erro == true)
                    return null;

                return new CepInfo
                {
                    Cep = Format(cepData?.cep ?? ""),
                    Logradouro = cepData?.logradouro ?? "",
                    Bairro = cepData?.bairro ?? "",
                    Cidade = cepData?.localidade ?? "",
                    Uf = cepData?.uf ?? "",
                    Complemento = cepData?.complemento ?? ""
                };
            }
            catch
            {
                return null;
            }
        }
    }

    public class CepInfo
    {
        public string Cep { get; set; } = "";
        public string Logradouro { get; set; } = "";
        public string Bairro { get; set; } = "";
        public string Cidade { get; set; } = "";
        public string Uf { get; set; } = "";
        public string Complemento { get; set; } = "";
    }

    internal class ViaCepResponse
    {
        public string? cep { get; set; }
        public string? logradouro { get; set; }
        public string? complemento { get; set; }
        public string? bairro { get; set; }
        public string? localidade { get; set; }
        public string? uf { get; set; }
        public bool erro { get; set; }
    }
}
