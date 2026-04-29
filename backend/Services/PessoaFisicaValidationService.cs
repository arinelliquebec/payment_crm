using CrmArrighi.DTOs;
using CrmArrighi.Models;
using CrmArrighi.Utils;

namespace CrmArrighi.Services
{
    public class PessoaFisicaValidationService
    {
        /// <summary>
        /// Valida os dados de uma pessoa física antes da criação
        /// </summary>
        public static ValidationResult ValidateCreatePessoaFisica(CreatePessoaFisicaDTO dto)
        {
            var result = new ValidationResult { IsValid = true };

            // Validações de campos obrigatórios
            ValidateRequiredFields(dto, result);

            // Validações de formato e regras de negócio
            if (result.IsValid || result.FieldErrors.Count == 0)
            {
                ValidateBusinessRules(dto, result);
            }

            result.IsValid = result.Errors.Count == 0 && result.FieldErrors.Count == 0;
            return result;
        }

        private static void ValidateRequiredFields(CreatePessoaFisicaDTO dto, ValidationResult result)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                result.AddFieldError("nome", "Nome é obrigatório");

            if (string.IsNullOrWhiteSpace(dto.EmailEmpresarial))
                result.AddFieldError("emailEmpresarial", "E-mail empresarial é obrigatório");

            if (string.IsNullOrWhiteSpace(dto.Sexo))
                result.AddFieldError("sexo", "Sexo é obrigatório");

            if (!dto.DataNascimento.HasValue || dto.DataNascimento.Value == default)
                result.AddFieldError("dataNascimento", "Data de nascimento é obrigatória");

            // Estado civil é opcional
            // if (string.IsNullOrWhiteSpace(dto.EstadoCivil))
            //     result.AddFieldError("estadoCivil", "Estado civil é obrigatório");

            if (string.IsNullOrWhiteSpace(dto.Cpf))
                result.AddFieldError("cpf", "CPF é obrigatório");

            if (string.IsNullOrWhiteSpace(dto.Telefone1))
                result.AddFieldError("telefone1", "Telefone principal é obrigatório");

            // Validações do endereço
            if (dto.Endereco == null)
            {
                result.AddFieldError("endereco", "Endereço é obrigatório");
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.Endereco.Cidade))
                    result.AddFieldError("endereco.cidade", "Cidade é obrigatória");

                if (string.IsNullOrWhiteSpace(dto.Endereco.Bairro))
                    result.AddFieldError("endereco.bairro", "Bairro é obrigatório");

                if (string.IsNullOrWhiteSpace(dto.Endereco.Logradouro))
                    result.AddFieldError("endereco.logradouro", "Logradouro é obrigatório");

                if (string.IsNullOrWhiteSpace(dto.Endereco.Cep))
                    result.AddFieldError("endereco.cep", "CEP é obrigatório");

                if (string.IsNullOrWhiteSpace(dto.Endereco.Numero))
                    result.AddFieldError("endereco.numero", "Número é obrigatório");
            }
        }

        private static void ValidateBusinessRules(CreatePessoaFisicaDTO dto, ValidationResult result)
        {
            // Validação do nome
            if (!string.IsNullOrWhiteSpace(dto.Nome))
            {
                if (dto.Nome.Trim().Length < 2)
                    result.AddFieldError("nome", "Nome deve ter pelo menos 2 caracteres");

                if (dto.Nome.Trim().Length > 200)
                    result.AddFieldError("nome", "Nome não pode exceder 200 caracteres");

                // ✅ Validar se contém apenas letras (incluindo acentos) e espaços - SEM SÍMBOLOS
                if (!IsValidName(dto.Nome))
                    result.AddFieldError("nome", "Nome deve conter apenas letras e espaços (sem números ou símbolos como parênteses, hífens, etc)");

                // Verifica se tem pelo menos nome e sobrenome
                var nomePartes = dto.Nome.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (nomePartes.Length < 2)
                    result.AddFieldError("nome", "Informe nome e sobrenome");
            }

            // Validação do CPF
            if (!string.IsNullOrWhiteSpace(dto.Cpf))
            {
                if (!CpfValidator.IsValid(dto.Cpf))
                    result.AddFieldError("cpf", "CPF inválido");
            }

            // Validação do e-mail empresarial
            if (!string.IsNullOrWhiteSpace(dto.EmailEmpresarial))
            {
                if (!EmailValidator.IsValid(dto.EmailEmpresarial))
                    result.AddFieldError("emailEmpresarial", "E-mail empresarial inválido");

                if (EmailValidator.IsDisposableEmail(dto.EmailEmpresarial))
                    result.AddFieldError("emailEmpresarial", "E-mails temporários não são permitidos");
            }

            // Validação do e-mail pessoal (opcional)
            if (!string.IsNullOrWhiteSpace(dto.EmailPessoal))
            {
                if (!EmailValidator.IsValid(dto.EmailPessoal))
                    result.AddFieldError("emailPessoal", "E-mail pessoal inválido");
            }

            // Validação da data de nascimento
            if (dto.DataNascimento.HasValue && dto.DataNascimento.Value != default)
            {
                var dataNasc = dto.DataNascimento.Value;

                if (dataNasc > DateTime.Now.Date)
                    result.AddFieldError("dataNascimento", "Data de nascimento não pode ser futura");
            }

            // Validação do sexo
            if (!string.IsNullOrWhiteSpace(dto.Sexo))
            {
                var sexosValidos = new[] { "M", "F", "Masculino", "Feminino" };
                if (!sexosValidos.Contains(dto.Sexo, StringComparer.OrdinalIgnoreCase))
                    result.AddFieldError("sexo", "Sexo deve ser 'M', 'F', 'Masculino' ou 'Feminino'");
            }

            // Validação do estado civil
            if (!string.IsNullOrWhiteSpace(dto.EstadoCivil))
            {
                var estadosCivisValidos = new[] {
                    "Solteiro", "Casado", "Divorciado", "Viúvo", "Separado",
                    "União Estável", "Solteira", "Casada", "Divorciada", "Viúva", "Separada"
                };
                if (!estadosCivisValidos.Contains(dto.EstadoCivil, StringComparer.OrdinalIgnoreCase))
                    result.AddFieldError("estadoCivil", "Estado civil inválido");
            }

            // Validação dos telefones
            if (!string.IsNullOrWhiteSpace(dto.Telefone1))
            {
                if (!PhoneValidator.IsValid(dto.Telefone1))
                    result.AddFieldError("telefone1", "Telefone principal inválido");
            }

            if (!string.IsNullOrWhiteSpace(dto.Telefone2))
            {
                if (!PhoneValidator.IsValid(dto.Telefone2))
                    result.AddFieldError("telefone2", "Telefone secundário inválido");
            }

            // Validação do endereço
            if (dto.Endereco != null)
            {
                if (!string.IsNullOrWhiteSpace(dto.Endereco.Cep))
                {
                    if (!CepValidator.IsValidFormat(dto.Endereco.Cep))
                        result.AddFieldError("endereco.cep", "CEP inválido");
                }

                if (!string.IsNullOrWhiteSpace(dto.Endereco.Numero))
                {
                    if (dto.Endereco.Numero.Length > 10)
                        result.AddFieldError("endereco.numero", "Número não pode exceder 10 caracteres");
                }
            }

            // Validação de campos opcionais com limites
            if (!string.IsNullOrWhiteSpace(dto.Codinome) && dto.Codinome.Length > 100)
                result.AddFieldError("codinome", "Codinome não pode exceder 100 caracteres");

            if (!string.IsNullOrWhiteSpace(dto.Rg) && dto.Rg.Length > 20)
                result.AddFieldError("rg", "RG não pode exceder 20 caracteres");

            if (!string.IsNullOrWhiteSpace(dto.Cnh) && dto.Cnh.Length > 20)
                result.AddFieldError("cnh", "CNH não pode exceder 20 caracteres");
        }

        /// <summary>
        /// Valida se o nome contém apenas letras (incluindo acentos) e espaços - SEM SÍMBOLOS
        /// </summary>
        private static bool IsValidName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return false;

            // Remove espaços para validação
            var nomeSemEspacos = name.Replace(" ", "");
            
            // Verifica se todos os caracteres são letras (incluindo acentuação)
            // Permite: a-z, A-Z, á, é, í, ó, ú, ã, õ, â, ê, ô, ç, etc.
            // Bloqueia: números, parênteses (), hífens -, pontos ., vírgulas, etc.
            foreach (char c in nomeSemEspacos)
            {
                if (!char.IsLetter(c))
                    return false;
            }

            return true;
        }

        /// <summary>
        /// Remove caracteres inválidos do nome, mantendo apenas letras e espaços
        /// </summary>
        private static string SanitizeName(string? name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return string.Empty;

            // Remove caracteres que não são letras ou espaços
            var chars = new List<char>();
            bool lastWasSpace = false;

            foreach (char c in name)
            {
                if (char.IsLetter(c))
                {
                    chars.Add(char.ToUpper(c));
                    lastWasSpace = false;
                }
                else if (char.IsWhiteSpace(c) && !lastWasSpace && chars.Count > 0)
                {
                    chars.Add(' ');
                    lastWasSpace = true;
                }
            }

            // Remove espaço no final se houver
            var result = new string(chars.ToArray()).Trim();
            return result;
        }

        /// <summary>
        /// Sanitiza os dados de entrada
        /// </summary>
        public static void SanitizeData(CreatePessoaFisicaDTO dto)
        {
            // Sanitização de strings
            dto.Nome = SanitizeName(dto.Nome?.Trim()) ?? "";
            dto.Codinome = dto.Codinome?.Trim().ToUpperInvariant();
            dto.EmailEmpresarial = EmailValidator.Normalize(dto.EmailEmpresarial ?? "");
            dto.EmailPessoal = EmailValidator.Normalize(dto.EmailPessoal ?? "");
            dto.Sexo = dto.Sexo?.Trim().ToUpperInvariant();
            dto.EstadoCivil = dto.EstadoCivil?.Trim();
            dto.Rg = dto.Rg?.Trim().ToUpperInvariant();
            dto.Cnh = dto.Cnh?.Trim().ToUpperInvariant();

            // Sanitização e formatação de CPF
            if (!string.IsNullOrWhiteSpace(dto.Cpf))
            {
                dto.Cpf = CpfValidator.Format(dto.Cpf);
            }

            // Sanitização e formatação de telefones
            if (!string.IsNullOrWhiteSpace(dto.Telefone1))
            {
                dto.Telefone1 = PhoneValidator.Format(dto.Telefone1);
            }

            if (!string.IsNullOrWhiteSpace(dto.Telefone2))
            {
                dto.Telefone2 = PhoneValidator.Format(dto.Telefone2);
            }

            // Sanitização do endereço
            if (dto.Endereco != null)
            {
                dto.Endereco.Cidade = dto.Endereco.Cidade?.Trim().ToUpperInvariant() ?? "";
                dto.Endereco.Bairro = dto.Endereco.Bairro?.Trim().ToUpperInvariant() ?? "";
                dto.Endereco.Logradouro = dto.Endereco.Logradouro?.Trim().ToUpperInvariant() ?? "";
                dto.Endereco.Numero = dto.Endereco.Numero?.Trim() ?? "";
                dto.Endereco.Complemento = dto.Endereco.Complemento?.Trim().ToUpperInvariant();

                if (!string.IsNullOrWhiteSpace(dto.Endereco.Cep))
                {
                    dto.Endereco.Cep = CepValidator.Format(dto.Endereco.Cep);
                }
            }
        }
    }
}
