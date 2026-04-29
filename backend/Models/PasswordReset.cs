using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    public class PasswordReset
    {
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        [Required]
        [StringLength(256)]
        public string Token { get; set; } = string.Empty;

        [Required]
        public DateTime DataExpiracao { get; set; }

        public bool Utilizado { get; set; } = false;

        public DateTime? DataUtilizacao { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.Now;
    }
}

