-- Script para atualizar permissões do grupo Consultores
-- Garantir que consultores vejam apenas seus próprios contratos

-- Verificar se o grupo Consultores existe
SELECT Id, Nome, Descricao FROM GruposAcesso WHERE Nome = 'Consultores';

-- Verificar permissões atuais do grupo Consultores
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
ORDER BY p.Modulo, p.Acao;

-- Atualizar permissões do grupo Consultores para Contrato
-- Definir que consultores só podem ver seus próprios contratos
UPDATE PermissoesGrupos 
SET ApenasProprios = 1,  -- Apenas seus próprios registros
    ApenasFilial = 0,    -- Não restrito por filial
    ApenasLeitura = 0    -- Pode editar
WHERE GrupoAcessoId = (SELECT Id FROM GruposAcesso WHERE Nome = 'Consultores')
  AND PermissaoId IN (
    SELECT Id FROM Permissoes 
    WHERE Modulo = 'Contrato' 
    AND Acao IN ('Visualizar', 'Editar', 'Incluir')
  );

-- Verificar se a atualização foi aplicada
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

-- Verificar total de permissões por grupo
SELECT 
    g.Nome as Grupo,
    COUNT(pg.Id) as TotalPermissoes
FROM GruposAcesso g
LEFT JOIN PermissoesGrupos pg ON g.Id = pg.GrupoAcessoId
GROUP BY g.Id, g.Nome
ORDER BY g.Id;
