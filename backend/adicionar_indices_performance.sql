/*
 * Script para adicionar índices de performance
 * CRM Arrighi - Otimização de Queries
 * Data: 30/09/2025
 */

USE [CrmArrighi]; -- Ajustar para o nome do seu banco
GO

PRINT '🚀 Iniciando criação de índices de performance...';
GO

-- ============================================================
-- ÍNDICES PARA PESSOAS FÍSICAS
-- ============================================================

-- Índice para busca por CPF (muito usado)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PessoasFisicas_Cpf' AND object_id = OBJECT_ID('PessoasFisicas'))
BEGIN
    PRINT '  ✅ Criando índice IX_PessoasFisicas_Cpf...';
    CREATE NONCLUSTERED INDEX IX_PessoasFisicas_Cpf
    ON PessoasFisicas(Cpf)
    INCLUDE (Nome, EmailEmpresarial, Telefone1);
END
ELSE
    PRINT '  ℹ️  Índice IX_PessoasFisicas_Cpf já existe';
GO

-- Índice para busca por email empresarial
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PessoasFisicas_EmailEmpresarial' AND object_id = OBJECT_ID('PessoasFisicas'))
BEGIN
    PRINT '  ✅ Criando índice IX_PessoasFisicas_EmailEmpresarial...';
    CREATE NONCLUSTERED INDEX IX_PessoasFisicas_EmailEmpresarial
    ON PessoasFisicas(EmailEmpresarial)
    WHERE EmailEmpresarial IS NOT NULL;
END
ELSE
    PRINT '  ℹ️  Índice IX_PessoasFisicas_EmailEmpresarial já existe';
GO

-- Índice para busca por nome (autocomplete)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PessoasFisicas_Nome' AND object_id = OBJECT_ID('PessoasFisicas'))
BEGIN
    PRINT '  ✅ Criando índice IX_PessoasFisicas_Nome...';
    CREATE NONCLUSTERED INDEX IX_PessoasFisicas_Nome
    ON PessoasFisicas(Nome);
END
ELSE
    PRINT '  ℹ️  Índice IX_PessoasFisicas_Nome já existe';
GO

-- ============================================================
-- ÍNDICES PARA PESSOAS JURÍDICAS
-- ============================================================

-- Índice para busca por CNPJ
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PessoaJuridica_Cnpj' AND object_id = OBJECT_ID('PessoaJuridica'))
BEGIN
    PRINT '  ✅ Criando índice IX_PessoaJuridica_Cnpj...';
    CREATE NONCLUSTERED INDEX IX_PessoaJuridica_Cnpj
    ON PessoaJuridica(Cnpj)
    INCLUDE (RazaoSocial, Email, Telefone1);
END
ELSE
    PRINT '  ℹ️  Índice IX_PessoaJuridica_Cnpj já existe';
GO

-- Índice para busca por razão social
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PessoaJuridica_RazaoSocial' AND object_id = OBJECT_ID('PessoaJuridica'))
BEGIN
    PRINT '  ✅ Criando índice IX_PessoaJuridica_RazaoSocial...';
    CREATE NONCLUSTERED INDEX IX_PessoaJuridica_RazaoSocial
    ON PessoaJuridica(RazaoSocial);
END
ELSE
    PRINT '  ℹ️  Índice IX_PessoaJuridica_RazaoSocial já existe';
GO

-- ============================================================
-- ÍNDICES PARA CLIENTES
-- ============================================================

-- Índice composto para filtros comuns
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_Ativo_TipoPessoa' AND object_id = OBJECT_ID('Clientes'))
BEGIN
    PRINT '  ✅ Criando índice IX_Clientes_Ativo_TipoPessoa...';
    CREATE NONCLUSTERED INDEX IX_Clientes_Ativo_TipoPessoa
    ON Clientes(Ativo, TipoPessoa)
    INCLUDE (PessoaFisicaId, PessoaJuridicaId, FilialId);
END
ELSE
    PRINT '  ℹ️  Índice IX_Clientes_Ativo_TipoPessoa já existe';
GO

-- Índice para FK PessoaFisicaId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_PessoaFisicaId' AND object_id = OBJECT_ID('Clientes'))
BEGIN
    PRINT '  ✅ Criando índice IX_Clientes_PessoaFisicaId...';
    CREATE NONCLUSTERED INDEX IX_Clientes_PessoaFisicaId
    ON Clientes(PessoaFisicaId)
    WHERE PessoaFisicaId IS NOT NULL;
END
ELSE
    PRINT '  ℹ️  Índice IX_Clientes_PessoaFisicaId já existe';
GO

-- Índice para FK PessoaJuridicaId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_PessoaJuridicaId' AND object_id = OBJECT_ID('Clientes'))
BEGIN
    PRINT '  ✅ Criando índice IX_Clientes_PessoaJuridicaId...';
    CREATE NONCLUSTERED INDEX IX_Clientes_PessoaJuridicaId
    ON Clientes(PessoaJuridicaId)
    WHERE PessoaJuridicaId IS NOT NULL;
END
ELSE
    PRINT '  ℹ️  Índice IX_Clientes_PessoaJuridicaId já existe';
GO

-- ============================================================
-- ÍNDICES PARA CONTRATOS
-- ============================================================

-- Índice para busca por ClienteId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contratos_ClienteId_Ativo' AND object_id = OBJECT_ID('Contratos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Contratos_ClienteId_Ativo...';
    CREATE NONCLUSTERED INDEX IX_Contratos_ClienteId_Ativo
    ON Contratos(ClienteId, Ativo)
    INCLUDE (Situacao, ValorNegociado, DataCadastro);
END
ELSE
    PRINT '  ℹ️  Índice IX_Contratos_ClienteId_Ativo já existe';
GO

-- Índice para busca por ConsultorId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contratos_ConsultorId_Ativo' AND object_id = OBJECT_ID('Contratos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Contratos_ConsultorId_Ativo...';
    CREATE NONCLUSTERED INDEX IX_Contratos_ConsultorId_Ativo
    ON Contratos(ConsultorId, Ativo)
    INCLUDE (ClienteId, Situacao, ValorNegociado);
END
ELSE
    PRINT '  ℹ️  Índice IX_Contratos_ConsultorId_Ativo já existe';
GO

-- Índice para filtro por situação
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contratos_Situacao_Ativo' AND object_id = OBJECT_ID('Contratos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Contratos_Situacao_Ativo...';
    CREATE NONCLUSTERED INDEX IX_Contratos_Situacao_Ativo
    ON Contratos(Situacao, Ativo)
    INCLUDE (ClienteId, ConsultorId, ValorNegociado, DataCadastro);
END
ELSE
    PRINT '  ℹ️  Índice IX_Contratos_Situacao_Ativo já existe';
GO

-- Índice para ordenação por data
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Contratos_DataCadastro' AND object_id = OBJECT_ID('Contratos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Contratos_DataCadastro...';
    CREATE NONCLUSTERED INDEX IX_Contratos_DataCadastro
    ON Contratos(DataCadastro DESC)
    WHERE Ativo = 1;
END
ELSE
    PRINT '  ℹ️  Índice IX_Contratos_DataCadastro já existe';
GO

-- ============================================================
-- ÍNDICES PARA BOLETOS
-- ============================================================

-- Índice para busca por ContratoId e Status
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_ContratoId_Status' AND object_id = OBJECT_ID('Boletos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Boletos_ContratoId_Status...';
    CREATE NONCLUSTERED INDEX IX_Boletos_ContratoId_Status
    ON Boletos(ContratoId, Status)
    INCLUDE (NominalValue, DueDate, IssueDate);
END
ELSE
    PRINT '  ℹ️  Índice IX_Boletos_ContratoId_Status já existe';
GO

-- Índice para busca por data de vencimento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Boletos_DueDate_Status' AND object_id = OBJECT_ID('Boletos'))
BEGIN
    PRINT '  ✅ Criando índice IX_Boletos_DueDate_Status...';
    CREATE NONCLUSTERED INDEX IX_Boletos_DueDate_Status
    ON Boletos(DueDate, Status)
    WHERE Ativo = 1;
END
ELSE
    PRINT '  ℹ️  Índice IX_Boletos_DueDate_Status já existe';
GO

-- ============================================================
-- ÍNDICES PARA USUÁRIOS
-- ============================================================

-- Índice para login (muito usado)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_Login' AND object_id = OBJECT_ID('Usuarios'))
BEGIN
    PRINT '  ✅ Criando índice IX_Usuarios_Login...';
    CREATE NONCLUSTERED INDEX IX_Usuarios_Login
    ON Usuarios(Login)
    WHERE Ativo = 1;
END
ELSE
    PRINT '  ℹ️  Índice IX_Usuarios_Login já existe';
GO

-- Índice para busca por email
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_Email' AND object_id = OBJECT_ID('Usuarios'))
BEGIN
    PRINT '  ✅ Criando índice IX_Usuarios_Email...';
    CREATE NONCLUSTERED INDEX IX_Usuarios_Email
    ON Usuarios(Email)
    WHERE Ativo = 1;
END
ELSE
    PRINT '  ℹ️  Índice IX_Usuarios_Email já existe';
GO

-- ============================================================
-- ÍNDICES PARA SESSÕES ATIVAS
-- ============================================================

-- Índice para busca por UsuarioId e Ativa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessoesAtivas_UsuarioId_Ativa' AND object_id = OBJECT_ID('SessoesAtivas'))
BEGIN
    PRINT '  ✅ Criando índice IX_SessoesAtivas_UsuarioId_Ativa...';
    CREATE NONCLUSTERED INDEX IX_SessoesAtivas_UsuarioId_Ativa
    ON SessoesAtivas(UsuarioId, Ativa)
    INCLUDE (UltimaAtividade, InicioSessao);
END
ELSE
    PRINT '  ℹ️  Índice IX_SessoesAtivas_UsuarioId_Ativa já existe';
GO

-- Índice para limpeza de sessões antigas
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SessoesAtivas_UltimaAtividade' AND object_id = OBJECT_ID('SessoesAtivas'))
BEGIN
    PRINT '  ✅ Criando índice IX_SessoesAtivas_UltimaAtividade...';
    CREATE NONCLUSTERED INDEX IX_SessoesAtivas_UltimaAtividade
    ON SessoesAtivas(UltimaAtividade)
    WHERE Ativa = 1;
END
ELSE
    PRINT '  ℹ️  Índice IX_SessoesAtivas_UltimaAtividade já existe';
GO

-- ============================================================
-- ESTATÍSTICAS FINAIS
-- ============================================================

PRINT '';
PRINT '============================================================';
PRINT '📊 ESTATÍSTICAS DOS ÍNDICES CRIADOS';
PRINT '============================================================';

SELECT
    OBJECT_NAME(i.object_id) AS Tabela,
    i.name AS Indice,
    i.type_desc AS Tipo,
    CAST(ROUND(((SUM(ps.reserved_page_count) * 8.0) / 1024), 2) AS DECIMAL(10,2)) AS [Tamanho_MB]
FROM
    sys.indexes AS i
    INNER JOIN sys.dm_db_partition_stats AS ps
        ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE
    i.name LIKE 'IX_%'
    AND i.name NOT LIKE 'PK_%'
GROUP BY
    i.object_id, i.name, i.type_desc
ORDER BY
    OBJECT_NAME(i.object_id), i.name;

PRINT '';
PRINT '✅ Script de índices concluído com sucesso!';
PRINT '⚠️  Nota: Execute REINDEX periodicamente para manter performance';
GO
