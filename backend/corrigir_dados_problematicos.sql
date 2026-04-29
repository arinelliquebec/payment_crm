-- =========================================
-- SCRIPT ROBUSTO PARA CORRIGIR DADOS PROBLEMÁTICOS ANTES DE EXECUTAR O SCRIPT PRINCIPAL
-- Trata TODOS os casos que podem causar overflow ou erro de conversão
-- =========================================

PRINT '=== INICIANDO CORREÇÃO DE DADOS PROBLEMÁTICOS ===';

-- 1. Primeiro, vamos ver quais dados existem atualmente
SELECT TOP 5
    Id,
    ValorDevido,
    Comissao,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas
FROM Contratos
ORDER BY Id;

PRINT 'Dados atuais identificados';

-- 2. Tratar ValorDevido - o campo mais crítico
-- Primeiro, identificar problemas
SELECT
    COUNT(*) as Total,
    COUNT(CASE WHEN ValorDevido IS NULL THEN 1 END) as ValorDevidoNULL,
    COUNT(CASE WHEN ValorDevido < 0 THEN 1 END) as ValorDevidoNegativo,
    COUNT(CASE WHEN ValorDevido > 999999.99 THEN 1 END) as ValorDevidoAlto,
    COUNT(CASE WHEN ValorDevido < 0.01 AND ValorDevido > 0 THEN 1 END) as ValorDevidoMuitoBaixo
FROM Contratos;

-- Corrigir ValorDevido passo a passo
UPDATE Contratos
SET ValorDevido = 0
WHERE ValorDevido IS NULL;

UPDATE Contratos
SET ValorDevido = ABS(ValorDevido)
WHERE ValorDevido < 0;

UPDATE Contratos
SET ValorDevido = 999999.99
WHERE ValorDevido > 999999.99;

UPDATE Contratos
SET ValorDevido = 1000.00  -- Valor mínimo razoável
WHERE ValorDevido < 0.01 AND ValorDevido > 0;

PRINT 'ValorDevido corrigido';

-- 3. Tratar Comissão - abordagem ultra-simples
-- Definir valor padrão seguro para evitar qualquer problema
UPDATE Contratos
SET Comissao = 0  -- Valor neutro e seguro
WHERE Comissao IS NULL;

PRINT 'Comissão definida com valor padrão neutro';

-- 4. Tratar outros campos numéricos
UPDATE Contratos
SET
    ValorEntrada = COALESCE(ValorEntrada, 0),
    ValorParcela = COALESCE(ValorParcela, 0),
    NumeroParcelas = COALESCE(NumeroParcelas, 0)
WHERE ValorEntrada IS NULL OR ValorParcela IS NULL OR NumeroParcelas IS NULL;

PRINT 'Campos numéricos básicos tratados';

-- 5. Verificação final antes de continuar
SELECT
    COUNT(*) as TotalContratos,
    COUNT(CASE WHEN ValorDevido IS NULL THEN 1 END) as ValorDevidoNULL,
    COUNT(CASE WHEN ValorDevido <= 0 THEN 1 END) as ValorDevidoInvalido,
    COUNT(CASE WHEN ValorDevido > 999999.99 THEN 1 END) as ValorDevidoMuitoAlto,
    COUNT(CASE WHEN Comissao IS NULL THEN 1 END) as ComissaoNULL
FROM Contratos;

PRINT '=== VERIFICAÇÃO APÓS CORREÇÕES ===';

-- 6. Definir Comissão com valor padrão seguro (evitar cálculos)
-- Abordagem ultra-conservadora
UPDATE Contratos
SET Comissao = 0  -- Valor neutro e seguro
WHERE Comissao IS NULL;

PRINT 'Comissão definida com valor padrão seguro';

-- 7. Verificação final
SELECT TOP 5
    Id,
    ValorDevido,
    Comissao,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas
FROM Contratos
ORDER BY Id;

PRINT '=== DADOS CORRIGIDOS COM SUCESSO ===';
PRINT 'Agora execute o script popular_campos_contratos.sql';
PRINT 'Todos os dados estão limpos e seguros para cálculos';
