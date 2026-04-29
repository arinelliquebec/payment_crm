using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Armazena chaves de idempotência para evitar processamento duplicado de requisições
    /// </summary>
    [Table("IdempotencyKeys")]
    public class IdempotencyKey
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Chave única de idempotência (UUID gerado pelo cliente)
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Caminho da requisição (ex: /api/Boleto)
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string RequestPath { get; set; } = string.Empty;

        /// <summary>
        /// Body da requisição original (JSON)
        /// </summary>
        public string? RequestBody { get; set; }

        /// <summary>
        /// Status HTTP da resposta (ex: 200, 201, 400)
        /// </summary>
        [Required]
        public int ResponseStatus { get; set; }

        /// <summary>
        /// Body da resposta (JSON)
        /// </summary>
        public string? ResponseBody { get; set; }

        /// <summary>
        /// Data/hora de criação da chave
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Data/hora de expiração (após esta data, a chave pode ser reutilizada)
        /// Padrão: 24 horas após criação
        /// </summary>
        [Required]
        public DateTime ExpiresAt { get; set; }
    }
}
