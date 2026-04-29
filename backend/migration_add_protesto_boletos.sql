-- ========================================================================
-- MIGRATION: Adicionar campos de Protesto na tabela Boletos
-- Data: 06/01/2026
-- Descrição: Adiciona colunas ProtestType e ProtestQuantityDays para 
--            configurar protesto automático em cartório via API Santander
-- ========================================================================

-- Verificar se a coluna ProtestType já existe antes de adicionar
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Boletos' 
    AND COLUMN_NAME = 'ProtestType'
)
BEGIN
    ALTER TABLE Boletos
    ADD ProtestType NVARCHAR(20) NULL;
    
    PRINT '✅ Coluna ProtestType adicionada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna ProtestType já existe';
END
GO

-- Verificar se a coluna ProtestQuantityDays já existe antes de adicionar
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Boletos' 
    AND COLUMN_NAME = 'ProtestQuantityDays'
)
BEGIN
    ALTER TABLE Boletos
    ADD ProtestQuantityDays INT NULL;
    
    PRINT '✅ Coluna ProtestQuantityDays adicionada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna ProtestQuantityDays já existe';
END
GO

-- Adicionar comentários/descrições nas colunas (opcional - SQL Server 2016+)
-- Isso ajuda na documentação do banco de dados

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tipo de protesto: DIAS_CORRIDOS, DIAS_UTEIS, SEM_PROTESTO, NAO_PROTESTAR', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Boletos',
    @level2type = N'COLUMN', @level2name = N'ProtestType';
GO

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Quantidade de dias após vencimento para enviar ao protesto (1-99)', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Boletos',
    @level2type = N'COLUMN', @level2name = N'ProtestQuantityDays';
GO

-- ========================================================================
-- VERIFICAÇÃO: Confirmar que as colunas foram adicionadas
-- ========================================================================
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Boletos'
AND COLUMN_NAME IN ('ProtestType', 'ProtestQuantityDays')
ORDER BY COLUMN_NAME;

PRINT '';
PRINT '========================================================================';
PRINT '✅ Migration concluída com sucesso!';
PRINT '';
PRINT 'Novas colunas adicionadas à tabela Boletos:';
PRINT '  - ProtestType (NVARCHAR(20)) - Tipo de protesto';
PRINT '  - ProtestQuantityDays (INT) - Dias para protestar';
PRINT '';
PRINT 'Valores aceitos para ProtestType:';
PRINT '  - DIAS_CORRIDOS: Conta dias corridos';
PRINT '  - DIAS_UTEIS: Conta apenas dias úteis';
PRINT '  - SEM_PROTESTO: Não enviar para protesto';
PRINT '  - NAO_PROTESTAR: Não enviar para protesto';
PRINT '  - NULL: Sem protesto (padrão)';
PRINT '========================================================================';

