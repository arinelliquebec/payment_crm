-- Migration: Criar tabela LogsAtividades
-- Data: 2024
-- Descrição: Tabela para armazenar logs de atividades dos usuários no sistema

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LogsAtividades' and xtype='U')
BEGIN
    CREATE TABLE [dbo].[LogsAtividades] (
        [Id] INT IDENTITY(1,1) NOT NULL,
        [UsuarioId] INT NOT NULL,
        [UsuarioNome] NVARCHAR(200) NOT NULL,
        [Acao] NVARCHAR(500) NOT NULL,
        [Tipo] NVARCHAR(50) NOT NULL DEFAULT 'info',
        [Detalhes] NVARCHAR(1000) NULL,
        [ModuloOrigem] NVARCHAR(100) NULL,
        [DataHora] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [Ativo] BIT NOT NULL DEFAULT 1,
        
        CONSTRAINT [PK_LogsAtividades] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_LogsAtividades_Usuarios] FOREIGN KEY([UsuarioId]) 
            REFERENCES [dbo].[Usuarios] ([Id]) ON DELETE NO ACTION
    );

    -- Índices para performance
    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_UsuarioId] 
        ON [dbo].[LogsAtividades]([UsuarioId] ASC);
    
    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_DataHora] 
        ON [dbo].[LogsAtividades]([DataHora] DESC);
    
    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_Ativo] 
        ON [dbo].[LogsAtividades]([Ativo] ASC);

    PRINT '✅ Tabela LogsAtividades criada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela LogsAtividades já existe';
END
GO

