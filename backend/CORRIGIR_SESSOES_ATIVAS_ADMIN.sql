-- ============================================
-- Script para Corrigir Sessões Ativas para Administradores
-- ============================================

-- 1. Verificar estado atual dos grupos
PRINT '=== VERIFICANDO GRUPOS DE ACESSO ==='
SELECT
    Id,
    Nome,
    DATALENGTH(Nome) as TamanhoBytes,
    LEN(Nome) as Comprimento,
    CASE
        WHEN Nome = 'Administrador' THEN '✅ Correto'
        ELSE '❌ Incorreto'
    END as Status
FROM GruposAcesso
WHERE Nome LIKE '%Admin%';

-- 2. Corrigir nome do grupo Administrador (remover espaços e padronizar)
PRINT ''
PRINT '=== CORRIGINDO NOME DO GRUPO ADMINISTRADOR ==='
UPDATE GruposAcesso
SET Nome = 'Administrador'
WHERE Nome LIKE '%Admin%'
  AND Nome != 'Administrador';

PRINT 'Grupos atualizados: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

-- 3. Verificar se existe o grupo Administrador
IF NOT EXISTS (SELECT 1 FROM GruposAcesso WHERE Nome = 'Administrador')
BEGIN
    PRINT ''
    PRINT '⚠️ ATENÇÃO: Grupo Administrador não existe! Criando...'

    INSERT INTO GruposAcesso (Nome, Descricao, Ativo, DataCadastro)
    VALUES ('Administrador', 'Grupo com acesso total ao sistema', 1, GETDATE());

    PRINT '✅ Grupo Administrador criado com sucesso!'
END

-- 4. Obter ID do grupo Administrador
DECLARE @AdminGroupId INT;
SELECT @AdminGroupId = Id FROM GruposAcesso WHERE Nome = 'Administrador';

PRINT ''
PRINT '=== ID DO GRUPO ADMINISTRADOR: ' + CAST(@AdminGroupId AS VARCHAR(10)) + ' ==='

-- 5. Verificar usuários que deveriam ser administradores
PRINT ''
PRINT '=== USUÁRIOS ATUAIS E SEUS GRUPOS ==='
SELECT
    u.Id,
    u.Login,
    u.Email,
    u.GrupoAcessoId,
    g.Nome as GrupoAtual,
    CASE
        WHEN g.Nome = 'Administrador' THEN '✅ É Admin'
        WHEN g.Nome LIKE '%Admin%' THEN '⚠️ Grupo Admin incorreto'
        ELSE '❌ Não é Admin'
    END as StatusAdmin
FROM Usuarios u
LEFT JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE u.Ativo = 1
ORDER BY g.Nome, u.Login;

-- 6. Atualizar usuários que têm grupo Admin incorreto
PRINT ''
PRINT '=== CORRIGINDO USUÁRIOS COM GRUPO ADMIN INCORRETO ==='
UPDATE u
SET u.GrupoAcessoId = @AdminGroupId
FROM Usuarios u
INNER JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE g.Nome LIKE '%Admin%'
  AND g.Nome != 'Administrador'
  AND u.Ativo = 1;

PRINT 'Usuários corrigidos: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

-- 7. Verificar resultado final
PRINT ''
PRINT '=== RESULTADO FINAL - ADMINISTRADORES ==='
SELECT
    u.Id,
    u.Login,
    u.Email,
    g.Nome as Grupo,
    u.UltimoAcesso,
    CASE
        WHEN g.Nome = 'Administrador' THEN '✅ Configurado corretamente'
        ELSE '❌ Ainda com problema'
    END as Status
FROM Usuarios u
INNER JOIN GruposAcesso g ON u.GrupoAcessoId = g.Id
WHERE g.Nome = 'Administrador'
  AND u.Ativo = 1
ORDER BY u.Login;

-- 8. Verificar sessões ativas
PRINT ''
PRINT '=== SESSÕES ATIVAS ATUAIS ==='
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SessoesAtivas')
BEGIN
    SELECT
        COUNT(*) as TotalSessoes,
        SUM(CASE WHEN Ativa = 1 THEN 1 ELSE 0 END) as SessoesAtivas,
        SUM(CASE WHEN Ativa = 0 THEN 1 ELSE 0 END) as SessoesInativas
    FROM SessoesAtivas;

    PRINT ''
    PRINT '=== DETALHES DAS SESSÕES ATIVAS ==='
    SELECT
        s.Id,
        s.UsuarioId,
        s.NomeUsuario,
        s.Email,
        s.Perfil,
        s.InicioSessao,
        s.UltimaAtividade,
        s.Ativa,
        DATEDIFF(MINUTE, s.UltimaAtividade, GETDATE()) as MinutosSemAtividade
    FROM SessoesAtivas s
    WHERE s.Ativa = 1
    ORDER BY s.UltimaAtividade DESC;
END
ELSE
BEGIN
    PRINT '⚠️ Tabela SessoesAtivas não existe!'
END

-- 9. Limpar sessões antigas (opcional - mais de 24 horas sem atividade)
PRINT ''
PRINT '=== LIMPANDO SESSÕES ANTIGAS ==='
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SessoesAtivas')
BEGIN
    UPDATE SessoesAtivas
    SET Ativa = 0,
        DataHoraOffline = GETDATE()
    WHERE Ativa = 1
      AND DATEDIFF(HOUR, UltimaAtividade, GETDATE()) > 24;

    PRINT 'Sessões antigas marcadas como inativas: ' + CAST(@@ROWCOUNT AS VARCHAR(10))
END

PRINT ''
PRINT '============================================'
PRINT '✅ SCRIPT CONCLUÍDO COM SUCESSO!'
PRINT '============================================'
PRINT ''
PRINT 'PRÓXIMOS PASSOS:'
PRINT '1. Faça logout do sistema'
PRINT '2. Limpe o cache do navegador (Ctrl+Shift+Delete)'
PRINT '3. Faça login novamente'
PRINT '4. Verifique se o card "Sessões Ativas" aparece no dashboard'
PRINT ''
