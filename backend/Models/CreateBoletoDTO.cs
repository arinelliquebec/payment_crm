using System.ComponentModel.DataAnnotations;

namespace CrmArrighi.Models
{
    /// <summary>
    /// Tipo de boleto manual
    /// </summary>
    public enum TipoBoletoManual
    {
        /// <summary>
        /// Boleto avulso - não afeta parcelas do contrato (acordos especiais, outros contratos, etc.)
        /// </summary>
        AVULSO = 0,
        
        /// <summary>
        /// Renegociação de parcelas em atraso (BAIXADO_NAO_PAGO)
        /// O usuário seleciona quais parcelas está renegociando
        /// </summary>
        RENEGOCIACAO = 1,
        
        /// <summary>
        /// Antecipação de parcelas futuras
        /// O usuário seleciona quais parcelas está antecipando
        /// </summary>
        ANTECIPACAO = 2
    }

    /// <summary>
    /// Parcela selecionada para renegociação ou antecipação
    /// </summary>
    public class ParcelaSelecionadaDTO
    {
        /// <summary>
        /// ID do boleto original (para renegociação de boletos BAIXADO_NAO_PAGO)
        /// </summary>
        public int? BoletoId { get; set; }
        
        /// <summary>
        /// Número da parcela
        /// </summary>
        public int NumeroParcela { get; set; }
        
        /// <summary>
        /// Valor original da parcela
        /// </summary>
        public decimal ValorOriginal { get; set; }
        
        /// <summary>
        /// Data de vencimento original
        /// </summary>
        public DateTime? VencimentoOriginal { get; set; }
    }

    public class CreateBoletoDTO
    {
        [Required(ErrorMessage = "O contrato é obrigatório")]
        public int ContratoId { get; set; }

        [Required(ErrorMessage = "A data de vencimento é obrigatória")]
        public DateTime DueDate { get; set; }

        [Required(ErrorMessage = "O valor nominal é obrigatório")]
        [Range(0.01, 999999999.99, ErrorMessage = "Valor nominal deve ser maior que zero")]
        public decimal NominalValue { get; set; }

        [StringLength(15, ErrorMessage = "Seu número deve ter no máximo 15 caracteres")]
        public string? ClientNumber { get; set; }

        // ========================================================================
        // CAMPOS PARA BOLETO MANUAL - TIPO E PARCELAS SELECIONADAS
        // ========================================================================
        
        /// <summary>
        /// Tipo de boleto manual: AVULSO, RENEGOCIACAO ou ANTECIPACAO
        /// Se não informado, o sistema tenta detectar automaticamente (comportamento legado)
        /// </summary>
        public TipoBoletoManual? TipoBoletoManual { get; set; }
        
        /// <summary>
        /// Lista de parcelas selecionadas para renegociação ou antecipação
        /// Obrigatório quando TipoBoletoManual = RENEGOCIACAO ou ANTECIPACAO
        /// </summary>
        public List<ParcelaSelecionadaDTO>? ParcelasSelecionadas { get; set; }

        // Campos opcionais para desconto, multa e juros
        [Range(0, 99.99, ErrorMessage = "Percentual de multa deve estar entre 0 e 99.99")]
        public decimal? FinePercentage { get; set; }

        [Range(1, 99, ErrorMessage = "Quantidade de dias da multa deve estar entre 1 e 99")]
        public int? FineQuantityDays { get; set; }

        [Range(0, 99.99, ErrorMessage = "Percentual de juros deve estar entre 0 e 99.99")]
        public decimal? InterestPercentage { get; set; }

        [Range(0, 999999999.99, ErrorMessage = "Valor de abatimento deve ser positivo")]
        public decimal? DeductionValue { get; set; }

        [Range(1, 99, ErrorMessage = "Dias para baixa deve estar entre 1 e 99")]
        public int? WriteOffQuantityDays { get; set; }

        // Campos de protesto
        /// <summary>
        /// Tipo de protesto: DIAS_CORRIDOS, DIAS_UTEIS, SEM_PROTESTO, NAO_PROTESTAR
        /// Se não informado, usa o padrão definido no sistema
        /// </summary>
        [StringLength(20, ErrorMessage = "Tipo de protesto deve ter no máximo 20 caracteres")]
        public string? ProtestType { get; set; }

        /// <summary>
        /// Quantidade de dias para protesto após vencimento
        /// </summary>
        [Range(1, 99, ErrorMessage = "Dias para protesto deve estar entre 1 e 99")]
        public int? ProtestQuantityDays { get; set; }

        // Mensagens personalizadas
        public List<string>? Messages { get; set; }

        // Dados PIX (opcionais)
        public string? PixKeyType { get; set; } // EMAIL, CPF, CNPJ, TELEFONE, CHAVE_ALEATORIA
        public string? PixKey { get; set; }
        public string? TxId { get; set; }

        // Dados de desconto (opcionais)
        public DescontoDTO? Discount { get; set; }
    }

    public class DescontoDTO
    {
        [Required(ErrorMessage = "Tipo de desconto é obrigatório")]
        public string Type { get; set; } = string.Empty; // VALOR_DATA_FIXA, PERCENTUAL_DATA_FIXA

        public DescontoValorDTO? DiscountOne { get; set; }
        public DescontoValorDTO? DiscountTwo { get; set; }
        public DescontoValorDTO? DiscountThree { get; set; }
    }

    public class DescontoValorDTO
    {
        [Required(ErrorMessage = "Valor do desconto é obrigatório")]
        [Range(0.01, 999999999.99, ErrorMessage = "Valor do desconto deve ser maior que zero")]
        public decimal Value { get; set; }

        [Required(ErrorMessage = "Data limite do desconto é obrigatória")]
        public DateTime LimitDate { get; set; }
    }

    /// <summary>
    /// Request para envio de email de boleto
    /// </summary>
    public class EnviarEmailRequest
    {
        /// <summary>
        /// Email de destino (opcional - se não informado, usa o email do cliente)
        /// </summary>
        public string? EmailDestino { get; set; }
    }

    /// <summary>
    /// Resultado do envio de emails de boletos em lote
    /// </summary>
    public class ResultadoEnvioEmailsDTO
    {
        public int TotalBoletos { get; set; }
        public int EmailsEnviados { get; set; }
        public int EmailsFalharam { get; set; }
        public int SemEmail { get; set; }
        public List<EmailEnviadoDTO> Enviados { get; set; } = new();
        public List<EmailFalhouDTO> Falhas { get; set; } = new();
    }

    public class EmailEnviadoDTO
    {
        public int BoletoId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string EmailDestino { get; set; } = string.Empty;
    }

    public class EmailFalhouDTO
    {
        public int BoletoId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string? EmailDestino { get; set; }
        public string Motivo { get; set; } = string.Empty;
    }
}
