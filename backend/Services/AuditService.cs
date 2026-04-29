using System.Text.Json;
using System.Text.Json.Serialization;
using CrmArrighi.Data;
using CrmArrighi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmArrighi.Services
{
    public interface IAuditService
    {
        /// <summary>Registra uma ação de auditoria.</summary>
        Task LogAsync(
            int usuarioId,
            string acao,
            string entidade,
            int? entidadeId,
            string descricao,
            string? modulo = null,
            object? valorAnterior = null,
            object? valorNovo = null,
            string? camposAlterados = null,
            string? severidade = "Info",
            HttpContext? httpContext = null
        );

        /// <summary>Busca logs com filtros e paginação.</summary>
        Task<AuditLogPagedResult> GetLogsAsync(AuditLogFilterDTO filtro);

        /// <summary>Resumo estatístico dos logs.</summary>
        Task<AuditLogResumo> GetResumoAsync();

        /// <summary>Busca log por ID.</summary>
        Task<AuditLogDTO?> GetByIdAsync(int id);
    }

    public class AuditService : IAuditService
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<AuditService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            WriteIndented = false,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            ReferenceHandler = ReferenceHandler.IgnoreCycles,
            MaxDepth = 3
        };

        public AuditService(CrmArrighiContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(
            int usuarioId,
            string acao,
            string entidade,
            int? entidadeId,
            string descricao,
            string? modulo = null,
            object? valorAnterior = null,
            object? valorNovo = null,
            string? camposAlterados = null,
            string? severidade = "Info",
            HttpContext? httpContext = null)
        {
            try
            {
                // Buscar dados do usuário
                var usuario = await _context.Usuarios
                    .Include(u => u.GrupoAcesso)
                    .Include(u => u.PessoaFisica)
                    .FirstOrDefaultAsync(u => u.Id == usuarioId);

                var nomeUsuario = usuario?.PessoaFisica?.Nome ?? usuario?.Login ?? $"Usuario #{usuarioId}";

                var log = new AuditLog
                {
                    UsuarioId = usuarioId,
                    UsuarioNome = nomeUsuario,
                    UsuarioLogin = usuario?.Login,
                    GrupoAcesso = usuario?.GrupoAcesso?.Nome,
                    Acao = acao,
                    Entidade = entidade,
                    EntidadeId = entidadeId,
                    Descricao = descricao,
                    Modulo = modulo ?? entidade,
                    Severidade = severidade ?? "Info",
                    CamposAlterados = camposAlterados,
                    DataHora = DateTime.UtcNow,
                };

                // Serializar valores
                if (valorAnterior != null)
                {
                    try { log.ValorAnterior = JsonSerializer.Serialize(valorAnterior, _jsonOptions); }
                    catch { log.ValorAnterior = valorAnterior.ToString(); }
                }

                if (valorNovo != null)
                {
                    try { log.ValorNovo = JsonSerializer.Serialize(valorNovo, _jsonOptions); }
                    catch { log.ValorNovo = valorNovo.ToString(); }
                }

                // Extrair IP e UserAgent
                if (httpContext != null)
                {
                    log.IpAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                    log.UserAgent = httpContext.Request.Headers["User-Agent"].FirstOrDefault();
                }

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Auditoria nunca deve quebrar o fluxo principal
                _logger.LogError(ex, "Erro ao registrar auditoria: {Acao} {Entidade} {EntidadeId}", acao, entidade, entidadeId);
            }
        }

        public async Task<AuditLogPagedResult> GetLogsAsync(AuditLogFilterDTO filtro)
        {
            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            // Filtros
            if (filtro.UsuarioId.HasValue)
                query = query.Where(l => l.UsuarioId == filtro.UsuarioId.Value);

            if (!string.IsNullOrEmpty(filtro.Acao))
                query = query.Where(l => l.Acao == filtro.Acao);

            if (!string.IsNullOrEmpty(filtro.Entidade))
                query = query.Where(l => l.Entidade == filtro.Entidade);

            if (filtro.EntidadeId.HasValue)
                query = query.Where(l => l.EntidadeId == filtro.EntidadeId.Value);

            if (!string.IsNullOrEmpty(filtro.Modulo))
                query = query.Where(l => l.Modulo == filtro.Modulo);

            if (!string.IsNullOrEmpty(filtro.Severidade))
                query = query.Where(l => l.Severidade == filtro.Severidade);

            if (filtro.DataInicio.HasValue)
                query = query.Where(l => l.DataHora >= filtro.DataInicio.Value);

            if (filtro.DataFim.HasValue)
                query = query.Where(l => l.DataHora <= filtro.DataFim.Value);

            if (!string.IsNullOrEmpty(filtro.Busca))
            {
                var busca = filtro.Busca.ToLower();
                query = query.Where(l =>
                    l.Descricao.ToLower().Contains(busca) ||
                    l.UsuarioNome.ToLower().Contains(busca) ||
                    (l.UsuarioLogin != null && l.UsuarioLogin.ToLower().Contains(busca)) ||
                    l.Entidade.ToLower().Contains(busca)
                );
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(l => l.DataHora)
                .Skip((filtro.Pagina - 1) * filtro.TamanhoPagina)
                .Take(filtro.TamanhoPagina)
                .Select(l => new AuditLogDTO
                {
                    Id = l.Id,
                    UsuarioId = l.UsuarioId,
                    UsuarioNome = l.UsuarioNome,
                    UsuarioLogin = l.UsuarioLogin,
                    GrupoAcesso = l.GrupoAcesso,
                    Acao = l.Acao,
                    Entidade = l.Entidade,
                    EntidadeId = l.EntidadeId,
                    Descricao = l.Descricao,
                    ValorAnterior = l.ValorAnterior,
                    ValorNovo = l.ValorNovo,
                    CamposAlterados = l.CamposAlterados,
                    IpAddress = l.IpAddress,
                    Modulo = l.Modulo,
                    Severidade = l.Severidade,
                    DataHora = l.DataHora,
                })
                .ToListAsync();

            return new AuditLogPagedResult
            {
                Items = items,
                TotalItems = total,
                Pagina = filtro.Pagina,
                TamanhoPagina = filtro.TamanhoPagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)filtro.TamanhoPagina),
            };
        }

        public async Task<AuditLogResumo> GetResumoAsync()
        {
            var hoje = DateTime.UtcNow.Date;
            var inicioSemana = hoje.AddDays(-(int)hoje.DayOfWeek);

            var totalRegistros = await _context.AuditLogs.CountAsync();
            var totalHoje = await _context.AuditLogs.CountAsync(l => l.DataHora >= hoje);
            var totalSemana = await _context.AuditLogs.CountAsync(l => l.DataHora >= inicioSemana);

            var porAcao = await _context.AuditLogs
                .GroupBy(l => l.Acao)
                .Select(g => new { Acao = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Acao, x => x.Count);

            var porEntidade = await _context.AuditLogs
                .GroupBy(l => l.Entidade)
                .Select(g => new { Entidade = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Entidade, x => x.Count);

            var porUsuario = await _context.AuditLogs
                .GroupBy(l => l.UsuarioNome)
                .Select(g => new { Usuario = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(10)
                .ToDictionaryAsync(x => x.Usuario, x => x.Count);

            var ultimasAcoes = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(l => l.DataHora)
                .Take(20)
                .Select(l => new AuditLogDTO
                {
                    Id = l.Id,
                    UsuarioId = l.UsuarioId,
                    UsuarioNome = l.UsuarioNome,
                    UsuarioLogin = l.UsuarioLogin,
                    GrupoAcesso = l.GrupoAcesso,
                    Acao = l.Acao,
                    Entidade = l.Entidade,
                    EntidadeId = l.EntidadeId,
                    Descricao = l.Descricao,
                    Modulo = l.Modulo,
                    Severidade = l.Severidade,
                    DataHora = l.DataHora,
                })
                .ToListAsync();

            return new AuditLogResumo
            {
                TotalRegistros = totalRegistros,
                TotalHoje = totalHoje,
                TotalSemana = totalSemana,
                PorAcao = porAcao,
                PorEntidade = porEntidade,
                PorUsuario = porUsuario,
                UltimasAcoes = ultimasAcoes,
            };
        }

        public async Task<AuditLogDTO?> GetByIdAsync(int id)
        {
            return await _context.AuditLogs
                .AsNoTracking()
                .Where(l => l.Id == id)
                .Select(l => new AuditLogDTO
                {
                    Id = l.Id,
                    UsuarioId = l.UsuarioId,
                    UsuarioNome = l.UsuarioNome,
                    UsuarioLogin = l.UsuarioLogin,
                    GrupoAcesso = l.GrupoAcesso,
                    Acao = l.Acao,
                    Entidade = l.Entidade,
                    EntidadeId = l.EntidadeId,
                    Descricao = l.Descricao,
                    ValorAnterior = l.ValorAnterior,
                    ValorNovo = l.ValorNovo,
                    CamposAlterados = l.CamposAlterados,
                    IpAddress = l.IpAddress,
                    Modulo = l.Modulo,
                    Severidade = l.Severidade,
                    DataHora = l.DataHora,
                })
                .FirstOrDefaultAsync();
        }
    }
}
