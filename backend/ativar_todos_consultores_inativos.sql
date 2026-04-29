-- Script para ativar TODOS os consultores inativos
-- Execute com cuidado - esta query irá ativar TODOS os consultores que estão inativos

-- 1. Verificar quantos consultores inativos existem ANTES da correção
SELECT 'ANTES DA CORREÇÃO:' as Status;
SELECT 
    COUNT(*) as TotalConsultoresInativos,
    'Consultores que serão ativados' as Descricao
FROM Consultores 
WHERE Ativo = 0;

-- 2. Mostrar quais consultores serão ativados
SELECT 'CONSULTORES QUE SERÃO ATIVADOS:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    c.Ativo as StatusAtual,
    c.DataCadastro,
    c.DataAtualizacao
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 0
ORDER BY c.Id;

-- 3. ATIVAR TODOS OS CONSULTORES INATIVOS
UPDATE Consultores 
SET 
    Ativo = 1, 
    DataAtualizacao = GETDATE()
WHERE Ativo = 0;

-- 4. Verificar quantos consultores foram ativados
SELECT 'RESULTADO DA CORREÇÃO:' as Status;
SELECT 
    @@ROWCOUNT as ConsultoresAtivados,
    'Consultores ativados com sucesso' as Descricao;

-- 5. Verificar se ainda existem consultores inativos
SELECT 'VERIFICAÇÃO FINAL:' as Status;
SELECT 
    COUNT(*) as ConsultoresAindaInativos,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ TODOS os consultores estão ativos!'
        ELSE '⚠️ Ainda existem consultores inativos'
    END as Resultado
FROM Consultores 
WHERE Ativo = 0;

-- 6. Mostrar estatísticas finais
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
    'Consultores Inativos' as Tipo,
    COUNT(*) as Quantidade
FROM Consultores
WHERE Ativo = 0;

-- 7. Listar todos os consultores ativos após a correção
SELECT 'TODOS OS CONSULTORES ATIVOS:' as Info;
SELECT 
    c.Id as ConsultorId,
    pf.Nome as NomeConsultor,
    f.Nome as FilialNome,
    c.Ativo as Status,
    c.DataAtualizacao as UltimaAtualizacao
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
WHERE c.Ativo = 1
ORDER BY pf.Nome;
