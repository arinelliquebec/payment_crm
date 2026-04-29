-- Script para corrigir consultores inativos que estão causando erro no cadastro
-- Execute este script para ativar consultores que deveriam estar ativos

-- 1. Verificar consultores inativos antes da correção
SELECT 'ANTES DA CORREÇÃO - Consultores Inativos:' as Status;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    c.DataCadastro
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 0
ORDER BY c.Id;

-- 2. Ativar consultores que têm PessoaFisica ativa (provavelmente foram desativados por engano)
UPDATE Consultores 
SET Ativo = 1, DataAtualizacao = GETDATE()
WHERE Ativo = 0 
  AND PessoaFisicaId IN (
    SELECT Id FROM PessoasFisicas WHERE Ativo = 1
  );

-- 3. Verificar quantos consultores foram ativados
SELECT 'Consultores ativados:' as Status, @@ROWCOUNT as Quantidade;

-- 4. Ativar PessoasFisicas que são consultores e estão inativas (se necessário)
UPDATE PessoasFisicas 
SET Ativo = 1, DataAtualizacao = GETDATE()
WHERE Ativo = 0 
  AND Id IN (
    SELECT DISTINCT PessoaFisicaId 
    FROM Consultores 
    WHERE PessoaFisicaId IS NOT NULL
  );

-- 5. Verificar quantas PessoasFisicas foram ativadas
SELECT 'PessoasFisicas de consultores ativadas:' as Status, @@ROWCOUNT as Quantidade;

-- 6. Verificar consultores após a correção
SELECT 'APÓS A CORREÇÃO - Consultores Ativos:' as Status;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as ConsultorAtivo,
    pf.Ativo as PessoaFisicaAtiva,
    c.DataCadastro,
    c.DataAtualizacao
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 1
ORDER BY c.Id;

-- 7. Verificar se ainda há consultores problemáticos
SELECT 'PROBLEMAS RESTANTES:' as Status;
SELECT 
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

-- 8. Estatísticas finais
SELECT 'ESTATÍSTICAS FINAIS:' as Info;
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
    'Consultores com PessoaFisica Ativa' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores c
JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE pf.Ativo = 1 AND c.Ativo = 1;
