using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuariosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Login = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Senha = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    GrupoAcesso = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TipoPessoa = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PessoaFisicaId = table.Column<int>(type: "int", nullable: true),
                    PessoaJuridicaId = table.Column<int>(type: "int", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UltimoAcesso = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
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

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

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
                name: "Usuarios");
        }
    }
}
