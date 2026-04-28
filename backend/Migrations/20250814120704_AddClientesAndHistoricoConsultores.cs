using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddClientesAndHistoricoConsultores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TipoPessoa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PessoaFisicaId = table.Column<int>(type: "int", nullable: true),
                    PessoaJuridicaId = table.Column<int>(type: "int", nullable: true),
                    ConsultorAtualId = table.Column<int>(type: "int", nullable: true),
                    Observacoes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clientes", x => x.Id);
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
                name: "HistoricoConsultores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    ConsultorId = table.Column<int>(type: "int", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataFim = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoTransferencia = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_PessoaFisicaId",
                table: "Clientes",
                column: "PessoaFisicaId");

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_PessoaJuridicaId",
                table: "Clientes",
                column: "PessoaJuridicaId");

            migrationBuilder.CreateIndex(
                name: "IX_HistoricoConsultores_ClienteId",
                table: "HistoricoConsultores",
                column: "ClienteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricoConsultores");

            migrationBuilder.DropTable(
                name: "Clientes");
        }
    }
}
