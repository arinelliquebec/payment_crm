using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificacoesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Pendencias",
                table: "Contratos",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ObjetoContrato",
                table: "Contratos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DataPagamento",
                table: "Boletos",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FoiPago",
                table: "Boletos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "NumeroParcela",
                table: "Boletos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorPago",
                table: "Boletos",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LogsGeracaoBoletos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DataExecucao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    TotalContratosProcessados = table.Column<int>(type: "int", nullable: false),
                    TotalBoletosGerados = table.Column<int>(type: "int", nullable: false),
                    TotalErros = table.Column<int>(type: "int", nullable: false),
                    ValorTotalGerado = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Detalhes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DuracaoSegundos = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DataFinalizacao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogsGeracaoBoletos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogsGeracaoBoletos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notificacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Mensagem = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    BoletoId = table.Column<int>(type: "int", nullable: true),
                    ContratoId = table.Column<int>(type: "int", nullable: true),
                    ClienteId = table.Column<int>(type: "int", nullable: true),
                    Lida = table.Column<bool>(type: "bit", nullable: false),
                    DataLeitura = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DadosAdicionais = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Prioridade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Link = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Boletos_BoletoId",
                        column: x => x.BoletoId,
                        principalTable: "Boletos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notificacoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LogsGeracaoBoletos_DataExecucao",
                table: "LogsGeracaoBoletos",
                column: "DataExecucao");

            migrationBuilder.CreateIndex(
                name: "IX_LogsGeracaoBoletos_UsuarioId",
                table: "LogsGeracaoBoletos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_BoletoId",
                table: "Notificacoes",
                column: "BoletoId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_ClienteId",
                table: "Notificacoes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_ContratoId",
                table: "Notificacoes",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_DataCriacao",
                table: "Notificacoes",
                column: "DataCriacao");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_Lida",
                table: "Notificacoes",
                column: "Lida");

            migrationBuilder.CreateIndex(
                name: "IX_Notificacoes_UsuarioId",
                table: "Notificacoes",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogsGeracaoBoletos");

            migrationBuilder.DropTable(
                name: "Notificacoes");

            migrationBuilder.DropColumn(
                name: "DataPagamento",
                table: "Boletos");

            migrationBuilder.DropColumn(
                name: "FoiPago",
                table: "Boletos");

            migrationBuilder.DropColumn(
                name: "NumeroParcela",
                table: "Boletos");

            migrationBuilder.DropColumn(
                name: "ValorPago",
                table: "Boletos");

            migrationBuilder.AlterColumn<string>(
                name: "Pendencias",
                table: "Contratos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ObjetoContrato",
                table: "Contratos",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);
        }
    }
}
