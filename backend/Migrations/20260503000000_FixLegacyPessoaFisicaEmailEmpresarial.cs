using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CadastroPessoas.Migrations
{
    /// <inheritdoc />
    public partial class FixLegacyPessoaFisicaEmailEmpresarial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            if (migrationBuilder.ActiveProvider != "Npgsql.EntityFrameworkCore.PostgreSQL")
                return;

            migrationBuilder.Sql(
                """
                DO $$
                BEGIN
                  IF to_regclass('public."PessoasFisicas"') IS NULL THEN
                    RETURN;
                  END IF;

                  IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'PessoasFisicas'
                      AND column_name = 'EmailEmpresarial'
                  ) THEN
                    RETURN;
                  END IF;

                  IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'PessoasFisicas'
                      AND column_name = 'Email'
                  ) THEN
                    EXECUTE 'ALTER TABLE public."PessoasFisicas" RENAME COLUMN "Email" TO "EmailEmpresarial"';
                    RETURN;
                  END IF;

                  IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'PessoasFisicas'
                      AND column_name = 'email'
                  ) THEN
                    EXECUTE 'ALTER TABLE public."PessoasFisicas" RENAME COLUMN email TO "EmailEmpresarial"';
                    RETURN;
                  END IF;
                END
                $$ LANGUAGE plpgsql;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
