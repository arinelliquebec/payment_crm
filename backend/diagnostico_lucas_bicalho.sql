-- Diagnóstico específico para o consultor LUCAS BICALHO
-- Execute este script para investigar por que este consultor específico está causando erro

-- 1. Buscar o consultor LUCAS BICALHO especificamente
SELECT 'BUSCA POR LUCAS BICALHO:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    pf.Cpf,
    c.PessoaFisicaId,
    c.FilialId,
    f.Nome as NomeFilial,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    c.DataCadastro,
    c.DataAtualizacao,
    pf.DataCadastro as PessoaFisicaDataCadastro,
    pf.DataAtualizacao as PessoaFisicaDataAtualizacao
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;

-- 2. Buscar por variações do nome
SELECT 'BUSCA POR VARIAÇÕES DO NOME:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    'Nome encontrado' as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LUCAS%' 
   OR pf.Nome LIKE '%BICALHO%'
   OR pf.Nome LIKE '%LUCAS BICALHO%'
   OR pf.Nome LIKE '%BICALHO LUCAS%'
ORDER BY pf.Nome;

-- 3. Verificar se há problemas com a PessoaFisica vinculada
SELECT 'VERIFICAÇÃO DA PESSOA FÍSICA:' as Info;
SELECT 
    pf.Id as PessoaFisicaId,
    pf.Nome,
    pf.Cpf,
    pf.Ativo as PessoaFisicaAtiva,
    pf.EmailEmpresarial,
    pf.EmailPessoal,
    pf.DataCadastro,
    pf.DataAtualizacao
FROM PessoasFisicas pf
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;

-- 4. Verificar se há múltiplos consultores com o mesmo nome
SELECT 'VERIFICAÇÃO DE DUPLICATAS:' as Info;
SELECT 
    pf.Nome,
    COUNT(c.Id) as QuantidadeConsultores,
    STRING_AGG(CAST(c.Id as VARCHAR), ', ') as IdsConsultores,
    STRING_AGG(CAST(c.Ativo as VARCHAR), ', ') as StatusAtivos
FROM PessoasFisicas pf
JOIN Consultores c ON pf.Id = c.PessoaFisicaId
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
GROUP BY pf.Nome
HAVING COUNT(c.Id) > 1;

-- 5. Verificar se o consultor está vinculado a algum contrato
SELECT 'CONTRATOS VINCULADOS:' as Info;
SELECT 
    ct.Id as ContratoId,
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    ct.Situacao,
    ct.DataCadastro as ContratoDataCadastro,
    ct.Ativo as ContratoAtivo
FROM Contratos ct
JOIN Consultores c ON ct.ConsultorId = c.Id
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY ct.Id;

-- 6. Verificar se há problemas com a Filial
SELECT 'VERIFICAÇÃO DA FILIAL:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.FilialId,
    f.Nome as NomeFilial,
    f.Ativo as FilialAtiva,
    f.DataCadastro as FilialDataCadastro
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;

-- 7. Verificar se há consultores com IDs específicos que podem estar sendo usados
SELECT 'CONSULTORES COM IDS ESPECÍFICOS:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    c.PessoaFisicaId,
    c.FilialId
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10) -- IDs comuns que podem estar sendo usados
ORDER BY c.Id;

-- 8. Verificar se há problemas de encoding ou caracteres especiais
SELECT 'VERIFICAÇÃO DE ENCODING:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    LEN(pf.Nome) as TamanhoNome,
    ASCII(LEFT(pf.Nome, 1)) as PrimeiroCharASCII,
    ASCII(RIGHT(pf.Nome, 1)) as UltimoCharASCII
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;

-- 9. Buscar consultores com nomes similares (pode ser erro de digitação)
SELECT 'NOMES SIMILARES:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    'Nome similar encontrado' as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LUC%' 
   OR pf.Nome LIKE '%BIC%'
   OR pf.Nome LIKE '%CALHO%'
   OR pf.Nome LIKE '%LUCAS%'
   OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;

-- 10. Verificar se há consultores ativos mas com PessoaFisica inativa
SELECT 'PROBLEMAS DE ATIVAÇÃO:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    CASE 
        WHEN c.Ativo = 1 AND pf.Ativo = 0 THEN 'PROBLEMA: Consultor ativo mas PessoaFisica inativa'
        WHEN c.Ativo = 0 AND pf.Ativo = 1 THEN 'PROBLEMA: Consultor inativo mas PessoaFisica ativa'
        WHEN c.Ativo = 0 AND pf.Ativo = 0 THEN 'PROBLEMA: Ambos inativos'
        WHEN c.Ativo = 1 AND pf.Ativo = 1 THEN 'OK: Ambos ativos'
        ELSE 'PROBLEMA: Status indefinido'
    END as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Nome LIKE '%LUCAS%' OR pf.Nome LIKE '%BICALHO%'
ORDER BY pf.Nome;
