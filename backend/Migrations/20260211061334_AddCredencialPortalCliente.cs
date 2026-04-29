using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    /// <remarks>
    /// A tabela CredenciaisPortalCliente pode já existir (criada via SQL manual).
    /// Esta migration é idempotente: cria se não existir, ajusta colunas se necessário.
    /// </remarks>
    public partial class AddCredencialPortalCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Criar tabela se não existir
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CredenciaisPortalCliente')
                BEGIN
                    CREATE TABLE [CredenciaisPortalCliente] (
                        [Id] int NOT NULL IDENTITY(1,1),
                        [ClienteId] int NOT NULL,
                        [Documento] nvarchar(14) NOT NULL,
                        [Email] nvarchar(100) NOT NULL,
                        [SenhaHash] nvarchar(200) NOT NULL,
                        [NomeExibicao] nvarchar(100) NULL,
                        [DataCriacao] datetime2 NOT NULL DEFAULT GETUTCDATE(),
                        [UltimoAcesso] datetime2 NULL,
                        [Ativo] bit NOT NULL DEFAULT 1,
                        [TokenAcesso] nvarchar(500) NULL,
                        [TokenExpiracao] datetime2 NULL,
                        [PrimeiroAcessoRealizado] bit NOT NULL DEFAULT 0,
                        CONSTRAINT [PK_CredenciaisPortalCliente] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_CredenciaisPortalCliente_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE NO ACTION
                    );
                END
            ");

            // 2. Se tabela existe com coluna antiga TokenRecuperacao, renomear para TokenAcesso
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CredenciaisPortalCliente') AND name = 'TokenRecuperacao')
                BEGIN
                    EXEC sp_rename 'CredenciaisPortalCliente.TokenRecuperacao', 'TokenAcesso', 'COLUMN';
                END
            ");

            // 3. Ajustar tipo da coluna TokenAcesso para nvarchar(500) se necessário
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CredenciaisPortalCliente') AND name = 'TokenAcesso')
                BEGIN
                    ALTER TABLE [CredenciaisPortalCliente] ALTER COLUMN [TokenAcesso] nvarchar(500) NULL;
                END
            ");

            // 4. Criar índices se não existirem
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CredenciaisPortalCliente_ClienteId' AND object_id = OBJECT_ID('CredenciaisPortalCliente'))
                    CREATE INDEX [IX_CredenciaisPortalCliente_ClienteId] ON [CredenciaisPortalCliente] ([ClienteId]);
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CredenciaisPortalCliente_Documento' AND object_id = OBJECT_ID('CredenciaisPortalCliente'))
                    CREATE UNIQUE INDEX [IX_CredenciaisPortalCliente_Documento] ON [CredenciaisPortalCliente] ([Documento]);
            ");

            // Remover índice antigo (TokenRecuperacao) e criar novo (TokenAcesso)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CredenciaisPortalCliente_Token' AND object_id = OBJECT_ID('CredenciaisPortalCliente'))
                    DROP INDEX [IX_CredenciaisPortalCliente_Token] ON [CredenciaisPortalCliente];
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CredenciaisPortalCliente_TokenAcesso' AND object_id = OBJECT_ID('CredenciaisPortalCliente'))
                    CREATE INDEX [IX_CredenciaisPortalCliente_TokenAcesso] ON [CredenciaisPortalCliente] ([TokenAcesso]) WHERE [TokenAcesso] IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CredenciaisPortalCliente");
        }
    }
}
