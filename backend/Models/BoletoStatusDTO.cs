namespace CrmArrighi.Models
{
    /// <summary>
    /// DTO para resposta detalhada de consulta de status de boleto
    /// </summary>
    public class BoletoStatusResponseDTO
    {
        // Informações básicas do boleto
        public string? BeneficiaryCode { get; set; }
        public string? BankNumber { get; set; }
        public string? ClientNumber { get; set; }
        public string? NsuCode { get; set; }
        public string? NsuDate { get; set; }
        
        // Status e datas
        public string? Status { get; set; }
        public string? StatusDescription { get; set; }
        public bool FoiPago { get; set; } // Indica se o boleto foi realmente pago (LIQUIDADO ou BAIXADO com paidValue > 0)
        public string? DueDate { get; set; }
        public string? IssueDate { get; set; }
        public string? EntryDate { get; set; }
        public string? SettlementDate { get; set; }
        
        // Valores
        public decimal? NominalValue { get; set; }
        public decimal? PaidValue { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? FineValue { get; set; }
        public decimal? InterestValue { get; set; }
        
        // Informações do pagador
        public PayerInfoDTO? Payer { get; set; }
        
        // Informações de PIX
        public string? QrCodePix { get; set; }
        public string? QrCodeUrl { get; set; }
        
        // Código de barras
        public string? BarCode { get; set; }
        public string? DigitableLine { get; set; }
        
        // Informações adicionais
        public string? DocumentKind { get; set; }
        public List<string>? Messages { get; set; }
        
        // Baixas e liquidações (para tipo settlement)
        public List<SettlementInfoDTO>? Settlements { get; set; }
        
        // Informações de cartório (para tipo registry)
        public RegistryInfoDTO? RegistryInfo { get; set; }
        
        // Metadados
        public DateTime ConsultaRealizadaEm { get; set; }
        public string? TipoConsulta { get; set; }
    }
    
    /// <summary>
    /// Informações do pagador
    /// </summary>
    public class PayerInfoDTO
    {
        public string? Name { get; set; }
        public string? DocumentType { get; set; }
        public string? DocumentNumber { get; set; }
        public string? Address { get; set; }
        public string? Neighborhood { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? ZipCode { get; set; }
    }
    
    /// <summary>
    /// Informações de liquidação/baixa
    /// </summary>
    public class SettlementInfoDTO
    {
        public string? SettlementType { get; set; }
        public string? SettlementDate { get; set; }
        public decimal? SettlementValue { get; set; }
        public string? SettlementOrigin { get; set; }
        public string? BankCode { get; set; }
        public string? BankBranch { get; set; }
    }
    
    /// <summary>
    /// Informações de cartório
    /// </summary>
    public class RegistryInfoDTO
    {
        public string? RegistryDate { get; set; }
        public string? RegistryNumber { get; set; }
        public string? NotaryOffice { get; set; }
        public decimal? RegistryCost { get; set; }
    }
    
    /// <summary>
    /// Resposta da API Santander para consulta de status
    /// Mapeia a estrutura retornada pela API do Santander
    /// </summary>
    public class SantanderBillStatusResponse
    {
        // Wrapper da resposta (lista com paginação)
        public SantanderPageable? _pageable { get; set; }
        public List<SantanderBillData>? _content { get; set; }
    }

    public class SantanderPageable
    {
        public bool _moreElements { get; set; }
    }

    public class SantanderBillData
    {
        // Estrutura básica
        public string? returnCode { get; set; }
        public string? documentNumber { get; set; }
        public int? beneficiaryCode { get; set; }
        public long? bankNumber { get; set; }
        public string? clientNumber { get; set; }
        public string? nsuCode { get; set; }
        public string? nsuDate { get; set; }
        
        // Status
        public string? status { get; set; }
        public string? statusComplement { get; set; }
        public string? statusDescription { get; set; }
        
        // Datas
        public string? dueDate { get; set; }
        public string? issueDate { get; set; }
        public string? entryDate { get; set; }
        public string? settlementDate { get; set; }
        
        // Valores
        public decimal? nominalValue { get; set; }
        public decimal? paidValue { get; set; }
        public decimal? discountValue { get; set; }
        public decimal? fineValue { get; set; }
        public decimal? interestValue { get; set; }
        public decimal? deductionValue { get; set; }
        
        // Outros
        public string? participantCode { get; set; }
        
        // Pagador
        public PayerResponse? payer { get; set; }
        
        // PIX
        public KeyResponse? key { get; set; }
        public string? qrCodePix { get; set; }
        public string? qrCodeUrl { get; set; }
        
        // Código de barras
        public string? barCode { get; set; }
        public string? digitableLine { get; set; }
        
        // Tipo de documento
        public string? documentKind { get; set; }
        
        // Mensagens
        public List<string>? messages { get; set; }
        
        // Liquidações (para tipo settlement)
        public List<SettlementData>? settlements { get; set; }
        
        // Cartório (para tipo registry)
        public RegistryData? registryInfo { get; set; }
    }
    
    public class SettlementData
    {
        public string? settlementType { get; set; }
        public string? settlementDate { get; set; }
        public string? settlementValue { get; set; }
        public string? settlementOrigin { get; set; }
        public string? bankCode { get; set; }
        public string? bankBranch { get; set; }
    }
    
    public class RegistryData
    {
        public string? registryDate { get; set; }
        public string? registryNumber { get; set; }
        public string? notaryOffice { get; set; }
        public string? registryCost { get; set; }
    }
}

