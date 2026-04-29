using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;
using CrmArrighi.Services;

namespace CrmArrighi.Controllers
{
    /// <summary>
    /// Gerencia documentos do Portal do Cliente.
    /// Upload/download no Azure Blob Storage, metadados no SQL Server.
    /// 
    /// Endpoints:
    ///   POST   /api/DocumentoPortal              → Upload de documento
    ///   GET    /api/DocumentoPortal/cliente/{id}  → Listar documentos do cliente
    ///   GET    /api/DocumentoPortal/{id}          → Detalhes de um documento
    ///   GET    /api/DocumentoPortal/{id}/download  → Download do arquivo
    ///   PUT    /api/DocumentoPortal/{id}          → Editar metadados (admin)
    ///   DELETE /api/DocumentoPortal/{id}          → Excluir documento (admin)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentoPortalController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly IAzureBlobStorageService _blobStorageService;
        private readonly ILogger<DocumentoPortalController> _logger;

        // Tipos MIME permitidos
        private static readonly Dictionary<string, string> AllowedMimeTypes = new()
        {
            { ".pdf", "application/pdf" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".gif", "image/gif" },
            { ".webp", "image/webp" },
            { ".doc", "application/msword" },
            { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".xls", "application/vnd.ms-excel" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        };

        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        public DocumentoPortalController(
            CrmArrighiContext context,
            IAzureBlobStorageService blobStorageService,
            ILogger<DocumentoPortalController> logger)
        {
            _context = context;
            _blobStorageService = blobStorageService;
            _logger = logger;
        }

        // ─── POST: Upload de documento ───────────────────────────────────────

        /// <summary>
        /// Upload de documento via multipart/form-data.
        /// Campos: arquivo (file), clienteId, tipo?, descricao?, contratoId?
        /// </summary>
        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
        public async Task<ActionResult<DocumentoPortalResponse>> Upload(
            [FromForm] IFormFile arquivo,
            [FromForm] int clienteId,
            [FromForm] string? tipo,
            [FromForm] string? descricao,
            [FromForm] int? contratoId)
        {
            try
            {
                // Validar cliente existe
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.Id == clienteId);
                if (!clienteExiste)
                    return NotFound(new { error = "Cliente não encontrado" });

                // Validar arquivo
                if (arquivo == null || arquivo.Length == 0)
                    return BadRequest(new { error = "Arquivo é obrigatório" });

                if (arquivo.Length > MaxFileSize)
                    return BadRequest(new { error = "Arquivo excede o limite de 10 MB" });

                var ext = Path.GetExtension(arquivo.FileName)?.ToLowerInvariant() ?? "";
                if (!AllowedMimeTypes.ContainsKey(ext))
                    return BadRequest(new { error = $"Formato '{ext}' não permitido. Permitidos: {string.Join(", ", AllowedMimeTypes.Keys)}" });

                // Gerar nome único no Blob
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var guid = Guid.NewGuid().ToString("N")[..8];
                var blobFileName = $"documentos/{clienteId}/{timestamp}_{guid}{ext}";

                // Upload para Azure Blob Storage
                using var ms = new MemoryStream();
                await arquivo.CopyToAsync(ms);
                var fileBytes = ms.ToArray();
                var contentType = AllowedMimeTypes.GetValueOrDefault(ext, "application/octet-stream");

                await _blobStorageService.UploadFileAsync(blobFileName, fileBytes, contentType);
                _logger.LogInformation("[DocumentoPortal] Upload: {FileName} ({Size} bytes) para cliente {ClienteId}", blobFileName, arquivo.Length, clienteId);

                // Salvar metadados no banco
                var documento = new DocumentoPortal
                {
                    ClienteId = clienteId,
                    Nome = Path.GetFileNameWithoutExtension(arquivo.FileName) ?? "Documento",
                    Tipo = ValidarTipo(tipo),
                    Descricao = descricao,
                    NomeArquivoBlobStorage = blobFileName,
                    NomeArquivoOriginal = arquivo.FileName,
                    Formato = ext.TrimStart('.'),
                    ContentType = contentType,
                    Tamanho = arquivo.Length,
                    Status = "ativo",
                    ContratoId = contratoId,
                    EnviadoPor = "cliente",
                    DataUpload = DateTime.UtcNow,
                };

                _context.DocumentosPortal.Add(documento);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = documento.Id }, new DocumentoPortalResponse
                {
                    Success = true,
                    Documento = MapToDto(documento),
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DocumentoPortal] Erro no upload para cliente {ClienteId}", clienteId);
                return StatusCode(500, new { error = "Erro interno ao fazer upload do documento" });
            }
        }

        // ─── GET: Listar documentos do cliente ───────────────────────────────

        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult> GetByCliente(int clienteId)
        {
            try
            {
                var documentos = await _context.DocumentosPortal
                    .Where(d => d.ClienteId == clienteId)
                    .OrderByDescending(d => d.DataUpload)
                    .ToListAsync();

                var dtos = documentos.Select(MapToDto).ToList();

                // Calcular totais por tipo
                var totalPorTipo = dtos
                    .GroupBy(d => d.Tipo)
                    .ToDictionary(g => g.Key, g => g.Count());

                return Ok(new
                {
                    documentos = dtos,
                    total = dtos.Count,
                    totalPorTipo,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DocumentoPortal] Erro ao listar documentos do cliente {ClienteId}", clienteId);
                return StatusCode(500, new { error = "Erro ao buscar documentos" });
            }
        }

        // ─── GET: Detalhes de um documento ───────────────────────────────────

        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var documento = await _context.DocumentosPortal.FindAsync(id);
            if (documento == null)
                return NotFound(new { error = "Documento não encontrado" });

            return Ok(MapToDto(documento));
        }

        // ─── GET: Download do arquivo ────────────────────────────────────────

        [HttpGet("{id}/download")]
        public async Task<ActionResult> Download(int id)
        {
            try
            {
                var documento = await _context.DocumentosPortal.FindAsync(id);
                if (documento == null)
                    return NotFound(new { error = "Documento não encontrado" });

                var fileBytes = await _blobStorageService.DownloadFileAsync(documento.NomeArquivoBlobStorage);
                var contentType = documento.ContentType ?? "application/octet-stream";
                var fileName = documento.NomeArquivoOriginal ?? $"{documento.Nome}.{documento.Formato}";

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DocumentoPortal] Erro no download do documento {Id}", id);
                return StatusCode(500, new { error = "Erro ao baixar documento" });
            }
        }

        // ─── PUT: Editar metadados (admin only) ─────────────────────────────

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateDocumentoRequest request)
        {
            try
            {
                var documento = await _context.DocumentosPortal.FindAsync(id);
                if (documento == null)
                    return NotFound(new { error = "Documento não encontrado" });

                if (!string.IsNullOrWhiteSpace(request.Nome))
                    documento.Nome = request.Nome;

                if (!string.IsNullOrWhiteSpace(request.Tipo))
                    documento.Tipo = ValidarTipo(request.Tipo);

                if (request.Descricao != null)
                    documento.Descricao = request.Descricao;

                if (!string.IsNullOrWhiteSpace(request.Status))
                    documento.Status = request.Status == "arquivado" ? "arquivado" : "ativo";

                documento.DataAtualizacao = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("[DocumentoPortal] Documento {Id} atualizado", id);

                return Ok(MapToDto(documento));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DocumentoPortal] Erro ao atualizar documento {Id}", id);
                return StatusCode(500, new { error = "Erro ao atualizar documento" });
            }
        }

        // ─── DELETE: Excluir documento (admin only) ──────────────────────────

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var documento = await _context.DocumentosPortal.FindAsync(id);
                if (documento == null)
                    return NotFound(new { error = "Documento não encontrado" });

                // Remover do Blob Storage
                try
                {
                    await _blobStorageService.DeleteFileAsync(documento.NomeArquivoBlobStorage);
                }
                catch (Exception blobEx)
                {
                    _logger.LogWarning(blobEx, "[DocumentoPortal] Erro ao excluir blob {FileName}, removendo registro do banco mesmo assim", documento.NomeArquivoBlobStorage);
                }

                // Remover do banco
                _context.DocumentosPortal.Remove(documento);
                await _context.SaveChangesAsync();

                _logger.LogInformation("[DocumentoPortal] Documento {Id} excluído (blob: {FileName})", id, documento.NomeArquivoBlobStorage);

                return Ok(new { success = true, message = "Documento excluído com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[DocumentoPortal] Erro ao excluir documento {Id}", id);
                return StatusCode(500, new { error = "Erro ao excluir documento" });
            }
        }

        // ─── Helpers ─────────────────────────────────────────────────────────

        private static string ValidarTipo(string? tipo)
        {
            var tiposValidos = new[] { "contrato", "boleto", "procuracao", "comprovante", "nota_fiscal", "outros" };
            var tipoLimpo = (tipo ?? "outros").ToLowerInvariant().Trim();
            return tiposValidos.Contains(tipoLimpo) ? tipoLimpo : "outros";
        }

        private static DocumentoPortalDto MapToDto(DocumentoPortal d)
        {
            return new DocumentoPortalDto
            {
                Id = d.Id,
                ClienteId = d.ClienteId,
                Nome = d.Nome,
                Tipo = d.Tipo,
                Descricao = d.Descricao,
                NomeArquivoOriginal = d.NomeArquivoOriginal,
                Formato = d.Formato,
                Tamanho = d.Tamanho,
                Status = d.Status,
                ContratoId = d.ContratoId,
                EnviadoPor = d.EnviadoPor,
                DataUpload = d.DataUpload,
                DataAtualizacao = d.DataAtualizacao,
            };
        }
    }

    // ─── DTOs ────────────────────────────────────────────────────────────────

    public class DocumentoPortalDto
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Tipo { get; set; } = "outros";
        public string? Descricao { get; set; }
        public string? NomeArquivoOriginal { get; set; }
        public string Formato { get; set; } = string.Empty;
        public long Tamanho { get; set; }
        public string Status { get; set; } = "ativo";
        public int? ContratoId { get; set; }
        public string EnviadoPor { get; set; } = "cliente";
        public DateTime DataUpload { get; set; }
        public DateTime? DataAtualizacao { get; set; }
    }

    public class DocumentoPortalResponse
    {
        public bool Success { get; set; }
        public DocumentoPortalDto? Documento { get; set; }
    }

    public class UpdateDocumentoRequest
    {
        public string? Nome { get; set; }
        public string? Tipo { get; set; }
        public string? Descricao { get; set; }
        public string? Status { get; set; }
    }
}
