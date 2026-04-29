using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    public class Lead
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string NomeEmpresa { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Novo"; // Novo, Qualificado, Proposta, Negociacao, Fechado, Perdido, Pausado

        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorEstimado { get; set; }

        public int? Probabilidade { get; set; } // 0-100%

        [MaxLength(100)]
        public string? Origem { get; set; } // Indicacao, Site, Evento, ColdCall, LinkedIn, etc

        [MaxLength(200)]
        public string? ContatoNome { get; set; }

        [MaxLength(20)]
        public string? ContatoTelefone { get; set; }

        [MaxLength(200)]
        public string? ContatoEmail { get; set; }

        [MaxLength(100)]
        public string? ContatoCargo { get; set; }

        public string? Necessidade { get; set; }

        public string? Observacoes { get; set; }

        public int? ResponsavelId { get; set; }
        [ForeignKey("ResponsavelId")]
        public virtual Usuario? Responsavel { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime? DataUltimaInteracao { get; set; }

        public DateTime? DataProximaAcao { get; set; }

        [MaxLength(500)]
        public string? ProximaAcao { get; set; }

        public DateTime? DataQualificacao { get; set; }

        public DateTime? DataProposta { get; set; }

        public DateTime? DataNegociacao { get; set; }

        public DateTime? DataFechamento { get; set; }

        [MaxLength(200)]
        public string? MotivoPerda { get; set; }

        public int? ClienteId { get; set; }
        [ForeignKey("ClienteId")]
        public virtual Cliente? Cliente { get; set; }

        public int? ContratoId { get; set; }
        [ForeignKey("ContratoId")]
        public virtual Contrato? Contrato { get; set; }

        // Campos de auditoria
        public int? CriadoPorId { get; set; }
        [ForeignKey("CriadoPorId")]
        public virtual Usuario? CriadoPor { get; set; }

        public DateTime? DataAtualizacao { get; set; }

        public int? AtualizadoPorId { get; set; }
        [ForeignKey("AtualizadoPorId")]
        public virtual Usuario? AtualizadoPor { get; set; }

        // Navegação para interações
        public virtual ICollection<LeadInteracao>? Interacoes { get; set; }
    }

    public class LeadInteracao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int LeadId { get; set; }
        [ForeignKey("LeadId")]
        public virtual Lead Lead { get; set; } = null!;

        [Required]
        [MaxLength(50)]
        public string Tipo { get; set; } = string.Empty; // Telefone, Email, Reuniao, WhatsApp, etc

        [Required]
        public string Descricao { get; set; } = string.Empty;

        public DateTime DataInteracao { get; set; } = DateTime.UtcNow;

        public int? UsuarioId { get; set; }
        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }

        public int? DuracaoMinutos { get; set; }
    }
}
