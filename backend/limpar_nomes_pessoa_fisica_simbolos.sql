-- ====================================================================
-- Script: Limpar Nomes com Símbolos em PessoasFisicas
-- Objetivo: Remover símbolos como (), -, etc. dos nomes de pessoas físicas
-- Data: 21/11/2025
-- ====================================================================

-- 1. VERIFICAR registros com símbolos no nome
SELECT 
    Id,
    Nome,
    EmailEmpresarial,
    DataCadastro,
    CASE 
        WHEN Nome LIKE '%(%' OR Nome LIKE '%)%' THEN 'Parênteses'
        WHEN Nome LIKE '%-%' THEN 'Hífen'
        WHEN Nome LIKE '%[0-9]%' THEN 'Números'
        WHEN Nome LIKE '%.%' THEN 'Ponto'
        WHEN Nome LIKE '%,%' THEN 'Vírgula'
        WHEN Nome LIKE '%@%' THEN 'Arroba'
        WHEN Nome LIKE '%&%' THEN 'E comercial'
        WHEN Nome LIKE '%/%' THEN 'Barra'
        ELSE 'Outro símbolo'
    END AS TipoProblema
FROM PessoasFisicas
WHERE 
    -- Parênteses
    Nome LIKE '%(%' 
    OR Nome LIKE '%)%'
    -- Hífen
    OR Nome LIKE '%-%'
    -- Números
    OR Nome LIKE '%[0-9]%'
    -- Símbolos comuns
    OR Nome LIKE '%.%'
    OR Nome LIKE '%,%'
    OR Nome LIKE '%@%'
    OR Nome LIKE '%#%'
    OR Nome LIKE '%$%'
    OR Nome LIKE '%&%'
    OR Nome LIKE '%*%'
    OR Nome LIKE '%+%'
    OR Nome LIKE '%=%'
    OR Nome LIKE '%[%'
    OR Nome LIKE '%]%'
    OR Nome LIKE '%{%'
    OR Nome LIKE '%}%'
    OR Nome LIKE '%<%'
    OR Nome LIKE '%>%'
    OR Nome LIKE '%/%'
    OR Nome LIKE '%\%'
    OR Nome LIKE '%|%'
    OR Nome LIKE '%!%'
    OR Nome LIKE '%?%'
    OR Nome LIKE '%:%'
    OR Nome LIKE '%;%'
    OR Nome LIKE '%''%'
    OR Nome LIKE '%"%'
    OR Nome LIKE '%_%'
    OR Nome LIKE '%~%'
    OR Nome LIKE '%`%'
    OR Nome LIKE '%^%'
ORDER BY Nome;

-- ====================================================================
-- 2. CONTAR quantos registros têm problemas
-- ====================================================================
SELECT COUNT(*) AS TotalComSimbolos
FROM PessoasFisicas
WHERE 
    Nome LIKE '%(%' 
    OR Nome LIKE '%)%'
    OR Nome LIKE '%-%'
    OR Nome LIKE '%[0-9]%'
    OR Nome LIKE '%.%'
    OR Nome LIKE '%,%'
    OR Nome LIKE '%@%'
    OR Nome LIKE '%&%';

-- ====================================================================
-- 3. BACKUP antes de fazer alterações (IMPORTANTE!)
-- ====================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PessoasFisicas_Backup_NomesSimbolos')
BEGIN
    SELECT 
        Id,
        Nome,
        EmailEmpresarial,
        DataCadastro,
        DataAtualizacao,
        GETDATE() AS DataBackup
    INTO PessoasFisicas_Backup_NomesSimbolos
    FROM PessoasFisicas
    WHERE 
        Nome LIKE '%(%' 
        OR Nome LIKE '%)%'
        OR Nome LIKE '%-%'
        OR Nome LIKE '%[0-9]%'
        OR Nome LIKE '%.%'
        OR Nome LIKE '%,%'
        OR Nome LIKE '%@%'
        OR Nome LIKE '%&%'
        OR Nome LIKE '%*%';
    
    PRINT '✅ Backup criado: PessoasFisicas_Backup_NomesSimbolos';
END;

-- ====================================================================
-- 4. ATUALIZAR - Remover símbolos dos nomes
-- ====================================================================

-- ATENÇÃO: Revise o resultado da consulta acima antes de executar!
-- Esta atualização remove símbolos e caracteres especiais

UPDATE PessoasFisicas
SET 
    Nome = LTRIM(RTRIM(
        -- Remove parênteses e conteúdo
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(
                                                REPLACE(
                                                    REPLACE(
                                                        -- Remove tudo entre parênteses primeiro
                                                        CASE 
                                                            WHEN CHARINDEX('(', Nome) > 0 AND CHARINDEX(')', Nome) > CHARINDEX('(', Nome)
                                                            THEN 
                                                                SUBSTRING(Nome, 1, CHARINDEX('(', Nome) - 1) + 
                                                                SUBSTRING(Nome, CHARINDEX(')', Nome) + 1, LEN(Nome))
                                                            ELSE Nome
                                                        END,
                                                    '-', ' '),  -- Hífen vira espaço
                                                    '.', ' '),  -- Ponto vira espaço
                                                    ',', ' '),  -- Vírgula vira espaço
                                                    '/', ' '),  -- Barra vira espaço
                                                    '\', ' '),  -- Barra invertida vira espaço
                                                    '@', ' '),  -- Arroba vira espaço
                                                    '#', ' '),  -- Hashtag vira espaço
                                                    '$', ' '),  -- Cifrão vira espaço
                                                    '&', ' '),  -- E comercial vira espaço
                                                    '*', ' '),  -- Asterisco vira espaço
                                                    '!', ' '),  -- Exclamação vira espaço
                                                '  ', ' '),    -- Remove espaços duplos
                                            '  ', ' ')         -- Remove espaços duplos novamente
                                        ),
            '(', ''),  -- Remove parênteses restantes
        ')', '')       -- Remove parênteses restantes
    )),
    DataAtualizacao = GETDATE()
WHERE 
    Nome LIKE '%(%' 
    OR Nome LIKE '%)%'
    OR Nome LIKE '%-%'
    OR Nome LIKE '%[0-9]%'
    OR Nome LIKE '%.%'
    OR Nome LIKE '%,%'
    OR Nome LIKE '%@%'
    OR Nome LIKE '%#%'
    OR Nome LIKE '%$%'
    OR Nome LIKE '%&%'
    OR Nome LIKE '%*%'
    OR Nome LIKE '%!%'
    OR Nome LIKE '%/%'
    OR Nome LIKE '%\%';

PRINT '✅ Nomes com símbolos atualizados';

-- ====================================================================
-- 5. REMOVER números dos nomes (caso existam)
-- ====================================================================
UPDATE PessoasFisicas
SET 
    Nome = LTRIM(RTRIM(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(Nome, '0', ''),
                                        '1', ''),
                                    '2', ''),
                                '3', ''),
                            '4', ''),
                        '5', ''),
                    '6', ''),
                '7', ''),
            '8', ''),
        '9', '')
    )),
    DataAtualizacao = GETDATE()
WHERE 
    Nome LIKE '%[0-9]%';

PRINT '✅ Números removidos dos nomes';

-- ====================================================================
-- 6. VERIFICAR resultado após limpeza
-- ====================================================================
SELECT 
    pf.Id,
    backup.Nome AS NomeAnterior,
    pf.Nome AS NomeAtual,
    pf.EmailEmpresarial,
    pf.DataAtualizacao
FROM PessoasFisicas pf
INNER JOIN PessoasFisicas_Backup_NomesSimbolos backup ON pf.Id = backup.Id
ORDER BY pf.Nome;

PRINT '✅ Script concluído! Verifique os resultados acima.';

-- ====================================================================
-- 7. ESTATÍSTICAS
-- ====================================================================
SELECT 
    'Antes' AS Periodo,
    COUNT(*) AS TotalRegistros
FROM PessoasFisicas_Backup_NomesSimbolos

UNION ALL

SELECT 
    'Depois' AS Periodo,
    COUNT(*) AS TotalRegistros
FROM PessoasFisicas
WHERE 
    Nome LIKE '%(%' 
    OR Nome LIKE '%)%'
    OR Nome LIKE '%-%'
    OR Nome LIKE '%[0-9]%';

-- ====================================================================
-- 8. RESTAURAR (caso necessário - USE COM CUIDADO!)
-- ====================================================================
/*
-- DESCOMENTE APENAS SE PRECISAR RESTAURAR

UPDATE pf
SET 
    pf.Nome = backup.Nome,
    pf.DataAtualizacao = GETDATE()
FROM PessoasFisicas pf
INNER JOIN PessoasFisicas_Backup_NomesSimbolos backup ON pf.Id = backup.Id;

PRINT '⚠️ Nomes restaurados do backup';
*/

-- ====================================================================
-- 9. LIMPAR tabela de backup (APÓS CONFIRMAR QUE ESTÁ TUDO OK)
-- ====================================================================
/*
-- DESCOMENTE APÓS CONFIRMAR QUE A LIMPEZA ESTÁ CORRETA

DROP TABLE PessoasFisicas_Backup_NomesSimbolos;
PRINT '🗑️ Tabela de backup removida';
*/

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================

