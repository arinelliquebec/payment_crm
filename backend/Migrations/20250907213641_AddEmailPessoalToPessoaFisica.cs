using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailPessoalToPessoaFisica : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Filial",
                table: "Consultores");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "PessoasFisicas",
                newName: "EmailEmpresarial");

            migrationBuilder.RenameIndex(
                name: "IX_PessoasFisicas_Email",
                table: "PessoasFisicas",
                newName: "IX_PessoasFisicas_EmailEmpresarial");

            migrationBuilder.AddColumn<string>(
                name: "EmailPessoal",
                table: "PessoasFisicas",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FilialId",
                table: "Consultores",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Parceiros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PessoaFisicaId = table.Column<int>(type: "int", nullable: false),
                    FilialId = table.Column<int>(type: "int", nullable: false),
                    OAB = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false)
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
                name: "Contratos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    ConsultorId = table.Column<int>(type: "int", nullable: false),
                    ParceiroId = table.Column<int>(type: "int", nullable: true),
                    Situacao = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DataUltimoContato = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataProximoContato = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ValorDevido = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ValorNegociado = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NumeroPasta = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DataFechamentoContrato = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TipoServico = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ObjetoContrato = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Comissao = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ValorEntrada = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ValorParcela = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    NumeroParcelas = table.Column<int>(type: "int", nullable: true),
                    PrimeiroVencimento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AnexoDocumento = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Pendencias = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false)
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
                name: "HistoricoSituacaoContratos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContratoId = table.Column<int>(type: "int", nullable: false),
                    SituacaoAnterior = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NovaSituacao = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MotivoMudanca = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataMudanca = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Consultores_FilialId",
                table: "Consultores",
                column: "FilialId");

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
                name: "IX_HistoricoSituacaoContratos_ContratoId",
                table: "HistoricoSituacaoContratos",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_FilialId",
                table: "Parceiros",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_PessoaFisicaId",
                table: "Parceiros",
                column: "PessoaFisicaId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Consultores_Filiais_FilialId",
                table: "Consultores",
                column: "FilialId",
                principalTable: "Filiais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Consultores_Filiais_FilialId",
                table: "Consultores");

            migrationBuilder.DropTable(
                name: "HistoricoSituacaoContratos");

            migrationBuilder.DropTable(
                name: "Contratos");

            migrationBuilder.DropTable(
                name: "Parceiros");

            migrationBuilder.DropIndex(
                name: "IX_Consultores_FilialId",
                table: "Consultores");

            migrationBuilder.DropColumn(
                name: "EmailPessoal",
                table: "PessoasFisicas");

            migrationBuilder.DropColumn(
                name: "FilialId",
                table: "Consultores");

            migrationBuilder.RenameColumn(
                name: "EmailEmpresarial",
                table: "PessoasFisicas",
                newName: "Email");

            migrationBuilder.RenameIndex(
                name: "IX_PessoasFisicas_EmailEmpresarial",
                table: "PessoasFisicas",
                newName: "IX_PessoasFisicas_Email");

            migrationBuilder.AddColumn<string>(
                name: "Filial",
                table: "Consultores",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
