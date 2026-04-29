using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Data.SqlClient;

namespace CrmArrighi.HealthChecks;

/// <summary>
/// Health Check para SQL Server com verificações detalhadas
/// </summary>
public class SqlServerHealthCheck : IHealthCheck
{
    private readonly string _connectionString;
    private readonly ILogger<SqlServerHealthCheck> _logger;

    public SqlServerHealthCheck(IConfiguration configuration, ILogger<SqlServerHealthCheck> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new ArgumentNullException("ConnectionString:DefaultConnection não configurada");
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

            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);

            // Verificar conexão básica
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync(cancellationToken);

            var connectionTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            data.Add("ConnectionTimeMs", connectionTime);

            // Obter informações do servidor
            command.CommandText = "SELECT @@VERSION";
            var version = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("ServerVersion", version?.ToString()?.Split('\n')[0] ?? "Unknown");

            // Verificar database atual
            command.CommandText = "SELECT DB_NAME()";
            var dbName = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("DatabaseName", dbName?.ToString() ?? "Unknown");

            // Verificar se tabela principal existe (teste de integridade)
            command.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Usuarios'";
            var tableExists = await command.ExecuteScalarAsync(cancellationToken);
            data.Add("MainTableExists", Convert.ToInt32(tableExists) > 0);

            // Verificar contagem de usuários (query simples)
            try
            {
                command.CommandText = "SELECT COUNT(*) FROM Usuarios";
                var userCount = await command.ExecuteScalarAsync(cancellationToken);
                data.Add("UserCount", userCount ?? 0);
            }
            catch
            {
                data.Add("UserCount", "N/A");
            }

            _logger.LogDebug("SQL Server health check passed in {Time}ms", connectionTime);

            // Avaliar se está degradado (conexão lenta)
            if (connectionTime > 1000)
            {
                return HealthCheckResult.Degraded(
                    description: $"SQL Server respondendo lentamente ({connectionTime:F0}ms)",
                    data: data);
            }

            return HealthCheckResult.Healthy(
                description: "SQL Server operacional",
                data: data);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL Server health check failed");
            return HealthCheckResult.Unhealthy(
                description: $"SQL Server não disponível: {ex.Message}",
                exception: ex,
                data: new Dictionary<string, object>
                {
                    { "ErrorNumber", ex.Number },
                    { "ErrorState", ex.State }
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SQL Server health check failed with unexpected error");
            return HealthCheckResult.Unhealthy(
                description: $"Erro inesperado: {ex.Message}",
                exception: ex);
        }
    }
}

