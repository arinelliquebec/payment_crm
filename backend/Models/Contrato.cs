using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    public class Contrato
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O cliente é obrigatório")]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        [Required(ErrorMessage = "O consultor é obrigatório")]
        public int ConsultorId { get; set; }
        public Consultor Consultor { get; set; } = null!;

        public int? ParceiroId { get; set; }
        public Parceiro? Parceiro { get; set; }

        [Required(ErrorMessage = "A situação é obrigatória")]
        [StringLength(50, ErrorMessage = "A situação deve ter no máximo 50 caracteres")]
        public string Situacao { get; set; } = string.Empty; // Leed, Prospecto, Contrato Enviado, Contrato Assinado, Retornar, Sem Interesse

        public DateTime? DataUltimoContato { get; set; }
        public DateTime? DataProximoContato { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ValorDevido { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ValorNegociado { get; set; }

        public string? Observacoes { get; set; }

        // Novos campos adicionados
        [StringLength(100, ErrorMessage = "O número da pasta deve ter no máximo 100 caracteres")]
        public string? NumeroPasta { get; set; }

        public DateTime? DataFechamentoContrato { get; set; }

        [StringLength(200, ErrorMessage = "O tipo de serviço deve ter no máximo 200 caracteres")]
        public string? TipoServico { get; set; }

        public string? ObjetoContrato { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Comissao { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ValorEntrada { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ValorParcela { get; set; }

        public int? NumeroParcelas { get; set; }

        public DateTime? PrimeiroVencimento { get; set; }

        public string? AnexoDocumento { get; set; }

        public string? Pendencias { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.Now;
        public DateTime? DataAtualizacao { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
