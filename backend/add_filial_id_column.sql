-- Script para adicionar a coluna FilialId à tabela Usuarios
-- Executar este script diretamente no banco de dados SQL Server

-- Verificar se a coluna já existe antes de adicionar
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Usuarios'
    AND COLUMN_NAME = 'FilialId'
)
BEGIN
    -- Adicionar a coluna FilialId
    ALTER TABLE [Usuarios]
    ADD [FilialId] int NULL;

    -- Criar índice para melhor performance
    CREATE NONCLUSTERED INDEX [IX_Usuarios_FilialId]
    ON [Usuarios] ([FilialId] ASC);

    -- Adicionar foreign key constraint para Filiais
    ALTER TABLE [Usuarios]
    ADD CONSTRAINT [FK_Usuarios_Filiais_FilialId]
    FOREIGN KEY([FilialId]) REFERENCES [Filiais] ([Id]);

    PRINT 'Coluna FilialId adicionada com sucesso à tabela Usuarios';
END
ELSE
BEGIN
    PRINT 'Coluna FilialId já existe na tabela Usuarios';
END

-- Verificar se a coluna ConsultorId já existe antes de adicionar
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Usuarios'
    AND COLUMN_NAME = 'ConsultorId'
)
BEGIN
    -- Adicionar a coluna ConsultorId
    ALTER TABLE [Usuarios]
    ADD [ConsultorId] int NULL;

    -- Criar índice para melhor performance
    CREATE NONCLUSTERED INDEX [IX_Usuarios_ConsultorId]
    ON [Usuarios] ([ConsultorId] ASC);

    PRINT 'Coluna ConsultorId adicionada com sucesso à tabela Usuarios';
END
ELSE
BEGIN
    PRINT 'Coluna ConsultorId já existe na tabela Usuarios';
END
