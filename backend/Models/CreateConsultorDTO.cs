using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreateConsultorDTO
    {
        [Required(ErrorMessage = "A pessoa física é obrigatória")]
        public int PessoaFisicaId { get; set; }

        [Required(ErrorMessage = "A filial é obrigatória")]
        public int FilialId { get; set; }

        [StringLength(20, ErrorMessage = "OAB deve ter no máximo 20 caracteres")]
        public string? OAB { get; set; }
    }
}
