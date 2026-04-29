-- =========================================
-- SCRIPT PARA VERIFICAR E POPULAR CAMPOS DE CONTRATOS
-- Execute este script diretamente no banco de dados
-- =========================================

-- 1. Verificar estrutura da tabela Contratos
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Contratos'
ORDER BY ORDINAL_POSITION;

-- 2. Verificar contratos sem TipoServico
SELECT COUNT(*) as ContratosSemTipoServico
FROM Contratos
WHERE TipoServico IS NULL OR TipoServico = '';

-- 3. Verificar contratos sem DataFechamentoContrato
SELECT COUNT(*) as ContratosSemDataFechamento
FROM Contratos
WHERE DataFechamentoContrato IS NULL;

-- 4. Verificar contratos sem dados de pagamento
SELECT COUNT(*) as ContratosSemDadosPagamento
FROM Contratos
WHERE ValorEntrada IS NULL
   AND ValorParcela IS NULL
   AND NumeroParcelas IS NULL
   AND PrimeiroVencimento IS NULL;

-- 5. Mostrar alguns exemplos de contratos existentes
SELECT TOP 10
    Id,
    TipoServico,
    DataFechamentoContrato,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    PrimeiroVencimento,
    DataCadastro
FROM Contratos
ORDER BY Id;

PRINT '=== VERIFICAÇÃO CONCLUÍDA ===';
PRINT 'Execute o próximo script se precisar popular campos vazios';
