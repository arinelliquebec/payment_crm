using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;

namespace CrmArrighi.Telemetry
{
    /// <summary>
    /// Inicializador de telemetria customizado para o CRM Arrighi.
    /// Adiciona propriedades globais a todos os eventos de telemetria.
    /// </summary>
    public class CrmTelemetryInitializer : ITelemetryInitializer
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _configuration;

        public CrmTelemetryInitializer(
            IHttpContextAccessor httpContextAccessor,
            IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
        }

        public void Initialize(ITelemetry telemetry)
        {
            // Adicionar nome da aplicação
            telemetry.Context.Cloud.RoleName = "CRM-Arrighi-API";

            // Adicionar ambiente
            var environment = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
            telemetry.Context.GlobalProperties["Environment"] = environment;

            // Adicionar versão da aplicação
            telemetry.Context.Component.Version = "1.0.0";

            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext != null)
            {
                // Adicionar ID do usuário (se autenticado)
                var usuarioId = httpContext.Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!string.IsNullOrEmpty(usuarioId))
                {
                    telemetry.Context.User.Id = usuarioId;
                    telemetry.Context.User.AuthenticatedUserId = usuarioId;
                    telemetry.Context.GlobalProperties["UsuarioId"] = usuarioId;
                }

                // Adicionar ID da filial (se disponível)
                var filialId = httpContext.Request.Headers["X-Filial-Id"].FirstOrDefault();
                if (!string.IsNullOrEmpty(filialId))
                {
                    telemetry.Context.GlobalProperties["FilialId"] = filialId;
                }

                // Adicionar IP do cliente
                var clientIp = httpContext.Connection.RemoteIpAddress?.ToString();
                if (!string.IsNullOrEmpty(clientIp))
                {
                    telemetry.Context.Location.Ip = clientIp;
                }

                // Adicionar User-Agent
                var userAgent = httpContext.Request.Headers["User-Agent"].FirstOrDefault();
                if (!string.IsNullOrEmpty(userAgent))
                {
                    telemetry.Context.GlobalProperties["UserAgent"] = userAgent;
                }

                // Adicionar Correlation ID para rastreamento distribuído
                var correlationId = httpContext.Request.Headers["X-Correlation-Id"].FirstOrDefault();
                if (string.IsNullOrEmpty(correlationId))
                {
                    correlationId = Guid.NewGuid().ToString();
                }
                telemetry.Context.Operation.Id = correlationId;
                telemetry.Context.GlobalProperties["CorrelationId"] = correlationId;
            }
        }
    }
}

