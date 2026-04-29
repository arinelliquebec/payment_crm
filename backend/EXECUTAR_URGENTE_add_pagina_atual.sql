-- ⚠️ SCRIPT URGENTE: Adicionar coluna PaginaAtual para corrigir erro de Sessões Ativas
-- Execute este script AGORA no banco de dados para resolver o erro

-- Verificar se a coluna já existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SessoesAtivas'
    AND COLUMN_NAME = 'PaginaAtual'
)
BEGIN
    -- Adicionar coluna PaginaAtual com valor padrão vazio
    ALTER TABLE [dbo].[SessoesAtivas]
    ADD [PaginaAtual] NVARCHAR(200) NOT NULL DEFAULT '';

    PRINT '✅ Coluna PaginaAtual adicionada à tabela SessoesAtivas!';
    PRINT '✅ Sessões Ativas agora devem funcionar corretamente.';
END
ELSE
BEGIN
    PRINT '⚠️ Coluna PaginaAtual já existe na tabela SessoesAtivas.';
END
GO

-- Verificar a estrutura da tabela
PRINT '';
PRINT '📋 Estrutura atual da tabela SessoesAtivas:';
SELECT
    COLUMN_NAME as 'Coluna',
    DATA_TYPE as 'Tipo',
    CHARACTER_MAXIMUM_LENGTH as 'Tamanho',
    IS_NULLABLE as 'Nulo?',
    COLUMN_DEFAULT as 'Padrão'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SessoesAtivas'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ Script executado com sucesso!';
PRINT '🔄 Agora teste abrindo o Dashboard e clicando em "Sessões Ativas".';

