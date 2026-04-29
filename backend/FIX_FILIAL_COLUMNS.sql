-- =====================================================
-- SCRIPT URGENTE PARA CORRIGIR PROBLEMA DE FILIAL
-- Execute este script AGORA no Azure SQL Server
-- =====================================================

-- PASSO 1: Adicionar coluna FilialId
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]')
    AND name = 'FilialId'
)
BEGIN
    ALTER TABLE [dbo].[Usuarios] ADD [FilialId] int NULL;
    PRINT '✅ Coluna FilialId adicionada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna FilialId já existe';
END
GO

-- PASSO 2: Adicionar coluna ConsultorId
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Usuarios]')
    AND name = 'ConsultorId'
)
BEGIN
    ALTER TABLE [dbo].[Usuarios] ADD [ConsultorId] int NULL;
    PRINT '✅ Coluna ConsultorId adicionada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna ConsultorId já existe';
END
GO

-- PASSO 3: Adicionar Foreign Keys (opcional mas recomendado)
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Usuarios_Filiais_FilialId'
)
BEGIN
    ALTER TABLE [dbo].[Usuarios]
    ADD CONSTRAINT [FK_Usuarios_Filiais_FilialId]
    FOREIGN KEY ([FilialId]) REFERENCES [dbo].[Filiais]([Id]);
    PRINT '✅ Foreign Key para Filial criada';
END
GO

IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Usuarios_Consultores_ConsultorId'
)
BEGIN
    ALTER TABLE [dbo].[Usuarios]
    ADD CONSTRAINT [FK_Usuarios_Consultores_ConsultorId]
    FOREIGN KEY ([ConsultorId]) REFERENCES [dbo].[Consultores]([Id]);
    PRINT '✅ Foreign Key para Consultor criada';
END
GO

-- PASSO 4: Verificar resultado
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable,
    CASE
        WHEN fk.name IS NOT NULL THEN 'FK: ' + fk.name
        ELSE 'No FK'
    END AS ForeignKey
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN sys.foreign_key_columns fkc ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
LEFT JOIN sys.foreign_keys fk ON fk.object_id = fkc.constraint_object_id
WHERE c.object_id = OBJECT_ID(N'[dbo].[Usuarios]')
AND c.name IN ('FilialId', 'ConsultorId')
ORDER BY c.name;

PRINT '=====================================================';
PRINT '✅ SCRIPT EXECUTADO COM SUCESSO!';
PRINT 'As colunas FilialId e ConsultorId foram criadas.';
PRINT 'Agora você pode testar o salvamento de filial.';
PRINT '=====================================================';
