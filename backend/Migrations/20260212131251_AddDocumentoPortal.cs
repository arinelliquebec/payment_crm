using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentoPortal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetodoPagamento",
                table: "Contratos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TipoPagamento",
                table: "Boletos",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "DocumentosPortal",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    NomeArquivoBlobStorage = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    NomeArquivoOriginal = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Formato = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Tamanho = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ContratoId = table.Column<int>(type: "int", nullable: true),
                    EnviadoPor = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    DataUpload = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentosPortal");

            migrationBuilder.DropColumn(
                name: "MetodoPagamento",
                table: "Contratos");

            migrationBuilder.DropColumn(
                name: "TipoPagamento",
                table: "Boletos");
        }
    }
}
