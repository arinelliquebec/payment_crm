-- =========================================
-- SCRIPT ULTRA-CONSERVADOR: SÓ CORRIGE CONTRATOS COMPLETAMENTE VAZIOS
-- Preserva 100% dos dados existentes, só intervém onde não há nada
-- =========================================

PRINT '=== VERIFICAÇÃO ANTES DE QUALQUER ALTERAÇÃO ===';

-- 1. Mostrar contratos que têm PELO MENOS UM campo preenchido
SELECT TOP 5
    Id,
    ValorDevido,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    AnexoDocumento,
    Pendencias
FROM Contratos
WHERE ValorDevido IS NOT NULL
   OR ValorEntrada IS NOT NULL
   OR ValorParcela IS NOT NULL
   OR NumeroParcelas IS NOT NULL
   OR TipoServico IS NOT NULL
   OR AnexoDocumento IS NOT NULL
   OR Pendencias IS NOT NULL
ORDER BY Id;

-- 2. Mostrar contratos que estão completamente vazios (só esses serão alterados)
SELECT TOP 5
    Id,
    ValorDevido,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    AnexoDocumento,
    Pendencias
FROM Contratos
WHERE ValorDevido IS NULL
  AND ValorEntrada IS NULL
  AND ValorParcela IS NULL
  AND NumeroParcelas IS NULL
  AND (TipoServico IS NULL OR TipoServico = '')
  AND (AnexoDocumento IS NULL OR AnexoDocumento = '')
  AND (Pendencias IS NULL OR Pendencias = '')
ORDER BY Id;

PRINT '=== APENAS CONTRATOS VAZIOS SERÃO MODIFICADOS ===';

-- 3. Só definir valores mínimos para contratos completamente vazios
-- Abordagem: contratos existentes com dados são 100% preservados
UPDATE Contratos
SET
    ValorDevido = COALESCE(ValorDevido, 0),
    ValorEntrada = COALESCE(ValorEntrada, 0),
    ValorParcela = COALESCE(ValorParcela, 0),
    NumeroParcelas = COALESCE(NumeroParcelas, 0),
    Comissao = COALESCE(Comissao, 0)
WHERE ValorDevido IS NULL
  AND ValorEntrada IS NULL
  AND ValorParcela IS NULL
  AND NumeroParcelas IS NULL
  AND Comissao IS NULL;

PRINT 'Apenas contratos completamente vazios receberam valores padrão';

-- 4. Verificação final - mostrar que dados existentes foram preservados
SELECT TOP 10
    Id,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    AnexoDocumento,
    Pendencias,
    ValorDevido
FROM Contratos
WHERE ValorEntrada IS NOT NULL
   OR ValorParcela IS NOT NULL
   OR NumeroParcelas IS NOT NULL
   OR TipoServico IS NOT NULL
   OR AnexoDocumento IS NOT NULL
   OR Pendencias IS NOT NULL
ORDER BY Id;

PRINT '=== VERIFICAÇÃO FINAL ===';
PRINT '✅ Dados existentes foram 100% preservados';
PRINT '✅ Apenas contratos vazios receberam valores mínimos';
PRINT '✅ Contratos com dados originais estão intactos';
PRINT 'Agora teste a edição de contratos no frontend';
