-- =========================================
-- SCRIPT PARA VERIFICAR DADOS COMPLETOS DE UM CONTRATO ESPECÍFICO
-- Mostra TODOS os campos e relacionamentos
-- =========================================

DECLARE @ContratoId INT = 34;  -- Altere para o ID do contrato que está com problemas

PRINT '=== VERIFICAÇÃO COMPLETA DO CONTRATO ===';

-- 1. Dados básicos do contrato
SELECT
    'CONTRATO PRINCIPAL' as Categoria,
    Id,
    ClienteId,
    ConsultorId,
    ParceiroId,
    Situacao,
    ValorDevido,
    ValorNegociado,
    Observacoes,
    Ativo,
    DataCadastro,
    DataAtualizacao
FROM Contratos
WHERE Id = @ContratoId;

-- 2. Campos específicos mencionados
SELECT
    'CAMPOS ESPECÍFICOS' as Categoria,
    NumeroPasta,
    DataFechamentoContrato,
    TipoServico,
    ObjetoContrato,
    Comissao,
    ValorEntrada,
    ValorParcela,
    NumeroParcelas,
    PrimeiroVencimento,
    AnexoDocumento,
    Pendencias,
    DataUltimoContato,
    DataProximoContato
FROM Contratos
WHERE Id = @ContratoId;

-- 3. Dados do cliente relacionado
SELECT
    'CLIENTE RELACIONADO' as Categoria,
    c.Id as ContratoId,
    cl.Id as ClienteId,
    cl.TipoPessoa,
    pf.Nome as ClienteNome,
    pf.EmailEmpresarial as ClienteEmail,
    pf.Telefone1 as ClienteTelefone,
    pj.RazaoSocial as ClienteRazaoSocial,
    pj.Email as ClienteEmailPJ,
    pj.Telefone1 as ClienteTelefonePJ,
    cl.FilialId
FROM Contratos c
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN PessoasFisicas pf ON cl.PessoaFisicaId = pf.Id
LEFT JOIN PessoasJuridicas pj ON cl.PessoaJuridicaId = pj.Id
WHERE c.Id = @ContratoId;

-- 4. Dados do consultor relacionado
SELECT
    'CONSULTOR RELACIONADO' as Categoria,
    c.Id as ContratoId,
    co.Id as ConsultorId,
    pf.Nome as ConsultorNome,
    pf.EmailEmpresarial as ConsultorEmail,
    pf.Telefone1 as ConsultorTelefone,
    f.Nome as FilialNome,
    co.FilialId
FROM Contratos c
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON co.FilialId = f.Id
WHERE c.Id = @ContratoId;

-- 5. Verificar se há dados relacionados que podem estar faltando
SELECT
    'VERIFICAÇÃO DE RELACIONAMENTOS' as Categoria,
    c.Id as ContratoId,
    CASE WHEN c.ClienteId IS NOT NULL THEN 'Cliente OK' ELSE 'Cliente NULL' END as ClienteStatus,
    CASE WHEN c.ConsultorId IS NOT NULL THEN 'Consultor OK' ELSE 'Consultor NULL' END as ConsultorStatus,
    CASE WHEN cl.Id IS NOT NULL THEN 'Cliente encontrado' ELSE 'Cliente não encontrado' END as ClienteEncontrado,
    CASE WHEN co.Id IS NOT NULL THEN 'Consultor encontrado' ELSE 'Consultor não encontrado' END as ConsultorEncontrado
FROM Contratos c
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
WHERE c.Id = @ContratoId;

PRINT '=== VERIFICAÇÃO CONCLUÍDA ===';
PRINT 'Compare estes dados com o que aparece no frontend';
PRINT 'Se os dados estão no banco mas não no frontend, há problema na transmissão';
