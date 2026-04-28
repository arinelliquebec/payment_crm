using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class UpdateClienteFilialToId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Filial",
                table: "Clientes");

            migrationBuilder.AddColumn<int>(
                name: "FilialId",
                table: "Clientes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_FilialId",
                table: "Clientes",
                column: "FilialId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Filiais_FilialId",
                table: "Clientes",
                column: "FilialId",
                principalTable: "Filiais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Filiais_FilialId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_FilialId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "FilialId",
                table: "Clientes");

            migrationBuilder.AddColumn<string>(
                name: "Filial",
                table: "Clientes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
