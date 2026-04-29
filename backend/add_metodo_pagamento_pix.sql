-- ====================================================================
-- MIGRATION: Adicionar suporte a pagamento via PIX
-- ====================================================================
-- Descrição: Adiciona campos para controlar contratos que usam PIX
--            em vez de boleto. Parcelas PIX aparecem no faturamento
--            mas não geram boleto no Santander.
-- Data: 11/02/2026
-- ====================================================================

BEGIN TRANSACTION;

-- 1. Adicionar coluna MetodoPagamento na tabela Contratos
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Contratos' AND COLUMN_NAME = 'MetodoPagamento'
)
BEGIN
    ALTER TABLE [dbo].[Contratos]
    ADD [MetodoPagamento] NVARCHAR(20) NOT NULL DEFAULT 'Boleto';
    
    PRINT '✅ Coluna MetodoPagamento adicionada na tabela Contratos';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna MetodoPagamento já existe na tabela Contratos';
END

-- 2. Adicionar coluna TipoPagamento na tabela Boletos
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Boletos' AND COLUMN_NAME = 'TipoPagamento'
)
BEGIN
    ALTER TABLE [dbo].[Boletos]
    ADD [TipoPagamento] NVARCHAR(20) NOT NULL DEFAULT 'Boleto';
    
    PRINT '✅ Coluna TipoPagamento adicionada na tabela Boletos';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna TipoPagamento já existe na tabela Boletos';
END

-- 3. Atualizar contratos existentes para ter MetodoPagamento = 'Boleto'
UPDATE [dbo].[Contratos]
SET [MetodoPagamento] = 'Boleto'
WHERE [MetodoPagamento] IS NULL OR [MetodoPagamento] = '';

PRINT '✅ Contratos existentes atualizados com MetodoPagamento = Boleto';

-- 4. Atualizar boletos existentes para ter TipoPagamento = 'Boleto'
UPDATE [dbo].[Boletos]
SET [TipoPagamento] = 'Boleto'
WHERE [TipoPagamento] IS NULL OR [TipoPagamento] = '';

PRINT '✅ Boletos existentes atualizados com TipoPagamento = Boleto';

COMMIT TRANSACTION;

PRINT '';
PRINT '====================================================================';
PRINT '✅ MIGRATION CONCLUÍDA COM SUCESSO!';
PRINT '====================================================================';
PRINT 'Próximos passos:';
PRINT '1. Reiniciar a aplicação backend para aplicar os models atualizados';
PRINT '2. Testar criação de contrato com MetodoPagamento = "Pix"';
PRINT '3. Verificar que parcelas PIX aparecem no faturamento sem boleto';
PRINT '====================================================================';
