using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

namespace CrmArrighi.Helpers
{
    public static class CreateGruposAcessoTableHelper
    {
        public static async Task CreateGruposAcessoTablesIfNotExists(CrmArrighiContext context)
        {
            var sql = @"
                -- Criar tabela GruposAcesso
                IF OBJECT_ID('dbo.GruposAcesso', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[GruposAcesso] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [Nome] nvarchar(100) NOT NULL,
                        [Descricao] nvarchar(500) NULL,
                        [Ativo] bit NOT NULL DEFAULT 1,
                        [DataCadastro] datetime2 NOT NULL DEFAULT GETDATE(),
                        [DataAtualizacao] datetime2 NULL,
                        CONSTRAINT [PK_GruposAcesso] PRIMARY KEY ([Id])
                    );

                    CREATE UNIQUE INDEX [IX_GruposAcesso_Nome] ON [dbo].[GruposAcesso] ([Nome]);
                    PRINT 'Tabela GruposAcesso criada com sucesso!';
                END

                -- Criar tabela Permissoes
                IF OBJECT_ID('dbo.Permissoes', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[Permissoes] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [Nome] nvarchar(100) NOT NULL,
                        [Descricao] nvarchar(500) NULL,
                        [Modulo] nvarchar(100) NOT NULL,
                        [Acao] nvarchar(100) NOT NULL,
                        [Ativo] bit NOT NULL DEFAULT 1,
                        [DataCadastro] datetime2 NOT NULL DEFAULT GETDATE(),
                        [DataAtualizacao] datetime2 NULL,
                        CONSTRAINT [PK_Permissoes] PRIMARY KEY ([Id])
                    );

                    CREATE UNIQUE INDEX [IX_Permissoes_Modulo_Acao] ON [dbo].[Permissoes] ([Modulo], [Acao]);
                    PRINT 'Tabela Permissoes criada com sucesso!';
                END

                -- Criar tabela PermissoesGrupos
                IF OBJECT_ID('dbo.PermissoesGrupos', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[PermissoesGrupos] (
                        [Id] int IDENTITY(1,1) NOT NULL,
                        [GrupoAcessoId] int NOT NULL,
                        [PermissaoId] int NOT NULL,
                        [ApenasProprios] bit NOT NULL DEFAULT 0,
                        [ApenasFilial] bit NOT NULL DEFAULT 0,
                        [ApenasLeitura] bit NOT NULL DEFAULT 0,
                        [IncluirSituacoesEspecificas] bit NOT NULL DEFAULT 0,
                        [SituacoesEspecificas] nvarchar(500) NULL,
                        [DataCadastro] datetime2 NOT NULL DEFAULT GETDATE(),
                        CONSTRAINT [PK_PermissoesGrupos] PRIMARY KEY ([Id])
                    );

                    CREATE UNIQUE INDEX [IX_PermissoesGrupos_GrupoAcessoId_PermissaoId]
                    ON [dbo].[PermissoesGrupos] ([GrupoAcessoId], [PermissaoId]);

                    ALTER TABLE [dbo].[PermissoesGrupos]
                    ADD CONSTRAINT [FK_PermissoesGrupos_GruposAcesso_GrupoAcessoId]
                    FOREIGN KEY ([GrupoAcessoId]) REFERENCES [dbo].[GruposAcesso] ([Id]) ON DELETE CASCADE;

                    ALTER TABLE [dbo].[PermissoesGrupos]
                    ADD CONSTRAINT [FK_PermissoesGrupos_Permissoes_PermissaoId]
                    FOREIGN KEY ([PermissaoId]) REFERENCES [dbo].[Permissoes] ([Id]) ON DELETE CASCADE;

                    PRINT 'Tabela PermissoesGrupos criada com sucesso!';
                END
                ELSE
                BEGIN
                    -- Adicionar colunas se não existirem (para tabelas já criadas)
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasProprios')
                    BEGIN
                        ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasProprios] bit NOT NULL DEFAULT 0;
                        PRINT 'Coluna ApenasProprios adicionada à tabela PermissoesGrupos.';
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasFilial')
                    BEGIN
                        ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasFilial] bit NOT NULL DEFAULT 0;
                        PRINT 'Coluna ApenasFilial adicionada à tabela PermissoesGrupos.';
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasLeitura')
                    BEGIN
                        ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasLeitura] bit NOT NULL DEFAULT 0;
                        PRINT 'Coluna ApenasLeitura adicionada à tabela PermissoesGrupos.';
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'IncluirSituacoesEspecificas')
                    BEGIN
                        ALTER TABLE [dbo].[PermissoesGrupos] ADD [IncluirSituacoesEspecificas] bit NOT NULL DEFAULT 0;
                        PRINT 'Coluna IncluirSituacoesEspecificas adicionada à tabela PermissoesGrupos.';
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'SituacoesEspecificas')
                    BEGIN
                        ALTER TABLE [dbo].[PermissoesGrupos] ADD [SituacoesEspecificas] nvarchar(500) NULL;
                        PRINT 'Coluna SituacoesEspecificas adicionada à tabela PermissoesGrupos.';
                    END
                END

                -- Adicionar colunas na tabela Usuarios se não existirem
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'GrupoAcessoId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios] ADD [GrupoAcessoId] int NULL;
                    PRINT 'Coluna GrupoAcessoId adicionada à tabela Usuarios.';
                END

                -- Remover coluna GrupoAcesso string se existir (substituída por GrupoAcessoId)
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'GrupoAcesso')
                BEGIN
                    -- Primeiro remover foreign key se existir
                    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuarios_GrupoAcesso')
                    BEGIN
                        ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT [FK_Usuarios_GrupoAcesso];
                    END

                    ALTER TABLE [dbo].[Usuarios] DROP COLUMN [GrupoAcesso];
                    PRINT 'Coluna GrupoAcesso (string) removida da tabela Usuarios.';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'FilialId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios] ADD [FilialId] int NULL;
                    PRINT 'Coluna FilialId adicionada à tabela Usuarios.';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'ConsultorId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios] ADD [ConsultorId] int NULL;
                    PRINT 'Coluna ConsultorId adicionada à tabela Usuarios.';
                END

                -- Adicionar foreign keys para Usuarios
                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuarios_GruposAcesso_GrupoAcessoId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios]
                    ADD CONSTRAINT [FK_Usuarios_GruposAcesso_GrupoAcessoId]
                    FOREIGN KEY ([GrupoAcessoId]) REFERENCES [dbo].[GruposAcesso] ([Id]);
                    PRINT 'Foreign key FK_Usuarios_GruposAcesso_GrupoAcessoId criada.';
                END

                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuarios_Filiais_FilialId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios]
                    ADD CONSTRAINT [FK_Usuarios_Filiais_FilialId]
                    FOREIGN KEY ([FilialId]) REFERENCES [dbo].[Filiais] ([Id]);
                    PRINT 'Foreign key FK_Usuarios_Filiais_FilialId criada.';
                END

                IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Usuarios_Consultores_ConsultorId')
                BEGIN
                    ALTER TABLE [dbo].[Usuarios]
                    ADD CONSTRAINT [FK_Usuarios_Consultores_ConsultorId]
                    FOREIGN KEY ([ConsultorId]) REFERENCES [dbo].[Consultores] ([Id]);
                    PRINT 'Foreign key FK_Usuarios_Consultores_ConsultorId criada.';
                END

                PRINT 'Script de criação de tabelas de Grupos de Acesso executado com sucesso!';
            ";

            try
            {
                await context.Database.ExecuteSqlRawAsync(sql);
                Console.WriteLine("Tabelas de Grupos de Acesso criadas/verificadas com sucesso!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao criar tabelas de Grupos de Acesso: {ex.Message}");
                // Não lançar exceção para permitir que o aplicativo continue
            }
        }
    }
}
