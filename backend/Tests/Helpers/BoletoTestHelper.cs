using CrmArrighi.Models;

namespace Tests.Helpers
{
    /// <summary>
    /// Helper para criar objetos Boleto para testes
    /// </summary>
    public static class BoletoTestHelper
    {
        public static Boleto CriarBoleto(
            int id = 1,
            int contratoId = 1,
            decimal valor = 150.00m,
            string status = "PENDENTE",
            string tipoPagamento = "Boleto",
            bool foiPago = false,
            DateTime? dueDate = null)
        {
            return new Boleto
            {
                Id = id,
                ContratoId = contratoId,
                NsuCode = $"NSU{id:D10}",
                NsuDate = DateTime.Now,
                CovenantCode = "123456789",
                BankNumber = $"BN{id:D10}",
                DueDate = dueDate ?? DateTime.Now.AddDays(30),
                IssueDate = DateTime.Now,
                NominalValue = valor,
                DocumentKind = "DUPLICATA_MERCANTIL",
                PayerName = "EMPRESA TESTE LTDA",
                PayerDocumentType = "CNPJ",
                PayerDocumentNumber = "12345678000190",
                PayerAddress = "Rua Teste, 123",
                PayerNeighborhood = "Centro",
                PayerCity = "Sao Paulo",
                PayerState = "SP",
                PayerZipCode = "01001-000",
                Status = status,
                TipoPagamento = tipoPagamento,
                FoiPago = foiPago,
                DataCadastro = DateTime.Now,
                Ativo = true
            };
        }

        public static Boleto CriarBoletoPix(
            int id = 1,
            int contratoId = 2,
            decimal valor = 100.00m,
            string status = "PENDENTE",
            bool foiPago = false)
        {
            return CriarBoleto(
                id: id,
                contratoId: contratoId,
                valor: valor,
                status: status,
                tipoPagamento: "Pix",
                foiPago: foiPago
            );
        }

        public static Boleto CriarBoletoPago(int id = 1)
        {
            var boleto = CriarBoleto(id: id, status: "LIQUIDADO", foiPago: true);
            boleto.ValorPago = boleto.NominalValue;
            boleto.DataPagamento = DateTime.Now.AddDays(-1);
            return boleto;
        }
    }
}
