using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using CrmArrighi.Controllers;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;
using Tests.Helpers;

namespace Tests.Controllers
{
    public class ContratoControllerTests : IDisposable
    {
        private readonly CrmArrighiContext _context;
        private readonly ContratoController _controller;
        private readonly Mock<IAuthorizationService> _authServiceMock;
        private readonly Mock<IAzureBlobStorageService> _blobServiceMock;

        public ContratoControllerTests()
        {
            _context = TestDbContextFactory.CreateWithSeedData();
            _authServiceMock = new Mock<IAuthorizationService>();
            _blobServiceMock = new Mock<IAzureBlobStorageService>();

            // Configurar mocks de autorizacao para permitir todas as operacoes
            _authServiceMock
                .Setup(s => s.HasPermissionAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(true);
            _authServiceMock
                .Setup(s => s.CanAccessAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<int?>()))
                .ReturnsAsync(true);
            _authServiceMock
                .Setup(s => s.CanViewContratoAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(true);
            _authServiceMock
                .Setup(s => s.CanEditContratoAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(true);
            _authServiceMock
                .Setup(s => s.CanDeleteContratoAsync(It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(true);
            _authServiceMock
                .Setup(s => s.FilterContratosByUserAsync(It.IsAny<int>(), It.IsAny<IQueryable<Contrato>>()))
                .Returns<int, IQueryable<Contrato>>((userId, query) => Task.FromResult(query));
            _authServiceMock
                .Setup(s => s.GetUsuarioAsync(It.IsAny<int>()))
                .ReturnsAsync(new CrmArrighi.Models.Usuario
                {
                    Id = 1,
                    Login = "admin",
                    Email = "admin@test.com",
                    Senha = "hash",
                    TipoPessoa = "PF",
                    Ativo = true,
                    DataCadastro = DateTime.Now
                });

            _controller = new ContratoController(
                _context,
                _authServiceMock.Object,
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
        // TESTES: Criar Contrato
        // =====================================================

        [Fact]
        public async Task CreateContrato_DeveSalvarNoBanco_ComDadosValidos()
        {
            // Arrange - Testar diretamente no DbContext (business logic pura)
            var contrato = new Contrato
            {
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = "Leed",
                DataUltimoContato = DateTime.Now,
                DataProximoContato = DateTime.Now.AddDays(3),
                ValorDevido = 5000m,
                MetodoPagamento = "Boleto"
            };

            // Act
            _context.Contratos.Add(contrato);
            await _context.SaveChangesAsync();

            // Assert
            var saved = await _context.Contratos.FindAsync(contrato.Id);
            saved.Should().NotBeNull();
            saved!.MetodoPagamento.Should().Be("Boleto");
            saved.Situacao.Should().Be("Leed");
            saved.ValorDevido.Should().Be(5000m);
            saved.Ativo.Should().BeTrue();
        }

        [Fact]
        public async Task CreateContrato_DeveSalvarMetodoPagamentoPix()
        {
            // Arrange
            var dto = new CreateContratoDTO
            {
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = "Cliente",
                DataUltimoContato = DateTime.Now,
                DataProximoContato = DateTime.Now.AddDays(3),
                ValorDevido = 1000m,
                MetodoPagamento = "Pix"
            };

            // Act
            var result = await _controller.CreateContrato(dto);

            // Assert
            var objResult = result as ObjectResult;
            objResult.Should().NotBeNull();

            // Verificar que o metodo de pagamento foi salvo
            var contrato = await _context.Contratos
                .OrderByDescending(c => c.Id)
                .FirstAsync();
            contrato.MetodoPagamento.Should().Be("Pix");
        }

        [Fact]
        public void CreateContratoDTO_DeveTerBoleto_ComoMetodoPagamentoPadrao()
        {
            // Arrange & Act
            var dto = new CreateContratoDTO();

            // Assert
            dto.MetodoPagamento.Should().Be("Boleto");
        }

        // =====================================================
        // TESTES: Buscar Contrato
        // =====================================================

        [Fact]
        public async Task GetContrato_DeveRetornarContrato_QuandoExiste()
        {
            // Act
            var result = await _controller.GetContrato(1);

            // Assert - ActionResult<Contrato> usa .Result para o IActionResult
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetContrato_DeveRetornar404_QuandoNaoExiste()
        {
            // Act
            var result = await _controller.GetContrato(9999);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        // =====================================================
        // TESTES: Deletar Contrato
        // =====================================================

        [Fact]
        public async Task DeleteContrato_DeveDesativar_QuandoExiste()
        {
            // Act
            var result = await _controller.DeleteContrato(1);

            // Assert
            result.Should().BeOfType<OkObjectResult>();

            var contrato = await _context.Contratos.FindAsync(1);
            contrato!.Ativo.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteContrato_DeveRetornar404_QuandoNaoExiste()
        {
            // Act
            var result = await _controller.DeleteContrato(9999);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }

        // =====================================================
        // TESTES: Validacao do Modelo
        // =====================================================

        [Fact]
        public void Contrato_DeveExigirSituacao()
        {
            // Arrange
            var contrato = new Contrato
            {
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = "" // Vazio invalido - exige Required
            };

            // Act & Assert
            var validationResults = ValidateModel(contrato);
            validationResults.Should().Contain(v => v.MemberNames.Contains("Situacao"));
        }

        [Fact]
        public void Contrato_SituacaoDeveTerNoMaximo50Caracteres()
        {
            // Arrange
            var contrato = new Contrato
            {
                ClienteId = 1,
                ConsultorId = 1,
                Situacao = new string('X', 51) // 51 chars - invalido
            };

            // Act & Assert
            var validationResults = ValidateModel(contrato);
            validationResults.Should().Contain(v => v.MemberNames.Contains("Situacao"));
        }

        [Fact]
        public void Contrato_DeveTerMetodoPagamentoPadraoBoleto()
        {
            // Arrange
            var contrato = new Contrato();

            // Assert
            contrato.MetodoPagamento.Should().Be("Boleto");
        }

        [Fact]
        public void Contrato_DeveTerAtivoTruePorPadrao()
        {
            // Arrange
            var contrato = new Contrato();

            // Assert
            contrato.Ativo.Should().BeTrue();
        }

        // Helper para validacao de DataAnnotations
        private static List<System.ComponentModel.DataAnnotations.ValidationResult> ValidateModel(object model)
        {
            var validationResults = new List<System.ComponentModel.DataAnnotations.ValidationResult>();
            var context = new System.ComponentModel.DataAnnotations.ValidationContext(model);
            System.ComponentModel.DataAnnotations.Validator.TryValidateObject(model, context, validationResults, true);
            return validationResults;
        }
    }
}
