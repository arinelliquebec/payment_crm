-- =========================================
-- SCRIPT DE DIAGNÓSTICO COMPLETO PARA O CONTRATO #34
-- Verifica estrutura da tabela, relacionamentos e dados
-- =========================================

DECLARE @ContratoId INT = 34;

PRINT '=== DIAGNÓSTICO COMPLETO DO CONTRATO #34 ===';

-- 1. Verificar estrutura da tabela Contratos
SELECT
    'ESTRUTURA DA TABELA' as Categoria,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    NUMERIC_PRECISION,
    NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Contratos'
ORDER BY ORDINAL_POSITION;

-- 2. Verificar dados completos do contrato #34
SELECT
    'DADOS DO CONTRATO #34' as Categoria,
    Id,
    ClienteId,
    ConsultorId,
    ParceiroId,
    Situacao,
    ValorDevido,
    ValorNegociado,
    Observacoes,
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
    DataProximoContato,
    DataCadastro,
    DataAtualizacao,
    Ativo
FROM Contratos
WHERE Id = @ContratoId;

-- 3. Verificar relacionamentos (Cliente)
SELECT
    'CLIENTE RELACIONADO' as Categoria,
    c.Id as ContratoId,
    cl.Id as ClienteId,
    cl.TipoPessoa,
    CASE
        WHEN pf.Id IS NOT NULL THEN 'Pessoa Física'
        WHEN pj.Id IS NOT NULL THEN 'Pessoa Jurídica'
        ELSE 'Tipo desconhecido'
    END as TipoCliente,
    COALESCE(pf.Nome, pj.RazaoSocial, 'Cliente não encontrado') as NomeCliente,
    COALESCE(pf.EmailEmpresarial, pj.Email, 'Email não encontrado') as EmailCliente,
    cl.FilialId
FROM Contratos c
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN PessoasFisicas pf ON cl.PessoaFisicaId = pf.Id
LEFT JOIN PessoasJuridicas pj ON cl.PessoaJuridicaId = pj.Id
WHERE c.Id = @ContratoId;

-- 4. Verificar relacionamentos (Consultor)
SELECT
    'CONSULTOR RELACIONADO' as Categoria,
    c.Id as ContratoId,
    co.Id as ConsultorId,
    pf.Nome as ConsultorNome,
    pf.EmailEmpresarial as ConsultorEmail,
    f.Nome as FilialNome,
    co.FilialId
FROM Contratos c
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON co.FilialId = f.Id
WHERE c.Id = @ContratoId;

-- 5. Verificar se há problemas de integridade referencial
SELECT
    'VERIFICAÇÃO DE INTEGRIDADE' as Categoria,
    c.Id as ContratoId,
    CASE WHEN c.ClienteId IS NOT NULL AND cl.Id IS NULL THEN 'ClienteId órfão!' ELSE 'ClienteId OK' END as ClienteStatus,
    CASE WHEN c.ConsultorId IS NOT NULL AND co.Id IS NULL THEN 'ConsultorId órfão!' ELSE 'ConsultorId OK' END as ConsultorStatus,
    CASE WHEN c.ParceiroId IS NOT NULL AND p.Id IS NULL THEN 'ParceiroId órfão!' ELSE 'ParceiroId OK' END as ParceiroStatus
FROM Contratos c
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN Parceiros p ON c.ParceiroId = p.Id
WHERE c.Id = @ContratoId;

-- 6. Verificar se há registros duplicados ou inconsistentes
SELECT
    'VERIFICAÇÃO DE DUPLICATAS' as Categoria,
    COUNT(*) as TotalContratosComMesmoId,
    MIN(DataCadastro) as PrimeiroCadastro,
    MAX(DataAtualizacao) as UltimaAtualizacao
FROM Contratos
WHERE Id = @ContratoId;

PRINT '=== DIAGNÓSTICO CONCLUÍDO ===';
PRINT 'Verifique se há problemas estruturais ou de relacionamento';
PRINT 'Se tudo estiver OK no banco, o problema pode estar na transmissão dos dados';
