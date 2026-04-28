using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class CreateContratoDTO
    {
        [Required(ErrorMessage = "O cliente é obrigatório")]
        public int ClienteId { get; set; }

        [Required(ErrorMessage = "O consultor é obrigatório")]
        public int ConsultorId { get; set; }

        public int? ParceiroId { get; set; }

        [Required(ErrorMessage = "A situação é obrigatória")]
        [StringLength(50, ErrorMessage = "A situação deve ter no máximo 50 caracteres")]
        public string Situacao { get; set; } = "Leed"; // Padrão: Leed

        public DateTime? DataUltimoContato { get; set; }
        public DateTime? DataProximoContato { get; set; }

        public decimal? ValorDevido { get; set; }
        public decimal? ValorNegociado { get; set; }

        [StringLength(1000, ErrorMessage = "As observações devem ter no máximo 1000 caracteres")]
        public string? Observacoes { get; set; }

        // Novos campos adicionados
        [StringLength(100, ErrorMessage = "O número da pasta deve ter no máximo 100 caracteres")]
        public string? NumeroPasta { get; set; }

        public DateTime? DataFechamentoContrato { get; set; }

        [StringLength(200, ErrorMessage = "O tipo de serviço deve ter no máximo 200 caracteres")]
        public string? TipoServico { get; set; }

        public string? ObjetoContrato { get; set; }

        public decimal? Comissao { get; set; }
        public decimal? ValorEntrada { get; set; }
        public decimal? ValorParcela { get; set; }
        public int? NumeroParcelas { get; set; }

        public DateTime? PrimeiroVencimento { get; set; }

        public string? AnexoDocumento { get; set; }
        public string? Pendencias { get; set; }
    }
}
