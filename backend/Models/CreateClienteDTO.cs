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
    }
}
