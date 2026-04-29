-- Script para adicionar coluna PaginaAtual à tabela SessoesAtivas
-- Esta coluna armazenará a rota/página atual onde o usuário está navegando

USE [CrmArrighi]; -- Alterar para o nome do seu banco de dados
GO

-- Verificar se a coluna já existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SessoesAtivas'
    AND COLUMN_NAME = 'PaginaAtual'
)
BEGIN
    -- Adicionar coluna PaginaAtual
    ALTER TABLE [dbo].[SessoesAtivas]
    ADD [PaginaAtual] NVARCHAR(200) NOT NULL DEFAULT '';

    PRINT '✅ Coluna PaginaAtual adicionada à tabela SessoesAtivas com sucesso!';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna PaginaAtual já existe na tabela SessoesAtivas.';
END
GO

-- Verificar a estrutura da tabela
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SessoesAtivas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '✅ Script executado com sucesso!';

