using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoricoClienteController : ControllerBase
    {
        private readonly CrmArrighiContext _context;
        private readonly ILogger<HistoricoClienteController> _logger;

        public HistoricoClienteController(CrmArrighiContext context, ILogger<HistoricoClienteController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/HistoricoCliente
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetHistoricoClientes(
            [FromQuery] int? clienteId = null,
            [FromQuery] int? usuarioId = null,
            [FromQuery] string? tipoAcao = null,
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] int limit = 100)
        {
            try
            {
                var query = _context.HistoricoClientes
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .Include(h => h.Usuario)
                    .AsQueryable();

                // Aplicar filtros
                if (clienteId.HasValue)
                {
                    query = query.Where(h => h.ClienteId == clienteId.Value);
                }

                if (usuarioId.HasValue)
                {
                    query = query.Where(h => h.UsuarioId == usuarioId.Value);
                }

                if (!string.IsNullOrEmpty(tipoAcao))
                {
                    query = query.Where(h => h.TipoAcao == tipoAcao);
                }

                if (dataInicio.HasValue)
                {
                    query = query.Where(h => h.DataHora >= dataInicio.Value);
                }

                if (dataFim.HasValue)
                {
                    query = query.Where(h => h.DataHora <= dataFim.Value);
                }

                var historico = await query
                    .OrderByDescending(h => h.DataHora)
                    .Take(limit)
                    .ToListAsync();

                // Transformar para incluir nome do cliente
                var resultado = historico.Select(h => new
                {
                    h.Id,
                    h.ClienteId,
                    ClienteNome = h.Cliente?.TipoPessoa == "Fisica"
                        ? h.Cliente.PessoaFisica?.Nome
                        : h.Cliente?.PessoaJuridica?.RazaoSocial,
                    ClienteTipo = h.Cliente?.TipoPessoa,
                    h.TipoAcao,
                    h.Descricao,
                    h.DadosAnteriores,
                    h.DadosNovos,
                    h.UsuarioId,
                    UsuarioNome = h.NomeUsuario ?? h.Usuario?.Login ?? "Desconhecido",
                    h.DataHora,
                    h.EnderecoIP
                }).ToList();

                _logger.LogInformation($"📊 Retornando {resultado.Count} registros de histórico de clientes");
                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar histórico de clientes");
                return StatusCode(500, new { message = "Erro ao buscar histórico de clientes", error = ex.Message });
            }
        }

        // GET: api/HistoricoCliente/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<HistoricoCliente>> GetHistoricoCliente(int id)
        {
            try
            {
                var historico = await _context.HistoricoClientes
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .Include(h => h.Usuario)
                    .FirstOrDefaultAsync(h => h.Id == id);

                if (historico == null)
                {
                    return NotFound(new { message = $"Histórico com ID {id} não encontrado" });
                }

                return Ok(historico);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao buscar histórico {id}");
                return StatusCode(500, new { message = "Erro ao buscar histórico", error = ex.Message });
            }
        }

        // GET: api/HistoricoCliente/cliente/{clienteId}
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetHistoricoPorCliente(int clienteId)
        {
            try
            {
                var historico = await _context.HistoricoClientes
                    .Include(h => h.Usuario)
                    .Where(h => h.ClienteId == clienteId)
                    .OrderByDescending(h => h.DataHora)
                    .ToListAsync();

                var resultado = historico.Select(h => new
                {
                    h.Id,
                    h.ClienteId,
                    h.TipoAcao,
                    h.Descricao,
                    h.DadosAnteriores,
                    h.DadosNovos,
                    h.UsuarioId,
                    UsuarioNome = h.NomeUsuario ?? h.Usuario?.Login ?? "Desconhecido",
                    h.DataHora,
                    h.EnderecoIP
                }).ToList();

                _logger.LogInformation($"📊 Retornando {resultado.Count} registros de histórico para cliente {clienteId}");
                return resultado;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao buscar histórico do cliente {clienteId}");
                return StatusCode(500, new { message = "Erro ao buscar histórico do cliente", error = ex.Message });
            }
        }

        // GET: api/HistoricoCliente/usuario/{usuarioId}
        [HttpGet("usuario/{usuarioId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetHistoricoPorUsuario(int usuarioId)
        {
            try
            {
                var historico = await _context.HistoricoClientes
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaFisica)
                    .Include(h => h.Cliente)
                        .ThenInclude(c => c.PessoaJuridica)
                    .Where(h => h.UsuarioId == usuarioId)
                    .OrderByDescending(h => h.DataHora)
                    .Take(100)
                    .ToListAsync();

                var resultado = historico.Select(h => new
                {
                    h.Id,
                    h.ClienteId,
                    ClienteNome = h.Cliente?.TipoPessoa == "Fisica"
                        ? h.Cliente.PessoaFisica?.Nome
                        : h.Cliente?.PessoaJuridica?.RazaoSocial,
                    h.TipoAcao,
                    h.Descricao,
                    h.DadosAnteriores,
                    h.DadosNovos,
                    h.DataHora,
                    h.EnderecoIP
                }).ToList();

                _logger.LogInformation($"📊 Retornando {resultado.Count} registros de histórico para usuário {usuarioId}");
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao buscar histórico do usuário {usuarioId}");
                return StatusCode(500, new { message = "Erro ao buscar histórico do usuário", error = ex.Message });
            }
        }

        // POST: api/HistoricoCliente
        [HttpPost]
        public async Task<ActionResult<HistoricoCliente>> CreateHistoricoCliente(HistoricoCliente historico)
        {
            try
            {
                // Validar se o cliente existe
                var cliente = await _context.Clientes.FindAsync(historico.ClienteId);
                if (cliente == null)
                {
                    return BadRequest(new { message = "Cliente não encontrado" });
                }

                // Validar se o usuário existe
                var usuario = await _context.Usuarios.FindAsync(historico.UsuarioId);
                if (usuario == null)
                {
                    return BadRequest(new { message = "Usuário não encontrado" });
                }

                // Preencher nome do usuário
                if (string.IsNullOrEmpty(historico.NomeUsuario))
                {
                    historico.NomeUsuario = usuario.Login; // Usar Login como identificador
                }

                // Definir data/hora se não fornecida
                if (historico.DataHora == default)
                {
                    historico.DataHora = DateTime.Now;
                }

                // Obter IP do request
                if (string.IsNullOrEmpty(historico.EnderecoIP))
                {
                    historico.EnderecoIP = HttpContext.Connection.RemoteIpAddress?.ToString();
                }

                _context.HistoricoClientes.Add(historico);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"✅ Histórico criado: Cliente {historico.ClienteId}, Ação: {historico.TipoAcao}");

                return CreatedAtAction(nameof(GetHistoricoCliente), new { id = historico.Id }, historico);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao criar histórico");
                return StatusCode(500, new { message = "Erro ao criar histórico", error = ex.Message });
            }
        }

        // DELETE: api/HistoricoCliente/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHistoricoCliente(int id)
        {
            try
            {
                var historico = await _context.HistoricoClientes.FindAsync(id);
                if (historico == null)
                {
                    return NotFound(new { message = $"Histórico com ID {id} não encontrado" });
                }

                _context.HistoricoClientes.Remove(historico);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"🗑️ Histórico {id} removido");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Erro ao deletar histórico {id}");
                return StatusCode(500, new { message = "Erro ao deletar histórico", error = ex.Message });
            }
        }

        // GET: api/HistoricoCliente/estatisticas
        [HttpGet("estatisticas")]
        public async Task<ActionResult<object>> GetEstatisticas()
        {
            try
            {
                var totalRegistros = await _context.HistoricoClientes.CountAsync();
                var registrosHoje = await _context.HistoricoClientes
                    .Where(h => h.DataHora.Date == DateTime.Today)
                    .CountAsync();
                var registrosSemana = await _context.HistoricoClientes
                    .Where(h => h.DataHora >= DateTime.Today.AddDays(-7))
                    .CountAsync();

                var porTipoAcao = await _context.HistoricoClientes
                    .GroupBy(h => h.TipoAcao)
                    .Select(g => new { TipoAcao = g.Key, Total = g.Count() })
                    .ToListAsync();

                var porUsuario = await _context.HistoricoClientes
                    .GroupBy(h => new { h.UsuarioId, h.NomeUsuario })
                    .Select(g => new { UsuarioId = g.Key.UsuarioId, NomeUsuario = g.Key.NomeUsuario, Total = g.Count() })
                    .OrderByDescending(x => x.Total)
                    .Take(10)
                    .ToListAsync();

                return Ok(new
                {
                    TotalRegistros = totalRegistros,
                    RegistrosHoje = registrosHoje,
                    RegistrosSemana = registrosSemana,
                    PorTipoAcao = porTipoAcao,
                    TopUsuarios = porUsuario
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao buscar estatísticas");
                return StatusCode(500, new { message = "Erro ao buscar estatísticas", error = ex.Message });
            }
        }
    }
}

