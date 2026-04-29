-- Script para adicionar campo Estado na tabela Enderecos
-- Executar este script diretamente no banco de dados

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Enderecos' 
               AND COLUMN_NAME = 'Estado')
BEGIN
    -- Adicionar coluna Estado
    ALTER TABLE [Enderecos] 
    ADD [Estado] nvarchar(2) NULL;
    
    PRINT 'Campo Estado adicionado com sucesso na tabela Enderecos';
END
ELSE
BEGIN
    PRINT 'Campo Estado já existe na tabela Enderecos';
END

-- Verificar se a coluna foi criada
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Enderecos' 
AND COLUMN_NAME = 'Estado';
