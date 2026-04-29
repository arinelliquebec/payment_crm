using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Documento enviado pelo cliente ou admin via portal.
    /// Arquivos são armazenados no Azure Blob Storage.
    /// </summary>
    public class DocumentoPortal
    {
        public int Id { get; set; }

        [Required]
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        /// <summary>Nome de exibição do documento (ex: "Procuração João Silva")</summary>
        [Required]
        [StringLength(500)]
        public string Nome { get; set; } = string.Empty;

        /// <summary>Tipo: contrato, boleto, procuracao, comprovante, nota_fiscal, outros</summary>
        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } = "outros";

        /// <summary>Descrição opcional do documento</summary>
        [StringLength(2000)]
        public string? Descricao { get; set; }

        /// <summary>Nome do arquivo no Azure Blob Storage (path completo no container)</summary>
        [Required]
        [StringLength(1000)]
        public string NomeArquivoBlobStorage { get; set; } = string.Empty;

        /// <summary>Nome original do arquivo (como enviado pelo usuário)</summary>
        [StringLength(500)]
        public string? NomeArquivoOriginal { get; set; }

        /// <summary>Extensão do arquivo: pdf, jpg, png, doc, xls, etc.</summary>
        [StringLength(20)]
        public string Formato { get; set; } = string.Empty;

        /// <summary>Content-Type MIME (ex: application/pdf, image/jpeg)</summary>
        [StringLength(200)]
        public string? ContentType { get; set; }

        /// <summary>Tamanho em bytes</summary>
        public long Tamanho { get; set; }

        /// <summary>Status: ativo, arquivado</summary>
        [StringLength(30)]
        public string Status { get; set; } = "ativo";

        /// <summary>ID do contrato relacionado (opcional)</summary>
        public int? ContratoId { get; set; }

        /// <summary>Quem enviou: "cliente" ou "admin"</summary>
        [StringLength(30)]
        public string EnviadoPor { get; set; } = "cliente";

        public DateTime DataUpload { get; set; } = DateTime.UtcNow;
        public DateTime? DataAtualizacao { get; set; }
    }
}
