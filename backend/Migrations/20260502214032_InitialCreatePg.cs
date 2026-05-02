using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreatePg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    UsuarioNome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UsuarioLogin = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GrupoAcesso = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Acao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Entidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntidadeId = table.Column<int>(type: "integer", nullable: true),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ValorAnterior = table.Column<string>(type: "text", nullable: true),
                    ValorNovo = table.Column<string>(type: "text", nullable: true),
                    CamposAlterados = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Modulo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Severidade = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Enderecos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Estado = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    Bairro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Logradouro = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    Numero = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enderecos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Filiais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DataInclusao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioImportacao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Filiais", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GruposAcesso",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposAcesso", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IdempotencyKeys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RequestPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RequestBody = table.Column<string>(type: "text", nullable: true),
                    ResponseStatus = table.Column<int>(type: "integer", nullable: false),
                    ResponseBody = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdempotencyKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Modulo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Acao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PessoasFisicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EmailEmpresarial = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    EmailPessoal = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Codinome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Sexo = table.Column<string>(type: "text", nullable: true),
                    DataNascimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstadoCivil = table.Column<string>(type: "text", nullable: true),
                    Cpf = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                    Rg = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Cnh = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Telefone1 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    Telefone2 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    EnderecoId = table.Column<int>(type: "integer", nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PessoasFisicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PessoasFisicas_Enderecos_EnderecoId",
                        column: x => x.EnderecoId,
                        principalTable: "Enderecos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PermissoesGrupos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GrupoAcessoId = table.Column<int>(type: "integer", nullable: false),
                    PermissaoId = table.Column<int>(type: "integer", nullable: false),
                    ApenasProprios = table.Column<bool>(type: "boolean", nullable: false),
                    ApenasFilial = table.Column<bool>(type: "boolean", nullable: false),
                    ApenasLeitura = table.Column<bool>(type: "boolean", nullable: false),
                    IncluirSituacoesEspecificas = table.Column<bool>(type: "boolean", nullable: false),
                    SituacoesEspecificas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermissoesGrupos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PermissoesGrupos_GruposAcesso_GrupoAcessoId",
                        column: x => x.GrupoAcessoId,
                        principalTable: "GruposAcesso",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PermissoesGrupos_Permissoes_PermissaoId",
                        column: x => x.PermissaoId,
                        principalTable: "Permissoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Consultores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PessoaFisicaId = table.Column<int>(type: "integer", nullable: false),
                    FilialId = table.Column<int>(type: "integer", nullable: false),
                    OAB = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Consultores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Consultores_Filiais_FilialId",
                        column: x => x.FilialId,
                        principalTable: "Filiais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Consultores_PessoasFisicas_PessoaFisicaId",
                        column: x => x.PessoaFisicaId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Parceiros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PessoaFisicaId = table.Column<int>(type: "integer", nullable: false),
                    FilialId = table.Column<int>(type: "integer", nullable: false),
                    OAB = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parceiros", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Parceiros_Filiais_FilialId",
                        column: x => x.FilialId,
                        principalTable: "Filiais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Parceiros_PessoasFisicas_PessoaFisicaId",
                        column: x => x.PessoaFisicaId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PessoasJuridicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RazaoSocial = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NomeFantasia = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Cnpj = table.Column<string>(type: "character varying(18)", maxLength: 18, nullable: false),
                    ResponsavelTecnicoId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Telefone1 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    Telefone2 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    Telefone3 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    Telefone4 = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    EnderecoId = table.Column<int>(type: "integer", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PessoasJuridicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PessoasJuridicas_Enderecos_EnderecoId",
                        column: x => x.EnderecoId,
                        principalTable: "Enderecos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PessoasJuridicas_PessoasFisicas_ResponsavelTecnicoId",
                        column: x => x.ResponsavelTecnicoId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TipoPessoa = table.Column<string>(type: "text", nullable: false),
                    PessoaFisicaId = table.Column<int>(type: "integer", nullable: true),
                    PessoaJuridicaId = table.Column<int>(type: "integer", nullable: true),
                    ConsultorAtualId = table.Column<int>(type: "integer", nullable: true),
                    FilialId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Observacoes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EmailAlternativo = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clientes_Filiais_FilialId",
                        column: x => x.FilialId,
                        principalTable: "Filiais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Clientes_PessoasFisicas_PessoaFisicaId",
                        column: x => x.PessoaFisicaId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Clientes_PessoasJuridicas_PessoaJuridicaId",
                        column: x => x.PessoaJuridicaId,
                        principalTable: "PessoasJuridicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Login = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Senha = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GrupoAcessoId = table.Column<int>(type: "integer", nullable: true),
                    FilialId = table.Column<int>(type: "integer", nullable: true),
                    ConsultorId = table.Column<int>(type: "integer", nullable: true),
                    TipoPessoa = table.Column<string>(type: "text", nullable: false),
                    PessoaFisicaId = table.Column<int>(type: "integer", nullable: true),
                    PessoaJuridicaId = table.Column<int>(type: "integer", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UltimoAcesso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Consultores_ConsultorId",
                        column: x => x.ConsultorId,
                        principalTable: "Consultores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Usuarios_Filiais_FilialId",
                        column: x => x.FilialId,
                        principalTable: "Filiais",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Usuarios_GruposAcesso_GrupoAcessoId",
                        column: x => x.GrupoAcessoId,
                        principalTable: "GruposAcesso",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Usuarios_PessoasFisicas_PessoaFisicaId",
                        column: x => x.PessoaFisicaId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Usuarios_PessoasJuridicas_PessoaJuridicaId",
                        column: x => x.PessoaJuridicaId,
                        principalTable: "PessoasJuridicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Contratos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    ConsultorId = table.Column<int>(type: "integer", nullable: false),
                    ParceiroId = table.Column<int>(type: "integer", nullable: true),
                    Situacao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DataUltimoContato = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataProximoContato = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValorDevido = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ValorNegociado = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Observacoes = table.Column<string>(type: "text", nullable: true),
                    NumeroPasta = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DataFechamentoContrato = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TipoServico = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ObjetoContrato = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Comissao = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ValorEntrada = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    ValorParcela = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NumeroParcelas = table.Column<int>(type: "integer", nullable: true),
                    PrimeiroVencimento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnexoDocumento = table.Column<string>(type: "text", nullable: true),
                    Pendencias = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    MetodoPagamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contratos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contratos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contratos_Consultores_ConsultorId",
                        column: x => x.ConsultorId,
                        principalTable: "Consultores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contratos_Parceiros_ParceiroId",
                        column: x => x.ParceiroId,
                        principalTable: "Parceiros",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ConvitesPortal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    CriadoPorId = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Usado = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConvitesPortal", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConvitesPortal_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CredenciaisPortalCliente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    Documento = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SenhaHash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    NomeExibicao = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UltimoAcesso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    TokenAcesso = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TokenExpiracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrimeiroAcessoRealizado = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CredenciaisPortalCliente", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CredenciaisPortalCliente_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentosPortal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    NomeArquivoBlobStorage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    NomeArquivoOriginal = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Formato = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Tamanho = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ContratoId = table.Column<int>(type: "integer", nullable: true),
                    EnviadoPor = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    DataUpload = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentosPortal", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentosPortal_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HistoricoConsultores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    ConsultorId = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MotivoTransferencia = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoConsultores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricoConsultores_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HistoricoClientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    TipoAcao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DadosAnteriores = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DadosNovos = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    NomeUsuario = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DataHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EnderecoIP = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoClientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricoClientes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HistoricoClientes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LogsAtividades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    UsuarioNome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Acao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Detalhes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ModuloOrigem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DataHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogsAtividades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogsAtividades_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LogsGeracaoBoletos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DataExecucao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    TotalContratosProcessados = table.Column<int>(type: "integer", nullable: false),
                    TotalBoletosGerados = table.Column<int>(type: "integer", nullable: false),
                    TotalErros = table.Column<int>(type: "integer", nullable: false),
                    ValorTotalGerado = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Detalhes = table.Column<string>(type: "text", nullable: true),
                    DuracaoSegundos = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DataFinalizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogsGeracaoBoletos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogsGeracaoBoletos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    Token = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    DataExpiracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Utilizado = table.Column<bool>(type: "boolean", nullable: false),
                    DataUtilizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResets_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessoesAtivas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    NomeUsuario = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Perfil = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InicioSessao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UltimaAtividade = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EnderecoIP = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    TokenSessao = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PaginaAtual = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DataHoraOffline = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessoesAtivas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessoesAtivas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Boletos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContratoId = table.Column<int>(type: "integer", nullable: false),
                    NsuCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    NsuDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CovenantCode = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    BankNumber = table.Column<string>(type: "character varying(13)", maxLength: 13, nullable: false),
                    ClientNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IssueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NominalValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DocumentKind = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PayerName = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    PayerDocumentType = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    PayerDocumentNumber = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    PayerAddress = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    PayerNeighborhood = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PayerCity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PayerState = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    PayerZipCode = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    FinePercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    FineQuantityDays = table.Column<int>(type: "integer", nullable: true),
                    InterestPercentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    DeductionValue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    WriteOffQuantityDays = table.Column<int>(type: "integer", nullable: true),
                    ProtestType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ProtestQuantityDays = table.Column<int>(type: "integer", nullable: true),
                    BarCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DigitableLine = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    EntryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrCodePix = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FoiPago = table.Column<bool>(type: "boolean", nullable: false),
                    ValorPago = table.Column<decimal>(type: "numeric", nullable: true),
                    DataPagamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Messages = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NumeroParcela = table.Column<int>(type: "integer", nullable: true),
                    TipoBoletoManual = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TipoPagamento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ParcelasCobertas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    BoletosOriginaisRenegociados = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    ErrorCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TraceId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PdfBlobUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PdfArmazenadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boletos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boletos_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HistoricoSituacaoContratos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ContratoId = table.Column<int>(type: "integer", nullable: false),
                    SituacaoAnterior = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NovaSituacao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MotivoMudanca = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataMudanca = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistoricoSituacaoContratos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistoricoSituacaoContratos_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NomeEmpresa = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ValorEstimado = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Probabilidade = table.Column<int>(type: "integer", nullable: true),
                    Origem = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ContatoNome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContatoTelefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ContatoEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContatoCargo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Necessidade = table.Column<string>(type: "text", nullable: true),
                    Observacoes = table.Column<string>(type: "text", nullable: true),
                    ResponsavelId = table.Column<int>(type: "integer", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DataUltimaInteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataProximaAcao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProximaAcao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DataQualificacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataProposta = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataNegociacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataFechamento = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MotivoPerda = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ClienteId = table.Column<int>(type: "integer", nullable: true),
                    ContratoId = table.Column<int>(type: "integer", nullable: true),
                    CriadoPorId = table.Column<int>(type: "integer", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AtualizadoPorId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_AtualizadoPorId",
                        column: x => x.AtualizadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_CriadoPorId",
                        column: x => x.CriadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_ResponsavelId",
                        column: x => x.ResponsavelId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Notificacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    Titulo = table.Column<string>(type: "text", nullable: false),
                    Mensagem = table.Column<string>(type: "text", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    BoletoId = table.Column<int>(type: "integer", nullable: true),
                    ContratoId = table.Column<int>(type: "integer", nullable: true),
                    ClienteId = table.Column<int>(type: "integer", nullable: true),
                    Lida = table.Column<bool>(type: "boolean", nullable: false),
                    DataLeitura = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DadosAdicionais = table.Column<string>(type: "text", nullable: true),
                    Prioridade = table.Column<string>(type: "text", nullable: false),
                    Link = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Boletos_BoletoId",
                        column: x => x.BoletoId,
                        principalTable: "Boletos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LeadInteracoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LeadId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: false),
                    DataInteracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadInteracoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadInteracoes_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadInteracoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Acao",
                table: "AuditLogs",
                column: "Acao");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_DataHora",
                table: "AuditLogs",
                column: "DataHora");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Entidade",
                table: "AuditLogs",
                column: "Entidade");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Severidade",
                table: "AuditLogs",
                column: "Severidade");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UsuarioId",
                table: "AuditLogs",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Boletos_ContratoId",
                table: "Boletos",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Boletos_NsuCode_NsuDate",
                table: "Boletos",
                columns: new[] { "NsuCode", "NsuDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_FilialId",
                table: "Clientes",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_PessoaFisicaId",
                table: "Clientes",
                column: "PessoaFisicaId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_PessoaJuridicaId",
                table: "Clientes",
                column: "PessoaJuridicaId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultores_FilialId",
                table: "Consultores",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Consultores_PessoaFisicaId",
                table: "Consultores",
                column: "PessoaFisicaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contratos_ClienteId",
                table: "Contratos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Contratos_ConsultorId",
                table: "Contratos",
                column: "ConsultorId");

            migrationBuilder.CreateIndex(
                name: "IX_Contratos_ParceiroId",
                table: "Contratos",
                column: "ParceiroId");

            migrationBuilder.CreateIndex(
                name: "IX_ConvitesPortal_ClienteId",
                table: "ConvitesPortal",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CredenciaisPortalCliente_ClienteId",
                table: "CredenciaisPortalCliente",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CredenciaisPortalCliente_Documento",
                table: "CredenciaisPortalCliente",
                column: "Documento",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CredenciaisPortalCliente_TokenAcesso",
                table: "CredenciaisPortalCliente",
                column: "TokenAcesso",
                filter: "\"TokenAcesso\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentosPortal_ClienteId",
                table: "DocumentosPortal",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentosPortal_DataUpload",
                table: "DocumentosPortal",
                column: "DataUpload");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentosPortal_Tipo",
                table: "DocumentosPortal",
                column: "Tipo");

            migrationBuilder.CreateIndex(
                name: "IX_Filiais_Nome",
                table: "Filiais",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GruposAcesso_Nome",
                table: "GruposAcesso",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoClientes_ClienteId",
                table: "HistoricoClientes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoClientes_DataHora",
                table: "HistoricoClientes",
                column: "DataHora");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoClientes_UsuarioId",
                table: "HistoricoClientes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoConsultores_ClienteId",
                table: "HistoricoConsultores",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoSituacaoContratos_ContratoId",
                table: "HistoricoSituacaoContratos",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadInteracoes_LeadId",
                table: "LeadInteracoes",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadInteracoes_UsuarioId",
                table: "LeadInteracoes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_AtualizadoPorId",
                table: "Leads",
                column: "AtualizadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ClienteId",
                table: "Leads",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ContratoId",
                table: "Leads",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_CriadoPorId",
                table: "Leads",
                column: "CriadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ResponsavelId",
                table: "Leads",
                column: "ResponsavelId");

            migrationBuilder.CreateIndex(
                name: "IX_LogsAtividades_UsuarioId",
                table: "LogsAtividades",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_LogsGeracaoBoletos_DataExecucao",
                table: "LogsGeracaoBoletos",
                column: "DataExecucao");

            migrationBuilder.CreateIndex(
                name: "IX_LogsGeracaoBoletos_UsuarioId",
                table: "LogsGeracaoBoletos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_BoletoId",
                table: "Notificacoes",
                column: "BoletoId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_ClienteId",
                table: "Notificacoes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_ContratoId",
                table: "Notificacoes",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_DataCriacao",
                table: "Notificacoes",
                column: "DataCriacao");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_Lida",
                table: "Notificacoes",
                column: "Lida");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_UsuarioId",
                table: "Notificacoes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_FilialId",
                table: "Parceiros",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_PessoaFisicaId",
                table: "Parceiros",
                column: "PessoaFisicaId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResets_Token",
                table: "PasswordResets",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResets_UsuarioId",
                table: "PasswordResets",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Permissoes_Modulo_Acao",
                table: "Permissoes",
                columns: new[] { "Modulo", "Acao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PermissoesGrupos_GrupoAcessoId_PermissaoId",
                table: "PermissoesGrupos",
                columns: new[] { "GrupoAcessoId", "PermissaoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PermissoesGrupos_PermissaoId",
                table: "PermissoesGrupos",
                column: "PermissaoId");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_Cpf",
                table: "PessoasFisicas",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_EmailEmpresarial",
                table: "PessoasFisicas",
                column: "EmailEmpresarial",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_EnderecoId",
                table: "PessoasFisicas",
                column: "EnderecoId");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Cnpj",
                table: "PessoasJuridicas",
                column: "Cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_EnderecoId",
                table: "PessoasJuridicas",
                column: "EnderecoId");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_ResponsavelTecnicoId",
                table: "PessoasJuridicas",
                column: "ResponsavelTecnicoId");

            migrationBuilder.CreateIndex(
                name: "IX_SessoesAtivas_UsuarioId",
                table: "SessoesAtivas",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ConsultorId",
                table: "Usuarios",
                column: "ConsultorId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_FilialId",
                table: "Usuarios",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_GrupoAcessoId",
                table: "Usuarios",
                column: "GrupoAcessoId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Login",
                table: "Usuarios",
                column: "Login",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_PessoaFisicaId",
                table: "Usuarios",
                column: "PessoaFisicaId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_PessoaJuridicaId",
                table: "Usuarios",
                column: "PessoaJuridicaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "ConvitesPortal");

            migrationBuilder.DropTable(
                name: "CredenciaisPortalCliente");

            migrationBuilder.DropTable(
                name: "DocumentosPortal");

            migrationBuilder.DropTable(
                name: "HistoricoClientes");

            migrationBuilder.DropTable(
                name: "HistoricoConsultores");

            migrationBuilder.DropTable(
                name: "HistoricoSituacaoContratos");

            migrationBuilder.DropTable(
                name: "IdempotencyKeys");

            migrationBuilder.DropTable(
                name: "LeadInteracoes");

            migrationBuilder.DropTable(
                name: "LogsAtividades");

            migrationBuilder.DropTable(
                name: "LogsGeracaoBoletos");

            migrationBuilder.DropTable(
                name: "Notificacoes");

            migrationBuilder.DropTable(
                name: "PasswordResets");

            migrationBuilder.DropTable(
                name: "PermissoesGrupos");

            migrationBuilder.DropTable(
                name: "SessoesAtivas");

            migrationBuilder.DropTable(
                name: "Leads");

            migrationBuilder.DropTable(
                name: "Boletos");

            migrationBuilder.DropTable(
                name: "Permissoes");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Contratos");

            migrationBuilder.DropTable(
                name: "GruposAcesso");

            migrationBuilder.DropTable(
                name: "Clientes");

            migrationBuilder.DropTable(
                name: "Consultores");

            migrationBuilder.DropTable(
                name: "Parceiros");

            migrationBuilder.DropTable(
                name: "PessoasJuridicas");

            migrationBuilder.DropTable(
                name: "Filiais");

            migrationBuilder.DropTable(
                name: "PessoasFisicas");

            migrationBuilder.DropTable(
                name: "Enderecos");
        }
    }
}
