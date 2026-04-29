using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;
using System.Text.Json;

namespace CrmArrighi.Services
{
    /// <summary>
    /// Implementação de ICacheService usando Redis (IDistributedCache) com fallback
    /// automático para IMemoryCache quando o Redis estiver indisponível.
    ///
    /// Estratégia de TTL padrão:
    ///   - Dashboard / KPIs  → 5 min
    ///   - Tokens Santander  → 13 min (configurado no SantanderBoletoService)
    ///   - Dados do portal   → 5 min
    /// </summary>
    public class CacheService : ICacheService
    {
        private readonly IDistributedCache _distributed;
        private readonly IMemoryCache _memory;
        private readonly ILogger<CacheService> _logger;
        private readonly IConnectionMultiplexer? _redis;

        private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(5);

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
        };

        public CacheService(
            IDistributedCache distributed,
            IMemoryCache memory,
            ILogger<CacheService> logger,
            IConnectionMultiplexer? redis = null)
        {
            _distributed = distributed;
            _memory = memory;
            _logger = logger;
            _redis = redis;
        }

        public bool IsRedisAvailable =>
            _redis is not null && _redis.IsConnected;

        // ─── GET ──────────────────────────────────────────────────────────────

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                if (IsRedisAvailable)
                {
                    var bytes = await _distributed.GetAsync(key);
                    if (bytes is null) return default;
                    return JsonSerializer.Deserialize<T>(bytes, JsonOptions);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Redis GET falhou para '{Key}'. Usando memória.", key);
            }

            // fallback: memória
            _memory.TryGetValue(key, out T? value);
            return value;
        }

        // ─── SET ──────────────────────────────────────────────────────────────

        public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null)
        {
            var expiry = ttl ?? DefaultTtl;

            try
            {
                if (IsRedisAvailable)
                {
                    var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
                    await _distributed.SetAsync(key, bytes, new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = expiry,
                    });
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Redis SET falhou para '{Key}'. Usando memória.", key);
            }

            // fallback: memória
            _memory.Set(key, value, expiry);
        }

        // ─── GET-OR-SET ───────────────────────────────────────────────────────

        public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null)
        {
            var cached = await GetAsync<T>(key);
            if (cached is not null)
                return cached;

            var result = await factory();
            await SetAsync(key, result, ttl);
            return result;
        }

        // ─── REMOVE ───────────────────────────────────────────────────────────

        public async Task RemoveAsync(string key)
        {
            try
            {
                if (IsRedisAvailable)
                {
                    await _distributed.RemoveAsync(key);
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Redis REMOVE falhou para '{Key}'.", key);
            }

            _memory.Remove(key);
        }

        // ─── REMOVE BY PREFIX ─────────────────────────────────────────────────

        public async Task RemoveByPrefixAsync(string prefix)
        {
            if (!IsRedisAvailable || _redis is null)
            {
                // MemoryCache não suporta prefixo nativamente; ignoramos silenciosamente.
                _logger.LogDebug("RemoveByPrefix ignorado (Redis indisponível): {Prefix}", prefix);
                return;
            }

            try
            {
                foreach (var server in _redis.GetServers())
                {
                    if (server.IsConnected)
                    {
                        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
                        if (keys.Length == 0) return;

                        var db = _redis.GetDatabase();
                        await db.KeyDeleteAsync(keys);
                        _logger.LogInformation("🗑️ Redis: {Count} chave(s) removidas com prefixo '{Prefix}'", keys.Length, prefix);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "⚠️ Redis RemoveByPrefix falhou para '{Prefix}'.", prefix);
            }
        }
    }
}
