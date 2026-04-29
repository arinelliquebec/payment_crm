-- Script para tornar o usuário com CPF 12365382770 administrador
-- Execute este script no banco de dados

-- 1. Primeiro, vamos encontrar a pessoa física com o CPF
DECLARE @PessoaFisicaId INT;
DECLARE @UsuarioId INT;
DECLARE @GrupoAdminId INT;

-- Buscar pessoa física pelo CPF (removendo formatação)
SELECT @PessoaFisicaId = Id
FROM PessoasFisicas
WHERE REPLACE(REPLACE(REPLACE(Cpf, '.', ''), '-', ''), ' ', '') = '12365382770';

IF @PessoaFisicaId IS NULL
BEGIN
    PRINT 'ERRO: Pessoa física com CPF 123.653.827-70 não encontrada!';
    RETURN;
END
ELSE
BEGIN
    PRINT 'Pessoa física encontrada com ID: ' + CAST(@PessoaFisicaId AS VARCHAR);
END

-- 2. Buscar usuário associado a essa pessoa física
SELECT @UsuarioId = Id
FROM Usuarios
WHERE PessoaFisicaId = @PessoaFisicaId;

IF @UsuarioId IS NULL
BEGIN
    PRINT 'ERRO: Usuário associado ao CPF 123.653.827-70 não encontrado!';
    RETURN;
END
ELSE
BEGIN
    PRINT 'Usuário encontrado com ID: ' + CAST(@UsuarioId AS VARCHAR);
END

-- 3. Buscar ID do grupo Administrador
SELECT @GrupoAdminId = Id
FROM GruposAcesso
WHERE Nome = 'Administrador';

IF @GrupoAdminId IS NULL
BEGIN
    PRINT 'ERRO: Grupo de acesso "Administrador" não encontrado!';
    RETURN;
END
ELSE
BEGIN
    PRINT 'Grupo Administrador encontrado com ID: ' + CAST(@GrupoAdminId AS VARCHAR);
END

-- 4. Verificar dados atuais do usuário
SELECT
    u.Login,
    u.Email,
    pf.Nome,
    pf.Cpf,
    ga.Nome as GrupoAtual
FROM Usuarios u
LEFT JOIN PessoasFisicas pf ON u.PessoaFisicaId = pf.Id
LEFT JOIN GruposAcesso ga ON u.GrupoAcessoId = ga.Id
WHERE u.Id = @UsuarioId;

-- 5. Atualizar o usuário para administrador
UPDATE Usuarios
SET
    GrupoAcessoId = @GrupoAdminId,
    DataAtualizacao = GETDATE()
WHERE Id = @UsuarioId;

-- 6. Verificar se a atualização foi bem-sucedida
IF @@ROWCOUNT > 0
BEGIN
    PRINT 'SUCCESS: Usuário atualizado para Administrador com sucesso!';

    -- Mostrar dados atualizados
    SELECT
        u.Login,
        u.Email,
        pf.Nome,
        pf.Cpf,
        ga.Nome as NovoGrupo,
        u.DataAtualizacao
    FROM Usuarios u
    LEFT JOIN PessoasFisicas pf ON u.PessoaFisicaId = pf.Id
    LEFT JOIN GruposAcesso ga ON u.GrupoAcessoId = ga.Id
    WHERE u.Id = @UsuarioId;
END
ELSE
BEGIN
    PRINT 'ERRO: Falha ao atualizar o usuário!';
END
