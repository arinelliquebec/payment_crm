using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Registra cada execução de geração de boletos em lote
    /// </summary>
    public class LogGeracaoBoleto
    {
        public int Id { get; set; }

        [Required]
        public DateTime DataExecucao { get; set; } = DateTime.Now;

        [Required]
        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;

        [Required]
        public int TotalContratosProcessados { get; set; }

        [Required]
        public int TotalBoletosGerados { get; set; }

        [Required]
        public int TotalErros { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorTotalGerado { get; set; }

        /// <summary>
        /// JSON com detalhes de cada boleto gerado e erros
        /// </summary>
        public string? Detalhes { get; set; }

        public int? DuracaoSegundos { get; set; }

        /// <summary>
        /// SUCESSO, PARCIAL, ERRO
        /// </summary>
        [StringLength(20)]
        public string Status { get; set; } = "SUCESSO";

        public DateTime? DataFinalizacao { get; set; }
    }

    /// <summary>
    /// DTO para preview de geração em lote
    /// </summary>
    public class PreviewGeracaoLoteDTO
    {
        public int TotalContratosAtivos { get; set; }
        public int ContratosParaGerar { get; set; }
        public decimal ValorTotal { get; set; }
        public List<ContratoParaGerarDTO> Contratos { get; set; } = new();
    }

    /// <summary>
    /// DTO para cada contrato no preview
    /// </summary>
    public class ContratoParaGerarDTO
    {
        public int ContratoId { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string ClienteDocumento { get; set; } = string.Empty;
        public string NumeroPasta { get; set; } = string.Empty;
        public int NumeroParcela { get; set; }
        public int TotalParcelas { get; set; }
        public string ParcelaDescricao { get; set; } = string.Empty; // Ex: "20/36"
        public DateTime DataVencimento { get; set; }
        public decimal Valor { get; set; }
        public decimal ValorParcela { get; set; } // Valor da parcela do contrato
        public int DiasAteVencimento { get; set; }
        public string? FilialNome { get; set; }
        
        /// <summary>
        /// Indica se este boleto é uma REGENERAÇÃO de um boleto BAIXADO não pago
        /// Usado quando o contrato é reativado após negociação com cliente inadimplente
        /// </summary>
        public bool IsRegeneracao { get; set; } = false;
    }

    /// <summary>
    /// DTO para resultado da geração em lote
    /// </summary>
    public class ResultadoGeracaoLoteDTO
    {
        public DateTime Iniciado { get; set; }
        public DateTime Finalizado { get; set; }
        public int DuracaoSegundos { get; set; }
        public int TotalProcessados { get; set; }
        public int TotalSucesso { get; set; }
        public int TotalErros { get; set; }
        public decimal ValorTotalGerado { get; set; }
        public string Status { get; set; } = string.Empty; // SUCESSO, PARCIAL, ERRO
        public List<BoletoGeradoDTO> BoletosGerados { get; set; } = new();
        public List<ErroGeracaoDTO> Erros { get; set; } = new();
        public int LogId { get; set; }
        
        // Resumo de envio de emails
        public ResumoEnvioEmailDTO? ResumoEmail { get; set; }
    }

    /// <summary>
    /// Resumo do envio de emails na geração em lote
    /// </summary>
    public class ResumoEnvioEmailDTO
    {
        public int TotalEnviados { get; set; }
        public int TotalFalharam { get; set; }
        public int TotalSemEmail { get; set; }
        public List<string> ClientesSemEmail { get; set; } = new();
    }

    /// <summary>
    /// DTO para boleto gerado com sucesso
    /// </summary>
    public class BoletoGeradoDTO
    {
        public int BoletoId { get; set; }
        public int ContratoId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public int NumeroParcela { get; set; }
        public int TotalParcelas { get; set; }
        public DateTime DataVencimento { get; set; }
        public decimal Valor { get; set; }
        public string NsuCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        
        // Informações de envio de email
        public string? EmailStatus { get; set; } // ENVIADO, FALHOU, SEM_EMAIL, null (não tentou)
        public string? EmailDestino { get; set; }
    }

    /// <summary>
    /// DTO para erro na geração
    /// </summary>
    public class ErroGeracaoDTO
    {
        public int ContratoId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string Erro { get; set; } = string.Empty;
        public DateTime DataHora { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// DTO para listagem de logs de geração
    /// </summary>
    public class LogGeracaoListDTO
    {
        public int Id { get; set; }
        public DateTime DataExecucao { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public int TotalContratosProcessados { get; set; }
        public int TotalBoletosGerados { get; set; }
        public int TotalErros { get; set; }
        public decimal ValorTotalGerado { get; set; }
        public int? DuracaoSegundos { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}

