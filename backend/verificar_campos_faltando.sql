-- =========================================
-- SCRIPT PARA VERIFICAR CAMPOS QUE AINDA ESTÃO VAZIOS APÓS EXECUTAR O SCRIPT ANTERIOR
-- Execute este script APÓS executar popular_campos_contratos.sql
-- =========================================

-- 1. Verificar contratos que ainda têm campos vazios ou nulos
SELECT
    Id,
    'TipoServico' as Campo,
    TipoServico as Valor
FROM Contratos
WHERE TipoServico IS NULL OR TipoServico = ''
UNION ALL
SELECT
    Id,
    'DataFechamentoContrato' as Campo,
    CAST(DataFechamentoContrato as varchar) as Valor
FROM Contratos
WHERE DataFechamentoContrato IS NULL
UNION ALL
SELECT
    Id,
    'ValorEntrada' as Campo,
    CAST(ValorEntrada as varchar) as Valor
FROM Contratos
WHERE ValorEntrada IS NULL
UNION ALL
SELECT
    Id,
    'ValorParcela' as Campo,
    CAST(ValorParcela as varchar) as Valor
FROM Contratos
WHERE ValorParcela IS NULL
UNION ALL
SELECT
    Id,
    'NumeroParcelas' as Campo,
    CAST(NumeroParcelas as varchar) as Valor
FROM Contratos
WHERE NumeroParcelas IS NULL
UNION ALL
SELECT
    Id,
    'PrimeiroVencimento' as Campo,
    CAST(PrimeiroVencimento as varchar) as Valor
FROM Contratos
WHERE PrimeiroVencimento IS NULL
UNION ALL
SELECT
    Id,
    'Comissao' as Campo,
    CAST(Comissao as varchar) as Valor
FROM Contratos
WHERE Comissao IS NULL
UNION ALL
SELECT
    Id,
    'AnexoDocumento' as Campo,
    AnexoDocumento as Valor
FROM Contratos
WHERE AnexoDocumento IS NULL OR AnexoDocumento = ''
UNION ALL
SELECT
    Id,
    'Pendencias' as Campo,
    Pendencias as Valor
FROM Contratos
WHERE Pendencias IS NULL OR Pendencias = ''
ORDER BY Id, Campo;

-- 2. Contar quantos contratos ainda têm problemas
SELECT
    COUNT(DISTINCT Id) as ContratosComCamposVazios,
    COUNT(*) as TotalCamposVazios
FROM (
    SELECT Id FROM Contratos WHERE TipoServico IS NULL OR TipoServico = ''
    UNION ALL
    SELECT Id FROM Contratos WHERE DataFechamentoContrato IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE ValorEntrada IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE ValorParcela IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE NumeroParcelas IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE PrimeiroVencimento IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE Comissao IS NULL
    UNION ALL
    SELECT Id FROM Contratos WHERE AnexoDocumento IS NULL OR AnexoDocumento = ''
    UNION ALL
    SELECT Id FROM Contratos WHERE Pendencias IS NULL OR Pendencias = ''
) Problemas;

PRINT '=== VERIFICAÇÃO DE CAMPOS VAZIOS APÓS EXECUÇÃO ===';
PRINT 'Se houver contratos com campos vazios, pode ser necessário executar novamente o script de população';
PRINT 'Ou verificar se há problemas de permissão/constraint no banco de dados';
