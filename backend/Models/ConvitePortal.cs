using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Token de convite para ativação de conta no Portal do Cliente.
    /// Gerado quando o colaborador convida um cliente ou quando o cliente solicita acesso.
    /// Validade: 1 hora. Uso único.
    /// </summary>
    public class ConvitePortal
    {
        public int Id { get; set; }

        /// <summary>
        /// Hash SHA-256 do token (o token plain é enviado por email, o hash é armazenado)
        /// </summary>
        [Required]
        [StringLength(128)]
        public string TokenHash { get; set; } = string.Empty;

        [Required]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        /// <summary>
        /// Email para onde o convite foi enviado
        /// </summary>
        [Required]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// ID do usuario (colaborador/admin) que criou o convite. Null se foi self-service.
        /// </summary>
        public int? CriadoPorId { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Data/hora de expiracao (CriadoEm + 1 hora)
        /// </summary>
        public DateTime ExpiraEm { get; set; }

        /// <summary>
        /// Data/hora em que o token foi usado para ativar a conta
        /// </summary>
        public DateTime? UsadoEm { get; set; }

        public bool Usado { get; set; } = false;
    }
}
