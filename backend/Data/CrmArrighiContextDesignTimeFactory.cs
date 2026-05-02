using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

namespace CrmArrighi.Data
{
    /// <summary>
    /// Permite executar comandos <c>dotnet ef</c> sem subir o host ASP.NET Core.
    /// Usa apenas variáveis de ambiente, com a mesma prioridade que <c>GetPostgreSqlConnectionString</c> em <c>Program.cs</c>.
    /// </summary>
    public sealed class CrmArrighiContextDesignTimeFactory : IDesignTimeDbContextFactory<CrmArrighiContext>
    {
        public CrmArrighiContext CreateDbContext(string[] args)
        {
            var connectionString = ResolveConnectionStringFromEnvironment();
            var options = new DbContextOptionsBuilder<CrmArrighiContext>()
                .UseNpgsql(connectionString)
                // Em design-time aplicamos apenas as migrações existentes; eventual drift
                // entre o modelo C# e o snapshot é tratado em migrações dedicadas e
                // não deve bloquear `dotnet ef database update` neste fluxo.
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))
                .Options;
            return new CrmArrighiContext(options);
        }

        private static string ResolveConnectionStringFromEnvironment()
        {
            var configured = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (!string.IsNullOrWhiteSpace(configured) &&
                !configured.Contains("Server=", StringComparison.OrdinalIgnoreCase) &&
                !configured.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
            {
                return configured;
            }

            var host = Environment.GetEnvironmentVariable("PGHOST");
            var user = Environment.GetEnvironmentVariable("PGUSER");
            var database = Environment.GetEnvironmentVariable("PGDATABASE");
            var password = Environment.GetEnvironmentVariable("PGPASSWORD");
            var pgPort = Environment.GetEnvironmentVariable("PGPORT");

            if (string.IsNullOrWhiteSpace(host) ||
                string.IsNullOrWhiteSpace(user) ||
                string.IsNullOrWhiteSpace(database))
            {
                // Modo "offline" para tooling que só precisa do modelo (migrations add).
                // Comandos que abrem conexão (database update) falharão com erro claro do Npgsql.
                return "Host=localhost;Port=5432;Database=design_time;Username=design_time;Password=design_time";
            }

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = int.TryParse(pgPort, out var port) ? port : 5432,
                Database = database,
                Username = user,
                Password = password,
                SslMode = SslMode.Require,
                Pooling = true
            };

            return builder.ConnectionString;
        }
    }
}
