using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreateClienteDTO
    {
        [Required(ErrorMessage = "O tipo de pessoa é obrigatório")]
        public string TipoPessoa { get; set; } = string.Empty; // "Fisica" ou "Juridica"

        [Required(ErrorMessage = "O ID da pessoa é obrigatório")]
        public int PessoaId { get; set; }

        public int? FilialId { get; set; }

        [StringLength(100, ErrorMessage = "O status deve ter no máximo 100 caracteres")]
        public string? Status { get; set; }

        public string? Observacoes { get; set; }

        [StringLength(255, ErrorMessage = "O email alternativo deve ter no máximo 255 caracteres")]
        [EmailAddress(ErrorMessage = "O email alternativo deve ser um endereço de email válido")]
        public string? EmailAlternativo { get; set; }

        // Dados da Pessoa Física (para atualização)
        public string? Nome { get; set; }
        public string? Cpf { get; set; }
        public string? EmailEmpresarial { get; set; }
        public string? EmailPessoal { get; set; }
        public string? Telefone1 { get; set; }
        public string? Telefone2 { get; set; }
        public DateTime? DataNascimento { get; set; }
        public string? EstadoCivil { get; set; }
        public string? Sexo { get; set; }

        // Dados da Pessoa Jurídica (para atualização)
        public string? RazaoSocial { get; set; }
        public string? NomeFantasia { get; set; }
        public string? Cnpj { get; set; }
        public string? Email { get; set; }
        public string? Telefone3 { get; set; }
        public string? Telefone4 { get; set; }

        // Dados de Endereço (para atualização)
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? Cep { get; set; }
    }
}
