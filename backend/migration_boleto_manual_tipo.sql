-- ============================================================================
-- MIGRATION: Adicionar campos de tipo de boleto manual
-- Data: 2026-01-26
-- Descrição: Adiciona campos para controlar tipo de boleto manual 
--            (RENEGOCIACAO, ANTECIPACAO, AVULSO) e parcelas cobertas
-- ============================================================================

-- ============================================================================
-- 1. Adicionar coluna TipoBoletoManual na tabela Boletos
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'TipoBoletoManual')
BEGIN
    ALTER TABLE Boletos ADD TipoBoletoManual NVARCHAR(20) NULL;
    PRINT '✅ Coluna TipoBoletoManual adicionada à tabela Boletos';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna TipoBoletoManual já existe na tabela Boletos';
END
GO

-- ============================================================================
-- 2. Adicionar coluna ParcelasCobertas na tabela Boletos
-- JSON array com números das parcelas cobertas por este boleto
-- Ex: "[5,6,7]" para renegociação das parcelas 5, 6 e 7
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'ParcelasCobertas')
BEGIN
    ALTER TABLE Boletos ADD ParcelasCobertas NVARCHAR(500) NULL;
    PRINT '✅ Coluna ParcelasCobertas adicionada à tabela Boletos';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna ParcelasCobertas já existe na tabela Boletos';
END
GO

-- ============================================================================
-- 3. Adicionar coluna BoletosOriginaisRenegociados na tabela Boletos
-- JSON array com IDs dos boletos originais que foram renegociados
-- Ex: "[123,124,125]" para os boletos originais BAIXADO_NAO_PAGO
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Boletos') AND name = 'BoletosOriginaisRenegociados')
BEGIN
    ALTER TABLE Boletos ADD BoletosOriginaisRenegociados NVARCHAR(500) NULL;
    PRINT '✅ Coluna BoletosOriginaisRenegociados adicionada à tabela Boletos';
END
ELSE
BEGIN
    PRINT 'ℹ️ Coluna BoletosOriginaisRenegociados já existe na tabela Boletos';
END
GO

-- ============================================================================
-- 4. Criar índice para consultas por tipo de boleto manual
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Boletos_TipoBoletoManual' AND object_id = OBJECT_ID('Boletos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Boletos_TipoBoletoManual 
    ON Boletos(TipoBoletoManual) 
    WHERE TipoBoletoManual IS NOT NULL;
    PRINT '✅ Índice IX_Boletos_TipoBoletoManual criado';
END
ELSE
BEGIN
    PRINT 'ℹ️ Índice IX_Boletos_TipoBoletoManual já existe';
END
GO

-- ============================================================================
-- 5. Verificar resultado da migration
-- ============================================================================
SELECT 
    c.name AS NomeColuna,
    t.name AS TipoDado,
    c.max_length AS TamanhoMax,
    CASE WHEN c.is_nullable = 1 THEN 'SIM' ELSE 'NÃO' END AS Nullable
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('Boletos')
    AND c.name IN ('TipoBoletoManual', 'ParcelasCobertas', 'BoletosOriginaisRenegociados')
ORDER BY c.name;

PRINT '';
PRINT '============================================================================';
PRINT '✅ Migration concluída com sucesso!';
PRINT '============================================================================';
PRINT '';
PRINT 'Novas colunas adicionadas:';
PRINT '  - TipoBoletoManual: RENEGOCIACAO, ANTECIPACAO ou AVULSO';
PRINT '  - ParcelasCobertas: JSON array com parcelas cobertas [1,2,3]';
PRINT '  - BoletosOriginaisRenegociados: JSON array com IDs dos boletos originais';
PRINT '';
GO

