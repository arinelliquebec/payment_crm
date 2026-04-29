-- ============================================
-- Migration: Pipeline de Vendas (Leads)
-- Data: 25/12/2024
-- Descrição: Cria tabelas para gestão de leads e pipeline comercial
-- ============================================

-- Tabela de Leads
CREATE TABLE Leads (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NomeEmpresa NVARCHAR(200) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Novo',
    ValorEstimado DECIMAL(18,2) NOT NULL DEFAULT 0,
    Probabilidade INT NULL,
    Origem NVARCHAR(100) NULL,
    ContatoNome NVARCHAR(200) NULL,
    ContatoTelefone NVARCHAR(20) NULL,
    ContatoEmail NVARCHAR(200) NULL,
    ContatoCargo NVARCHAR(100) NULL,
    Necessidade NVARCHAR(MAX) NULL,
    Observacoes NVARCHAR(MAX) NULL,
    ResponsavelId INT NULL,
    DataCriacao DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    DataUltimaInteracao DATETIME2 NULL,
    DataProximaAcao DATETIME2 NULL,
    ProximaAcao NVARCHAR(500) NULL,
    DataQualificacao DATETIME2 NULL,
    DataProposta DATETIME2 NULL,
    DataNegociacao DATETIME2 NULL,
    DataFechamento DATETIME2 NULL,
    MotivoPerda NVARCHAR(200) NULL,
    ClienteId INT NULL,
    ContratoId INT NULL,
    CriadoPorId INT NULL,
    DataAtualizacao DATETIME2 NULL,
    AtualizadoPorId INT NULL,

    CONSTRAINT FK_Leads_Responsavel FOREIGN KEY (ResponsavelId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Leads_Cliente FOREIGN KEY (ClienteId) REFERENCES Clientes(Id),
    CONSTRAINT FK_Leads_Contrato FOREIGN KEY (ContratoId) REFERENCES Contratos(Id),
    CONSTRAINT FK_Leads_CriadoPor FOREIGN KEY (CriadoPorId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Leads_AtualizadoPor FOREIGN KEY (AtualizadoPorId) REFERENCES Usuarios(Id)
);

-- Tabela de Interações com Leads
CREATE TABLE LeadInteracoes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    LeadId INT NOT NULL,
    Tipo NVARCHAR(50) NOT NULL,
    Descricao NVARCHAR(MAX) NOT NULL,
    DataInteracao DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UsuarioId INT NULL,
    DuracaoMinutos INT NULL,

    CONSTRAINT FK_LeadInteracoes_Lead FOREIGN KEY (LeadId) REFERENCES Leads(Id) ON DELETE CASCADE,
    CONSTRAINT FK_LeadInteracoes_Usuario FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
);

-- Índices para performance
CREATE INDEX IX_Leads_Status ON Leads(Status);
CREATE INDEX IX_Leads_ResponsavelId ON Leads(ResponsavelId);
CREATE INDEX IX_Leads_Origem ON Leads(Origem);
CREATE INDEX IX_Leads_DataCriacao ON Leads(DataCriacao DESC);
CREATE INDEX IX_Leads_DataProximaAcao ON Leads(DataProximaAcao);
CREATE INDEX IX_LeadInteracoes_LeadId ON LeadInteracoes(LeadId);
CREATE INDEX IX_LeadInteracoes_DataInteracao ON LeadInteracoes(DataInteracao DESC);

-- Dados de exemplo (opcional - remover em produção)
/*
INSERT INTO Leads (NomeEmpresa, Status, ValorEstimado, Probabilidade, Origem, ContatoNome, ContatoTelefone, ContatoEmail, Necessidade, ResponsavelId)
VALUES
('Construtora ABC Ltda', 'Novo', 50000, 10, 'Indicação', 'João Silva', '(11) 99999-9999', 'joao@abc.com.br', 'Consultoria tributária para expansão', 1),
('Tech Solutions SA', 'Qualificado', 120000, 30, 'Site', 'Maria Santos', '(11) 98888-8888', 'maria@techsolutions.com.br', 'Revisão de processos fiscais', 1),
('Indústria XYZ', 'Proposta', 200000, 50, 'Evento', 'Carlos Mendes', '(11) 97777-7777', 'carlos@xyz.com.br', 'Defesa em autuação fiscal', 1);
*/

PRINT '✅ Tabelas de Pipeline de Vendas criadas com sucesso!';
