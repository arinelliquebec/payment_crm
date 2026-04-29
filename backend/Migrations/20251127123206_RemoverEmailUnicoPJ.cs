using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class RemoverEmailUnicoPJ : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas",
                column: "Email");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas",
                column: "Email",
                unique: true);
        }
    }
}
