using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    /// <summary>
    /// Endpoints de dados do Portal do Cliente.
    /// Todos os endpoints requerem JWT (exceto se marcado AllowAnonymous).
    /// Reaproveita logica existente de ClienteController e BoletoController.
    /// </summary>
    [ApiController]
    [Route("api/portal")]
    [Authorize(AuthenticationSchemes = "PortalJwt")]
    public class PortalDadosController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAzureBlobStorageService _blobService;
        private readonly ILogger<PortalDadosController> _logger;

        public PortalDadosController(
            CrmArrighiContext context,
            IAzureBlobStorageService blobService,
            ILogger<PortalDadosController> logger)
        {
            _context = context;
            _blobService = blobService;
            _logger = logger;
        }

        // ─── GET /api/portal/clientes/{id}/dados ────────────────────────────

        /// <summary>
        /// Dashboard completo do cliente: contratos, boletos e resumo.
        /// </summary>
        [HttpGet("clientes/{id}/dados")]
        public async Task<IActionResult> GetDados(int id)
        {
            try
            {
                // Buscar contratos do cliente
                var contratos = await _context.Contratos
                    .Where(c => c.ClienteId == id && c.Ativo)
                    .Include(c => c.Consultor)
                        .ThenInclude(cons => cons.PessoaFisica)
                    .Select(c => new
                    {
                        id = c.Id,
                        numeroPasta = c.NumeroPasta ?? c.Id.ToString(),
                        tipoServico = c.TipoServico ?? "Serviço Jurídico",
                        situacao = c.Situacao ?? "Ativo",
                        valorTotal = c.ValorNegociado ?? ((c.ValorEntrada ?? 0) + ((c.ValorParcela ?? 0) * (c.NumeroParcelas ?? 0))),
                        dataInicio = c.DataFechamentoContrato ?? c.DataCadastro,
                        consultorNome = c.Consultor.PessoaFisica != null ? c.Consultor.PessoaFisica.Nome : "Consultor",
                        consultorId = c.ConsultorId,
                        pendencias = c.Pendencias,
                        observacoes = c.Observacoes,
                    })
                    .ToListAsync();

                // Buscar boletos
                var boletos = await _context.Boletos
                    .Where(b => b.Contrato.ClienteId == id && b.Ativo)
                    .Include(b => b.Contrato)
                    .OrderBy(b => b.DueDate)
                    .Select(b => new
                    {
                        id = b.Id,
                        contratoId = b.ContratoId,
                        contratoNumero = b.Contrato.NumeroPasta ?? $"#{b.ContratoId}",
                        nsuCode = b.NsuCode,
                        valor = b.NominalValue,
                        dataVencimento = b.DueDate,
                        dataEmissao = b.IssueDate,
                        dataPagamento = b.DataPagamento,
                        status = b.FoiPago ? "pago"
                            : b.Status == "CANCELADO" ? "cancelado"
                            : b.DueDate < DateTime.Now ? "vencido"
                            : "pendente",
                        tipo = "Boleto",
                        codigoBarras = b.BarCode,
                        linhaDigitavel = b.DigitableLine,
                        linkBoleto = b.QrCodeUrl,
                        qrCodePix = b.QrCodePix,
                        pdfBlobUrl = b.PdfBlobUrl,
                        numeroParcela = b.NumeroParcela,
                        valorPago = b.ValorPago,
                        pagadorNome = b.PayerName,
                        pagadorDocumento = b.PayerDocumentNumber,
                        multa = b.FinePercentage,
                        juros = b.InterestPercentage,
                        convenio = b.CovenantCode,
                        banco = b.BankNumber,
                    })
                    .ToListAsync();

                // Calcular valor pago por contrato
                var valorPagoPorContrato = boletos
                    .Where(b => b.status == "pago")
                    .GroupBy(b => b.contratoId)
                    .ToDictionary(g => g.Key, g => g.Sum(b => b.valorPago ?? b.valor));

                // Enriquecer contratos com valor pago
                var contratosComValorPago = contratos.Select(c =>
                {
                    var valorPago = valorPagoPorContrato.GetValueOrDefault(c.id, 0);
                    return new
                    {
                        c.id,
                        c.numeroPasta,
                        c.tipoServico,
                        c.situacao,
                        c.valorTotal,
                        valorPago,
                        c.dataInicio,
                        c.consultorNome,
                        c.consultorId,
                        c.pendencias,
                        c.observacoes,
                    };
                }).ToList();

                // Resumo
                var boletosPendentes = boletos.Count(b => b.status == "pendente");
                var boletosVencidos = boletos.Count(b => b.status == "vencido");
                var proximoPagamento = boletos
                    .Where(b => b.status == "pendente")
                    .OrderBy(b => b.dataVencimento)
                    .FirstOrDefault();

                return Ok(new
                {
                    contratos = contratosComValorPago,
                    pagamentos = boletos,
                    resumo = new
                    {
                        totalContratos = contratos.Count,
                        contratosAtivos = contratos.Count(c => c.situacao != "Quitado" && c.situacao != "RESCINDIDO" && c.situacao != "Cancelado"),
                        valorTotalContratos = contratosComValorPago.Sum(c => c.valorTotal),
                        valorTotalPago = contratosComValorPago.Sum(c => c.valorPago),
                        boletosPendentes,
                        boletosVencidos,
                        proximoPagamento,
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar dados do portal para cliente {ClienteId}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        // ─── GET /api/portal/boletos/{id} ───────────────────────────────────

        [HttpGet("boletos/{id}")]
        public async Task<IActionResult> GetBoleto(int id)
        {
            var boleto = await _context.Boletos
                .Where(b => b.Id == id && b.Ativo)
                .Select(b => new
                {
                    id = b.Id,
                    pdfUrl = b.QrCodeUrl,
                    linhaDigitavel = b.DigitableLine,
                    codigoBarras = b.BarCode,
                    valor = b.NominalValue,
                    vencimento = b.DueDate,
                    pagador = b.PayerName,
                    status = b.Status,
                })
                .FirstOrDefaultAsync();

            if (boleto == null)
                return NotFound(new { error = "Boleto não encontrado" });

            return Ok(boleto);
        }

        // ─── GET /api/portal/boletos/{id}/pdf ───────────────────────────────

        [HttpGet("boletos/{id}/pdf")]
        public async Task<IActionResult> GetBoletoPdf(int id)
        {
            try
            {
                var boleto = await _context.Boletos
                    .Where(b => b.Id == id && b.Ativo)
                    .FirstOrDefaultAsync();

                if (boleto == null)
                    return NotFound(new { error = "Boleto não encontrado" });

                // Tentar Azure Blob primeiro
                if (!string.IsNullOrEmpty(boleto.PdfBlobUrl))
                {
                    try
                    {
                        var pdfBytes = await _blobService.DownloadFileAsync(boleto.PdfBlobUrl);
                        if (pdfBytes != null && pdfBytes.Length > 0)
                        {
                            return File(pdfBytes, "application/pdf",
                                $"boleto_{boleto.PayerName?.Replace(" ", "_")}_{boleto.Id}.pdf");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Erro ao baixar PDF do blob para boleto {BoletoId}", id);
                    }
                }

                return NotFound(new { error = "PDF do boleto não disponível" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao baixar PDF do boleto {BoletoId}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        // ─── GET /api/portal/clientes/{id}/documentos ───────────────────────

        [HttpGet("clientes/{id}/documentos")]
        public async Task<IActionResult> GetDocumentos(int id, [FromQuery] string? tipo, [FromQuery] int? contratoId)
        {
            try
            {
                // Buscar documentos do Azure Blob Storage (pasta do cliente)
                var containerName = "contratos";
                var prefix = $"cliente_{id}/";

                var documentos = new List<object>();

                try
                {
                    var blobs = await _blobService.ListBlobsAsync(containerName, prefix);
                    if (blobs != null)
                    {
                        foreach (var blob in blobs)
                        {
                            documentos.Add(new
                            {
                                id = blob.GetHashCode(),
                                nome = blob,
                                tipo = "outros",
                                tamanho = 0,
                                formato = System.IO.Path.GetExtension(blob).TrimStart('.'),
                                dataUpload = DateTime.UtcNow,
                                status = "ativo",
                                origem = "blob",
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao listar blobs para cliente {ClienteId}", id);
                }

                return Ok(new { documentos });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar documentos do cliente {ClienteId}", id);
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        // ─── POST /api/portal/documentos/upload ─────────────────────────────

        [HttpPost("documentos/upload")]
        public async Task<IActionResult> UploadDocumento([FromForm] IFormFile arquivo, [FromForm] int clienteId, [FromForm] string? tipo, [FromForm] string? descricao)
        {
            try
            {
                if (arquivo == null || arquivo.Length == 0)
                    return BadRequest(new { error = "Arquivo é obrigatório" });

                if (arquivo.Length > 10 * 1024 * 1024)
                    return BadRequest(new { error = "Arquivo deve ter no máximo 10MB" });

                var containerName = "contratos";
                var blobName = $"cliente_{clienteId}/{Guid.NewGuid():N}_{arquivo.FileName}";

                using var stream = arquivo.OpenReadStream();
                var url = await _blobService.UploadFileAsync(containerName, blobName, stream, arquivo.ContentType);

                return Created("", new
                {
                    success = true,
                    documento = new
                    {
                        nome = arquivo.FileName,
                        blobName,
                        url,
                        tamanho = arquivo.Length,
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no upload de documento");
                return StatusCode(500, new { error = "Erro interno do servidor" });
            }
        }

        // ─── GET /api/portal/documentos/{id}/download ───────────────────────

        [HttpGet("documentos/{id}/download")]
        public async Task<IActionResult> DownloadDocumento(int id)
        {
            // Placeholder - depende de como documentos sao indexados
            return NotFound(new { error = "Documento não encontrado" });
        }

        // ─── GET /api/portal/documentos/{id}/preview ────────────────────────

        [HttpGet("documentos/{id}/preview")]
        public async Task<IActionResult> PreviewDocumento(int id)
        {
            // Placeholder - depende de como documentos sao indexados
            return NotFound(new { error = "Documento não encontrado" });
        }

        // ─── GET /api/portal/documentos/{id} ────────────────────────────────

        [HttpGet("documentos/{id}")]
        public async Task<IActionResult> GetDocumento(int id)
        {
            return NotFound(new { error = "Documento não encontrado" });
        }

        // ─── GET /api/portal/pessoas-fisicas ────────────────────────────────

        [HttpGet("pessoas-fisicas")]
        public async Task<IActionResult> GetPessoaFisica([FromQuery] int? id, [FromQuery] string? cpf)
        {
            if (id == null && string.IsNullOrWhiteSpace(cpf))
                return BadRequest(new { error = "ID ou CPF é obrigatório" });

            PessoaFisica? pf;

            if (id.HasValue)
            {
                pf = await _context.PessoasFisicas.FindAsync(id.Value);
            }
            else
            {
                var cpfLimpo = cpf!.Replace(".", "").Replace("-", "").Replace(" ", "");
                pf = await _context.PessoasFisicas
                    .FirstOrDefaultAsync(p => p.Cpf.Replace(".", "").Replace("-", "").Replace(" ", "") == cpfLimpo);
            }

            if (pf == null)
                return NotFound(new { error = "Pessoa física não encontrada" });

            return Ok(new
            {
                data = new
                {
                    id = pf.Id,
                    nome = pf.Nome,
                    cpf = pf.Cpf,
                    rg = pf.Rg,
                    dataNascimento = pf.DataNascimento,
                    email = pf.EmailEmpresarial ?? pf.EmailPessoal,
                    telefone1 = pf.Telefone1,
                    telefone2 = pf.Telefone2,
                }
            });
        }

        // ─── GET /api/portal/pessoas-juridicas ──────────────────────────────

        [HttpGet("pessoas-juridicas")]
        public async Task<IActionResult> GetPessoaJuridica([FromQuery] int? id, [FromQuery] string? cnpj)
        {
            if (id == null && string.IsNullOrWhiteSpace(cnpj))
                return BadRequest(new { error = "ID ou CNPJ é obrigatório" });

            PessoaJuridica? pj;

            if (id.HasValue)
            {
                pj = await _context.PessoasJuridicas.FindAsync(id.Value);
            }
            else
            {
                var cnpjLimpo = cnpj!.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "");
                pj = await _context.PessoasJuridicas
                    .FirstOrDefaultAsync(p => p.Cnpj.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "") == cnpjLimpo);
            }

            if (pj == null)
                return NotFound(new { error = "Pessoa jurídica não encontrada" });

            return Ok(new
            {
                data = new
                {
                    id = pj.Id,
                    razaoSocial = pj.RazaoSocial,
                    nomeFantasia = pj.NomeFantasia,
                    cnpj = pj.Cnpj,
                    email = pj.Email,
                    telefone1 = pj.Telefone1,
                    telefone2 = pj.Telefone2,
                }
            });
        }
    }
}
