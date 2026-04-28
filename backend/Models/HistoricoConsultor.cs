using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class HistoricoConsultor
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O cliente é obrigatório")]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        [Required(ErrorMessage = "O consultor é obrigatório")]
        public int ConsultorId { get; set; }
        // Relacionamento com Consultor será implementado posteriormente
        // public Consultor Consultor { get; set; } = null!;

        [Required(ErrorMessage = "A data de início é obrigatória")]
        public DateTime DataInicio { get; set; }

        public DateTime? DataFim { get; set; }

        [StringLength(500, ErrorMessage = "O motivo da transferência deve ter no máximo 500 caracteres")]
        public string? MotivoTransferencia { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.Now;
    }
}
