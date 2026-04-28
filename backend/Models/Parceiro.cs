using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class Parceiro
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A pessoa física é obrigatória")]
        public int PessoaFisicaId { get; set; }
        public PessoaFisica PessoaFisica { get; set; } = null!;

        [Required(ErrorMessage = "A filial é obrigatória")]
        public int FilialId { get; set; }
        public Filial Filial { get; set; } = null!;

        [StringLength(20, ErrorMessage = "OAB deve ter no máximo 20 caracteres")]
        public string? OAB { get; set; }

        [StringLength(100, ErrorMessage = "Email deve ter no máximo 100 caracteres")]
        [EmailAddress(ErrorMessage = "Email deve ter um formato válido")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "Telefone deve ter no máximo 20 caracteres")]
        public string? Telefone { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
