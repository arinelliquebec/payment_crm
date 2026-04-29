using FluentAssertions;
using CrmArrighi.Models;
using Tests.Helpers;

namespace Tests.Models
{
    public class BoletoModelTests
    {
        [Fact]
        public void Boleto_DeveTerStatusPendentePorPadrao()
        {
            var boleto = new Boleto();
            boleto.Status.Should().Be("PENDENTE");
        }

        [Fact]
        public void Boleto_DeveTerTipoPagamentoBoletoPorPadrao()
        {
            var boleto = new Boleto();
            boleto.TipoPagamento.Should().Be("Boleto");
        }

        [Fact]
        public void Boleto_DeveTerFoiPagoFalsoPorPadrao()
        {
            var boleto = new Boleto();
            boleto.FoiPago.Should().BeFalse();
        }

        [Fact]
        public void Boleto_DeveTerAtivoPorPadrao()
        {
            var boleto = new Boleto();
            boleto.Ativo.Should().BeTrue();
        }

        [Fact]
        public void Boleto_DeveExigirCamposObrigatorios()
        {
            // Arrange - Boleto vazio (strings default sao string.Empty, nao falham Required)
            var boleto = new Boleto();

            // Act
            var validationResults = ValidateModel(boleto);

            // Assert - NominalValue com Range(0.01,...) deve falhar quando 0
            validationResults.Should().NotBeEmpty();
            validationResults.Should().Contain(v => v.MemberNames.Contains("NominalValue"));
        }

        [Fact]
        public void Boleto_DeveAceitarTipoPagamentoPix()
        {
            var boleto = BoletoTestHelper.CriarBoletoPix();
            boleto.TipoPagamento.Should().Be("Pix");
        }

        [Fact]
        public void Boleto_DeveValidarValorNominalPositivo()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoleto();
            boleto.NominalValue = 0; // Invalido

            // Act
            var validationResults = ValidateModel(boleto);

            // Assert
            validationResults.Should().Contain(v => v.MemberNames.Contains("NominalValue"));
        }

        [Fact]
        public void Boleto_CriarBoletoPago_DeveEstarLiquidado()
        {
            var boleto = BoletoTestHelper.CriarBoletoPago();

            boleto.FoiPago.Should().BeTrue();
            boleto.Status.Should().Be("LIQUIDADO");
            boleto.ValorPago.Should().Be(boleto.NominalValue);
            boleto.DataPagamento.Should().NotBeNull();
        }

        [Fact]
        public void Boleto_NsuCode_DeveTerNoMaximo20Caracteres()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoleto();
            boleto.NsuCode = new string('X', 21); // 21 caracteres - invalido

            // Act
            var validationResults = ValidateModel(boleto);

            // Assert
            validationResults.Should().Contain(v => v.MemberNames.Contains("NsuCode"));
        }

        [Fact]
        public async Task Boleto_DevePersistirNoBanco()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateWithSeedData();
            var boleto = BoletoTestHelper.CriarBoleto(id: 100);

            // Act
            context.Boletos.Add(boleto);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Boletos.FindAsync(100);
            saved.Should().NotBeNull();
            saved!.NominalValue.Should().Be(150.00m);
            saved.TipoPagamento.Should().Be("Boleto");
        }

        [Fact]
        public async Task Boleto_Pix_DevePersistirNoBanco()
        {
            // Arrange
            using var context = TestDbContextFactory.CreateWithSeedData();
            var boleto = BoletoTestHelper.CriarBoletoPix(id: 101, valor: 250m);

            // Act
            context.Boletos.Add(boleto);
            await context.SaveChangesAsync();

            // Assert
            var saved = await context.Boletos.FindAsync(101);
            saved.Should().NotBeNull();
            saved!.TipoPagamento.Should().Be("Pix");
            saved.NominalValue.Should().Be(250m);
        }

        private static List<System.ComponentModel.DataAnnotations.ValidationResult> ValidateModel(object model)
        {
            var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
            var context = new System.ComponentModel.DataAnnotations.ValidationContext(model);
            System.ComponentModel.DataAnnotations.Validator.TryValidateObject(model, context, validationResults, true);
            return validationResults;
        }
    }
}
