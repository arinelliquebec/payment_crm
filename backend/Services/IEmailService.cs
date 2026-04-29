namespace CrmArrighi.Services
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmail(string toEmail, string userName, string resetLink);
        Task<bool> SendEmail(string toEmail, string subject, string htmlBody);
        Task<EnvioEmailBoletoResult> SendBoletoEmail(
            string toEmail, 
            string clienteNome, 
            decimal valor, 
            DateTime vencimento, 
            int numeroParcela, 
            int? totalParcelas,
            string? linhaDigitavel, 
            string? codigoPix, 
            byte[] pdfBytes, 
            string nomeArquivoPdf);
    }

    /// <summary>
    /// Resultado do envio de email de boleto
    /// </summary>
    public class EnvioEmailBoletoResult
    {
        public bool Sucesso { get; set; }
        public string? Erro { get; set; }
        public string? EmailDestino { get; set; }
    }
}

