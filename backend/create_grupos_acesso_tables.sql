-- Script para criar as tabelas de Grupos de Acesso, Permissões e relacionamentos

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

    -- Criar índice único para Nome
    CREATE UNIQUE INDEX [IX_GruposAcesso_Nome] ON [dbo].[GruposAcesso] ([Nome]);

    PRINT 'Tabela GruposAcesso criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela GruposAcesso já existe.';
END
GO

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

    -- Criar índice único para Modulo + Acao
    CREATE UNIQUE INDEX [IX_Permissoes_Modulo_Acao] ON [dbo].[Permissoes] ([Modulo], [Acao]);

    PRINT 'Tabela Permissoes criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela Permissoes já existe.';
END
GO

-- Criar tabela PermissoesGrupos (tabela de relacionamento)
IF OBJECT_ID('dbo.PermissoesGrupos', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PermissoesGrupos] (
        [Id] int IDENTITY(1,1) NOT NULL,
        [GrupoAcessoId] int NOT NULL,
        [PermissaoId] int NOT NULL,
        [DataCadastro] datetime2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_PermissoesGrupos] PRIMARY KEY ([Id])
    );

    -- Criar índice único para evitar duplicação
    CREATE UNIQUE INDEX [IX_PermissoesGrupos_GrupoAcessoId_PermissaoId]
    ON [dbo].[PermissoesGrupos] ([GrupoAcessoId], [PermissaoId]);

    -- Criar foreign keys
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
    PRINT 'Tabela PermissoesGrupos já existe.';
END
GO

-- Adicionar colunas na tabela Usuarios se não existirem
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuarios') AND name = 'GrupoAcessoId')
BEGIN
    ALTER TABLE [dbo].[Usuarios] ADD [GrupoAcessoId] int NULL;
    PRINT 'Coluna GrupoAcessoId adicionada à tabela Usuarios.';
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
GO

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
GO

PRINT 'Script executado com sucesso! Tabelas de Grupos de Acesso criadas.';
