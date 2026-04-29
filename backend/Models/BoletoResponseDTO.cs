namespace CrmArrighi.Models
{
    public class BoletoResponseDTO
    {
        public int Id { get; set; }
        public int ContratoId { get; set; }
        public string NsuCode { get; set; } = string.Empty;
        public DateTime NsuDate { get; set; }
        public string CovenantCode { get; set; } = string.Empty;
        public string BankNumber { get; set; } = string.Empty;
        public string? ClientNumber { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime IssueDate { get; set; }
        public decimal NominalValue { get; set; }
        public string DocumentKind { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        // Dados do Pagador
        public string PayerName { get; set; } = string.Empty;
        public string PayerDocumentType { get; set; } = string.Empty;
        public string PayerDocumentNumber { get; set; } = string.Empty;
        public string PayerAddress { get; set; } = string.Empty;
        public string PayerNeighborhood { get; set; } = string.Empty;
        public string PayerCity { get; set; } = string.Empty;
        public string PayerState { get; set; } = string.Empty;
        public string PayerZipCode { get; set; } = string.Empty;

        // Dados de resposta da API Santander
        public string? BarCode { get; set; }
        public string? DigitableLine { get; set; }
        public DateTime? EntryDate { get; set; }
        public string? QrCodePix { get; set; }
        public string? QrCodeUrl { get; set; }

        // Campos de pagamento
        public bool FoiPago { get; set; }
        public decimal? ValorPago { get; set; }
        public DateTime? DataPagamento { get; set; }

        // Campos de protesto
        public string? ProtestType { get; set; }
        public int? ProtestQuantityDays { get; set; }

        // Informações do Contrato
        public ContratoInfoDTO? Contrato { get; set; }

        // Campos de controle
        public DateTime DataCadastro { get; set; }
        public DateTime? DataAtualizacao { get; set; }

        // Campos de erro (se houver)
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public string? TraceId { get; set; }

        // Tipo do boleto manual (RENEGOCIACAO, ANTECIPACAO, AVULSO ou null para lote normal)
        public string? TipoBoletoManual { get; set; }

        // Campos de armazenamento de PDF (para portal do cliente)
        public string? PdfBlobUrl { get; set; }
        public DateTime? PdfArmazenadoEm { get; set; }
        public bool PdfDisponivel => !string.IsNullOrEmpty(PdfBlobUrl);
    }

    public class ContratoInfoDTO
    {
        public int Id { get; set; }
        public string NumeroContrato { get; set; } = string.Empty;
        public string? NumeroPasta { get; set; }
        public string? TipoServico { get; set; }
        public string? ClienteNome { get; set; }
        public string? ClienteDocumento { get; set; }
        public decimal? ValorContrato { get; set; }
        public string? FilialNome { get; set; }
    }

    // DTO para resposta da API Santander
    public class SantanderBoletoResponse
    {
        public string nsuCode { get; set; } = string.Empty;
        public string nsuDate { get; set; } = string.Empty;
        public string environment { get; set; } = string.Empty;
        public string covenantCode { get; set; } = string.Empty;
        public string issueDate { get; set; } = string.Empty;
        public string dueDate { get; set; } = string.Empty;
        public string bankNumber { get; set; } = string.Empty;
        public string? clientNumber { get; set; }
        public string nominalValue { get; set; } = string.Empty; // Santander retorna como string
        public PayerResponse payer { get; set; } = new();
        public string documentKind { get; set; } = string.Empty;
        public string paymentType { get; set; } = string.Empty;
        public List<string>? messages { get; set; }
        public KeyResponse? key { get; set; }
        public DiscountResponse? discount { get; set; }
        public string? finePercentage { get; set; } // Santander retorna como string
        public string? FineDate { get; set; }
        public string? interestPercentage { get; set; } // Santander retorna como string
        public string? writeOffQuantityDays { get; set; } // Santander retorna como string
        public string? deductionValue { get; set; } // Santander retorna como string

        // Campos de resposta específicos
        public string? barCode { get; set; }
        public string? digitableLine { get; set; }
        public string? entryDate { get; set; }
        public string? qrCodePix { get; set; }
        public string? qrCodeUrl { get; set; }

        // Campos para PDF
        public string? PdfUrl { get; set; }
        public string? BankSlipUrl { get; set; }
        public string? Url { get; set; }

        // Campos de status (para verificar se foi liquidado)
        public string? Status { get; set; }
        public string? SettlementDate { get; set; }
    }

    public class PayerResponse
    {
        public string name { get; set; } = string.Empty;
        public string documentType { get; set; } = string.Empty;
        public string documentNumber { get; set; } = string.Empty;
        public string address { get; set; } = string.Empty;
        public string neighborhood { get; set; } = string.Empty;
        public string city { get; set; } = string.Empty;
        public string state { get; set; } = string.Empty;
        public string zipCode { get; set; } = string.Empty;
    }

    public class KeyResponse
    {
        public string type { get; set; } = string.Empty;
        public string dictKey { get; set; } = string.Empty;
    }

    public class DiscountResponse
    {
        public string type { get; set; } = string.Empty;
        public DiscountValueResponse? discountOne { get; set; }
        public DiscountValueResponse? discountTwo { get; set; }
        public DiscountValueResponse? discountThree { get; set; }
    }

    public class DiscountValueResponse
    {
        public decimal value { get; set; }
        public string limitDate { get; set; } = string.Empty;
    }

    // DTO para erro da API Santander
    public class SantanderErrorResponse
    {
        public int _errorCode { get; set; } // Santander retorna como número (400, 401, etc)
        public string _message { get; set; } = string.Empty;
        public string _details { get; set; } = string.Empty;
        public string _timestamp { get; set; } = string.Empty;
        public string _traceId { get; set; } = string.Empty;
        public List<SantanderErrorDetail>? _errors { get; set; }
    }

    public class SantanderErrorDetail
    {
        public string _code { get; set; } = string.Empty;
        public string _field { get; set; } = string.Empty;
        public string _message { get; set; } = string.Empty;
    }
}
