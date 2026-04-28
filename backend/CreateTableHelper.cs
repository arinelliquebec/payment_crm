using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

public static class CreateTableHelper
{
    public static async Task CreateParceirosTableIfNotExists(CrmArrighiContext context)
    {
        try
        {
            // Verificar se a tabela já existe
            var tableExists = await context.Database.ExecuteSqlRawAsync(@"
                IF OBJECT_ID('dbo.Parceiros', 'U') IS NULL
                BEGIN
                    -- Criar tabela Parceiros
                    CREATE TABLE [dbo].[Parceiros] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [PessoaFisicaId] int NOT NULL,
                        [FilialId] int NOT NULL,
                        [OAB] nvarchar(20) NULL,
                        [DataCadastro] datetime2 NOT NULL,
                        [DataAtualizacao] datetime2 NULL,
                        [Ativo] bit NOT NULL,
                        CONSTRAINT [PK_Parceiros] PRIMARY KEY ([Id])
                    );

                    -- Criar índices
                    CREATE INDEX [IX_Parceiros_FilialId] ON [dbo].[Parceiros] ([FilialId]);
                    CREATE UNIQUE INDEX [IX_Parceiros_PessoaFisicaId] ON [dbo].[Parceiros] ([PessoaFisicaId]);

                    -- Criar foreign keys
                    ALTER TABLE [dbo].[Parceiros] ADD CONSTRAINT [FK_Parceiros_Filiais_FilialId]
                        FOREIGN KEY ([FilialId]) REFERENCES [dbo].[Filiais] ([Id]);

                    ALTER TABLE [dbo].[Parceiros] ADD CONSTRAINT [FK_Parceiros_PessoasFisicas_PessoaFisicaId]
                        FOREIGN KEY ([PessoaFisicaId]) REFERENCES [dbo].[PessoasFisicas] ([Id]);

                    PRINT 'Tabela Parceiros criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela Parceiros já existe.';
                END
            ");

            Console.WriteLine("Script SQL executado com sucesso!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao criar tabela Parceiros: {ex.Message}");
        }
    }
}
