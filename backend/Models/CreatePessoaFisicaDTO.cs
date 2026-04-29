using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreatePessoaFisicaDTO
    {
        [Required(ErrorMessage = "O nome completo é obrigatório")]
        [StringLength(200, ErrorMessage = "O nome completo deve ter no máximo 200 caracteres")]
        public string Nome { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail empresarial é obrigatório")]
        [EmailAddress(ErrorMessage = "E-mail empresarial inválido")]
        [StringLength(150, ErrorMessage = "O e-mail empresarial deve ter no máximo 150 caracteres")]
        public string EmailEmpresarial { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "E-mail pessoal inválido")]
        [StringLength(150, ErrorMessage = "O e-mail pessoal deve ter no máximo 150 caracteres")]
        public string? EmailPessoal { get; set; }

        [StringLength(100, ErrorMessage = "O codinome deve ter no máximo 100 caracteres")]
        public string? Codinome { get; set; }

        public string? Sexo { get; set; }

        [DataType(DataType.Date)]
        public DateTime? DataNascimento { get; set; }

        public string? EstadoCivil { get; set; }

        [Required(ErrorMessage = "O CPF é obrigatório")]
        [StringLength(14, ErrorMessage = "O CPF deve ter 14 caracteres")]
        public string Cpf { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "O RG deve ter no máximo 20 caracteres")]
        public string? Rg { get; set; }

        [StringLength(20, ErrorMessage = "A CNH deve ter no máximo 20 caracteres")]
        public string? Cnh { get; set; }

        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string? Telefone1 { get; set; }

        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string? Telefone2 { get; set; }

        public CreateEnderecoDTO Endereco { get; set; } = new();
    }

    public class CreateEnderecoDTO
    {
        [Required(ErrorMessage = "A cidade é obrigatória")]
        [StringLength(100, ErrorMessage = "A cidade deve ter no máximo 100 caracteres")]
        public string Cidade { get; set; } = string.Empty;

        [StringLength(2, MinimumLength = 2, ErrorMessage = "O estado (UF) deve ter 2 caracteres")]
        public string? Estado { get; set; }

        [Required(ErrorMessage = "O bairro é obrigatório")]
        [StringLength(100, ErrorMessage = "O bairro deve ter no máximo 100 caracteres")]
        public string Bairro { get; set; } = string.Empty;

        [Required(ErrorMessage = "O logradouro é obrigatório")]
        [StringLength(200, ErrorMessage = "O logradouro deve ter no máximo 200 caracteres")]
        public string Logradouro { get; set; } = string.Empty;

        [Required(ErrorMessage = "O CEP é obrigatório")]
        [StringLength(9, ErrorMessage = "O CEP deve ter 9 caracteres")]
        public string Cep { get; set; } = string.Empty;

        [Required(ErrorMessage = "O número é obrigatório")]
        [StringLength(10, ErrorMessage = "O número deve ter no máximo 10 caracteres")]
        public string Numero { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "O complemento deve ter no máximo 100 caracteres")]
        public string? Complemento { get; set; }
    }
}
