using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LogAtividadeController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<LogAtividadeController> _logger;

        public LogAtividadeController(
            CrmArrighiContext context,
            ILogger<LogAtividadeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/LogAtividade/recentes?limite=20
        [HttpGet("recentes")]
        public async Task<ActionResult<IEnumerable<object>>> GetAtividadesRecentes([FromQuery] int limite = 50)
        {
            try
            {
                _logger.LogInformation($"Buscando {limite} atividades recentes...");

                var atividades = await _context.LogsAtividades
                    .Where(l => l.Ativo)
                    .OrderByDescending(l => l.DataHora)
                    .Take(limite)
                    .Select(l => new
                    {
                        l.Id,
                        l.UsuarioId,
                        l.UsuarioNome,
                        l.Acao,
                        l.Tipo,
                        l.Detalhes,
                        l.ModuloOrigem,
                        l.DataHora
                    })
                    .ToListAsync();

                _logger.LogInformation($"✅ {atividades.Count} atividades encontradas");

                return Ok(atividades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atividades recentes");
                _logger.LogError($"Mensagem: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");

                // Verificar se é erro de tabela não existente
                if (ex.Message.Contains("Invalid object name 'LogsAtividades'") ||
                    ex.Message.Contains("LogsAtividades"))
                {
                    return StatusCode(500, new {
                        message = "Tabela LogsAtividades não existe no banco de dados",
                        detalhes = "Execute o script Migrations/LogAtividades_Create.sql no banco de dados",
                        erro = ex.Message
                    });
                }

                return StatusCode(500, new {
                    message = "Erro interno do servidor",
                    erro = ex.Message
                });
            }
        }

        // GET: api/LogAtividade/usuario/5?limite=10
        [HttpGet("usuario/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAtividadesPorUsuario(
            int usuarioId,
            [FromQuery] int limite = 20)
        {
            try
            {
                _logger.LogInformation($"Buscando atividades do usuário {usuarioId}...");

                var atividades = await _context.LogsAtividades
                    .Where(l => l.Ativo && l.UsuarioId == usuarioId)
                    .OrderByDescending(l => l.DataHora)
                    .Take(limite)
                    .Select(l => new
                    {
                        l.Id,
                        l.UsuarioId,
                        l.UsuarioNome,
                        l.Acao,
                        l.Tipo,
                        l.Detalhes,
                        l.ModuloOrigem,
                        l.DataHora
                    })
                    .ToListAsync();

                _logger.LogInformation($"✅ {atividades.Count} atividades encontradas para o usuário {usuarioId}");

                return Ok(atividades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao buscar atividades do usuário {usuarioId}");
                _logger.LogError($"Mensagem: {ex.Message}");

                if (ex.Message.Contains("Invalid object name 'LogsAtividades'"))
                {
                    return StatusCode(500, new {
                        message = "Tabela LogsAtividades não existe no banco de dados",
                        detalhes = "Execute o script Migrations/LogAtividades_Create.sql no banco de dados",
                        erro = ex.Message
                    });
                }

                return StatusCode(500, new {
                    message = "Erro interno do servidor",
                    erro = ex.Message
                });
            }
        }

        // POST: api/LogAtividade
        [HttpPost]
        public async Task<ActionResult<LogAtividade>> RegistrarAtividade([FromBody] LogAtividadeDTO dto)
        {
            try
            {
                _logger.LogInformation($"Registrando atividade: {dto.Acao} - Usuário: {dto.UsuarioNome}");

                var logAtividade = new LogAtividade
                {
                    UsuarioId = dto.UsuarioId,
                    UsuarioNome = dto.UsuarioNome,
                    Acao = dto.Acao,
                    Tipo = dto.Tipo ?? "info",
                    Detalhes = dto.Detalhes,
                    ModuloOrigem = dto.ModuloOrigem,
                    DataHora = DateTime.Now,
                    Ativo = true
                };

                _context.LogsAtividades.Add(logAtividade);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Atividade registrada com ID: {logAtividade.Id}");

                return CreatedAtAction(
                    nameof(GetAtividade),
                    new { id = logAtividade.Id },
                    logAtividade
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao registrar atividade");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // GET: api/LogAtividade/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LogAtividade>> GetAtividade(int id)
        {
            try
            {
                var atividade = await _context.LogsAtividades
                    .Where(l => l.Id == id && l.Ativo)
                    .FirstOrDefaultAsync();

                if (atividade == null)
                {
                    return NotFound();
                }

                return Ok(atividade);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao buscar atividade ID: {id}");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/LogAtividade/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarAtividade(int id)
        {
            try
            {
                var atividade = await _context.LogsAtividades.FindAsync(id);

                if (atividade == null)
                {
                    return NotFound();
                }

                // Soft delete
                atividade.Ativo = false;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Atividade ID {id} marcada como inativa");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao deletar atividade ID: {id}");
                return StatusCode(500, "Erro interno do servidor");
            }
        }

        // DELETE: api/LogAtividade/limpar?diasAntigos=30
        [HttpDelete("limpar")]
        public async Task<IActionResult> LimparAtividadesAntigas([FromQuery] int diasAntigos = 30)
        {
            try
            {
                var dataLimite = DateTime.Now.AddDays(-diasAntigos);

                var atividadesAntigas = await _context.LogsAtividades
                    .Where(l => l.DataHora < dataLimite)
                    .ToListAsync();

                foreach (var atividade in atividadesAntigas)
                {
                    atividade.Ativo = false;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ {atividadesAntigas.Count} atividades antigas marcadas como inativas");

                return Ok(new { mensagem = $"{atividadesAntigas.Count} atividades antigas foram arquivadas" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao limpar atividades antigas");
                return StatusCode(500, "Erro interno do servidor");
            }
        }
    }

    // DTO para criação de log de atividade
    public class LogAtividadeDTO
    {
        public int UsuarioId { get; set; }
        public string UsuarioNome { get; set; } = string.Empty;
        public string Acao { get; set; } = string.Empty;
        public string? Tipo { get; set; } = "info";
        public string? Detalhes { get; set; }
        public string? ModuloOrigem { get; set; }
    }
}

