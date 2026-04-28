using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class CreateParceirosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Parceiros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PessoaFisicaId = table.Column<int>(type: "int", nullable: false),
                    FilialId = table.Column<int>(type: "int", nullable: false),
                    OAB = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
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

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_FilialId",
                table: "Parceiros",
                column: "FilialId");

            migrationBuilder.CreateIndex(
                name: "IX_Parceiros_PessoaFisicaId",
                table: "Parceiros",
                column: "PessoaFisicaId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Parceiros");
        }
    }
}
