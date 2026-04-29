-- =========================================
-- SCRIPT PARA VERIFICAR DADOS EXISTENTES ANTES DE FAZER ALTERAÇÕES
-- Mostra quais contratos têm quais campos preenchidos
-- =========================================

PRINT '=== VERIFICAÇÃO DE DADOS EXISTENTES ===';

-- 1. Ver contratos com dados de pagamento preenchidos
SELECT TOP 10
    Id,
    ValorDevido,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    DataFechamentoContrato,
    AnexoDocumento,
    Pendencias,
    NumeroPasta
FROM Contratos
WHERE ValorEntrada IS NOT NULL
   OR ValorParcela IS NOT NULL
   OR NumeroParcelas IS NOT NULL
   OR TipoServico IS NOT NULL
   OR DataFechamentoContrato IS NOT NULL
   OR AnexoDocumento IS NOT NULL
   OR Pendencias IS NOT NULL
   OR NumeroPasta IS NOT NULL
ORDER BY Id;

-- 2. Contar quantos contratos têm cada campo preenchido
SELECT
    COUNT(*) as TotalContratos,
    COUNT(CASE WHEN ValorEntrada IS NOT NULL THEN 1 END) as ComValorEntrada,
    COUNT(CASE WHEN ValorParcela IS NOT NULL THEN 1 END) as ComValorParcela,
    COUNT(CASE WHEN NumeroParcelas IS NOT NULL THEN 1 END) as ComNumeroParcelas,
    COUNT(CASE WHEN TipoServico IS NOT NULL AND TipoServico != '' THEN 1 END) as ComTipoServico,
    COUNT(CASE WHEN DataFechamentoContrato IS NOT NULL THEN 1 END) as ComDataFechamento,
    COUNT(CASE WHEN AnexoDocumento IS NOT NULL AND AnexoDocumento != '' THEN 1 END) as ComAnexoDocumento,
    COUNT(CASE WHEN Pendencias IS NOT NULL AND Pendencias != '' THEN 1 END) as ComPendencias,
    COUNT(CASE WHEN NumeroPasta IS NOT NULL AND NumeroPasta != '' THEN 1 END) as ComNumeroPasta
FROM Contratos;

PRINT '=== VERIFICAÇÃO CONCLUÍDA ===';
PRINT 'Estes contratos JÁ TÊM dados preenchidos e NÃO devem ser alterados';
PRINT 'Só execute scripts de correção se realmente necessário';
