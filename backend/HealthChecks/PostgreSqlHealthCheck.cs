using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;

namespace CrmArrighi.HealthChecks;

/// <summary>
/// Health Check para PostgreSQL com verificações detalhadas
/// </summary>
public class PostgreSqlHealthCheck : IHealthCheck
{
    private readonly string _connectionString;
    private readonly ILogger<PostgreSqlHealthCheck> _logger;

    public PostgreSqlHealthCheck(IConfiguration configuration, ILogger<PostgreSqlHealthCheck> logger)
    {
        _connectionString = BuildConnectionString(configuration);
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var data = new Dictionary<string, object>();
            var startTime = DateTime.UtcNow;

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            // Verificar conexão básica
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync(cancellationToken);

            var connectionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            data.Add("ConnectionTimeMs", connectionTime);

            // Obter informações do servidor
            command.CommandText = "SELECT version()";
            var version = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("ServerVersion", version?.ToString()?.Split('\n')[0] ?? "Unknown");

            // Verificar database atual
            command.CommandText = "SELECT current_database()";
            var dbName = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("DatabaseName", dbName?.ToString() ?? "Unknown");

            // Verificar se tabela principal existe (teste de integridade)
            command.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'Usuarios'";
            var tableExists = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("MainTableExists", Convert.ToInt32(tableExists) > 0);

            // Verificar contagem de usuários (query simples)
            try
            {
                command.CommandText = "SELECT COUNT(*) FROM \"Usuarios\"";
                var userCount = await command.ExecuteScalarAsync(cancellationToken);
                data.Add("UserCount", userCount ?? 0);
            }
            catch
            {
                data.Add("UserCount", "N/A");
            }

            _logger.LogDebug("PostgreSQL health check passed in {Time}ms", connectionTime);

            // Avaliar se está degradado (conexão lenta)
            if (connectionTime > 1000)
            {
                return HealthCheckResult.Degraded(
                    description: $"PostgreSQL respondendo lentamente ({connectionTime:F0}ms)",
                    data: data);
            }

            return HealthCheckResult.Healthy(
                description: "PostgreSQL operacional",
                data: data);
        }
        catch (PostgresException ex)
        {
            _logger.LogError(ex, "PostgreSQL health check failed");
            return HealthCheckResult.Unhealthy(
                description: $"PostgreSQL não disponível: {ex.Message}",
                exception: ex,
                data: new Dictionary<string, object>
                {
                    { "SqlState", ex.SqlState },
                    { "Severity", ex.Severity }
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PostgreSQL health check failed with unexpected error");
            return HealthCheckResult.Unhealthy(
                description: $"Erro inesperado: {ex.Message}",
                exception: ex);
        }
    }

    private static string BuildConnectionString(IConfiguration configuration)
    {
        var configuredConnectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(configuredConnectionString) &&
            !configuredConnectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase) &&
            !configuredConnectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
        {
            return configuredConnectionString;
        }

        var host = configuration["PGHOST"];
        var user = configuration["PGUSER"];
        var database = configuration["PGDATABASE"];
        var password = configuration["PGPASSWORD"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(user) ||
            string.IsNullOrWhiteSpace(database))
        {
            throw new ArgumentNullException("PGHOST/PGUSER/PGDATABASE", "Variáveis PostgreSQL não configuradas");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = int.TryParse(configuration["PGPORT"], out var port) ? port : 5432,
            Database = database,
            Username = user,
            Password = password,
            SslMode = SslMode.Require,
            Pooling = true
        };

        return builder.ConnectionString;
    }
}

