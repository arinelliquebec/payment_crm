-- ============================================================================
-- MIGRATION: Portal do Cliente
-- Data: 2024-12-12
-- Descrição: Cria tabela de credenciais para acesso ao Portal do Cliente
-- ============================================================================

-- Criar tabela CredenciaisPortalCliente
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CredenciaisPortalCliente')
BEGIN
    CREATE TABLE CredenciaisPortalCliente (
        Id INT PRIMARY KEY IDENTITY(1,1),
        ClienteId INT NOT NULL,
        Documento VARCHAR(14) NOT NULL,
        Email VARCHAR(100) NOT NULL,
        SenhaHash VARCHAR(200) NOT NULL,
        NomeExibicao VARCHAR(100),
        DataCriacao DATETIME NOT NULL DEFAULT GETDATE(),
        UltimoAcesso DATETIME NULL,
        Ativo BIT NOT NULL DEFAULT 1,
        TokenRecuperacao VARCHAR(100) NULL,
        TokenExpiracao DATETIME NULL,
        PrimeiroAcessoRealizado BIT NOT NULL DEFAULT 0,
        
        -- Foreign Key
        CONSTRAINT FK_CredenciaisPortalCliente_Clientes 
            FOREIGN KEY (ClienteId) REFERENCES Clientes(Id)
    );
    
    PRINT 'Tabela CredenciaisPortalCliente criada com sucesso';
    
    -- Índice único por documento
    CREATE UNIQUE INDEX IX_CredenciaisPortalCliente_Documento 
        ON CredenciaisPortalCliente (Documento);
    PRINT 'Índice único por Documento criado';
    
    -- Índice por ClienteId
    CREATE INDEX IX_CredenciaisPortalCliente_ClienteId 
        ON CredenciaisPortalCliente (ClienteId);
    PRINT 'Índice por ClienteId criado';
    
    -- Índice por Token (para recuperação de senha)
    CREATE INDEX IX_CredenciaisPortalCliente_Token 
        ON CredenciaisPortalCliente (TokenRecuperacao) 
        WHERE TokenRecuperacao IS NOT NULL;
    PRINT 'Índice por Token criado';
END
ELSE
BEGIN
    PRINT 'Tabela CredenciaisPortalCliente já existe';
END;

-- ============================================================================
-- Configuração opcional: Criar credencial inicial para testes
-- ============================================================================

/*
-- Exemplo: Criar credencial para um cliente específico (DESCOMENTE se necessário)
-- Primeiro, encontre o ClienteId do cliente que quer criar acesso:

SELECT c.Id, pf.Nome, pf.Cpf, pf.EmailEmpresarial
FROM Clientes c
INNER JOIN PessoasFisicas pf ON c.PessoaFisicaId = pf.Id
WHERE c.Ativo = 1
ORDER BY pf.Nome;

-- Depois, insira a credencial (substitua os valores):
-- A senha abaixo é "123456" em BCrypt

INSERT INTO CredenciaisPortalCliente (
    ClienteId, 
    Documento, 
    Email, 
    SenhaHash, 
    NomeExibicao, 
    PrimeiroAcessoRealizado
)
VALUES (
    1,  -- ClienteId
    '12345678901',  -- CPF sem formatação
    'cliente@email.com',  -- Email
    '$2a$11$K3VqoWZE3fOk.lOoJUNpO.aK8SJIuPzqZRWrCFpBrHYiUKwKNT9Wy',  -- Hash de "123456"
    'Nome do Cliente',
    1  -- Já realizou primeiro acesso
);
*/

PRINT '=============================================================================';
PRINT 'MIGRATION DO PORTAL DO CLIENTE CONCLUÍDA!';
PRINT '=============================================================================';
PRINT '';
PRINT 'Endpoints disponíveis:';
PRINT '  POST /api/Portal/auth/login           - Login do cliente';
PRINT '  POST /api/Portal/auth/primeiro-acesso - Solicitar primeiro acesso';
PRINT '  POST /api/Portal/auth/definir-senha   - Definir/redefinir senha';
PRINT '  POST /api/Portal/auth/recuperar-senha - Recuperar senha';
PRINT '  GET  /api/Portal/contratos            - Listar contratos';
PRINT '  GET  /api/Portal/contratos/{id}       - Detalhes do contrato';
PRINT '  GET  /api/Portal/contratos/{id}/pdf   - Download PDF do contrato';
PRINT '  GET  /api/Portal/boletos              - Listar boletos';
PRINT '  GET  /api/Portal/boletos/{id}         - Detalhes do boleto';
PRINT '  GET  /api/Portal/boletos/{id}/pdf     - Download PDF do boleto';
PRINT '  GET  /api/Portal/boletos/dashboard    - Dashboard do cliente';
PRINT '=============================================================================';

