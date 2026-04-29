using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

namespace CrmArrighi.Utils
{
    public static class PasswordResetTableHelper
    {
        public static async Task EnsurePasswordResetTableExistsAsync(CrmArrighiContext context)
        {
            try
            {
                Console.WriteLine("🔄 Verificando tabela PasswordResets...");

                // Verificar se a tabela existe
                var tableExists = await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResets')
                    BEGIN
                        CREATE TABLE [PasswordResets] (
                            [Id] int NOT NULL IDENTITY,
                            [UsuarioId] int NOT NULL,
                            [Token] nvarchar(256) NOT NULL,
                            [DataExpiracao] datetime2 NOT NULL,
                            [Utilizado] bit NOT NULL,
                            [DataUtilizacao] datetime2 NULL,
                            [DataCriacao] datetime2 NOT NULL,
                            CONSTRAINT [PK_PasswordResets] PRIMARY KEY ([Id]),
                            CONSTRAINT [FK_PasswordResets_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
                        );

                        CREATE UNIQUE INDEX [IX_PasswordResets_Token] ON [PasswordResets] ([Token]);
                        CREATE INDEX [IX_PasswordResets_UsuarioId] ON [PasswordResets] ([UsuarioId]);

                        PRINT '✅ Tabela PasswordResets criada com sucesso!';
                    END
                    ELSE
                    BEGIN
                        PRINT '✅ Tabela PasswordResets já existe!';
                    END
                ");

                Console.WriteLine("✅ Tabela PasswordResets verificada/criada com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erro ao criar tabela PasswordResets: {ex.Message}");
                throw;
            }
        }
    }
}

