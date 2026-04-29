-- Script para configurar corretamente o usuário Mauro
-- Execute este script para garantir que o usuário esteja configurado corretamente

-- 1. Verificar se o usuário Mauro existe
SELECT 'Verificando usuário Mauro...' as Status;
SELECT Id, Nome, Email, GrupoAcessoId, ConsultorId, FilialId, Ativo 
FROM Usuarios 
WHERE Nome LIKE '%Mauro%' OR Email LIKE '%mauro%';

-- 2. Verificar se existe um consultor para Mauro
SELECT 'Verificando consultor para Mauro...' as Status;
SELECT c.Id, c.PessoaFisicaId, pf.Nome, c.FilialId, f.Nome as FilialNome
FROM Consultores c
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
WHERE pf.Nome LIKE '%Mauro%';

-- 3. Se não existir consultor para Mauro, criar um
-- Primeiro, verificar se existe PessoaFisica para Mauro
SELECT 'Verificando PessoaFisica para Mauro...' as Status;
SELECT Id, Nome, Cpf, Email FROM PessoasFisicas WHERE Nome LIKE '%Mauro%';

-- 4. Se não existir PessoaFisica para Mauro, criar uma
INSERT INTO PessoasFisicas (Nome, Cpf, Email, DataNascimento, Telefone, DataCadastro, Ativo)
SELECT 'Mauro Silva', '12345678901', 'mauro@arrighi.com', '1980-01-01', '(11) 99999-9999', GETDATE(), 1
WHERE NOT EXISTS (SELECT 1 FROM PessoasFisicas WHERE Nome LIKE '%Mauro%');

-- 5. Criar consultor para Mauro se não existir
INSERT INTO Consultores (PessoaFisicaId, FilialId, OAB, DataCadastro, Ativo)
SELECT 
    pf.Id,
    1, -- Assumindo que existe uma filial com ID 1
    '123456',
    GETDATE(),
    1
FROM PessoasFisicas pf
WHERE pf.Nome LIKE '%Mauro%'
  AND NOT EXISTS (SELECT 1 FROM Consultores c WHERE c.PessoaFisicaId = pf.Id);

-- 6. Atualizar usuário Mauro para ter o grupo Consultores e o ConsultorId correto
UPDATE Usuarios 
SET 
    GrupoAcessoId = (SELECT Id FROM GruposAcesso WHERE Nome = 'Consultores'),
    ConsultorId = (SELECT c.Id FROM Consultores c 
                   JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id 
                   WHERE pf.Nome LIKE '%Mauro%'),
    FilialId = (SELECT c.FilialId FROM Consultores c 
                JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id 
                WHERE pf.Nome LIKE '%Mauro%')
WHERE Nome LIKE '%Mauro%' OR Email LIKE '%mauro%';

-- 7. Verificar se a atualização foi bem-sucedida
SELECT 'Verificando configuração final do usuário Mauro...' as Status;
SELECT 
    u.Id,
    u.Nome,
    u.Email,
    u.GrupoAcessoId,
    g.Nome as GrupoNome,
    u.ConsultorId,
    c.PessoaFisicaId,
    pf.Nome as ConsultorNome,
    u.FilialId,
    f.Nome as FilialNome
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
LEFT JOIN Consultores c ON u.ConsultorId = c.Id
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON u.FilialId = f.Id
WHERE u.Nome LIKE '%Mauro%' OR u.Email LIKE '%mauro%';

-- 8. Verificar permissões do grupo Consultores
SELECT 'Verificando permissões do grupo Consultores...' as Status;
SELECT 
    g.Nome as Grupo,
    p.Nome as Permissao,
    p.Modulo,
    p.Acao,
    pg.ApenasProprios,
    pg.ApenasFilial,
    pg.ApenasLeitura
FROM GruposAcesso g
JOIN PermissoesGrupos pg ON g.Id = pg.GrupoAcessoId
JOIN Permissoes p ON pg.PermissaoId = p.Id
WHERE g.Nome = 'Consultores'
  AND p.Modulo = 'Contrato'
ORDER BY p.Acao;

-- 9. Verificar contratos existentes e seus consultores
SELECT 'Verificando contratos e consultores...' as Status;
SELECT 
    c.Id as ContratoId,
    c.ConsultorId,
    pf.Nome as ConsultorNome,
    CASE 
        WHEN cl.TipoPessoa = 'Fisica' THEN pf_cl.Nome
        WHEN cl.TipoPessoa = 'Juridica' THEN pj_cl.RazaoSocial
        ELSE 'N/A'
    END as ClienteNome,
    c.Situacao
FROM Contratos c
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN PessoasFisicas pf_cl ON cl.PessoaFisicaId = pf_cl.Id
LEFT JOIN PessoasJuridicas pj_cl ON cl.PessoaJuridicaId = pj_cl.Id
WHERE c.Ativo = 1
ORDER BY c.ConsultorId, c.Id;
