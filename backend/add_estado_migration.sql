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

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PessoasFisicas_Cpf] ON [PessoasFisicas] ([Cpf]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PessoasFisicas_Email] ON [PessoasFisicas] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PessoasFisicas_EnderecoId] ON [PessoasFisicas] ([EnderecoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PessoasJuridicas_Cnpj] ON [PessoasJuridicas] ([Cnpj]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PessoasJuridicas_EnderecoId] ON [PessoasJuridicas] ([EnderecoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PessoasJuridicas_ResponsavelTecnicoId] ON [PessoasJuridicas] ([ResponsavelTecnicoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250730192614_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250730192614_InitialCreate', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuarios_Email] ON [Usuarios] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuarios_Login] ON [Usuarios] ([Login]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
    CREATE INDEX [IX_Usuarios_PessoaFisicaId] ON [Usuarios] ([PessoaFisicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
    CREATE INDEX [IX_Usuarios_PessoaJuridicaId] ON [Usuarios] ([PessoaJuridicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731123141_AddUsuariosTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250731123141_AddUsuariosTable', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731131039_UpdateUsuarioModel'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Usuarios]') AND [c].[name] = N'TipoPessoa');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Usuarios] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Usuarios] ALTER COLUMN [TipoPessoa] nvarchar(max) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250731131039_UpdateUsuarioModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250731131039_UpdateUsuarioModel', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    ALTER TABLE [PessoasJuridicas] ADD [Telefone3] nvarchar(15) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    ALTER TABLE [PessoasJuridicas] ADD [Telefone4] nvarchar(15) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'Telefone1');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [PessoasFisicas] ALTER COLUMN [Telefone1] nvarchar(15) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'Sexo');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [PessoasFisicas] ALTER COLUMN [Sexo] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'EstadoCivil');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [PessoasFisicas] ALTER COLUMN [EstadoCivil] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'EnderecoId');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [PessoasFisicas] ALTER COLUMN [EnderecoId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PessoasFisicas]') AND [c].[name] = N'DataNascimento');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [PessoasFisicas] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [PessoasFisicas] ALTER COLUMN [DataNascimento] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250812134124_AddTelefone3Telefone4ToPessoasJuridicas', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
    CREATE INDEX [IX_Clientes_PessoaFisicaId] ON [Clientes] ([PessoaFisicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
    CREATE INDEX [IX_Clientes_PessoaJuridicaId] ON [Clientes] ([PessoaJuridicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
    CREATE INDEX [IX_HistoricoConsultores_ClienteId] ON [HistoricoConsultores] ([ClienteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814120704_AddClientesAndHistoricoConsultores'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250814120704_AddClientesAndHistoricoConsultores', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814122217_AddFiliaisTable'
)
BEGIN
    ALTER TABLE [Clientes] ADD [Filial] nvarchar(100) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814122217_AddFiliaisTable'
)
BEGIN
    CREATE TABLE [Filiais] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [DataInclusao] datetime2 NOT NULL,
        [UsuarioImportacao] nvarchar(100) NULL,
        CONSTRAINT [PK_Filiais] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814122217_AddFiliaisTable'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Filiais_Nome] ON [Filiais] ([Nome]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814122217_AddFiliaisTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250814122217_AddFiliaisTable', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814124606_AddFiliaisAndConsultores'
)
BEGIN
    ALTER TABLE [Clientes] ADD [Status] nvarchar(100) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814124606_AddFiliaisAndConsultores'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814124606_AddFiliaisAndConsultores'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Consultores_PessoaFisicaId] ON [Consultores] ([PessoaFisicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814124606_AddFiliaisAndConsultores'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250814124606_AddFiliaisAndConsultores', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814172949_AddOABToConsultor'
)
BEGIN
    ALTER TABLE [Consultores] ADD [OAB] nvarchar(20) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814172949_AddOABToConsultor'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250814172949_AddOABToConsultor', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814235740_AddValorContratoToClientes'
)
BEGIN
    ALTER TABLE [Clientes] ADD [ValorContrato] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250814235740_AddValorContratoToClientes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250814235740_AddValorContratoToClientes', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820120302_UpdateClienteFilialToId'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Clientes]') AND [c].[name] = N'Filial');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Clientes] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [Clientes] DROP COLUMN [Filial];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820120302_UpdateClienteFilialToId'
)
BEGIN
    ALTER TABLE [Clientes] ADD [FilialId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820120302_UpdateClienteFilialToId'
)
BEGIN
    CREATE INDEX [IX_Clientes_FilialId] ON [Clientes] ([FilialId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820120302_UpdateClienteFilialToId'
)
BEGIN
    ALTER TABLE [Clientes] ADD CONSTRAINT [FK_Clientes_Filiais_FilialId] FOREIGN KEY ([FilialId]) REFERENCES [Filiais] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250820120302_UpdateClienteFilialToId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250820120302_UpdateClienteFilialToId', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Consultores]') AND [c].[name] = N'Filial');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Consultores] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [Consultores] DROP COLUMN [Filial];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    EXEC sp_rename N'[PessoasFisicas].[Email]', N'EmailEmpresarial', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    EXEC sp_rename N'[PessoasFisicas].[IX_PessoasFisicas_Email]', N'IX_PessoasFisicas_EmailEmpresarial', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    ALTER TABLE [PessoasFisicas] ADD [EmailPessoal] nvarchar(150) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    ALTER TABLE [Consultores] ADD [FilialId] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE TABLE [Parceiros] (
        [Id] int NOT NULL IDENTITY,
        [PessoaFisicaId] int NOT NULL,
        [FilialId] int NOT NULL,
        [OAB] nvarchar(20) NULL,
        [Email] nvarchar(100) NULL,
        [Telefone] nvarchar(20) NULL,
        [DataCadastro] datetime2 NOT NULL,
        [DataAtualizacao] datetime2 NULL,
        [Ativo] bit NOT NULL,
        CONSTRAINT [PK_Parceiros] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Parceiros_Filiais_FilialId] FOREIGN KEY ([FilialId]) REFERENCES [Filiais] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Parceiros_PessoasFisicas_PessoaFisicaId] FOREIGN KEY ([PessoaFisicaId]) REFERENCES [PessoasFisicas] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE TABLE [Contratos] (
        [Id] int NOT NULL IDENTITY,
        [ClienteId] int NOT NULL,
        [ConsultorId] int NOT NULL,
        [ParceiroId] int NULL,
        [Situacao] nvarchar(50) NOT NULL,
        [DataUltimoContato] datetime2 NULL,
        [DataProximoContato] datetime2 NULL,
        [ValorDevido] decimal(18,2) NULL,
        [ValorNegociado] decimal(18,2) NULL,
        [Observacoes] nvarchar(max) NULL,
        [NumeroPasta] nvarchar(100) NULL,
        [DataFechamentoContrato] datetime2 NULL,
        [TipoServico] nvarchar(200) NULL,
        [ObjetoContrato] nvarchar(max) NULL,
        [Comissao] decimal(18,2) NULL,
        [ValorEntrada] decimal(18,2) NULL,
        [ValorParcela] decimal(18,2) NULL,
        [NumeroParcelas] int NULL,
        [PrimeiroVencimento] datetime2 NULL,
        [AnexoDocumento] nvarchar(max) NULL,
        [Pendencias] nvarchar(max) NULL,
        [DataCadastro] datetime2 NOT NULL,
        [DataAtualizacao] datetime2 NULL,
        [Ativo] bit NOT NULL,
        CONSTRAINT [PK_Contratos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Contratos_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Contratos_Consultores_ConsultorId] FOREIGN KEY ([ConsultorId]) REFERENCES [Consultores] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Contratos_Parceiros_ParceiroId] FOREIGN KEY ([ParceiroId]) REFERENCES [Parceiros] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE TABLE [HistoricoSituacaoContratos] (
        [Id] int NOT NULL IDENTITY,
        [ContratoId] int NOT NULL,
        [SituacaoAnterior] nvarchar(50) NOT NULL,
        [NovaSituacao] nvarchar(50) NOT NULL,
        [MotivoMudanca] nvarchar(500) NULL,
        [DataMudanca] datetime2 NOT NULL,
        [DataCadastro] datetime2 NOT NULL,
        CONSTRAINT [PK_HistoricoSituacaoContratos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HistoricoSituacaoContratos_Contratos_ContratoId] FOREIGN KEY ([ContratoId]) REFERENCES [Contratos] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_Consultores_FilialId] ON [Consultores] ([FilialId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_Contratos_ClienteId] ON [Contratos] ([ClienteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_Contratos_ConsultorId] ON [Contratos] ([ConsultorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_Contratos_ParceiroId] ON [Contratos] ([ParceiroId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_HistoricoSituacaoContratos_ContratoId] ON [HistoricoSituacaoContratos] ([ContratoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE INDEX [IX_Parceiros_FilialId] ON [Parceiros] ([FilialId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Parceiros_PessoaFisicaId] ON [Parceiros] ([PessoaFisicaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    ALTER TABLE [Consultores] ADD CONSTRAINT [FK_Consultores_Filiais_FilialId] FOREIGN KEY ([FilialId]) REFERENCES [Filiais] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907213641_AddEmailPessoalToPessoaFisica'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250907213641_AddEmailPessoalToPessoaFisica', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Usuarios]') AND [c].[name] = N'GrupoAcesso');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Usuarios] DROP CONSTRAINT [' + @var8 + '];');
    ALTER TABLE [Usuarios] DROP COLUMN [GrupoAcesso];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [ConsultorId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [FilialId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [GrupoAcessoId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE TABLE [Boletos] (
        [Id] int NOT NULL IDENTITY,
        [ContratoId] int NOT NULL,
        [NsuCode] nvarchar(20) NOT NULL,
        [NsuDate] datetime2 NOT NULL,
        [CovenantCode] nvarchar(9) NOT NULL,
        [BankNumber] nvarchar(13) NOT NULL,
        [ClientNumber] nvarchar(15) NULL,
        [DueDate] datetime2 NOT NULL,
        [IssueDate] datetime2 NOT NULL,
        [NominalValue] decimal(18,2) NOT NULL,
        [DocumentKind] nvarchar(50) NOT NULL,
        [PayerName] nvarchar(40) NOT NULL,
        [PayerDocumentType] nvarchar(4) NOT NULL,
        [PayerDocumentNumber] nvarchar(15) NOT NULL,
        [PayerAddress] nvarchar(40) NOT NULL,
        [PayerNeighborhood] nvarchar(30) NOT NULL,
        [PayerCity] nvarchar(20) NOT NULL,
        [PayerState] nvarchar(2) NOT NULL,
        [PayerZipCode] nvarchar(9) NOT NULL,
        [FinePercentage] decimal(5,2) NULL,
        [FineQuantityDays] int NULL,
        [InterestPercentage] decimal(5,2) NULL,
        [DeductionValue] decimal(18,2) NULL,
        [WriteOffQuantityDays] int NULL,
        [BarCode] nvarchar(100) NULL,
        [DigitableLine] nvarchar(100) NULL,
        [EntryDate] datetime2 NULL,
        [QrCodePix] nvarchar(500) NULL,
        [QrCodeUrl] nvarchar(500) NULL,
        [Status] nvarchar(20) NOT NULL,
        [Messages] nvarchar(1000) NULL,
        [DataCadastro] datetime2 NOT NULL,
        [DataAtualizacao] datetime2 NULL,
        [Ativo] bit NOT NULL,
        [ErrorCode] nvarchar(10) NULL,
        [ErrorMessage] nvarchar(500) NULL,
        [TraceId] nvarchar(50) NULL,
        CONSTRAINT [PK_Boletos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Boletos_Contratos_ContratoId] FOREIGN KEY ([ContratoId]) REFERENCES [Contratos] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE TABLE [GruposAcesso] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(500) NULL,
        [Ativo] bit NOT NULL,
        [DataCadastro] datetime2 NOT NULL,
        [DataAtualizacao] datetime2 NULL,
        CONSTRAINT [PK_GruposAcesso] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE TABLE [Permissoes] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(200) NULL,
        [Modulo] nvarchar(50) NOT NULL,
        [Acao] nvarchar(50) NOT NULL,
        [Ativo] bit NOT NULL,
        [DataCadastro] datetime2 NOT NULL,
        CONSTRAINT [PK_Permissoes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE TABLE [SessoesAtivas] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [NomeUsuario] nvarchar(100) NOT NULL,
        [Email] nvarchar(100) NOT NULL,
        [Perfil] nvarchar(50) NOT NULL,
        [InicioSessao] datetime2 NOT NULL,
        [UltimaAtividade] datetime2 NOT NULL,
        [EnderecoIP] nvarchar(45) NOT NULL,
        [UserAgent] nvarchar(500) NOT NULL,
        [TokenSessao] nvarchar(255) NOT NULL,
        [Ativa] bit NOT NULL,
        CONSTRAINT [PK_SessoesAtivas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SessoesAtivas_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE TABLE [PermissoesGrupos] (
        [Id] int NOT NULL IDENTITY,
        [GrupoAcessoId] int NOT NULL,
        [PermissaoId] int NOT NULL,
        [ApenasProprios] bit NOT NULL,
        [ApenasFilial] bit NOT NULL,
        [ApenasLeitura] bit NOT NULL,
        [IncluirSituacoesEspecificas] bit NOT NULL,
        [SituacoesEspecificas] nvarchar(500) NULL,
        [DataCadastro] datetime2 NOT NULL,
        CONSTRAINT [PK_PermissoesGrupos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PermissoesGrupos_GruposAcesso_GrupoAcessoId] FOREIGN KEY ([GrupoAcessoId]) REFERENCES [GruposAcesso] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PermissoesGrupos_Permissoes_PermissaoId] FOREIGN KEY ([PermissaoId]) REFERENCES [Permissoes] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_Usuarios_ConsultorId] ON [Usuarios] ([ConsultorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_Usuarios_FilialId] ON [Usuarios] ([FilialId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_Usuarios_GrupoAcessoId] ON [Usuarios] ([GrupoAcessoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_Boletos_ContratoId] ON [Boletos] ([ContratoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Boletos_NsuCode_NsuDate] ON [Boletos] ([NsuCode], [NsuDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_GruposAcesso_Nome] ON [GruposAcesso] ([Nome]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Permissoes_Modulo_Acao] ON [Permissoes] ([Modulo], [Acao]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PermissoesGrupos_GrupoAcessoId_PermissaoId] ON [PermissoesGrupos] ([GrupoAcessoId], [PermissaoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_PermissoesGrupos_PermissaoId] ON [PermissoesGrupos] ([PermissaoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    CREATE INDEX [IX_SessoesAtivas_UsuarioId] ON [SessoesAtivas] ([UsuarioId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD CONSTRAINT [FK_Usuarios_Consultores_ConsultorId] FOREIGN KEY ([ConsultorId]) REFERENCES [Consultores] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD CONSTRAINT [FK_Usuarios_Filiais_FilialId] FOREIGN KEY ([FilialId]) REFERENCES [Filiais] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    ALTER TABLE [Usuarios] ADD CONSTRAINT [FK_Usuarios_GruposAcesso_GrupoAcessoId] FOREIGN KEY ([GrupoAcessoId]) REFERENCES [GruposAcesso] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250916121512_CreateGruposAcessoAndPermissions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250916121512_CreateGruposAcessoAndPermissions', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250917091946_AddFilialIdToUsuarios'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250917091946_AddFilialIdToUsuarios', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251003111123_AddPaginaAtualToSessoesAtivas'
)
BEGIN
    ALTER TABLE [SessoesAtivas] ADD [PaginaAtual] nvarchar(200) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251003111123_AddPaginaAtualToSessoesAtivas'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251003111123_AddPaginaAtualToSessoesAtivas', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251003123534_AddDataHoraOfflineToSessaoAtiva'
)
BEGIN
    ALTER TABLE [SessoesAtivas] ADD [DataHoraOffline] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251003123534_AddDataHoraOfflineToSessaoAtiva'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251003123534_AddDataHoraOfflineToSessaoAtiva', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    DECLARE @var9 sysname;
    SELECT @var9 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Clientes]') AND [c].[name] = N'ValorContrato');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Clientes] DROP CONSTRAINT [' + @var9 + '];');
    ALTER TABLE [Clientes] DROP COLUMN [ValorContrato];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    ALTER TABLE [Enderecos] ADD [Estado] nvarchar(2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE TABLE [HistoricoClientes] (
        [Id] int NOT NULL IDENTITY,
        [ClienteId] int NOT NULL,
        [TipoAcao] nvarchar(50) NOT NULL,
        [Descricao] nvarchar(500) NOT NULL,
        [DadosAnteriores] nvarchar(2000) NULL,
        [DadosNovos] nvarchar(2000) NULL,
        [UsuarioId] int NOT NULL,
        [NomeUsuario] nvarchar(200) NULL,
        [DataHora] datetime2 NOT NULL,
        [EnderecoIP] nvarchar(100) NULL,
        CONSTRAINT [PK_HistoricoClientes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HistoricoClientes_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_HistoricoClientes_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE TABLE [PasswordResets] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [Token] nvarchar(256) NOT NULL,
        [DataExpiracao] datetime2 NOT NULL,
        [Utilizado] bit NOT NULL,
        [DataUtilizacao] datetime2 NULL,
        [DataCriacao] datetime2 NOT NULL,
        CONSTRAINT [PK_PasswordResets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PasswordResets_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE INDEX [IX_HistoricoClientes_ClienteId] ON [HistoricoClientes] ([ClienteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE INDEX [IX_HistoricoClientes_DataHora] ON [HistoricoClientes] ([DataHora]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE INDEX [IX_HistoricoClientes_UsuarioId] ON [HistoricoClientes] ([UsuarioId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PasswordResets_Token] ON [PasswordResets] ([Token]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    CREATE INDEX [IX_PasswordResets_UsuarioId] ON [PasswordResets] ([UsuarioId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251024121911_AddEstadoToEndereco'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251024121911_AddEstadoToEndereco', N'8.0.0');
END;
GO

COMMIT;
GO

