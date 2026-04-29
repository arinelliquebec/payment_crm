using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using System;
using System.Threading.Tasks;

namespace CrmArrighi.Utils
{
    /// <summary>
    /// Helper para executar migrations programaticamente
    /// </summary>
    public class ExecuteMigrationHelper
    {
        /// <summary>
        /// Executa a migration AddDataHoraOfflineToSessaoAtiva manualmente via SQL
        /// </summary>
        public static async Task ExecuteAddDataHoraOfflineMigrationAsync(CrmArrighiContext context)
        {
            try
            {
                Console.WriteLine("🔄 Verificando se a coluna DataHoraOffline existe...");

                // Verificar se a migration já foi aplicada
                var migrationExists = await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (
                        SELECT * FROM [__EFMigrationsHistory]
                        WHERE [MigrationId] = N'20251003123534_AddDataHoraOfflineToSessaoAtiva'
                    )
                    BEGIN
                        -- Verificar se a coluna já existe
                        IF NOT EXISTS (
                            SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                            WHERE TABLE_NAME = 'SessoesAtivas'
                            AND COLUMN_NAME = 'DataHoraOffline'
                        )
                        BEGIN
                            ALTER TABLE [SessoesAtivas] ADD [DataHoraOffline] datetime2 NULL;
                            PRINT '✅ Coluna DataHoraOffline adicionada com sucesso';
                        END
                        ELSE
                        BEGIN
                            PRINT 'ℹ️  Coluna DataHoraOffline já existe';
                        END

                        -- Registrar migration
                        INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
                        VALUES (N'20251003123534_AddDataHoraOfflineToSessaoAtiva', N'8.0.0');

                        PRINT '✅ Migration registrada no histórico';
                    END
                    ELSE
                    BEGIN
                        PRINT 'ℹ️  Migration já foi aplicada anteriormente';
                    END
                ");

                Console.WriteLine("✅ Migration executada com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao executar migration: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Aplica todas as migrations pendentes
        /// </summary>
        public static async Task ApplyAllPendingMigrationsAsync(CrmArrighiContext context)
        {
            try
            {
                Console.WriteLine("🔄 Aplicando migrations pendentes...");
                await context.Database.MigrateAsync();
                Console.WriteLine("✅ Todas as migrations foram aplicadas com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao aplicar migrations: {ex.Message}");
                Console.WriteLine("ℹ️  Tentando aplicar migration específica manualmente...");
                await ExecuteAddDataHoraOfflineMigrationAsync(context);
            }
        }
    }
}


