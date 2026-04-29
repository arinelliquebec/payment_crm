using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class CreateGruposAcessoAndPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GrupoAcesso",
                table: "Usuarios");

            migrationBuilder.AddColumn<int>(
                name: "ConsultorId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FilialId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GrupoAcessoId",
                table: "Usuarios",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Boletos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContratoId = table.Column<int>(type: "int", nullable: false),
                    NsuCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NsuDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CovenantCode = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: false),
                    BankNumber = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    ClientNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IssueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NominalValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DocumentKind = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PayerName = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PayerDocumentType = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: false),
                    PayerDocumentNumber = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    PayerAddress = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PayerNeighborhood = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PayerCity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PayerState = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    PayerZipCode = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: false),
                    FinePercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    FineQuantityDays = table.Column<int>(type: "int", nullable: true),
                    InterestPercentage = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    DeductionValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    WriteOffQuantityDays = table.Column<int>(type: "int", nullable: true),
                    BarCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DigitableLine = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EntryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    QrCodePix = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    QrCodeUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Messages = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    ErrorCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TraceId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
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
                name: "GruposAcesso",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GruposAcesso", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Modulo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Acao = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissoes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SessoesAtivas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NomeUsuario = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Perfil = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    InicioSessao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimaAtividade = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EnderecoIP = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TokenSessao = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Ativa = table.Column<bool>(type: "bit", nullable: false)
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
                name: "PermissoesGrupos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrupoAcessoId = table.Column<int>(type: "int", nullable: false),
                    PermissaoId = table.Column<int>(type: "int", nullable: false),
                    ApenasProprios = table.Column<bool>(type: "bit", nullable: false),
                    ApenasFilial = table.Column<bool>(type: "bit", nullable: false),
                    ApenasLeitura = table.Column<bool>(type: "bit", nullable: false),
                    IncluirSituacoesEspecificas = table.Column<bool>(type: "bit", nullable: false),
                    SituacoesEspecificas = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ConsultorId",
                table: "Usuarios",
                column: "ConsultorId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_FilialId",
                table: "Usuarios",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_GrupoAcessoId",
                table: "Usuarios",
                column: "GrupoAcessoId");

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
                name: "IX_GruposAcesso_Nome",
                table: "GruposAcesso",
                column: "Nome",
                unique: true);

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
                name: "IX_SessoesAtivas_UsuarioId",
                table: "SessoesAtivas",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Consultores_ConsultorId",
                table: "Usuarios",
                column: "ConsultorId",
                principalTable: "Consultores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Filiais_FilialId",
                table: "Usuarios",
                column: "FilialId",
                principalTable: "Filiais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_GruposAcesso_GrupoAcessoId",
                table: "Usuarios",
                column: "GrupoAcessoId",
                principalTable: "GruposAcesso",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Consultores_ConsultorId",
                table: "Usuarios");

            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Filiais_FilialId",
                table: "Usuarios");

            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_GruposAcesso_GrupoAcessoId",
                table: "Usuarios");

            migrationBuilder.DropTable(
                name: "Boletos");

            migrationBuilder.DropTable(
                name: "PermissoesGrupos");

            migrationBuilder.DropTable(
                name: "SessoesAtivas");

            migrationBuilder.DropTable(
                name: "GruposAcesso");

            migrationBuilder.DropTable(
                name: "Permissoes");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_ConsultorId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_FilialId",
                table: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_GrupoAcessoId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ConsultorId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "FilialId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "GrupoAcessoId",
                table: "Usuarios");

            migrationBuilder.AddColumn<string>(
                name: "GrupoAcesso",
                table: "Usuarios",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}
