using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace CrmArrighi.HealthChecks;

/// <summary>
/// Health Check para Azure Cache for Redis.
/// Reporta Degraded (não Unhealthy) para não bloquear o deploy caso
/// o Redis esteja temporariamente indisponível — o sistema funciona
/// via fallback em memória.
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(ILogger<RedisHealthCheck> logger, IConnectionMultiplexer? redis = null)
    {
        _redis = redis;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (_redis is null)
        {
            return HealthCheckResult.Degraded(
                "Redis não configurado. Sistema operando com cache em memória.");
        }

        try
        {
            var start = DateTime.UtcNow;
            var db = _redis.GetDatabase();
            await db.PingAsync();
            var latencyMs = (DateTime.UtcNow - start).TotalMilliseconds;

            var data = new Dictionary<string, object>
            {
                { "LatencyMs", Math.Round(latencyMs, 1) },
                { "IsConnected", _redis.IsConnected },
                { "Configuration", _redis.Configuration ?? "N/A" },
            };

            if (latencyMs > 100)
            {
                return HealthCheckResult.Degraded(
                    $"Redis respondendo lentamente ({latencyMs:F0}ms)", data: data);
            }

            return HealthCheckResult.Healthy("Redis operacional", data: data);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis health check falhou — sistema usará cache em memória");
            return HealthCheckResult.Degraded(
                $"Redis indisponível: {ex.Message} — fallback ativo",
                exception: ex);
        }
    }
}
