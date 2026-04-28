using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoricoSituacaoContratosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "IX_HistoricoSituacaoContratos_ContratoId",
                table: "HistoricoSituacaoContratos",
                column: "ContratoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HistoricoSituacaoContratos");
        }
    }
}
