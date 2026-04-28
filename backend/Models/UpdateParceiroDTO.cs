using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class UpdateParceiroDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A filial é obrigatória")]
        public int FilialId { get; set; }

        [StringLength(20, ErrorMessage = "OAB deve ter no máximo 20 caracteres")]
        public string? OAB { get; set; }

        [StringLength(100, ErrorMessage = "Email deve ter no máximo 100 caracteres")]
        [EmailAddress(ErrorMessage = "Email deve ter um formato válido")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "Telefone deve ter no máximo 20 caracteres")]
        public string? Telefone { get; set; }

        // Campos opcionais para evitar validação automática
        public int? PessoaFisicaId { get; set; }
        public PessoaFisica? PessoaFisica { get; set; }
    }
}
