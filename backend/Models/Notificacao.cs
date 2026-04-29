using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("Notificacoes")]
    public class Notificacao
    {
        public int Id { get; set; }

        [Required]
        public string Tipo { get; set; } = string.Empty; // "BoletoPago", "BoletoVencido", "ContratoAssinado", etc.

        [Required]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        public string Mensagem { get; set; } = string.Empty;

        // Relacionamento com usuário (quem deve receber a notificação)
        public int? UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        // Relacionamento com boleto (se aplicável)
        public int? BoletoId { get; set; }
        public Boleto? Boleto { get; set; }

        // Relacionamento com contrato (se aplicável)
        public int? ContratoId { get; set; }
        public Contrato? Contrato { get; set; }

        // Relacionamento com cliente (se aplicável)
        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        public bool Lida { get; set; } = false;
        public DateTime? DataLeitura { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        // Dados adicionais em JSON (opcional)
        public string? DadosAdicionais { get; set; }

        // Prioridade: "Baixa", "Normal", "Alta", "Urgente"
        public string Prioridade { get; set; } = "Normal";

        // Link para onde a notificação deve redirecionar
        public string? Link { get; set; }
    }
}
