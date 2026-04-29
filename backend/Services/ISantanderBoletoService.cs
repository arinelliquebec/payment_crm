using CrmArrighi.Models;

namespace CrmArrighi.Services
{
    public interface ISantanderBoletoService
    {
        /// <summary>
        /// Registra um boleto na API do Santander
        /// </summary>
        /// <param name="boleto">Dados do boleto para registro</param>
        /// <returns>Resposta da API do Santander com dados do boleto registrado</returns>
        Task<SantanderBoletoResponse> RegistrarBoletoAsync(Boleto boleto);

        /// <summary>
        /// Consulta um boleto na API do Santander
        /// </summary>
        /// <param name="covenantCode">Código do convênio</param>
        /// <param name="bankNumber">Nosso número do boleto</param>
        /// <param name="nsuDate">Data NSU do boleto</param>
        /// <returns>Dados atualizados do boleto</returns>
        Task<SantanderBoletoResponse> ConsultarBoletoAsync(string covenantCode, string bankNumber, DateTime nsuDate);

        /// <summary>
        /// Cancela/baixa um boleto na API do Santander
        /// </summary>
        /// <param name="covenantCode">Código do convênio</param>
        /// <param name="bankNumber">Nosso número do boleto</param>
        /// <param name="nsuDate">Data NSU do boleto</param>
        /// <returns>True se cancelado com sucesso</returns>
        Task<bool> CancelarBoletoAsync(string covenantCode, string bankNumber, DateTime nsuDate);

        /// <summary>
        /// Gera próximo NSU Code único
        /// </summary>
        /// <returns>Próximo NSU Code disponível</returns>
        Task<string> GerarProximoNsuCodeAsync();

        /// <summary>
        /// Baixa o PDF do boleto da API do Santander
        /// </summary>
        /// <param name="bankNumber">Número do banco do boleto</param>
        /// <param name="covenantCode">Código do convênio</param>
        /// <param name="payerDocumentNumber">CPF/CNPJ do pagador</param>
        /// <returns>Link para download do PDF do boleto</returns>
        Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, string payerDocumentNumber);

        /// <summary>
        /// Consulta status detalhado do boleto pelo Nosso Número
        /// </summary>
        /// <param name="beneficiaryCode">Código do convênio do beneficiário</param>
        /// <param name="bankNumber">Nosso número do boleto</param>
        /// <returns>Detalhes do status do boleto</returns>
        Task<BoletoStatusResponseDTO> ConsultarStatusPorNossoNumeroAsync(string beneficiaryCode, string bankNumber);

        /// <summary>
        /// Consulta status detalhado do boleto pelo Seu Número
        /// </summary>
        /// <param name="beneficiaryCode">Código do convênio do beneficiário</param>
        /// <param name="clientNumber">Seu número do boleto</param>
        /// <param name="dueDate">Data de vencimento</param>
        /// <param name="nominalValue">Valor nominal</param>
        /// <returns>Detalhes do status do boleto</returns>
        Task<BoletoStatusResponseDTO> ConsultarStatusPorSeuNumeroAsync(string beneficiaryCode, string clientNumber, DateTime dueDate, decimal nominalValue);

        /// <summary>
        /// Consulta detalhes do boleto por tipo de consulta
        /// </summary>
        /// <param name="billId">ID do boleto (formato: beneficiaryCode.bankNumber)</param>
        /// <param name="tipoConsulta">Tipo de consulta (default, duplicate, bankslip, settlement, registry)</param>
        /// <returns>Detalhes do boleto conforme tipo solicitado</returns>
        Task<BoletoStatusResponseDTO> ConsultarStatusPorTipoAsync(string billId, string tipoConsulta = "default");
    }
}
