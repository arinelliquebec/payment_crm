using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Enderecos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Cidade = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Bairro = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Logradouro = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Cep = table.Column<string>(type: "nvarchar(9)", maxLength: 9, nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Complemento = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enderecos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PessoasFisicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Codinome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Sexo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataNascimento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EstadoCivil = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cpf = table.Column<string>(type: "nvarchar(14)", maxLength: 14, nullable: false),
                    Rg = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Cnh = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Telefone1 = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Telefone2 = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    EnderecoId = table.Column<int>(type: "int", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PessoasFisicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PessoasFisicas_Enderecos_EnderecoId",
                        column: x => x.EnderecoId,
                        principalTable: "Enderecos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PessoasJuridicas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RazaoSocial = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NomeFantasia = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Cnpj = table.Column<string>(type: "nvarchar(18)", maxLength: 18, nullable: false),
                    ResponsavelTecnicoId = table.Column<int>(type: "int", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Telefone1 = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Telefone2 = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: true),
                    EnderecoId = table.Column<int>(type: "int", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PessoasJuridicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PessoasJuridicas_Enderecos_EnderecoId",
                        column: x => x.EnderecoId,
                        principalTable: "Enderecos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PessoasJuridicas_PessoasFisicas_ResponsavelTecnicoId",
                        column: x => x.ResponsavelTecnicoId,
                        principalTable: "PessoasFisicas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_Cpf",
                table: "PessoasFisicas",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_Email",
                table: "PessoasFisicas",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasFisicas_EnderecoId",
                table: "PessoasFisicas",
                column: "EnderecoId");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Cnpj",
                table: "PessoasJuridicas",
                column: "Cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_Email",
                table: "PessoasJuridicas",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_EnderecoId",
                table: "PessoasJuridicas",
                column: "EnderecoId");

            migrationBuilder.CreateIndex(
                name: "IX_PessoasJuridicas_ResponsavelTecnicoId",
                table: "PessoasJuridicas",
                column: "ResponsavelTecnicoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PessoasJuridicas");

            migrationBuilder.DropTable(
                name: "PessoasFisicas");

            migrationBuilder.DropTable(
                name: "Enderecos");
        }
    }
}
