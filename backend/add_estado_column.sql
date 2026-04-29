-- Adicionar coluna Estado na tabela Enderecos
-- Execute este script no banco de dados Azure SQL

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (SELECT * FROM sys.columns
               WHERE object_id = OBJECT_ID(N'[dbo].[Enderecos]')
               AND name = 'Estado')
BEGIN
    ALTER TABLE [dbo].[Enderecos]
    ADD [Estado] nvarchar(2) NULL;

    PRINT 'Coluna Estado adicionada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Coluna Estado já existe.';
END
GO

-- Opcional: Atualizar estados existentes baseado no CEP ou cidade
-- Você pode executar queries para preencher estados conhecidos:
-- UPDATE [dbo].[Enderecos] SET Estado = 'SP' WHERE Cidade LIKE '%São Paulo%' OR Cidade LIKE '%Sao Paulo%';
-- UPDATE [dbo].[Enderecos] SET Estado = 'RJ' WHERE Cidade LIKE '%Rio de Janeiro%';
-- UPDATE [dbo].[Enderecos] SET Estado = 'MG' WHERE Cidade LIKE '%Belo Horizonte%';
-- ... adicione outros estados conforme necessário


