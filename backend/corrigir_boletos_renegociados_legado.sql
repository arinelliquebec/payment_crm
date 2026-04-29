-- ============================================================================
-- SCRIPT: Corrigir boletos BAIXADO_NAO_PAGO que já foram renegociados
-- Data: 2026-01-27
-- Descrição: Marca como avulso (NumeroParcela = NULL) boletos BAIXADO_NAO_PAGO
--            que já foram cobertos por um boleto pago posterior
-- ============================================================================

-- ============================================================================
-- 1. DIAGNÓSTICO: Identificar boletos que precisam ser corrigidos
-- ============================================================================
PRINT '🔍 DIAGNÓSTICO: Buscando boletos BAIXADO_NAO_PAGO com renegociação posterior...'
PRINT ''

;WITH BoletosParaCorrigir AS (
    SELECT 
        baixado.Id AS BoletoOriginalId,
        baixado.ContratoId,
        baixado.NumeroParcela AS ParcelaOriginal,
        baixado.NominalValue AS ValorOriginal,
        baixado.DueDate AS VencimentoOriginal,
        baixado.DataCadastro AS DataCriacaoOriginal,
        pago.Id AS BoletoRenegociacaoId,
        pago.NominalValue AS ValorRenegociacao,
        pago.DueDate AS VencimentoRenegociacao,
        pago.DataCadastro AS DataCriacaoRenegociacao,
        pago.DataPagamento,
        pago.Status AS StatusRenegociacao
    FROM Boletos baixado
    INNER JOIN Boletos pago ON baixado.ContratoId = pago.ContratoId
        AND pago.FoiPago = 1
        AND pago.Ativo = 1
        AND pago.DataCadastro > baixado.DataCadastro
        AND (pago.NumeroParcela IS NULL OR pago.NumeroParcela != baixado.NumeroParcela)
        AND pago.NominalValue >= baixado.NominalValue * 0.8 -- Tolerância de 20%
    WHERE baixado.Ativo = 1
        AND baixado.Status = 'BAIXADO'
        AND baixado.FoiPago = 0
        AND baixado.NumeroParcela IS NOT NULL
)
SELECT 
    BoletoOriginalId,
    ContratoId,
    ParcelaOriginal,
    CAST(ValorOriginal AS DECIMAL(10,2)) AS ValorOriginal,
    FORMAT(VencimentoOriginal, 'dd/MM/yyyy') AS VencimentoOriginal,
    FORMAT(DataCriacaoOriginal, 'dd/MM/yyyy') AS CriadoEm,
    BoletoRenegociacaoId AS BoletoPagoId,
    CAST(ValorRenegociacao AS DECIMAL(10,2)) AS ValorPago,
    FORMAT(DataPagamento, 'dd/MM/yyyy') AS DataPagamento,
    StatusRenegociacao
FROM BoletosParaCorrigir
ORDER BY ContratoId, ParcelaOriginal;

-- Contar quantos serão corrigidos
DECLARE @QtdParaCorrigir INT;

;WITH BoletosParaCorrigir AS (
    SELECT baixado.Id
    FROM Boletos baixado
    INNER JOIN Boletos pago ON baixado.ContratoId = pago.ContratoId
        AND pago.FoiPago = 1
        AND pago.Ativo = 1
        AND pago.DataCadastro > baixado.DataCadastro
        AND (pago.NumeroParcela IS NULL OR pago.NumeroParcela != baixado.NumeroParcela)
        AND pago.NominalValue >= baixado.NominalValue * 0.8
    WHERE baixado.Ativo = 1
        AND baixado.Status = 'BAIXADO'
        AND baixado.FoiPago = 0
        AND baixado.NumeroParcela IS NOT NULL
)
SELECT @QtdParaCorrigir = COUNT(*) FROM BoletosParaCorrigir;

PRINT ''
PRINT CONCAT('📊 Total de boletos a corrigir: ', @QtdParaCorrigir);
PRINT ''

-- ============================================================================
-- 2. CORREÇÃO: Marcar boletos como avulsos (NumeroParcela = NULL)
-- ============================================================================
-- DESCOMENTE AS LINHAS ABAIXO APÓS VALIDAR O DIAGNÓSTICO
-- ============================================================================

/*
PRINT '🔄 EXECUTANDO CORREÇÃO...'
PRINT ''

;WITH BoletosParaCorrigir AS (
    SELECT baixado.Id
    FROM Boletos baixado
    INNER JOIN Boletos pago ON baixado.ContratoId = pago.ContratoId
        AND pago.FoiPago = 1
        AND pago.Ativo = 1
        AND pago.DataCadastro > baixado.DataCadastro
        AND (pago.NumeroParcela IS NULL OR pago.NumeroParcela != baixado.NumeroParcela)
        AND pago.NominalValue >= baixado.NominalValue * 0.8
    WHERE baixado.Ativo = 1
        AND baixado.Status = 'BAIXADO'
        AND baixado.FoiPago = 0
        AND baixado.NumeroParcela IS NOT NULL
)
UPDATE Boletos
SET 
    NumeroParcela = NULL,
    DataAtualizacao = GETDATE()
WHERE Id IN (SELECT Id FROM BoletosParaCorrigir);

PRINT CONCAT('✅ ', @@ROWCOUNT, ' boleto(s) marcado(s) como avulso (renegociados)');
*/

-- ============================================================================
-- 3. CORREÇÃO ESPECÍFICA: Boleto #177 (BRASSERIE FRANCESA)
-- ============================================================================
-- Se quiser corrigir apenas um boleto específico:
-- ============================================================================

/*
UPDATE Boletos
SET 
    NumeroParcela = NULL,
    DataAtualizacao = GETDATE()
WHERE Id = 177
    AND Status = 'BAIXADO'
    AND FoiPago = 0;

PRINT '✅ Boleto #177 marcado como avulso (renegociado pelo boleto #221)';
*/

PRINT ''
PRINT '============================================================================'
PRINT '⚠️  IMPORTANTE: Este script está em modo DIAGNÓSTICO.'
PRINT '    Para aplicar as correções, descomente as seções de UPDATE acima.'
PRINT '============================================================================'

