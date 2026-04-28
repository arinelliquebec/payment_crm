-- Criar tabela Parceiros
CREATE TABLE [dbo].[Parceiros] (
    [Id] int IDENTITY(1,1) NOT NULL,
    [PessoaFisicaId] int NOT NULL,
    [FilialId] int NOT NULL,
    [OAB] nvarchar(20) NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    [Ativo] bit NOT NULL,
    CONSTRAINT [PK_Parceiros] PRIMARY KEY ([Id])
);

-- Criar índices
CREATE INDEX [IX_Parceiros_FilialId] ON [dbo].[Parceiros] ([FilialId]);
CREATE UNIQUE INDEX [IX_Parceiros_PessoaFisicaId] ON [dbo].[Parceiros] ([PessoaFisicaId]);

-- Criar foreign keys
ALTER TABLE [dbo].[Parceiros] ADD CONSTRAINT [FK_Parceiros_Filiais_FilialId]
    FOREIGN KEY ([FilialId]) REFERENCES [dbo].[Filiais] ([Id]);

ALTER TABLE [dbo].[Parceiros] ADD CONSTRAINT [FK_Parceiros_PessoasFisicas_PessoaFisicaId]
    FOREIGN KEY ([PessoaFisicaId]) REFERENCES [dbo].[PessoasFisicas] ([Id]);

-- Adicionar registro na tabela de migrations
INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250902201000_CreateParceirosTable', N'8.0.0');

PRINT 'Tabela Parceiros criada com sucesso!';
