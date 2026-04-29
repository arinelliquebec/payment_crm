-- Script para criar a tabela SessoesAtivas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SessoesAtivas' AND xtype='U')
BEGIN
    CREATE TABLE [dbo].[SessoesAtivas](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [UsuarioId] [int] NOT NULL,
        [NomeUsuario] [nvarchar](100) NOT NULL,
        [Email] [nvarchar](100) NOT NULL,
        [Perfil] [nvarchar](50) NOT NULL,
        [InicioSessao] [datetime2](7) NOT NULL,
        [UltimaAtividade] [datetime2](7) NOT NULL,
        [EnderecoIP] [nvarchar](45) NOT NULL,
        [UserAgent] [nvarchar](500) NOT NULL,
        [TokenSessao] [nvarchar](255) NOT NULL,
        [Ativa] [bit] NOT NULL DEFAULT 1,
        CONSTRAINT [PK_SessoesAtivas] PRIMARY KEY CLUSTERED ([Id] ASC)
    )

    -- Criar índice na coluna UsuarioId
    CREATE NONCLUSTERED INDEX [IX_SessoesAtivas_UsuarioId] ON [dbo].[SessoesAtivas] ([UsuarioId] ASC)

    PRINT 'Tabela SessoesAtivas criada com sucesso!'
END
ELSE
BEGIN
    PRINT 'Tabela SessoesAtivas já existe.'
END
