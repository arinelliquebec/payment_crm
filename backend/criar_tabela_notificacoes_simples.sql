-- =====================================================
-- Script Simplificado: Criar APENAS tabela Notificacoes
-- Data: 2024-12-20
-- Uso: Execute este script diretamente no SQL Server
-- =====================================================

-- Verificar se a tabela já existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notificacoes')
BEGIN
    PRINT '📋 Criando tabela Notificacoes...';

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
            REFERENCES Boletos(Id),
        CONSTRAINT FK_Notificacoes_Contratos FOREIGN KEY (ContratoId)
            REFERENCES Contratos(Id),
        CONSTRAINT FK_Notificacoes_Clientes FOREIGN KEY (ClienteId)
            REFERENCES Clientes(Id)
    );

    PRINT '✅ Tabela Notificacoes criada com sucesso!';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela Notificacoes já existe. Nenhuma ação necessária.';
END
GO

-- Criar índices para performance
PRINT '📊 Criando índices...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_UsuarioId' AND object_id = OBJECT_ID('Notificacoes'))
BEGIN
    CREATE INDEX IX_Notificacoes_UsuarioId ON Notificacoes(UsuarioId);
    PRINT '✅ Índice IX_Notificacoes_UsuarioId criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_DataCriacao' AND object_id = OBJECT_ID('Notificacoes'))
BEGIN
    CREATE INDEX IX_Notificacoes_DataCriacao ON Notificacoes(DataCriacao DESC);
    PRINT '✅ Índice IX_Notificacoes_DataCriacao criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_Lida' AND object_id = OBJECT_ID('Notificacoes'))
BEGIN
    CREATE INDEX IX_Notificacoes_Lida ON Notificacoes(Lida);
    PRINT '✅ Índice IX_Notificacoes_Lida criado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notificacoes_UsuarioId_Lida_DataCriacao' AND object_id = OBJECT_ID('Notificacoes'))
BEGIN
    CREATE INDEX IX_Notificacoes_UsuarioId_Lida_DataCriacao
        ON Notificacoes(UsuarioId, Lida, DataCriacao DESC);
    PRINT '✅ Índice composto IX_Notificacoes_UsuarioId_Lida_DataCriacao criado';
END
GO

PRINT '';
PRINT '🎉 Script concluído com sucesso!';
PRINT '📋 Tabela Notificacoes está pronta para uso.';
PRINT '';
PRINT '🔍 Para verificar:';
PRINT '   SELECT * FROM Notificacoes;';
GO
