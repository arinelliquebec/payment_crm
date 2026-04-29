using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using CrmArrighi.Controllers;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using Tests.Helpers;

namespace Tests.Controllers
{
    public class BoletoControllerTests : IDisposable
    {
        private readonly CrmArrighiContext _context;
        private readonly BoletoController _controller;
        private readonly Mock<ISantanderBoletoService> _santanderServiceMock;
        private readonly Mock<ILogger<BoletoController>> _loggerMock;
        private readonly Mock<IAuthorizationService> _authServiceMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<INotificacaoService> _notificacaoServiceMock;
        private readonly Mock<IAzureBlobStorageService> _blobServiceMock;

        public BoletoControllerTests()
        {
            _context = TestDbContextFactory.CreateWithSeedData();
            _santanderServiceMock = new Mock<ISantanderBoletoService>();
            _loggerMock = new Mock<ILogger<BoletoController>>();
            _authServiceMock = new Mock<IAuthorizationService>();
            _configMock = new Mock<IConfiguration>();
            _emailServiceMock = new Mock<IEmailService>();
            _notificacaoServiceMock = new Mock<INotificacaoService>();
            _blobServiceMock = new Mock<IAzureBlobStorageService>();

            _controller = new BoletoController(
                _context,
                _santanderServiceMock.Object,
                _loggerMock.Object,
                _authServiceMock.Object,
                _configMock.Object,
                _emailServiceMock.Object,
                _notificacaoServiceMock.Object,
                _blobServiceMock.Object
            );

            // Simular HttpContext com headers
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["X-Usuario-Id"] = "1";
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // =====================================================
        // TESTES: MarcarPixComoPagoManual
        // =====================================================

        [Fact]
        public async Task MarcarPixComoPago_DeveRetornarOk_QuandoPixPendente()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoletoPix(id: 10, valor: 200m);
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            var dto = new MarcarPagoManualDTO
            {
                ValorPago = 200m,
                DataPagamento = DateTime.UtcNow,
                Observacao = "Pago via PIX Itau"
            };

            // Act
            var result = await _controller.MarcarPixComoPagoManual(10, dto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.StatusCode.Should().Be(200);

            // Verificar no banco
            var boletoAtualizado = await _context.Boletos.FindAsync(10);
            boletoAtualizado!.FoiPago.Should().BeTrue();
            boletoAtualizado.Status.Should().Be("LIQUIDADO");
            boletoAtualizado.ValorPago.Should().Be(200m);
        }

        [Fact]
        public async Task MarcarPixComoPago_DeveUsarValorNominal_QuandoValorPagoNaoInformado()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoletoPix(id: 11, valor: 350m);
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            var dto = new MarcarPagoManualDTO(); // Sem valores

            // Act
            var result = await _controller.MarcarPixComoPagoManual(11, dto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();

            var boletoAtualizado = await _context.Boletos.FindAsync(11);
            boletoAtualizado!.ValorPago.Should().Be(350m); // Usa valor nominal
            boletoAtualizado.DataPagamento.Should().NotBeNull();
        }

        [Fact]
        public async Task MarcarPixComoPago_DeveRetornar404_QuandoBoletoNaoExiste()
        {
            // Act
            var result = await _controller.MarcarPixComoPagoManual(9999, new MarcarPagoManualDTO());

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task MarcarPixComoPago_DeveRetornar400_QuandoNaoEhPix()
        {
            // Arrange - Boleto normal (nao PIX)
            var boleto = BoletoTestHelper.CriarBoleto(id: 12, tipoPagamento: "Boleto");
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.MarcarPixComoPagoManual(12, new MarcarPagoManualDTO());

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task MarcarPixComoPago_DeveRetornar400_QuandoJaPago()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoletoPix(id: 13, foiPago: true);
            boleto.Status = "LIQUIDADO";
            boleto.ValorPago = 100m;
            boleto.DataPagamento = DateTime.UtcNow;
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.MarcarPixComoPagoManual(13, new MarcarPagoManualDTO());

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        // =====================================================
        // TESTES: DeleteBoleto
        // =====================================================

        [Fact]
        public async Task DeleteBoleto_DeveDesativar_QuandoBoletoExiste()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoleto(id: 20, status: "PENDENTE");
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteBoleto(20);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            var boletoAtualizado = await _context.Boletos.FindAsync(20);
            boletoAtualizado!.Ativo.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteBoleto_DeveRetornar404_QuandoNaoExiste()
        {
            // Act
            var result = await _controller.DeleteBoleto(9999);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        [Fact]
        public async Task DeleteBoleto_DeveRetornar400_QuandoLiquidado()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoleto(id: 21, status: "LIQUIDADO");
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteBoleto(21);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task DeleteBoleto_DeveTentarCancelarNaSantander_QuandoRegistrado()
        {
            // Arrange
            var boleto = BoletoTestHelper.CriarBoleto(id: 22, status: "REGISTRADO");
            _context.Boletos.Add(boleto);
            await _context.SaveChangesAsync();

            _santanderServiceMock
                .Setup(s => s.CancelarBoletoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteBoleto(22);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _santanderServiceMock.Verify(
                s => s.CancelarBoletoAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>()),
                Times.Once
            );
        }
    }
}
