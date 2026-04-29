using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("LogsAtividades")]
    public class LogAtividade
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [MaxLength(200)]
        public string UsuarioNome { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Acao { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Tipo { get; set; } = "info"; // success, info, warning, error

        [MaxLength(1000)]
        public string? Detalhes { get; set; }

        [MaxLength(100)]
        public string? ModuloOrigem { get; set; }

        [Required]
        public DateTime DataHora { get; set; } = DateTime.Now;

        public bool Ativo { get; set; } = true;

        // Navigation property
        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }
}

