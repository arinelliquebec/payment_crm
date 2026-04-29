-- =========================================
-- SCRIPT PARA ADICIONAR COLUNAS FILIALID E CONSULTORID
-- Execute este script diretamente no Azure SQL Server
-- =========================================

-- 1. Adicionar coluna FilialId à tabela Usuarios
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Usuarios'
    AND COLUMN_NAME = 'FilialId'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [FilialId] int NULL;
    PRINT 'Coluna FilialId adicionada com sucesso à tabela Usuarios';
END
ELSE
BEGIN
    PRINT 'Coluna FilialId já existe na tabela Usuarios';
END

-- 2. Adicionar coluna ConsultorId à tabela Usuarios
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Usuarios'
    AND COLUMN_NAME = 'ConsultorId'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [ConsultorId] int NULL;
    PRINT 'Coluna ConsultorId adicionada com sucesso à tabela Usuarios';
END
ELSE
BEGIN
    PRINT 'Coluna ConsultorId já existe na tabela Usuarios';
END

-- 3. Verificar se as colunas foram criadas
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Usuarios'
AND COLUMN_NAME IN ('FilialId', 'ConsultorId')
ORDER BY COLUMN_NAME;

PRINT '=== SCRIPT EXECUTADO COM SUCESSO ===';
PRINT 'As colunas FilialId e ConsultorId foram adicionadas à tabela Usuarios';
PRINT 'Agora você pode testar a edição de usuários no frontend';
