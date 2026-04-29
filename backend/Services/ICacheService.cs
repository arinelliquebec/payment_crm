namespace CrmArrighi.Services
{
    /// <summary>
    /// Serviço de cache distribuído (Redis) com fallback para memória.
    /// </summary>
    public interface ICacheService
    {
        /// <summary>Retorna o valor em cache ou null se não existir.</summary>
        Task<T?> GetAsync<T>(string key);

        /// <summary>Armazena um valor no cache com TTL opcional.</summary>
        Task SetAsync<T>(string key, T value, TimeSpan? ttl = null);

        /// <summary>
        /// Padrão Get-or-Set: retorna do cache se existir; caso contrário executa
        /// a factory, armazena o resultado e o retorna.
        /// </summary>
        Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null);

        /// <summary>Remove uma entrada do cache.</summary>
        Task RemoveAsync(string key);

        /// <summary>Remove todas as entradas cujo prefixo corresponda ao informado.</summary>
        Task RemoveByPrefixAsync(string prefix);

        /// <summary>Indica se o Redis está disponível no momento.</summary>
        bool IsRedisAvailable { get; }
    }
}
