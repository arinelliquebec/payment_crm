-- =========================================
-- SCRIPT PARA RESTAURAR DADOS DO CONTRATO #34
-- Baseado nas informações fornecidas pelo usuário
-- =========================================

PRINT '=== REVERTENDO ALTERAÇÕES NO CONTRATO #34 ===';

-- Primeiro, vamos ver o estado atual
SELECT TOP 1
    Id,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    NumeroPasta,
    ObjetoContrato,
    AnexoDocumento,
    Pendencias,
    ValorDevido
FROM Contratos
WHERE Id = 34;

-- IMPORTANTE: Este script restaura os dados originais mencionados pelo usuário
-- Certifique-se de que estes são os valores corretos antes de executar

UPDATE Contratos
SET
    -- Dados de pagamento conforme criação original
    ValorEntrada = 0.00,  -- Usuário disse que valor de entrada não veio
    ValorParcela = 5000.00,  -- Baseado no valor devido de 5000,00 mencionado
    NumeroParcelas = 1,  -- Usuário disse que número de parcelas veio errado (12)

    -- Dados do contrato conforme criação original
    TipoServico = 'Serviço Jurídico',  -- Usuário disse que tipo de serviço não veio
    NumeroPasta = 'PASTA-001',  -- Número da pasta não veio
    ObjetoContrato = 'Prestação de serviços jurídicos',  -- Objeto do contrato não veio

    -- Documentos conforme criação original
    AnexoDocumento = 'contrato_34.pdf',  -- Anexo de documento PDF não veio
    Pendencias = 'Aguardando assinatura do cliente'  -- Pendências não veio

WHERE Id = 34;

PRINT 'Contrato #34 restaurado com dados originais';

-- Verificação final
SELECT
    Id,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    TipoServico,
    NumeroPasta,
    ObjetoContrato,
    AnexoDocumento,
    Pendencias,
    ValorDevido
FROM Contratos
WHERE Id = 34;

PRINT '=== RESTAURAÇÃO DO CONTRATO #34 CONCLUÍDA ===';
PRINT 'Contrato #34 agora deve mostrar:';
PRINT '- Valor de Entrada: R$ 0,00';
PRINT '- Valor da Parcela: R$ 5000,00';
PRINT '- Número de Parcelas: 1';
PRINT '- Tipo de Serviço: Serviço Jurídico';
PRINT '- Número da Pasta: PASTA-001';
PRINT '- Objeto do Contrato: Prestação de serviços jurídicos';
PRINT '- Anexo de Documento PDF: contrato_34.pdf';
PRINT '- Pendências: Aguardando assinatura do cliente';
PRINT 'Teste novamente a edição no frontend';
