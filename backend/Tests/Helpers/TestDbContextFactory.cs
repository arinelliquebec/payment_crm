using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;

namespace Tests.Helpers
{
    /// <summary>
    /// Factory para criar instancias de CrmArrighiContext com InMemory database para testes
    /// </summary>
    public static class TestDbContextFactory
    {
        public static CrmArrighiContext Create(string? databaseName = null)
        {
            var dbName = databaseName ?? Guid.NewGuid().ToString();
            var options = new DbContextOptionsBuilder<CrmArrighiContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;

            var context = new CrmArrighiContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        /// <summary>
        /// Cria um contexto com dados iniciais de seed para testes
        /// </summary>
        public static CrmArrighiContext CreateWithSeedData(string? databaseName = null)
        {
            var context = Create(databaseName);
            SeedTestData(context);
            return context;
        }

        private static void SeedTestData(CrmArrighiContext context)
        {
            // Cliente de teste
            var cliente = new CrmArrighi.Models.Cliente
            {
                Id = 1,
                TipoPessoa = "PF",
                Ativo = true,
                DataCadastro = DateTime.Now
            };
            context.Clientes.Add(cliente);

            // Consultor de teste (requer PessoaFisicaId e FilialId)
            var filial = new CrmArrighi.Models.Filial
            {
                Id = 1,
                Nome = "Filial Teste",
                DataInclusao = DateTime.Now
            };
            context.Filiais.Add(filial);

            var pessoaFisica = new CrmArrighi.Models.PessoaFisica
            {
                Id = 1,
                Nome = "Consultor Teste",
                DataCadastro = DateTime.Now
            };
            context.PessoasFisicas.Add(pessoaFisica);

            var consultor = new CrmArrighi.Models.Consultor
            {
                Id = 1,
                PessoaFisicaId = 1,
                FilialId = 1,
                Ativo = true,
                DataCadastro = DateTime.Now
            };
            context.Consultores.Add(consultor);

            // Contrato de teste
            var contrato = new CrmArrighi.Models.Contrato
            {
                Id = 1,
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = "Cliente",
                ValorDevido = 1000m,
                MetodoPagamento = "Boleto",
                Ativo = true,
                DataCadastro = DateTime.Now
            };
            context.Contratos.Add(contrato);

            // Contrato PIX de teste
            var contratoPix = new CrmArrighi.Models.Contrato
            {
                Id = 2,
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = "Cliente",
                ValorDevido = 500m,
                MetodoPagamento = "Pix",
                Ativo = true,
                DataCadastro = DateTime.Now
            };
            context.Contratos.Add(contratoPix);

            context.SaveChanges();
        }
    }
}
