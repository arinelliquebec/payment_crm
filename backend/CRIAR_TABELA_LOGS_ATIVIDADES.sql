-- ========================================
-- Script: Criar Tabela LogsAtividades
-- Descrição: Cria a tabela para rastrear logs de atividades dos usuários
-- Data: 07/11/2025
-- ========================================

-- Verificar se a tabela já existe
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LogsAtividades]') AND type in (N'U'))
BEGIN
    PRINT '⚠️ Tabela LogsAtividades já existe no banco de dados'
    PRINT '   Pulando criação...'
END
ELSE
BEGIN
    PRINT '📊 Criando tabela LogsAtividades...'

    -- Criar tabela
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

    PRINT '✅ Tabela LogsAtividades criada com sucesso!'

    -- Criar índices para melhorar performance
    PRINT '📇 Criando índices...'

    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_UsuarioId]
        ON [dbo].[LogsAtividades]([UsuarioId] ASC);

    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_DataHora]
        ON [dbo].[LogsAtividades]([DataHora] DESC);

    CREATE NONCLUSTERED INDEX [IX_LogsAtividades_Ativo]
        ON [dbo].[LogsAtividades]([Ativo] ASC);

    PRINT '✅ Índices criados com sucesso!'

    -- Inserir alguns registros de exemplo (opcional)
    PRINT '📝 Inserindo dados de exemplo...'

    DECLARE @PrimeiroUsuarioId INT
    SELECT TOP 1 @PrimeiroUsuarioId = Id FROM Usuarios WHERE Ativo = 1

    IF @PrimeiroUsuarioId IS NOT NULL
    BEGIN
        INSERT INTO LogsAtividades (UsuarioId, UsuarioNome, Acao, Tipo, Detalhes, ModuloOrigem, DataHora, Ativo)
        VALUES
            (@PrimeiroUsuarioId, 'Sistema', 'Tabela LogsAtividades criada', 'success', 'Tabela de logs de atividades criada com sucesso', 'Sistema', GETDATE(), 1)

        PRINT '✅ Dados de exemplo inseridos!'
    END
    ELSE
    BEGIN
        PRINT '⚠️ Nenhum usuário ativo encontrado. Pulando inserção de dados de exemplo.'
    END

    PRINT ''
    PRINT '════════════════════════════════════════'
    PRINT '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!'
    PRINT '════════════════════════════════════════'
END
GO

-- Verificar se a tabela foi criada
SELECT
    'LogsAtividades' AS Tabela,
    COUNT(*) AS TotalRegistros,
    MAX(DataHora) AS UltimaAtividade
FROM LogsAtividades
WHERE Ativo = 1;
GO

