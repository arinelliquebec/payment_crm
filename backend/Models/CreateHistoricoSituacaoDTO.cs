using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreateHistoricoSituacaoDTO
    {
        [Required(ErrorMessage = "O contrato é obrigatório")]
        public int ContratoId { get; set; }

        [Required(ErrorMessage = "A situação anterior é obrigatória")]
        [StringLength(50, ErrorMessage = "A situação deve ter no máximo 50 caracteres")]
        public string SituacaoAnterior { get; set; } = string.Empty;

        [Required(ErrorMessage = "A nova situação é obrigatória")]
        [StringLength(50, ErrorMessage = "A situação deve ter no máximo 50 caracteres")]
        public string NovaSituacao { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "O motivo da mudança deve ter no máximo 500 caracteres")]
        public string? MotivoMudanca { get; set; }
    }
}
