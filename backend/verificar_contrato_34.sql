-- =========================================
-- SCRIPT PARA VERIFICAR ESPECIFICAMENTE O CONTRATO #34
-- Mostra TODOS os campos do contrato mencionado pelo usuário
-- =========================================

PRINT '=== VERIFICAÇÃO DO CONTRATO #34 ===';

-- 1. Verificar se o contrato #34 existe
SELECT
    'Contrato existe' as Status,
    Id,
    ClienteId,
    ConsultorId,
    Situacao,
    Ativo
FROM Contratos
WHERE Id = 34;

-- 2. Mostrar TODOS os campos do contrato #34
SELECT
    Id,
    '--- DADOS PRINCIPAIS ---' as Categoria,
    ValorDevido,
    ValorNegociado,
    Situacao,
    DataCadastro,
    DataAtualizacao,
    Ativo,
    '--- DADOS DE PAGAMENTO ---' as Categoria2,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    PrimeiroVencimento,
    Comissao,
    '--- DADOS DO CONTRATO ---' as Categoria3,
    NumeroPasta,
    DataFechamentoContrato,
    TipoServico,
    ObjetoContrato,
    '--- DOCUMENTOS ---' as Categoria4,
    AnexoDocumento,
    Pendencias,
    '--- DADOS DE CONTATO ---' as Categoria5,
    DataUltimoContato,
    DataProximoContato,
    Observacoes
FROM Contratos
WHERE Id = 34;

-- 3. Verificar dados relacionados (Cliente e Consultor)
SELECT
    '--- DADOS DO CLIENTE ---' as Categoria,
    c.Id as ContratoId,
    cl.Id as ClienteId,
    pf.Nome as ClienteNome,
    pf.EmailEmpresarial as ClienteEmail,
    pj.RazaoSocial as ClienteRazaoSocial,
    pj.Email as ClienteEmailPJ
FROM Contratos c
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN PessoasFisicas pf ON cl.PessoaFisicaId = pf.Id
LEFT JOIN PessoasJuridicas pj ON cl.PessoaJuridicaId = pj.Id
WHERE c.Id = 34;

-- 4. Verificar dados do Consultor
SELECT
    '--- DADOS DO CONSULTOR ---' as Categoria,
    c.Id as ContratoId,
    co.Id as ConsultorId,
    pf.Nome as ConsultorNome,
    pf.EmailEmpresarial as ConsultorEmail,
    f.Nome as FilialNome
FROM Contratos c
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON co.FilialId = f.Id
WHERE c.Id = 34;

PRINT '=== VERIFICAÇÃO DO CONTRATO #34 CONCLUÍDA ===';
PRINT 'Compare estes dados com o que aparece no frontend';
PRINT 'Se os dados estão no banco mas não no frontend, há problema na transmissão';
