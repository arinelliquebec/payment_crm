IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Enderecos] (
    [Id] int NOT NULL IDENTITY,
    [Cidade] nvarchar(100) NOT NULL,
    [Bairro] nvarchar(100) NOT NULL,
    [Logradouro] nvarchar(200) NOT NULL,
    [Cep] nvarchar(9) NOT NULL,
    [Numero] nvarchar(10) NOT NULL,
    [Complemento] nvarchar(100) NULL,
    CONSTRAINT [PK_Enderecos] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [PessoasFisicas] (
    [Id] int NOT NULL IDENTITY,
    [Nome] nvarchar(200) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [Codinome] nvarchar(100) NULL,
    [Sexo] nvarchar(max) NOT NULL,
    [DataNascimento] datetime2 NOT NULL,
    [EstadoCivil] nvarchar(max) NOT NULL,
    [Cpf] nvarchar(14) NOT NULL,
    [Rg] nvarchar(20) NULL,
    [Cnh] nvarchar(20) NULL,
    [Telefone1] nvarchar(15) NOT NULL,
    [Telefone2] nvarchar(15) NULL,
    [EnderecoId] int NOT NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    CONSTRAINT [PK_PessoasFisicas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PessoasFisicas_Enderecos_EnderecoId] FOREIGN KEY ([EnderecoId]) REFERENCES [Enderecos] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [PessoasJuridicas] (
    [Id] int NOT NULL IDENTITY,
    [RazaoSocial] nvarchar(200) NOT NULL,
    [NomeFantasia] nvarchar(200) NULL,
    [Cnpj] nvarchar(18) NOT NULL,
    [ResponsavelTecnicoId] int NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [Telefone1] nvarchar(15) NOT NULL,
    [Telefone2] nvarchar(15) NULL,
    [EnderecoId] int NOT NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    CONSTRAINT [PK_PessoasJuridicas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PessoasJuridicas_Enderecos_EnderecoId] FOREIGN KEY ([EnderecoId]) REFERENCES [Enderecos] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PessoasJuridicas_PessoasFisicas_ResponsavelTecnicoId] FOREIGN KEY ([ResponsavelTecnicoId]) REFERENCES [PessoasFisicas] ([Id]) ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX [IX_PessoasFisicas_Cpf] ON [PessoasFisicas] ([Cpf]);
GO

CREATE UNIQUE INDEX [IX_PessoasFisicas_Email] ON [PessoasFisicas] ([Email]);
GO

CREATE INDEX [IX_PessoasFisicas_EnderecoId] ON [PessoasFisicas] ([EnderecoId]);
GO

CREATE UNIQUE INDEX [IX_PessoasJuridicas_Cnpj] ON [PessoasJuridicas] ([Cnpj]);
GO

CREATE UNIQUE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
GO

CREATE INDEX [IX_PessoasJuridicas_EnderecoId] ON [PessoasJuridicas] ([EnderecoId]);
GO

CREATE INDEX [IX_PessoasJuridicas_ResponsavelTecnicoId] ON [PessoasJuridicas] ([ResponsavelTecnicoId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250730192614_InitialCreate', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Usuarios] (
    [Id] int NOT NULL IDENTITY,
    [Login] nvarchar(50) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [Senha] nvarchar(100) NOT NULL,
    [GrupoAcesso] nvarchar(50) NOT NULL,
    [TipoPessoa] nvarchar(20) NOT NULL,
    [PessoaFisicaId] int NULL,
    [PessoaJuridicaId] int NULL,
    [Ativo] bit NOT NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    [UltimoAcesso] datetime2 NULL,
    CONSTRAINT [PK_Usuarios] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Usuarios_PessoasFisicas_PessoaFisicaId] FOREIGN KEY ([PessoaFisicaId]) REFERENCES [PessoasFisicas] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Usuarios_PessoasJuridicas_PessoaJuridicaId] FOREIGN KEY ([PessoaJuridicaId]) REFERENCES [PessoasJuridicas] ([Id]) ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX [IX_Usuarios_Email] ON [Usuarios] ([Email]);
GO

CREATE UNIQUE INDEX [IX_Usuarios_Login] ON [Usuarios] ([Login]);
GO

CREATE INDEX [IX_Usuarios_PessoaFisicaId] ON [Usuarios] ([PessoaFisicaId]);
GO

CREATE INDEX [IX_Usuarios_PessoaJuridicaId] ON [Usuarios] ([PessoaJuridicaId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250731123141_AddUsuariosTable', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Usuarios]') AND [c].[name] = N'TipoPessoa');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Usuarios] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Usuarios] ALTER COLUMN [TipoPessoa] nvarchar(max) NOT NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250731131039_UpdateUsuarioModel', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [PessoasJuridicas] ADD [Telefone3] nvarchar(15) NULL;
GO

ALTER TABLE [PessoasJuridicas] ADD [Telefone4] nvarchar(15) NULL;
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'Telefone1');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [PessoasFisicas] ALTER COLUMN [Telefone1] nvarchar(15) NULL;
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'Sexo');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [PessoasFisicas] ALTER COLUMN [Sexo] nvarchar(max) NULL;
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'EstadoCivil');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [PessoasFisicas] ALTER COLUMN [EstadoCivil] nvarchar(max) NULL;
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'EnderecoId');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [PessoasFisicas] ALTER COLUMN [EnderecoId] int NULL;
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'DataNascimento');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [PessoasFisicas] ALTER COLUMN [DataNascimento] datetime2 NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Clientes] (
    [Id] int NOT NULL IDENTITY,
    [TipoPessoa] nvarchar(max) NOT NULL,
    [PessoaFisicaId] int NULL,
    [PessoaJuridicaId] int NULL,
    [ConsultorAtualId] int NULL,
    [Observacoes] nvarchar(1000) NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    [Ativo] bit NOT NULL,
    CONSTRAINT [PK_Clientes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Clientes_PessoasFisicas_PessoaFisicaId] FOREIGN KEY ([PessoaFisicaId]) REFERENCES [PessoasFisicas] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Clientes_PessoasJuridicas_PessoaJuridicaId] FOREIGN KEY ([PessoaJuridicaId]) REFERENCES [PessoasJuridicas] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [HistoricoConsultores] (
    [Id] int NOT NULL IDENTITY,
    [ClienteId] int NOT NULL,
    [ConsultorId] int NOT NULL,
    [DataInicio] datetime2 NOT NULL,
    [DataFim] datetime2 NULL,
    [MotivoTransferencia] nvarchar(500) NULL,
    [DataCadastro] datetime2 NOT NULL,
    CONSTRAINT [PK_HistoricoConsultores] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_HistoricoConsultores_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Clientes_PessoaFisicaId] ON [Clientes] ([PessoaFisicaId]);
GO

CREATE INDEX [IX_Clientes_PessoaJuridicaId] ON [Clientes] ([PessoaJuridicaId]);
GO

CREATE INDEX [IX_HistoricoConsultores_ClienteId] ON [HistoricoConsultores] ([ClienteId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250814120704_AddClientesAndHistoricoConsultores', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Clientes] ADD [Filial] nvarchar(100) NOT NULL DEFAULT N'';
GO

CREATE TABLE [Filiais] (
    [Id] int NOT NULL IDENTITY,
    [Nome] nvarchar(100) NOT NULL,
    [DataInclusao] datetime2 NOT NULL,
    [UsuarioImportacao] nvarchar(100) NULL,
    CONSTRAINT [PK_Filiais] PRIMARY KEY ([Id])
);
GO

CREATE UNIQUE INDEX [IX_Filiais_Nome] ON [Filiais] ([Nome]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250814122217_AddFiliaisTable', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Clientes] ADD [Status] nvarchar(100) NULL;
GO

CREATE TABLE [Consultores] (
    [Id] int NOT NULL IDENTITY,
    [PessoaFisicaId] int NOT NULL,
    [Filial] nvarchar(100) NOT NULL,
    [DataCadastro] datetime2 NOT NULL,
    [DataAtualizacao] datetime2 NULL,
    [Ativo] bit NOT NULL,
    CONSTRAINT [PK_Consultores] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Consultores_PessoasFisicas_PessoaFisicaId] FOREIGN KEY ([PessoaFisicaId]) REFERENCES [PessoasFisicas] ([Id]) ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX [IX_Consultores_PessoaFisicaId] ON [Consultores] ([PessoaFisicaId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250814124606_AddFiliaisAndConsultores', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Consultores] ADD [OAB] nvarchar(20) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250814172949_AddOABToConsultor', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Clientes] ADD [ValorContrato] decimal(18,2) NOT NULL DEFAULT 0.0;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250814235740_AddValorContratoToClientes', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Clientes]') AND [c].[name] = N'Filial');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Clientes] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Clientes] DROP COLUMN [Filial];
GO

ALTER TABLE [Clientes] ADD [FilialId] int NULL;
GO

CREATE INDEX [IX_Clientes_FilialId] ON [Clientes] ([FilialId]);
GO

ALTER TABLE [Clientes] ADD CONSTRAINT [FK_Clientes_Filiais_FilialId] FOREIGN KEY ([FilialId]) REFERENCES [Filiais] ([Id]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250820120302_UpdateClienteFilialToId', N'8.0.0');
GO

COMMIT;
GO

