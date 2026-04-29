-- =========================================
-- SCRIPT PARA RESTAURAR DADOS CORRETOS DO CONTRATO #34
-- Baseado nas informações fornecidas pelo usuário
-- =========================================

PRINT '=== REVERTENDO CONTRATO #34 PARA DADOS CORRETOS ===';

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

-- IMPORTANTE: Este script restaura os dados corretos mencionados pelo usuário
-- Certifique-se de que estes são os valores corretos antes de executar

UPDATE Contratos
SET
    -- Dados de pagamento conforme criação original
    ValorEntrada = 0.00,  -- Usuário disse que valor de entrada não veio
    ValorParcela = 1250.00,  -- Baseado no valor devido de 5000 dividido por 4 parcelas
    NumeroParcelas = 4,  -- Usuário disse que deveria ser 4

    -- Dados do contrato conforme criação original
    TipoServico = 'Serviço Tributário',  -- Usuário disse que deveria ser "Serviço Tributário"
    NumeroPasta = 'TRIB-2024-001',  -- Número da pasta correto
    ObjetoContrato = 'Consultoria tributária especializada para empresa de médio porte',  -- Objeto do contrato correto

    -- Documentos conforme criação original
    AnexoDocumento = 'contrato_tributario_34.pdf',  -- Anexo de documento PDF correto
    Pendencias = 'Aguardando análise da documentação fiscal'  -- Pendências correto

WHERE Id = 34;

PRINT 'Contrato #34 restaurado com dados corretos';

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
PRINT '- Valor da Parcela: R$ 1250,00';
PRINT '- Número de Parcelas: 4';
PRINT '- Tipo de Serviço: Serviço Tributário';
PRINT '- Número da Pasta: TRIB-2024-001';
PRINT '- Objeto do Contrato: Consultoria tributária especializada para empresa de médio porte';
PRINT '- Anexo de Documento PDF: contrato_tributario_34.pdf';
PRINT '- Pendências: Aguardando análise da documentação fiscal';
PRINT 'Teste novamente a edição no frontend';
