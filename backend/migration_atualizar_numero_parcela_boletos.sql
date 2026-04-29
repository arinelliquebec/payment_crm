-- ============================================================================
-- MIGRATION: Atualizar NumeroParcela dos boletos existentes
-- Data: 2024-12-11
-- Descrição: Calcula e atualiza o NumeroParcela para boletos que foram
--            gerados manualmente e não possuem esse campo preenchido
-- ============================================================================

-- Visualizar boletos sem NumeroParcela ANTES da atualização
SELECT 
    b.Id AS BoletoId,
    b.ContratoId,
    b.NumeroParcela AS NumeroParcelaAtual,
    b.DueDate AS VencimentoBoleto,
    c.PrimeiroVencimento,
    c.NumeroParcelas AS TotalParcelas,
    DATEDIFF(MONTH, c.PrimeiroVencimento, b.DueDate) + 1 AS NumeroParcelaCalculado
FROM Boletos b
INNER JOIN Contratos c ON b.ContratoId = c.Id
WHERE b.NumeroParcela IS NULL
  AND b.Ativo = 1
  AND c.PrimeiroVencimento IS NOT NULL
ORDER BY b.ContratoId, b.DueDate;

-- Contar quantos boletos serão atualizados
SELECT COUNT(*) AS 'Boletos a atualizar' 
FROM Boletos b
INNER JOIN Contratos c ON b.ContratoId = c.Id
WHERE b.NumeroParcela IS NULL
  AND b.Ativo = 1
  AND c.PrimeiroVencimento IS NOT NULL;

-- ============================================================================
-- EXECUTAR A ATUALIZAÇÃO
-- ============================================================================

UPDATE b
SET b.NumeroParcela = 
    CASE 
        -- Se a diferença de meses for negativa ou zero, definir como 1
        WHEN DATEDIFF(MONTH, c.PrimeiroVencimento, b.DueDate) + 1 < 1 THEN 1
        ELSE DATEDIFF(MONTH, c.PrimeiroVencimento, b.DueDate) + 1
    END
FROM Boletos b
INNER JOIN Contratos c ON b.ContratoId = c.Id
WHERE b.NumeroParcela IS NULL
  AND b.Ativo = 1
  AND c.PrimeiroVencimento IS NOT NULL;

PRINT 'Boletos atualizados com NumeroParcela calculado!';

-- Verificar resultado APÓS a atualização
SELECT 
    b.Id AS BoletoId,
    b.ContratoId,
    b.NumeroParcela,
    b.DueDate AS VencimentoBoleto,
    c.PrimeiroVencimento,
    c.NumeroParcelas AS TotalParcelas,
    b.Status
FROM Boletos b
INNER JOIN Contratos c ON b.ContratoId = c.Id
WHERE b.Ativo = 1
ORDER BY b.ContratoId, b.NumeroParcela;

PRINT '=============================================================================';
PRINT 'MIGRATION CONCLUÍDA!';
PRINT '=============================================================================';
PRINT 'Os boletos manuais agora têm NumeroParcela calculado baseado em:';
PRINT '  NumeroParcela = (DueDate.Month - PrimeiroVencimento.Month) + 1';
PRINT '';
PRINT 'Isso evita duplicação no preview de geração em lote.';
PRINT '=============================================================================';

