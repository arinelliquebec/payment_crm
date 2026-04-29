-- Script para verificar e corrigir o usuário patrick.rodrigues2770
-- Execute este script no banco de dados

-- 1. Verificar dados atuais do usuário
PRINT '=== DADOS ATUAIS DO USUÁRIO ===';
SELECT
    u.Id as UsuarioId,
    u.Login,
    u.Email,
    u.Senha,
    pf.Nome as NomePessoa,
    pf.Cpf,
    pf.EmailEmpresarial,
    ga.Nome as GrupoAcesso,
    f.Nome as Filial
FROM Usuarios u
LEFT JOIN PessoasFisicas pf ON u.PessoaFisicaId = pf.Id
LEFT JOIN GruposAcesso ga ON u.GrupoAcessoId = ga.Id
LEFT JOIN Filiais f ON u.FilialId = f.Id
WHERE u.Login = 'patrick.rodrigues2770';

-- 2. Verificar se existe pessoa física com CPF 12365382770
PRINT '=== VERIFICANDO CPF 12365382770 ===';
SELECT
    Id,
    Nome,
    Cpf,
    EmailEmpresarial
FROM PessoasFisicas
WHERE REPLACE(REPLACE(REPLACE(Cpf, '.', ''), '-', ''), ' ', '') = '12365382770';

-- 3. Se não existir, vamos criar a pessoa física
IF NOT EXISTS (SELECT 1 FROM PessoasFisicas WHERE REPLACE(REPLACE(REPLACE(Cpf, '.', ''), '-', ''), ' ', '') = '12365382770')
BEGIN
    PRINT 'Criando pessoa física com CPF 12365382770...';

    INSERT INTO PessoasFisicas (Nome, EmailEmpresarial, Cpf)
    VALUES ('Patrick Rodrigues', 'patrick.rodrigues2770@gmail.com', '123.653.827-70');

    PRINT 'Pessoa física criada!';
END

-- 4. Obter ID da pessoa física
DECLARE @PessoaFisicaId INT;
SELECT @PessoaFisicaId = Id
FROM PessoasFisicas
WHERE REPLACE(REPLACE(REPLACE(Cpf, '.', ''), '-', ''), ' ', '') = '12365382770';

-- 5. Verificar se usuário existe
DECLARE @UsuarioId INT;
SELECT @UsuarioId = Id FROM Usuarios WHERE Login = 'patrick.rodrigues2770';

-- 6. Se usuário não existe, criar
IF @UsuarioId IS NULL
BEGIN
    PRINT 'Criando usuário patrick.rodrigues2770...';

    DECLARE @GrupoAdminId INT;
    SELECT @GrupoAdminId = Id FROM GruposAcesso WHERE Nome = 'Administrador';

    INSERT INTO Usuarios (
        Login,
        Email,
        Senha,
        TipoPessoa,
        PessoaFisicaId,
        GrupoAcessoId,
        Ativo,
        DataCadastro
    )
    VALUES (
        'patrick.rodrigues2770',
        'patrick.rodrigues2770@gmail.com',
        'bBhoho123#', -- Senha em texto plano (será hashada pelo sistema)
        'Fisica',
        @PessoaFisicaId,
        @GrupoAdminId,
        1,
        GETDATE()
    );

    SELECT @UsuarioId = SCOPE_IDENTITY();
    PRINT 'Usuário criado com ID: ' + CAST(@UsuarioId AS VARCHAR);
END
ELSE
BEGIN
    -- 7. Se usuário existe, atualizar dados
    PRINT 'Atualizando usuário existente...';

    UPDATE Usuarios
    SET
        PessoaFisicaId = @PessoaFisicaId,
        Senha = 'bBhoho123#', -- Atualizar senha
        Email = 'patrick.rodrigues2770@gmail.com',
        DataAtualizacao = GETDATE()
    WHERE Id = @UsuarioId;

    PRINT 'Usuário atualizado!';
END

-- 8. Verificar resultado final
PRINT '=== DADOS FINAIS DO USUÁRIO ===';
SELECT
    u.Id as UsuarioId,
    u.Login,
    u.Email,
    u.Senha,
    pf.Nome as NomePessoa,
    pf.Cpf,
    pf.EmailEmpresarial,
    ga.Nome as GrupoAcesso,
    f.Nome as Filial
FROM Usuarios u
LEFT JOIN PessoasFisicas pf ON u.PessoaFisicaId = pf.Id
LEFT JOIN GruposAcesso ga ON u.GrupoAcessoId = ga.Id
LEFT JOIN Filiais f ON u.FilialId = f.Id
WHERE u.Login = 'patrick.rodrigues2770';

PRINT 'Script executado com sucesso!';
