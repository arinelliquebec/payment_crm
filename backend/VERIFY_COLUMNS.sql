-- =====================================================
-- SCRIPT DE VERIFICAÇÃO - EXECUTE NO AZURE SQL
-- =====================================================

-- 1. VERIFICAR SE AS COLUNAS EXISTEM
SELECT
    c.name AS ColumnName,
    t.name AS DataType,
    c.is_nullable AS IsNullable,
    CASE
        WHEN c.name = 'FilialId' THEN '✅ FilialId EXISTE'
        WHEN c.name = 'ConsultorId' THEN '✅ ConsultorId EXISTE'
        ELSE c.name
    END AS Status
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(N'[dbo].[Usuarios]')
AND c.name IN ('FilialId', 'ConsultorId')
ORDER BY c.name;

-- 2. SE O RESULTADO ACIMA ESTIVER VAZIO, EXECUTE:
/*
ALTER TABLE [dbo].[Usuarios] ADD [FilialId] int NULL;
ALTER TABLE [dbo].[Usuarios] ADD [ConsultorId] int NULL;
*/

-- 3. TESTAR COM DADOS
UPDATE [dbo].[Usuarios]
SET FilialId = 7
WHERE Id = 22;

-- 4. VERIFICAR SE SALVOU
SELECT
    Id,
    Login,
    Email,
    GrupoAcessoId,
    FilialId,
    ConsultorId
FROM [dbo].[Usuarios]
WHERE Id = 22;
