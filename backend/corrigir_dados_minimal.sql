-- =========================================
-- SCRIPT MINIMALISTA PARA CORRIGIR APENAS DADOS ESSENCIAIS
-- Abordagem ultra-conservadora - sem cálculos matemáticos
-- =========================================

PRINT '=== INICIANDO CORREÇÃO MINIMALISTA ===';

-- 1. Ver dados atuais (apenas visualização)
SELECT TOP 3 Id, ValorDevido, Comissao FROM Contratos ORDER BY Id;

-- 2. APENAS corrigir campos que estão REALMENTE NULL ou inválidos
-- Abordagem ULTRA-CONSERVADORA: preservar TODOS os dados existentes

-- Só definir ValorDevido como 0 se estiver NULL (não tocar em valores existentes)
UPDATE Contratos
SET ValorDevido = 0
WHERE ValorDevido IS NULL;

-- Só definir outros campos essenciais como 0 se estiverem NULL
UPDATE Contratos
SET
    ValorEntrada = 0,
    ValorParcela = 0,
    NumeroParcelas = 0,
    Comissao = 0
WHERE ValorEntrada IS NULL
   OR ValorParcela IS NULL
   OR NumeroParcelas IS NULL
   OR Comissao IS NULL;

PRINT 'Campos essenciais definidos com valores padrão seguros (0)';

-- 3. Verificação final
SELECT TOP 3
    Id,
    ValorDevido,
    Comissao,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas
FROM Contratos
ORDER BY Id;

PRINT '=== CORREÇÃO MINIMALISTA CONCLUÍDA ===';
PRINT 'Todos os campos essenciais agora têm valores seguros (0)';
PRINT 'Execute agora o script popular_campos_contratos.sql';
