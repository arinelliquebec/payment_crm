using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class AtribuirClienteDTO
    {
        [Required(ErrorMessage = "O ID do consultor é obrigatório")]
        public int ConsultorId { get; set; }

        [Required(ErrorMessage = "O ID do cliente é obrigatório")]
        public int ClienteId { get; set; }

        [StringLength(500, ErrorMessage = "O motivo da atribuição deve ter no máximo 500 caracteres")]
        public string? MotivoAtribuicao { get; set; }
    }
}
