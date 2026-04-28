using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class PessoaJuridica
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A razão social é obrigatória")]
        [StringLength(200, ErrorMessage = "A razão social deve ter no máximo 200 caracteres")]
        public string RazaoSocial { get; set; } = string.Empty;

        [StringLength(200, ErrorMessage = "O nome fantasia deve ter no máximo 200 caracteres")]
        public string? NomeFantasia { get; set; }

        [Required(ErrorMessage = "O CNPJ é obrigatório")]
        [StringLength(18, ErrorMessage = "O CNPJ deve ter 18 caracteres")]
        public string Cnpj { get; set; } = string.Empty;

        [Required(ErrorMessage = "O responsável técnico é obrigatório")]
        public int ResponsavelTecnicoId { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public PessoaFisica? ResponsavelTecnico { get; set; }

        [Required(ErrorMessage = "O e-mail é obrigatório")]
        [EmailAddress(ErrorMessage = "E-mail inválido")]
        [StringLength(150, ErrorMessage = "O e-mail deve ter no máximo 150 caracteres")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "O telefone principal é obrigatório")]
        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string Telefone1 { get; set; } = string.Empty;

        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string? Telefone2 { get; set; }

        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string? Telefone3 { get; set; }

        [StringLength(15, ErrorMessage = "O telefone deve ter no máximo 15 caracteres")]
        public string? Telefone4 { get; set; }

        // Relacionamento com Endereço
        public int EnderecoId { get; set; }
        public Endereco Endereco { get; set; } = null!;

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
    }
}
