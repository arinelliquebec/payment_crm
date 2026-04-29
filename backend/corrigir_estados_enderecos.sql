-- Script para corrigir estados inválidos na tabela Enderecos
-- Este script corrige estados que estão com siglas de cidades ao invés de UF

-- ============================================
-- PARTE 1: Corrigir estados extraindo da cidade
-- ============================================

PRINT '=== Iniciando correção de estados ===';
PRINT '';

-- Corrigir registros onde a cidade termina com " MG" e o estado está errado
PRINT 'Corrigindo Minas Gerais (MG)...';
UPDATE [Enderecos]
SET Estado = 'MG'
WHERE (Estado IS NULL OR Estado = '' OR Estado = 'BH' OR LEN(Estado) != 2 OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
))
AND (
    Cidade LIKE '%BELO HORIZONTE%' OR
    Cidade LIKE '% MG' OR
    Cidade LIKE '%UBERLANDIA%' OR
    Cidade LIKE '%CONTAGEM%' OR
    Cidade LIKE '%JUIZ DE FORA%'
);
PRINT CONCAT('Registros atualizados: ', @@ROWCOUNT);
PRINT '';

-- Corrigir São Paulo
PRINT 'Corrigindo São Paulo (SP)...';
UPDATE [Enderecos]
SET Estado = 'SP'
WHERE (Estado IS NULL OR Estado = '' OR LEN(Estado) != 2 OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
))
AND (
    Cidade LIKE '%SAO PAULO%' OR
    Cidade LIKE '% SP' OR
    Cidade LIKE '%CAMPINAS%' OR
    Cidade LIKE '%SANTOS%' OR
    Cidade LIKE '%GUARULHOS%'
);
PRINT CONCAT('Registros atualizados: ', @@ROWCOUNT);
PRINT '';

-- Corrigir Rio de Janeiro
PRINT 'Corrigindo Rio de Janeiro (RJ)...';
UPDATE [Enderecos]
SET Estado = 'RJ'
WHERE (Estado IS NULL OR Estado = '' OR LEN(Estado) != 2 OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
))
AND (
    Cidade LIKE '%RIO DE JANEIRO%' OR
    Cidade LIKE '% RJ' OR
    Cidade LIKE '%NITEROI%' OR
    Cidade LIKE '%DUQUE DE CAXIAS%'
);
PRINT CONCAT('Registros atualizados: ', @@ROWCOUNT);
PRINT '';

-- Corrigir outros estados comuns
PRINT 'Corrigindo outros estados...';

UPDATE [Enderecos] SET Estado = 'BA' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%SALVADOR%';

UPDATE [Enderecos] SET Estado = 'DF' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%BRASILIA%';

UPDATE [Enderecos] SET Estado = 'PR' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%CURITIBA%';

UPDATE [Enderecos] SET Estado = 'RS' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%PORTO ALEGRE%';

UPDATE [Enderecos] SET Estado = 'CE' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%FORTALEZA%';

UPDATE [Enderecos] SET Estado = 'PE' WHERE (Estado IS NULL OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)) AND Cidade LIKE '%RECIFE%';

PRINT CONCAT('Registros atualizados: ', @@ROWCOUNT);
PRINT '';

-- ============================================
-- PARTE 2: Limpar campo Cidade removendo UF
-- ============================================

PRINT '=== Limpando campo Cidade (removendo UF do final) ===';
PRINT '';

-- Remover " MG" do final
UPDATE [Enderecos]
SET Cidade = LTRIM(RTRIM(LEFT(Cidade, LEN(Cidade) - 3)))
WHERE Cidade LIKE '% MG';
PRINT CONCAT('Registros com MG removido: ', @@ROWCOUNT);

-- Remover " SP" do final
UPDATE [Enderecos]
SET Cidade = LTRIM(RTRIM(LEFT(Cidade, LEN(Cidade) - 3)))
WHERE Cidade LIKE '% SP';
PRINT CONCAT('Registros com SP removido: ', @@ROWCOUNT);

-- Remover " RJ" do final
UPDATE [Enderecos]
SET Cidade = LTRIM(RTRIM(LEFT(Cidade, LEN(Cidade) - 3)))
WHERE Cidade LIKE '% RJ';
PRINT CONCAT('Registros com RJ removido: ', @@ROWCOUNT);

-- Remover outras UFs do final
DECLARE @uf VARCHAR(2);
DECLARE uf_cursor CURSOR FOR
SELECT valor FROM (VALUES
    ('BA'), ('CE'), ('DF'), ('ES'), ('GO'), ('MA'), ('MT'), ('MS'),
    ('PA'), ('PB'), ('PR'), ('PE'), ('PI'), ('RN'), ('RS'), ('RO'),
    ('RR'), ('SC'), ('SE'), ('TO'), ('AC'), ('AL'), ('AP'), ('AM')
) AS UFs(valor);

OPEN uf_cursor;
FETCH NEXT FROM uf_cursor INTO @uf;

WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE [Enderecos]
    SET Cidade = LTRIM(RTRIM(LEFT(Cidade, LEN(Cidade) - 3)))
    WHERE Cidade LIKE '% ' + @uf;
    
    IF @@ROWCOUNT > 0
        PRINT CONCAT('Registros com ', @uf, ' removido: ', @@ROWCOUNT);
    
    FETCH NEXT FROM uf_cursor INTO @uf;
END;

CLOSE uf_cursor;
DEALLOCATE uf_cursor;

PRINT '';
PRINT '=== Correção concluída! ===';
PRINT '';

-- ============================================
-- PARTE 3: Relatório final
-- ============================================

PRINT '=== Relatório de estados após correção ===';
PRINT '';

SELECT 
    Estado,
    COUNT(*) AS Quantidade,
    CASE 
        WHEN Estado IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                       'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                       'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')
        THEN '✅ Válido'
        WHEN Estado IS NULL OR Estado = ''
        THEN '⚠️ Vazio'
        ELSE '❌ Inválido'
    END AS Status
FROM [Enderecos]
GROUP BY Estado
ORDER BY Quantidade DESC;

PRINT '';
PRINT 'Estados que ainda precisam de correção manual:';
SELECT TOP 10
    Id,
    Cidade,
    Estado,
    Cep
FROM [Enderecos]
WHERE Estado IS NULL 
   OR Estado = '' 
   OR LEN(Estado) != 2 
   OR Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
);

