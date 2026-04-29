using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    [Table("SessoesAtivas")]
    public class SessaoAtiva
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [ForeignKey("UsuarioId")]
        public Usuario Usuario { get; set; }

        [Required]
        [MaxLength(100)]
        public string NomeUsuario { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Perfil { get; set; } = string.Empty;

        [Required]
        public DateTime InicioSessao { get; set; }

        public DateTime UltimaAtividade { get; set; }

        [MaxLength(45)]
        public string EnderecoIP { get; set; } = string.Empty;

        [MaxLength(500)]
        public string UserAgent { get; set; } = string.Empty;

        [MaxLength(255)]
        public string TokenSessao { get; set; } = string.Empty;

        [MaxLength(200)]
        public string PaginaAtual { get; set; } = string.Empty;

        public DateTime? DataHoraOffline { get; set; }

        public bool Ativa { get; set; } = true;
    }

    public class SessaoAtivaDTO
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string NomeUsuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? UltimoAcesso { get; set; }
        public string Perfil { get; set; } = string.Empty;
        public DateTime InicioSessao { get; set; }
        public DateTime UltimaAtividade { get; set; }
        public string TempoOnline { get; set; } = string.Empty;
        public string EnderecoIP { get; set; } = string.Empty;
        public string PaginaAtual { get; set; } = string.Empty;
        public DateTime? DataHoraOffline { get; set; }
    }
}
