using Microsoft.Extensions.Diagnostics.HealthChecks;
using Azure.Storage.Blobs;

namespace CrmArrighi.HealthChecks;

/// <summary>
/// Health Check para Azure Blob Storage
/// </summary>
public class AzureStorageHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AzureStorageHealthCheck> _logger;

    public AzureStorageHealthCheck(
        IConfiguration configuration,
        ILogger<AzureStorageHealthCheck> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var data = new Dictionary<string, object>();
        var startTime = DateTime.UtcNow;

        try
        {
            var connectionString = _configuration["AzureStorage:ConnectionString"];
            var containerName = _configuration["AzureStorage:ContainerName"] ?? "contratos";

            data.Add("ContainerName", containerName);
            data.Add("ConnectionStringConfigured", !string.IsNullOrEmpty(connectionString));

            // Verificar se está configurado
            if (string.IsNullOrEmpty(connectionString))
            {
                return HealthCheckResult.Degraded(
                    description: "Azure Storage não configurado (ConnectionString ausente)",
                    data: data);
            }

            // Verificar se é a connection string de desenvolvimento
            if (connectionString.Contains("UseDevelopmentStorage=true") ||
                connectionString.Contains("devstoreaccount1"))
            {
                data.Add("Environment", "Development/Emulator");
                return HealthCheckResult.Degraded(
                    description: "Azure Storage usando emulador local",
                    data: data);
            }

            data.Add("Environment", "Production");

            // Conectar ao Azure Blob Storage
            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

            // Verificar se container existe
            var containerExists = await containerClient.ExistsAsync(cancellationToken);
            data.Add("ContainerExists", containerExists.Value);

            var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            data.Add("ResponseTimeMs", responseTime);

            if (!containerExists.Value)
            {
                return HealthCheckResult.Degraded(
                    description: $"Container '{containerName}' não existe",
                    data: data);
            }

            // Obter propriedades do container
            var properties = await containerClient.GetPropertiesAsync(cancellationToken: cancellationToken);
            data.Add("LastModified", properties.Value.LastModified.ToString("o"));

            // Contar blobs (limitado a performance)
            var blobCount = 0;
            await foreach (var _ in containerClient.GetBlobsAsync(cancellationToken: cancellationToken).Take(100))
            {
                blobCount++;
            }
            data.Add("BlobCount", blobCount >= 100 ? "100+" : blobCount.ToString());

            // Obter account info
            var accountInfo = await blobServiceClient.GetAccountInfoAsync(cancellationToken);
            data.Add("AccountKind", accountInfo.Value.AccountKind.ToString());
            data.Add("SkuName", accountInfo.Value.SkuName.ToString());

            _logger.LogDebug("Azure Storage health check passed in {Time}ms", responseTime);

            if (responseTime > 3000)
            {
                return HealthCheckResult.Degraded(
                    description: $"Azure Storage respondendo lentamente ({responseTime:F0}ms)",
                    data: data);
            }

            return HealthCheckResult.Healthy(
                description: "Azure Storage operacional",
                data: data);
        }
        catch (Azure.RequestFailedException ex)
        {
            _logger.LogError(ex, "Azure Storage health check failed");
            return HealthCheckResult.Unhealthy(
                description: $"Erro ao acessar Azure Storage: {ex.Message}",
                exception: ex,
                data: new Dictionary<string, object>
                {
                    { "ErrorCode", ex.ErrorCode ?? "Unknown" },
                    { "Status", ex.Status }
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure Storage health check failed with unexpected error");
            return HealthCheckResult.Unhealthy(
                description: $"Erro inesperado: {ex.Message}",
                exception: ex,
                data: data);
        }
    }
}

// Extension method para Take em IAsyncEnumerable
public static class AsyncEnumerableExtensions
{
    public static async IAsyncEnumerable<T> Take<T>(
        this IAsyncEnumerable<T> source,
        int count,
        [System.Runtime.CompilerServices.EnumeratorCancellation]
        System.Threading.CancellationToken cancellationToken = default)
    {
        var taken = 0;
        await foreach (var item in source.WithCancellation(cancellationToken))
        {
            yield return item;
            if (++taken >= count) break;
        }
    }
}

