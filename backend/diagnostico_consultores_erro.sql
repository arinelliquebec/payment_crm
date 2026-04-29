-- Script para diagnosticar o problema "Consultor selecionado não foi encontrado"
-- Execute este script para identificar consultores inativos ou com problemas

-- 1. Verificar todos os consultores e seu status
SELECT 
    c.Id as ConsultorId,
    c.PessoaFisicaId,
    pf.Nome as NomeConsultor,
    c.FilialId,
    f.Nome as NomeFilial,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    c.DataCadastro,
    c.DataAtualizacao
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
ORDER BY c.Id;

-- 2. Verificar consultores INATIVOS (que podem estar causando o erro)
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    'PROBLEMA: Consultor inativo' as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 0
ORDER BY c.Id;

-- 3. Verificar consultores com PessoaFisica INATIVA
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    'PROBLEMA: PessoaFisica inativa' as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 1 AND pf.Ativo = 0
ORDER BY c.Id;

-- 4. Verificar consultores sem PessoaFisica vinculada
SELECT 
    c.Id as ConsultorId,
    c.PessoaFisicaId,
    c.Ativo as ConsultorAtivo,
    'PROBLEMA: Sem PessoaFisica vinculada' as Status
FROM Consultores c
WHERE c.PessoaFisicaId IS NULL
ORDER BY c.Id;

-- 5. Verificar consultores sem Filial vinculada
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.FilialId,
    c.Ativo as ConsultorAtivo,
    'PROBLEMA: Sem Filial vinculada' as Status
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.FilialId IS NULL
ORDER BY c.Id;

-- 6. Contar consultores por status
SELECT 
    'Total de Consultores' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores
UNION ALL
SELECT 
    'Consultores Ativos' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores
WHERE Ativo = 1
UNION ALL
SELECT 
    'Consultores Inativos' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores
WHERE Ativo = 0
UNION ALL
SELECT 
    'Consultores com PessoaFisica Ativa' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores c
JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Ativo = 1
UNION ALL
SELECT 
    'Consultores com PessoaFisica Inativa' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores c
JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Ativo = 0;

-- 7. Verificar contratos existentes e seus consultores
SELECT 
    'Contratos por Consultor' as Info,
    c.ConsultorId,
    co.PessoaFisicaId,
    pf.Nome as NomeConsultor,
    co.Ativo as ConsultorAtivo,
    COUNT(ct.Id) as TotalContratos
FROM Contratos ct
LEFT JOIN Consultores co ON ct.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Consultores c ON ct.ConsultorId = c.Id
WHERE ct.Ativo = 1
GROUP BY c.ConsultorId, co.PessoaFisicaId, pf.Nome, co.Ativo
ORDER BY TotalContratos DESC;

-- 8. Verificar se há consultores que aparecem na lista mas não podem ser selecionados
SELECT 
    'Possíveis Consultores Problemáticos' as Info,
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    CASE 
        WHEN c.Ativo = 0 THEN 'Consultor Inativo'
        WHEN pf.Ativo = 0 THEN 'PessoaFisica Inativa'
        WHEN c.PessoaFisicaId IS NULL THEN 'Sem PessoaFisica'
        WHEN c.FilialId IS NULL THEN 'Sem Filial'
        ELSE 'OK'
    END as Problema
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 0 
   OR pf.Ativo = 0 
   OR c.PessoaFisicaId IS NULL 
   OR c.FilialId IS NULL
ORDER BY c.Id;
