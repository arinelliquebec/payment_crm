-- =========================================
-- SCRIPT ULTRA-SIMPLES PARA DEFINIR VALORES ESSENCIAIS
-- Abordagem minimalista absoluta - sem cálculos, sem riscos
-- =========================================

PRINT '=== INICIANDO DEFINIÇÃO ULTRA-SIMPLES ===';

-- 1. Definir apenas valores seguros para campos críticos
-- Abordagem ultra-conservadora: apenas garantir que campos não sejam NULL

UPDATE Contratos
SET
    ValorEntrada = COALESCE(ValorEntrada, 0),
    ValorParcela = COALESCE(ValorParcela, 0),
    NumeroParcelas = COALESCE(NumeroParcelas, 0),
    Comissao = COALESCE(Comissao, 0)
WHERE ValorEntrada IS NULL
   OR ValorParcela IS NULL
   OR NumeroParcelas IS NULL
   OR Comissao IS NULL;

PRINT 'Campos essenciais definidos com valores seguros (0)';

-- 2. Verificação final simples
SELECT TOP 3
    Id,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    Comissao,
    ValorDevido
FROM Contratos
ORDER BY Id;

PRINT '=== SCRIPT ULTRA-SIMPLES EXECUTADO ===';
PRINT 'Campos essenciais têm valores seguros (0)';
PRINT 'Nenhum cálculo matemático foi realizado';
PRINT 'Campos opcionais preservados como originais';
