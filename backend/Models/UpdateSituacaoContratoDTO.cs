using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class UpdateSituacaoContratoDTO
    {
        [Required(ErrorMessage = "A nova situação é obrigatória")]
        [StringLength(50, ErrorMessage = "A situação deve ter no máximo 50 caracteres")]
        public string NovaSituacao { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "O motivo da mudança deve ter no máximo 500 caracteres")]
        public string? MotivoMudanca { get; set; }
        
        public DateTime? DataUltimoContato { get; set; }
        public DateTime? DataProximoContato { get; set; }
        
        public decimal? ValorDevido { get; set; }
        public decimal? ValorNegociado { get; set; }
        
        [StringLength(1000, ErrorMessage = "As observações devem ter no máximo 1000 caracteres")]
        public string? Observacoes { get; set; }
    }
}
