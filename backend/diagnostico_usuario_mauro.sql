-- Script para diagnosticar o usuário Mauro e suas permissões
-- Execute este script para verificar se o usuário está configurado corretamente

-- 1. Verificar se o usuário Mauro existe
SELECT 
    u.Id,
    u.Nome,
    u.Email,
    u.GrupoAcessoId,
    u.ConsultorId,
    u.FilialId,
    u.Ativo
FROM Usuarios u 
WHERE u.Nome LIKE '%Mauro%' OR u.Email LIKE '%mauro%'
ORDER BY u.Id;

-- 2. Verificar o grupo de acesso do usuário
SELECT 
    u.Id as UsuarioId,
    u.Nome as UsuarioNome,
    g.Id as GrupoId,
    g.Nome as GrupoNome,
    g.Descricao as GrupoDescricao
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.Nome LIKE '%Mauro%' OR u.Email LIKE '%mauro%';

-- 3. Verificar se o usuário tem consultor vinculado
SELECT 
    u.Id as UsuarioId,
    u.Nome as UsuarioNome,
    c.Id as ConsultorId,
    c.PessoaFisicaId,
    pf.Nome as ConsultorNome,
    c.FilialId,
    f.Nome as FilialNome
FROM Usuarios u
LEFT JOIN Consultores c ON u.ConsultorId = c.Id
LEFT JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
LEFT JOIN Filiais f ON c.FilialId = f.Id
WHERE u.Nome LIKE '%Mauro%' OR u.Email LIKE '%mauro%';

-- 4. Verificar permissões do grupo Consultores
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

-- 5. Verificar contratos existentes e seus consultores
SELECT 
    c.Id as ContratoId,
    c.ConsultorId,
    co.PessoaFisicaId,
    pf.Nome as ConsultorNome,
    cl.TipoPessoa,
    CASE 
        WHEN cl.TipoPessoa = 'Fisica' THEN pf_cl.Nome
        WHEN cl.TipoPessoa = 'Juridica' THEN pj_cl.RazaoSocial
        ELSE 'N/A'
    END as ClienteNome,
    c.Situacao,
    c.DataCadastro
FROM Contratos c
LEFT JOIN Consultores co ON c.ConsultorId = co.Id
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Clientes cl ON c.ClienteId = cl.Id
LEFT JOIN PessoasFisicas pf_cl ON cl.PessoaFisicaId = pf_cl.Id
LEFT JOIN PessoasJuridicas pj_cl ON cl.PessoaJuridicaId = pj_cl.Id
WHERE c.Ativo = 1
ORDER BY c.Id;

-- 6. Contar contratos por consultor
SELECT 
    co.Id as ConsultorId,
    pf.Nome as ConsultorNome,
    COUNT(c.Id) as TotalContratos
FROM Consultores co
LEFT JOIN PessoasFisicas pf ON co.PessoaFisicaId = pf.Id
LEFT JOIN Contratos c ON co.Id = c.ConsultorId AND c.Ativo = 1
GROUP BY co.Id, pf.Nome
ORDER BY TotalContratos DESC;

-- 7. Verificar se há usuários sem grupo de acesso
SELECT 
    u.Id,
    u.Nome,
    u.Email,
    u.GrupoAcessoId,
    g.Nome as GrupoNome
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.GrupoAcessoId IS NULL OR g.Nome IS NULL;
