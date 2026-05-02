using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Registro de auditoria para rastrear todas as ações dos usuários no sistema.
    /// </summary>
    [Table("AuditLogs")]
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }

        /// <summary>ID do usuário que realizou a ação.</summary>
        [Required]
        public int UsuarioId { get; set; }

        /// <summary>Nome do usuário no momento da ação (snapshot).</summary>
        [Required]
        [MaxLength(200)]
        public string UsuarioNome { get; set; } = string.Empty;

        /// <summary>Login do usuário.</summary>
        [MaxLength(100)]
        public string? UsuarioLogin { get; set; }

        /// <summary>Grupo de acesso do usuário no momento da ação.</summary>
        [MaxLength(100)]
        public string? GrupoAcesso { get; set; }

        /// <summary>Tipo de ação: Create, Update, Delete, Login, Logout, Export, View, StatusChange.</summary>
        [Required]
        [MaxLength(50)]
        public string Acao { get; set; } = string.Empty;

        /// <summary>Entidade afetada: Contrato, Boleto, Cliente, Usuario, etc.</summary>
        [Required]
        [MaxLength(100)]
        public string Entidade { get; set; } = string.Empty;

        /// <summary>ID da entidade afetada (quando aplicável).</summary>
        public int? EntidadeId { get; set; }

        /// <summary>Descrição legível da ação realizada.</summary>
        [Required]
        [MaxLength(500)]
        public string Descricao { get; set; } = string.Empty;

        /// <summary>JSON com os valores anteriores (para Update/Delete).</summary>
        [Column(TypeName = "text")]
        public string? ValorAnterior { get; set; }

        /// <summary>JSON com os valores novos (para Create/Update).</summary>
        [Column(TypeName = "text")]
        public string? ValorNovo { get; set; }

        /// <summary>Campos que foram alterados (separados por vírgula).</summary>
        [MaxLength(1000)]
        public string? CamposAlterados { get; set; }

        /// <summary>Endereço IP do usuário.</summary>
        [MaxLength(50)]
        public string? IpAddress { get; set; }

        /// <summary>User-Agent do navegador.</summary>
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        /// <summary>Módulo/área do sistema: Contratos, Boletos, Clientes, etc.</summary>
        [MaxLength(100)]
        public string? Modulo { get; set; }

        /// <summary>Severidade: Info, Warning, Critical.</summary>
        [MaxLength(20)]
        public string Severidade { get; set; } = "Info";

        /// <summary>Data e hora da ação (UTC).</summary>
        [Required]
        public DateTime DataHora { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("UsuarioId")]
        public virtual Usuario? Usuario { get; set; }
    }

    // ========== DTOs ==========

    public class AuditLogDTO
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string? UsuarioLogin { get; set; }
        public string? GrupoAcesso { get; set; }
        public string Acao { get; set; } = string.Empty;
        public string Entidade { get; set; } = string.Empty;
        public int? EntidadeId { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public string? ValorAnterior { get; set; }
        public string? ValorNovo { get; set; }
        public string? CamposAlterados { get; set; }
        public string? IpAddress { get; set; }
        public string? Modulo { get; set; }
        public string Severidade { get; set; } = "Info";
        public DateTime DataHora { get; set; }
    }

    public class AuditLogFilterDTO
    {
        public int? UsuarioId { get; set; }
        public string? Acao { get; set; }
        public string? Entidade { get; set; }
        public int? EntidadeId { get; set; }
        public string? Modulo { get; set; }
        public string? Severidade { get; set; }
        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public string? Busca { get; set; }
        public int Pagina { get; set; } = 1;
        public int TamanhoPagina { get; set; } = 50;
    }

    public class AuditLogPagedResult
    {
        public List<AuditLogDTO> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Pagina { get; set; }
        public int TamanhoPagina { get; set; }
        public int TotalPaginas { get; set; }
    }

    public class AuditLogResumo
    {
        public int TotalRegistros { get; set; }
        public int TotalHoje { get; set; }
        public int TotalSemana { get; set; }
        public Dictionary<string, int> PorAcao { get; set; } = new();
        public Dictionary<string, int> PorEntidade { get; set; } = new();
        public Dictionary<string, int> PorUsuario { get; set; } = new();
        public List<AuditLogDTO> UltimasAcoes { get; set; } = new();
    }
}
