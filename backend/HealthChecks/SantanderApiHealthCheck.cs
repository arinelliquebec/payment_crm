using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Net.Http.Headers;
using System.Text.Json;

namespace CrmArrighi.HealthChecks;

/// <summary>
/// Health Check para API do Santander (Boletos/PIX)
/// </summary>
public class SantanderApiHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SantanderApiHealthCheck> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public SantanderApiHealthCheck(
        IConfiguration configuration,
        ILogger<SantanderApiHealthCheck> logger,
        IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>();
        var startTime = DateTime.UtcNow;

        try
        {
            // Verificar configurações
            var clientId = _configuration["Santander:ClientId"];
            var clientSecret = _configuration["Santander:ClientSecret"];
            var certificatePath = _configuration["Santander:CertificatePath"];

            data.Add("ClientIdConfigured", !string.IsNullOrEmpty(clientId));
            data.Add("ClientSecretConfigured", !string.IsNullOrEmpty(clientSecret));
            data.Add("CertificatePathConfigured", !string.IsNullOrEmpty(certificatePath));

            // Verificar se certificado existe
            var certificateExists = false;
            if (!string.IsNullOrEmpty(certificatePath))
            {
                certificateExists = File.Exists(certificatePath);
                data.Add("CertificateExists", certificateExists);
            }

            // Se não tem configuração básica, retornar degraded
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                return HealthCheckResult.Degraded(
                    description: "API Santander não configurada (ClientId ou ClientSecret ausente)",
                    data: data);
            }

            if (!certificateExists)
            {
                return HealthCheckResult.Degraded(
                    description: "Certificado do Santander não encontrado",
                    data: data);
            }

            // Tentar obter token de acesso (teste de conectividade)
            var tokenUrl = _configuration["Santander:TokenUrl"]
                ?? "https://trust-open.api.santander.com.br/auth/oauth/v2/token";

            data.Add("TokenUrl", tokenUrl);

            using var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);

            // Preparar requisição de token
            var tokenRequest = new HttpRequestMessage(HttpMethod.Post, tokenUrl);
            var credentials = Convert.ToBase64String(
                System.Text.Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
            tokenRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            tokenRequest.Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" }
            });

            var response = await httpClient.SendAsync(tokenRequest, cancellationToken);
            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;

            data.Add("ResponseTimeMs", responseTime);
            data.Add("StatusCode", (int)response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenData = JsonDocument.Parse(content);

                if (tokenData.RootElement.TryGetProperty("access_token", out _))
                {
                    data.Add("TokenObtained", true);

                    if (responseTime > 5000)
                    {
                        return HealthCheckResult.Degraded(
                            description: $"API Santander respondendo lentamente ({responseTime:F0}ms)",
                            data: data);
                    }

                    _logger.LogDebug("Santander API health check passed in {Time}ms", responseTime);
                    return HealthCheckResult.Healthy(
                        description: "API Santander operacional",
                        data: data);
                }
            }

            // Resposta não foi sucesso
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            data.Add("ErrorResponse", errorContent.Length > 200 ? errorContent[..200] : errorContent);

            _logger.LogWarning("Santander API returned {StatusCode}: {Error}",
                response.StatusCode, errorContent);

            return HealthCheckResult.Degraded(
                description: $"API Santander retornou status {(int)response.StatusCode}",
                data: data);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Santander API health check failed - network error");
            data.Add("ErrorType", "NetworkError");
            return HealthCheckResult.Unhealthy(
                description: $"Erro de rede ao conectar ao Santander: {ex.Message}",
                exception: ex,
                data: data);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError(ex, "Santander API health check failed - timeout");
            data.Add("ErrorType", "Timeout");
            return HealthCheckResult.Unhealthy(
                description: "Timeout ao conectar à API Santander",
                exception: ex,
                data: data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Santander API health check failed with unexpected error");
            return HealthCheckResult.Unhealthy(
                description: $"Erro inesperado: {ex.Message}",
                exception: ex,
                data: data);
        }
    }
}

