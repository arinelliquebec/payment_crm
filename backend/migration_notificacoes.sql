-- =====================================================
-- Migration: Criar tabela de Notificações
-- Data: 2024-12-20
-- Descrição: Sistema de notificações para eventos do CRM
-- =====================================================

-- Criar tabela Notificacoes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notificacoes')
BEGIN
    CREATE TABLE Notificacoes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Tipo NVARCHAR(50) NOT NULL,
        Titulo NVARCHAR(200) NOT NULL,
        Mensagem NVARCHAR(MAX) NOT NULL,
        UsuarioId INT NULL,
        BoletoId INT NULL,
        ContratoId INT NULL,
        ClienteId INT NULL,
        Lida BIT NOT NULL DEFAULT 0,
        DataLeitura DATETIME2 NULL,
        DataCriacao DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        DadosAdicionais NVARCHAR(MAX) NULL,
        Prioridade NVARCHAR(20) NOT NULL DEFAULT 'Normal',
        Link NVARCHAR(500) NULL,

        -- Foreign Keys
        CONSTRAINT FK_Notificacoes_Usuarios FOREIGN KEY (UsuarioId)
            REFERENCES Usuarios(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Notificacoes_Boletos FOREIGN KEY (BoletoId)
            REFERENCES Boletos(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Notificacoes_Contratos FOREIGN KEY (ContratoId)
            REFERENCES Contratos(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Notificacoes_Clientes FOREIGN KEY (ClienteId)
            REFERENCES Clientes(Id) ON DELETE NO ACTION
    );

    PRINT '✅ Tabela Notificacoes criada com sucesso';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela Notificacoes já existe';
END
GO

-- Criar índices para performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_UsuarioId')
BEGIN
    CREATE INDEX IX_Notificacoes_UsuarioId ON Notificacoes(UsuarioId);
    PRINT '✅ Índice IX_Notificacoes_UsuarioId criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_DataCriacao')
BEGIN
    CREATE INDEX IX_Notificacoes_DataCriacao ON Notificacoes(DataCriacao DESC);
    PRINT '✅ Índice IX_Notificacoes_DataCriacao criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_Lida')
BEGIN
    CREATE INDEX IX_Notificacoes_Lida ON Notificacoes(Lida);
    PRINT '✅ Índice IX_Notificacoes_Lida criado';
END
GO

-- Índice composto para buscar notificações não lidas de um usuário (query mais comum)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_UsuarioId_Lida_DataCriacao')
BEGIN
    CREATE INDEX IX_Notificacoes_UsuarioId_Lida_DataCriacao
        ON Notificacoes(UsuarioId, Lida, DataCriacao DESC);
    PRINT '✅ Índice composto IX_Notificacoes_UsuarioId_Lida_DataCriacao criado';
END
GO

PRINT '🎉 Migration de Notificações concluída com sucesso!';
GO
