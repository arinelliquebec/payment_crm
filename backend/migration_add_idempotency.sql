-- =============================================
-- Migration: Adicionar Idempotência e Índices Únicos
-- Data: 2025-01-03
-- Objetivo: Evitar pagamentos duplicados
-- =============================================

-- 1. Criar tabela de Idempotency Keys
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IdempotencyKeys')
BEGIN
    CREATE TABLE IdempotencyKeys (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        [Key] NVARCHAR(100) NOT NULL,
        RequestPath NVARCHAR(500) NOT NULL,
        RequestBody NVARCHAR(MAX) NULL,
        ResponseStatus INT NOT NULL,
        ResponseBody NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        ExpiresAt DATETIME NOT NULL,
        CONSTRAINT UQ_IdempotencyKey UNIQUE ([Key])
    );

    CREATE INDEX IX_IdempotencyKey_ExpiresAt ON IdempotencyKeys([Key], ExpiresAt);

    PRINT '✅ Tabela IdempotencyKeys criada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela IdempotencyKeys já existe';
END
GO

-- 2. Adicionar índice único para evitar duplicatas de boletos por parcela
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_ContratoId_NumeroParcela_Ativo')
BEGIN
    CREATE UNIQUE INDEX IX_Boletos_ContratoId_NumeroParcela_Ativo
    ON Boletos(ContratoId, NumeroParcela)
    WHERE Ativo = 1 AND Status NOT IN ('ERRO', 'CANCELADO');

    PRINT '✅ Índice único IX_Boletos_ContratoId_NumeroParcela_Ativo criado';
END
ELSE
BEGIN
    PRINT '⚠️ Índice IX_Boletos_ContratoId_NumeroParcela_Ativo já existe';
END
GO

-- 3. Adicionar índice para performance de consultas de duplicata por data
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_ContratoId_DueDate_Ativo')
BEGIN
    CREATE INDEX IX_Boletos_ContratoId_DueDate_Ativo
    ON Boletos(ContratoId, DueDate, Ativo)
    WHERE Status NOT IN ('ERRO', 'CANCELADO');

    PRINT '✅ Índice IX_Boletos_ContratoId_DueDate_Ativo criado';
END
ELSE
BEGIN
    PRINT '⚠️ Índice IX_Boletos_ContratoId_DueDate_Ativo já existe';
END
GO

-- 4. Adicionar índice para consultas por mês/ano
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_ContratoId_Status_Ativo')
BEGIN
    CREATE INDEX IX_Boletos_ContratoId_Status_Ativo
    ON Boletos(ContratoId, Status, Ativo)
    INCLUDE (DueDate, NumeroParcela, NsuCode);

    PRINT '✅ Índice IX_Boletos_ContratoId_Status_Ativo criado';
END
ELSE
BEGIN
    PRINT '⚠️ Índice IX_Boletos_ContratoId_Status_Ativo já existe';
END
GO

-- 5. Job de limpeza de idempotency keys expiradas (executar diariamente)
PRINT '📋 Para criar job de limpeza automática, execute:';
PRINT 'USE msdb;';
PRINT 'EXEC dbo.sp_add_job @job_name = N''Limpar IdempotencyKeys Expiradas'';';
PRINT 'EXEC dbo.sp_add_jobstep @job_name = N''Limpar IdempotencyKeys Expiradas'',';
PRINT '    @step_name = N''Delete Expired Keys'',';
PRINT '    @command = N''DELETE FROM IdempotencyKeys WHERE ExpiresAt < GETDATE()'';';
GO

PRINT '';
PRINT '✅ Migration de idempotência concluída!';
PRINT '';
PRINT '📊 Resumo:';
PRINT '  - Tabela IdempotencyKeys criada';
PRINT '  - 3 índices únicos/performance criados';
PRINT '  - Sistema protegido contra duplicatas';
PRINT '';
PRINT '🚀 Próximos passos:';
PRINT '  1. Executar este script no banco de dados';
PRINT '  2. Reiniciar a aplicação';
PRINT '  3. Testar criação de boletos';
GO
