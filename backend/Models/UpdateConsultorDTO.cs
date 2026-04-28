using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class UpdateConsultorDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "A filial é obrigatória")]
        public int FilialId { get; set; }

        [StringLength(20, ErrorMessage = "OAB deve ter no máximo 20 caracteres")]
        public string? OAB { get; set; }

        // Campos opcionais para evitar validação automática
        public int? PessoaFisicaId { get; set; }
        public PessoaFisica? PessoaFisica { get; set; }
    }
}
