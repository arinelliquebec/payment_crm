-- =============================================================================
-- MIGRATION: Geração em Lote de Boletos
-- Data: 2025-12-04
-- Descrição: Adiciona campo NumeroParcela na tabela Boletos e cria tabela de logs
-- =============================================================================

-- Verificar se a coluna NumeroParcela já existe antes de adicionar
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Boletos' AND COLUMN_NAME = 'NumeroParcela'
)
BEGIN
    ALTER TABLE Boletos ADD NumeroParcela INT NULL;
    PRINT '✅ Coluna NumeroParcela adicionada na tabela Boletos';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna NumeroParcela já existe na tabela Boletos';
END
GO

-- Criar tabela de logs de geração de boletos em lote
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LogsGeracaoBoletos')
BEGIN
    CREATE TABLE LogsGeracaoBoletos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        DataExecucao DATETIME2 NOT NULL DEFAULT GETDATE(),
        UsuarioId INT NOT NULL,
        TotalContratosProcessados INT NOT NULL DEFAULT 0,
        TotalBoletosGerados INT NOT NULL DEFAULT 0,
        TotalErros INT NOT NULL DEFAULT 0,
        ValorTotalGerado DECIMAL(18,2) NOT NULL DEFAULT 0,
        Detalhes NVARCHAR(MAX) NULL, -- JSON com detalhes
        DuracaoSegundos INT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'SUCESSO', -- SUCESSO, PARCIAL, ERRO
        DataFinalizacao DATETIME2 NULL,
        
        CONSTRAINT FK_LogsGeracaoBoletos_Usuario 
            FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
    );
    
    -- Índice para consultas por data
    CREATE INDEX IX_LogsGeracaoBoletos_DataExecucao 
        ON LogsGeracaoBoletos(DataExecucao DESC);
    
    -- Índice para consultas por usuário
    CREATE INDEX IX_LogsGeracaoBoletos_UsuarioId 
        ON LogsGeracaoBoletos(UsuarioId);
    
    PRINT '✅ Tabela LogsGeracaoBoletos criada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela LogsGeracaoBoletos já existe';
END
GO

-- Criar índice para otimizar busca de boletos por contrato e parcela
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_Boletos_ContratoId_NumeroParcela' 
    AND object_id = OBJECT_ID('Boletos')
)
BEGIN
    CREATE INDEX IX_Boletos_ContratoId_NumeroParcela 
        ON Boletos(ContratoId, NumeroParcela);
    PRINT '✅ Índice IX_Boletos_ContratoId_NumeroParcela criado';
END
GO

-- Criar índice para otimizar busca de contratos ativos com dados de pagamento
IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'IX_Contratos_Ativo_PrimeiroVencimento' 
    AND object_id = OBJECT_ID('Contratos')
)
BEGIN
    CREATE INDEX IX_Contratos_Ativo_PrimeiroVencimento 
        ON Contratos(Ativo, PrimeiroVencimento) 
        WHERE Ativo = 1 AND PrimeiroVencimento IS NOT NULL;
    PRINT '✅ Índice IX_Contratos_Ativo_PrimeiroVencimento criado';
END
GO

PRINT '';
PRINT '=============================================================================';
PRINT '✅ MIGRATION CONCLUÍDA COM SUCESSO!';
PRINT '=============================================================================';
PRINT '';
PRINT 'Alterações realizadas:';
PRINT '  1. Campo NumeroParcela adicionado na tabela Boletos';
PRINT '  2. Tabela LogsGeracaoBoletos criada';
PRINT '  3. Índices de performance criados';
PRINT '';
GO

