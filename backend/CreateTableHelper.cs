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

    public static async Task CreateSessoesAtivasTableIfNotExists(CrmArrighiContext context)
    {
        try
        {
            // Verificar se a tabela já existe e criar se necessário
            var tableExists = await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SessoesAtivas' AND xtype='U')
                BEGIN
                    CREATE TABLE [dbo].[SessoesAtivas](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [UsuarioId] [int] NOT NULL,
                        [NomeUsuario] [nvarchar](100) NOT NULL,
                        [Email] [nvarchar](100) NOT NULL,
                        [Perfil] [nvarchar](50) NOT NULL,
                        [InicioSessao] [datetime2](7) NOT NULL,
                        [UltimaAtividade] [datetime2](7) NOT NULL,
                        [EnderecoIP] [nvarchar](45) NOT NULL,
                        [UserAgent] [nvarchar](500) NOT NULL,
                        [TokenSessao] [nvarchar](255) NOT NULL,
                        [Ativa] [bit] NOT NULL DEFAULT 1,
                        CONSTRAINT [PK_SessoesAtivas] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    -- Criar índice na coluna UsuarioId
                    CREATE NONCLUSTERED INDEX [IX_SessoesAtivas_UsuarioId] ON [dbo].[SessoesAtivas] ([UsuarioId] ASC);

                    -- Adicionar foreign key para Usuarios
                    ALTER TABLE [dbo].[SessoesAtivas]
                    ADD CONSTRAINT [FK_SessoesAtivas_Usuarios_UsuarioId]
                    FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE CASCADE;

                    PRINT 'Tabela SessoesAtivas criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela SessoesAtivas já existe.';
                END
            ");

            Console.WriteLine("Tabela SessoesAtivas criada/verificada com sucesso!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao criar tabela SessoesAtivas: {ex.Message}");
        }
    }

    public static async Task CreateDocumentosPortalTableIfNotExists(CrmArrighiContext context)
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DocumentosPortal' AND xtype='U')
                BEGIN
                    CREATE TABLE [dbo].[DocumentosPortal](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [ClienteId] [int] NOT NULL,
                        [Nome] [nvarchar](500) NOT NULL,
                        [Tipo] [nvarchar](50) NOT NULL DEFAULT 'outros',
                        [Descricao] [nvarchar](2000) NULL,
                        [NomeArquivoBlobStorage] [nvarchar](1000) NOT NULL,
                        [NomeArquivoOriginal] [nvarchar](500) NULL,
                        [Formato] [nvarchar](20) NOT NULL DEFAULT '',
                        [ContentType] [nvarchar](200) NULL,
                        [Tamanho] [bigint] NOT NULL DEFAULT 0,
                        [Status] [nvarchar](30) NOT NULL DEFAULT 'ativo',
                        [ContratoId] [int] NULL,
                        [EnviadoPor] [nvarchar](30) NOT NULL DEFAULT 'cliente',
                        [DataUpload] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
                        [DataAtualizacao] [datetime2](7) NULL,
                        CONSTRAINT [PK_DocumentosPortal] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    CREATE NONCLUSTERED INDEX [IX_DocumentosPortal_ClienteId] ON [dbo].[DocumentosPortal] ([ClienteId] ASC);
                    CREATE NONCLUSTERED INDEX [IX_DocumentosPortal_Tipo] ON [dbo].[DocumentosPortal] ([Tipo] ASC);
                    CREATE NONCLUSTERED INDEX [IX_DocumentosPortal_DataUpload] ON [dbo].[DocumentosPortal] ([DataUpload] DESC);

                    ALTER TABLE [dbo].[DocumentosPortal]
                    ADD CONSTRAINT [FK_DocumentosPortal_Clientes_ClienteId]
                    FOREIGN KEY([ClienteId]) REFERENCES [dbo].[Clientes] ([Id]);

                    PRINT 'Tabela DocumentosPortal criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT 'Tabela DocumentosPortal ja existe.';
                END
            ");

            Console.WriteLine("Tabela DocumentosPortal criada/verificada com sucesso!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao criar tabela DocumentosPortal: {ex.Message}");
        }
    }

    public static async Task CreateHistoricoClientesTableIfNotExists(CrmArrighiContext context)
    {
        try
        {
            // Verificar se a tabela já existe e criar se necessário
            var tableExists = await context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='HistoricoClientes' AND xtype='U')
                BEGIN
                    CREATE TABLE [dbo].[HistoricoClientes](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [ClienteId] [int] NOT NULL,
                        [TipoAcao] [nvarchar](50) NOT NULL,
                        [Descricao] [nvarchar](500) NOT NULL,
                        [DadosAnteriores] [nvarchar](2000) NULL,
                        [DadosNovos] [nvarchar](2000) NULL,
                        [UsuarioId] [int] NOT NULL,
                        [NomeUsuario] [nvarchar](200) NULL,
                        [DataHora] [datetime2](7) NOT NULL DEFAULT GETDATE(),
                        [EnderecoIP] [nvarchar](100) NULL,
                        CONSTRAINT [PK_HistoricoClientes] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    -- Criar índices para performance
                    CREATE NONCLUSTERED INDEX [IX_HistoricoClientes_ClienteId] ON [dbo].[HistoricoClientes] ([ClienteId] ASC);
                    CREATE NONCLUSTERED INDEX [IX_HistoricoClientes_UsuarioId] ON [dbo].[HistoricoClientes] ([UsuarioId] ASC);
                    CREATE NONCLUSTERED INDEX [IX_HistoricoClientes_DataHora] ON [dbo].[HistoricoClientes] ([DataHora] DESC);
                    CREATE NONCLUSTERED INDEX [IX_HistoricoClientes_TipoAcao] ON [dbo].[HistoricoClientes] ([TipoAcao] ASC);

                    -- Adicionar foreign keys
                    ALTER TABLE [dbo].[HistoricoClientes]
                    ADD CONSTRAINT [FK_HistoricoClientes_Clientes_ClienteId]
                    FOREIGN KEY([ClienteId]) REFERENCES [dbo].[Clientes] ([Id]) ON DELETE CASCADE;

                    ALTER TABLE [dbo].[HistoricoClientes]
                    ADD CONSTRAINT [FK_HistoricoClientes_Usuarios_UsuarioId]
                    FOREIGN KEY([UsuarioId]) REFERENCES [dbo].[Usuarios] ([Id]);

                    PRINT '✅ Tabela HistoricoClientes criada com sucesso!';
                END
                ELSE
                BEGIN
                    PRINT '✅ Tabela HistoricoClientes já existe.';
                END
            ");

            Console.WriteLine("✅ Tabela HistoricoClientes criada/verificada com sucesso!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Erro ao criar tabela HistoricoClientes: {ex.Message}");
        }
    }
}
