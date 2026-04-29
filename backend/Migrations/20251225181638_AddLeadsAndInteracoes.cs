using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class AddLeadsAndInteracoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Leads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomeEmpresa = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ValorEstimado = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Probabilidade = table.Column<int>(type: "int", nullable: true),
                    Origem = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContatoNome = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContatoTelefone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ContatoEmail = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ContatoCargo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Necessidade = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResponsavelId = table.Column<int>(type: "int", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataUltimaInteracao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataProximaAcao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProximaAcao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DataQualificacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataProposta = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataNegociacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DataFechamento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoPerda = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ClienteId = table.Column<int>(type: "int", nullable: true),
                    ContratoId = table.Column<int>(type: "int", nullable: true),
                    CriadoPorId = table.Column<int>(type: "int", nullable: true),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AtualizadoPorId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Leads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Leads_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Contratos_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contratos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_AtualizadoPorId",
                        column: x => x.AtualizadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_CriadoPorId",
                        column: x => x.CriadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Leads_Usuarios_ResponsavelId",
                        column: x => x.ResponsavelId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LeadInteracoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LeadId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataInteracao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    DuracaoMinutos = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadInteracoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadInteracoes_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeadInteracoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeadInteracoes_LeadId",
                table: "LeadInteracoes",
                column: "LeadId");

            migrationBuilder.CreateIndex(
                name: "IX_LeadInteracoes_UsuarioId",
                table: "LeadInteracoes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_AtualizadoPorId",
                table: "Leads",
                column: "AtualizadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ClienteId",
                table: "Leads",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ContratoId",
                table: "Leads",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_CriadoPorId",
                table: "Leads",
                column: "CriadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_ResponsavelId",
                table: "Leads",
                column: "ResponsavelId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadInteracoes");

            migrationBuilder.DropTable(
                name: "Leads");
        }
    }
}
