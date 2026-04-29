using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class PessoaFisica
    {
        public int Id { get; set; }

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

        // Relacionamento com Endereço
        public int? EnderecoId { get; set; }
        public Endereco? Endereco { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
    }
}
