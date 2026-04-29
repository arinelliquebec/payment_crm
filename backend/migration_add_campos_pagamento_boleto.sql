-- ============================================================================
-- MIGRATION: Adicionar campos de pagamento na tabela Boletos
-- Data: 2024-12-11
-- Descrição: Adiciona FoiPago, ValorPago e DataPagamento para persistir 
--            informações de pagamento retornadas pela API Santander
-- ============================================================================

-- 1. Adicionar campo FoiPago (bit/bool)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'FoiPago')
BEGIN
    ALTER TABLE Boletos ADD FoiPago BIT NOT NULL DEFAULT 0;
    PRINT 'Campo FoiPago adicionado na tabela Boletos';
END
ELSE
BEGIN
    PRINT 'Campo FoiPago já existe na tabela Boletos';
END;

-- 2. Adicionar campo ValorPago (decimal)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'ValorPago')
BEGIN
    ALTER TABLE Boletos ADD ValorPago DECIMAL(18,2) NULL;
    PRINT 'Campo ValorPago adicionado na tabela Boletos';
END
ELSE
BEGIN
    PRINT 'Campo ValorPago já existe na tabela Boletos';
END;

-- 3. Adicionar campo DataPagamento (datetime)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'DataPagamento')
BEGIN
    ALTER TABLE Boletos ADD DataPagamento DATETIME NULL;
    PRINT 'Campo DataPagamento adicionado na tabela Boletos';
END
ELSE
BEGIN
    PRINT 'Campo DataPagamento já existe na tabela Boletos';
END;

-- 4. Criar índice para consultas de boletos pagos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_FoiPago' AND object_id = OBJECT_ID('Boletos'))
BEGIN
    CREATE INDEX IX_Boletos_FoiPago ON Boletos (FoiPago);
    PRINT 'Índice IX_Boletos_FoiPago criado';
END
ELSE
BEGIN
    PRINT 'Índice IX_Boletos_FoiPago já existe';
END;

PRINT '=============================================================================';
PRINT 'MIGRATION CONCLUÍDA COM SUCESSO!';
PRINT '=============================================================================';
PRINT 'Campos adicionados:';
PRINT '  1. FoiPago (BIT) - Indica se foi pago (true/false)';
PRINT '  2. ValorPago (DECIMAL 18,2) - Valor pago pelo cliente';
PRINT '  3. DataPagamento (DATETIME) - Data do pagamento';
PRINT '';
PRINT 'PRÓXIMO PASSO:';
PRINT '  Execute PUT /api/Boleto/sincronizar-todos-forcado para atualizar todos os boletos';
PRINT '=============================================================================';

