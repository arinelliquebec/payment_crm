-- Migration: Portal do Cliente - Tabelas de Credenciais e Convites
-- Data: 2026-02-10

-- Tabela de credenciais de acesso ao portal
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CredenciaisPortalCliente')
BEGIN
    CREATE TABLE CredenciaisPortalCliente (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ClienteId INT NOT NULL,
        SenhaHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'cliente',
        Ativo BIT NOT NULL DEFAULT 1,
        DataCadastro DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        DataAtualizacao DATETIME2 NULL,
        CONSTRAINT FK_CredenciaisPortalCliente_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_CredenciaisPortalCliente_ClienteId UNIQUE (ClienteId)
    );

    CREATE INDEX IX_CredenciaisPortalCliente_ClienteId ON CredenciaisPortalCliente(ClienteId);

    PRINT 'Tabela CredenciaisPortalCliente criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela CredenciaisPortalCliente ja existe.';
END
GO

-- Tabela de convites (tokens de ativacao)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConvitesPortal')
BEGIN
    CREATE TABLE ConvitesPortal (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TokenHash NVARCHAR(128) NOT NULL,
        ClienteId INT NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        CriadoPorId INT NULL,
        CriadoEm DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        ExpiraEm DATETIME2 NOT NULL,
        UsadoEm DATETIME2 NULL,
        Usado BIT NOT NULL DEFAULT 0,
        CONSTRAINT FK_ConvitesPortal_Clientes FOREIGN KEY (ClienteId) REFERENCES Clientes(Id) ON DELETE CASCADE
    );

    CREATE INDEX IX_ConvitesPortal_TokenHash ON ConvitesPortal(TokenHash);
    CREATE INDEX IX_ConvitesPortal_ClienteId ON ConvitesPortal(ClienteId);

    PRINT 'Tabela ConvitesPortal criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela ConvitesPortal ja existe.';
END
GO
