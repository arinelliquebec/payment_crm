-- Script para adicionar colunas faltantes na tabela PermissoesGrupos

-- Adicionar coluna ApenasProprios se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasProprios')
BEGIN
    ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasProprios] bit NOT NULL DEFAULT 0;
    PRINT 'Coluna ApenasProprios adicionada à tabela PermissoesGrupos.';
END

-- Adicionar coluna ApenasFilial se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasFilial')
BEGIN
    ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasFilial] bit NOT NULL DEFAULT 0;
    PRINT 'Coluna ApenasFilial adicionada à tabela PermissoesGrupos.';
END

-- Adicionar coluna ApenasLeitura se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'ApenasLeitura')
BEGIN
    ALTER TABLE [dbo].[PermissoesGrupos] ADD [ApenasLeitura] bit NOT NULL DEFAULT 0;
    PRINT 'Coluna ApenasLeitura adicionada à tabela PermissoesGrupos.';
END

-- Adicionar coluna IncluirSituacoesEspecificas se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'IncluirSituacoesEspecificas')
BEGIN
    ALTER TABLE [dbo].[PermissoesGrupos] ADD [IncluirSituacoesEspecificas] bit NOT NULL DEFAULT 0;
    PRINT 'Coluna IncluirSituacoesEspecificas adicionada à tabela PermissoesGrupos.';
END

-- Adicionar coluna SituacoesEspecificas se não existir
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PermissoesGrupos') AND name = 'SituacoesEspecificas')
BEGIN
    ALTER TABLE [dbo].[PermissoesGrupos] ADD [SituacoesEspecificas] nvarchar(500) NULL;
    PRINT 'Coluna SituacoesEspecificas adicionada à tabela PermissoesGrupos.';
END

PRINT 'Script de correção da tabela PermissoesGrupos executado com sucesso!';
