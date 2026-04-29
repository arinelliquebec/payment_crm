using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço de telemetria para rastrear eventos de negócio no CRM.
    /// Integração com Azure Application Insights.
    /// </summary>
    public interface ITelemetryService
    {
        // Eventos de Boleto
        void TrackBoletoGerado(int boletoId, decimal valor, string clienteNome, int? contratoId);
        void TrackBoletoPago(int boletoId, decimal valor, string metodoPagamento);
        void TrackBoletoVencido(int boletoId, decimal valor, int diasAtraso);
        void TrackBoletoCancelado(int boletoId, string motivo);

        // Eventos de Cliente
        void TrackClienteCriado(int clienteId, string tipo, string nome);
        void TrackClienteAtualizado(int clienteId, string campo);
        void TrackClienteInativado(int clienteId, string motivo);

        // Eventos de Contrato
        void TrackContratoCriado(int contratoId, decimal valor, int clienteId);
        void TrackContratoAssinado(int contratoId);
        void TrackContratoCancelado(int contratoId, string motivo);

        // Eventos de Lead/Pipeline
        void TrackLeadCriado(int leadId, string origem, string status);
        void TrackLeadConvertido(int leadId, int clienteId);
        void TrackLeadPerdido(int leadId, string motivo);

        // Eventos de Integração Bancária
        void TrackIntegracaoBancaria(string banco, string operacao, bool sucesso, long duracaoMs, string? erro = null);

        // Métricas customizadas
        void TrackMetric(string nome, double valor, Dictionary<string, string>? propriedades = null);

        // Exceções
        void TrackException(Exception exception, Dictionary<string, string>? propriedades = null);

        // Eventos genéricos
        void TrackEvent(string nome, Dictionary<string, string>? propriedades = null, Dictionary<string, double>? metricas = null);
    }

    public class TelemetryService : ITelemetryService
    {
        private readonly TelemetryClient _telemetryClient;
        private readonly ILogger<TelemetryService> _logger;

        public TelemetryService(TelemetryClient telemetryClient, ILogger<TelemetryService> logger)
        {
            _telemetryClient = telemetryClient;
            _logger = logger;
        }

        #region Boletos

        public void TrackBoletoGerado(int boletoId, decimal valor, string clienteNome, int? contratoId)
        {
            var properties = new Dictionary<string, string>
            {
                { "BoletoId", boletoId.ToString() },
                { "ClienteNome", clienteNome },
                { "ContratoId", contratoId?.ToString() ?? "N/A" }
            };

            var metrics = new Dictionary<string, double>
            {
                { "Valor", (double)valor }
            };

            _telemetryClient.TrackEvent("Boleto_Gerado", properties, metrics);
            _logger.LogInformation("📊 Telemetria: Boleto {BoletoId} gerado - R$ {Valor}", boletoId, valor);
        }

        public void TrackBoletoPago(int boletoId, decimal valor, string metodoPagamento)
        {
            var properties = new Dictionary<string, string>
            {
                { "BoletoId", boletoId.ToString() },
                { "MetodoPagamento", metodoPagamento }
            };

            var metrics = new Dictionary<string, double>
            {
                { "Valor", (double)valor }
            };

            _telemetryClient.TrackEvent("Boleto_Pago", properties, metrics);
            _telemetryClient.GetMetric("BoletosRecebidos_Total").TrackValue((double)valor);
            _logger.LogInformation("📊 Telemetria: Boleto {BoletoId} pago via {Metodo} - R$ {Valor}", boletoId, metodoPagamento, valor);
        }

        public void TrackBoletoVencido(int boletoId, decimal valor, int diasAtraso)
        {
            var properties = new Dictionary<string, string>
            {
                { "BoletoId", boletoId.ToString() },
                { "DiasAtraso", diasAtraso.ToString() }
            };

            var metrics = new Dictionary<string, double>
            {
                { "Valor", (double)valor },
                { "DiasAtraso", diasAtraso }
            };

            _telemetryClient.TrackEvent("Boleto_Vencido", properties, metrics);
            _telemetryClient.GetMetric("BoletosVencidos_Total").TrackValue((double)valor);
            _logger.LogWarning("📊 Telemetria: Boleto {BoletoId} vencido há {Dias} dias - R$ {Valor}", boletoId, diasAtraso, valor);
        }

        public void TrackBoletoCancelado(int boletoId, string motivo)
        {
            var properties = new Dictionary<string, string>
            {
                { "BoletoId", boletoId.ToString() },
                { "Motivo", motivo }
            };

            _telemetryClient.TrackEvent("Boleto_Cancelado", properties);
            _logger.LogInformation("📊 Telemetria: Boleto {BoletoId} cancelado - Motivo: {Motivo}", boletoId, motivo);
        }

        #endregion

        #region Clientes

        public void TrackClienteCriado(int clienteId, string tipo, string nome)
        {
            var properties = new Dictionary<string, string>
            {
                { "ClienteId", clienteId.ToString() },
                { "Tipo", tipo },
                { "Nome", nome }
            };

            _telemetryClient.TrackEvent("Cliente_Criado", properties);
            _telemetryClient.GetMetric("ClientesCriados_Count").TrackValue(1);
            _logger.LogInformation("📊 Telemetria: Cliente {ClienteId} criado - {Nome} ({Tipo})", clienteId, nome, tipo);
        }

        public void TrackClienteAtualizado(int clienteId, string campo)
        {
            var properties = new Dictionary<string, string>
            {
                { "ClienteId", clienteId.ToString() },
                { "CampoAlterado", campo }
            };

            _telemetryClient.TrackEvent("Cliente_Atualizado", properties);
        }

        public void TrackClienteInativado(int clienteId, string motivo)
        {
            var properties = new Dictionary<string, string>
            {
                { "ClienteId", clienteId.ToString() },
                { "Motivo", motivo }
            };

            _telemetryClient.TrackEvent("Cliente_Inativado", properties);
            _logger.LogWarning("📊 Telemetria: Cliente {ClienteId} inativado - Motivo: {Motivo}", clienteId, motivo);
        }

        #endregion

        #region Contratos

        public void TrackContratoCriado(int contratoId, decimal valor, int clienteId)
        {
            var properties = new Dictionary<string, string>
            {
                { "ContratoId", contratoId.ToString() },
                { "ClienteId", clienteId.ToString() }
            };

            var metrics = new Dictionary<string, double>
            {
                { "Valor", (double)valor }
            };

            _telemetryClient.TrackEvent("Contrato_Criado", properties, metrics);
            _telemetryClient.GetMetric("ContratosValor_Total").TrackValue((double)valor);
            _logger.LogInformation("📊 Telemetria: Contrato {ContratoId} criado - R$ {Valor}", contratoId, valor);
        }

        public void TrackContratoAssinado(int contratoId)
        {
            var properties = new Dictionary<string, string>
            {
                { "ContratoId", contratoId.ToString() }
            };

            _telemetryClient.TrackEvent("Contrato_Assinado", properties);
            _logger.LogInformation("📊 Telemetria: Contrato {ContratoId} assinado", contratoId);
        }

        public void TrackContratoCancelado(int contratoId, string motivo)
        {
            var properties = new Dictionary<string, string>
            {
                { "ContratoId", contratoId.ToString() },
                { "Motivo", motivo }
            };

            _telemetryClient.TrackEvent("Contrato_Cancelado", properties);
            _logger.LogWarning("📊 Telemetria: Contrato {ContratoId} cancelado - Motivo: {Motivo}", contratoId, motivo);
        }

        #endregion

        #region Leads/Pipeline

        public void TrackLeadCriado(int leadId, string origem, string status)
        {
            var properties = new Dictionary<string, string>
            {
                { "LeadId", leadId.ToString() },
                { "Origem", origem },
                { "Status", status }
            };

            _telemetryClient.TrackEvent("Lead_Criado", properties);
            _telemetryClient.GetMetric($"Leads_{origem}_Count").TrackValue(1);
            _logger.LogInformation("📊 Telemetria: Lead {LeadId} criado - Origem: {Origem}", leadId, origem);
        }

        public void TrackLeadConvertido(int leadId, int clienteId)
        {
            var properties = new Dictionary<string, string>
            {
                { "LeadId", leadId.ToString() },
                { "ClienteId", clienteId.ToString() }
            };

            _telemetryClient.TrackEvent("Lead_Convertido", properties);
            _telemetryClient.GetMetric("LeadsConvertidos_Count").TrackValue(1);
            _logger.LogInformation("📊 Telemetria: Lead {LeadId} convertido para Cliente {ClienteId}", leadId, clienteId);
        }

        public void TrackLeadPerdido(int leadId, string motivo)
        {
            var properties = new Dictionary<string, string>
            {
                { "LeadId", leadId.ToString() },
                { "Motivo", motivo }
            };

            _telemetryClient.TrackEvent("Lead_Perdido", properties);
            _logger.LogInformation("📊 Telemetria: Lead {LeadId} perdido - Motivo: {Motivo}", leadId, motivo);
        }

        #endregion

        #region Integração Bancária

        public void TrackIntegracaoBancaria(string banco, string operacao, bool sucesso, long duracaoMs, string? erro = null)
        {
            var properties = new Dictionary<string, string>
            {
                { "Banco", banco },
                { "Operacao", operacao },
                { "Sucesso", sucesso.ToString() }
            };

            if (!string.IsNullOrEmpty(erro))
            {
                properties["Erro"] = erro;
            }

            var metrics = new Dictionary<string, double>
            {
                { "DuracaoMs", duracaoMs }
            };

            _telemetryClient.TrackEvent("Integracao_Bancaria", properties, metrics);

            // Métricas de performance
            _telemetryClient.GetMetric($"Banco_{banco}_{operacao}_Duracao").TrackValue(duracaoMs);
            _telemetryClient.GetMetric($"Banco_{banco}_{operacao}_Sucesso").TrackValue(sucesso ? 1 : 0);

            if (sucesso)
            {
                _logger.LogInformation("📊 Telemetria: Integração {Banco} - {Operacao} OK ({Duracao}ms)", banco, operacao, duracaoMs);
            }
            else
            {
                _logger.LogError("📊 Telemetria: Integração {Banco} - {Operacao} FALHOU ({Duracao}ms): {Erro}", banco, operacao, duracaoMs, erro);
            }
        }

        #endregion

        #region Métricas e Eventos Genéricos

        public void TrackMetric(string nome, double valor, Dictionary<string, string>? propriedades = null)
        {
            _telemetryClient.TrackMetric(nome, valor, propriedades);
        }

        public void TrackException(Exception exception, Dictionary<string, string>? propriedades = null)
        {
            var telemetry = new ExceptionTelemetry(exception);

            if (propriedades != null)
            {
                foreach (var prop in propriedades)
                {
                    telemetry.Properties[prop.Key] = prop.Value;
                }
            }

            _telemetryClient.TrackException(telemetry);
            _logger.LogError(exception, "📊 Telemetria: Exceção rastreada - {Message}", exception.Message);
        }

        public void TrackEvent(string nome, Dictionary<string, string>? propriedades = null, Dictionary<string, double>? metricas = null)
        {
            _telemetryClient.TrackEvent(nome, propriedades, metricas);
        }

        #endregion
    }
}

