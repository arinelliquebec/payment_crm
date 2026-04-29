using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CrmArrighi.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    UsuarioNome = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UsuarioLogin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GrupoAcesso = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Acao = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Entidade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EntidadeId = table.Column<int>(type: "int", nullable: true),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ValorAnterior = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValorNovo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CamposAlterados = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Modulo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Severidade = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Info"),
                    DataHora = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UsuarioId",
                table: "AuditLogs",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_DataHora",
                table: "AuditLogs",
                column: "DataHora");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Acao",
                table: "AuditLogs",
                column: "Acao");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Entidade",
                table: "AuditLogs",
                column: "Entidade");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Severidade",
                table: "AuditLogs",
                column: "Severidade");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");
        }
    }
}
