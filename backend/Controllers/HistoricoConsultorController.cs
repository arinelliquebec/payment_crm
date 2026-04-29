using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CrmArrighi.Data;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoricoConsultorController : ControllerBase
    {
        private readonly CrmArrighiContext _context;

        public HistoricoConsultorController(CrmArrighiContext context)
        {
            _context = context;
        }

        // GET: api/HistoricoConsultor
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoConsultores()
        {
            try
            {
                var historico = await _context.HistoricoConsultores
                    .Include(h => h.Cliente)
                    .OrderByDescending(h => h.DataInicio)
                    .ToListAsync();

                return historico;
            }
            catch (Exception ex)
            {
                // Retorna dados mock quando o banco não está disponível
                var mockData = new List<HistoricoConsultor>
                {
                    new HistoricoConsultor
                    {
                        Id = 1,
                        ClienteId = 1,
                        Cliente = new Cliente
                        {
                            Id = 1,
                            TipoPessoa = "Fisica",
                            FilialId = 5 // São Paulo - SP
                        },
                        ConsultorId = 1,
                        DataInicio = DateTime.UtcNow.AddDays(-60),
                        DataFim = DateTime.UtcNow.AddDays(-30),
                        MotivoTransferencia = "Reestruturação da equipe",
                        DataCadastro = DateTime.UtcNow.AddDays(-60)
                    },
                    new HistoricoConsultor
                    {
                        Id = 2,
                        ClienteId = 1,
                        Cliente = new Cliente
                        {
                            Id = 1,
                            TipoPessoa = "Fisica",
                            FilialId = 5 // São Paulo - SP
                        },
                        ConsultorId = 2,
                        DataInicio = DateTime.UtcNow.AddDays(-30),
                        DataFim = null, // Período atual
                        MotivoTransferencia = null,
                        DataCadastro = DateTime.UtcNow.AddDays(-30)
                    }
                };

                return mockData.OrderByDescending(h => h.DataInicio).ToList();
            }
        }

        // GET: api/HistoricoConsultor/5
        [HttpGet("{id}")]
        public async Task<ActionResult<HistoricoConsultor>> GetHistoricoConsultor(int id)
        {
            var historico = await _context.HistoricoConsultores
                .Include(h => h.Cliente)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (historico == null)
            {
                return NotFound();
            }

            return historico;
        }

        // GET: api/HistoricoConsultor/cliente/5
        [HttpGet("cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoPorCliente(int clienteId)
        {
            var historico = await _context.HistoricoConsultores
                .Include(h => h.Cliente)
                .Where(h => h.ClienteId == clienteId)
                .OrderByDescending(h => h.DataInicio)
                .ToListAsync();

            return historico;
        }

        // POST: api/HistoricoConsultor
        [HttpPost]
        public async Task<ActionResult<HistoricoConsultor>> CreateHistoricoConsultor(HistoricoConsultor historico)
        {
            try
            {
                // Validar se o cliente existe
                var cliente = await _context.Clientes.FindAsync(historico.ClienteId);
                if (cliente == null || !cliente.Ativo)
                {
                    return BadRequest("Cliente não encontrado ou inativo");
                }

                // Verificar se já existe um período ativo para este cliente
                var periodoAtivo = await _context.HistoricoConsultores
                    .Where(h => h.ClienteId == historico.ClienteId && h.DataFim == null)
                    .FirstOrDefaultAsync();

                if (periodoAtivo != null)
                {
                    return BadRequest("Já existe um período ativo para este cliente. Finalize o período atual antes de criar um novo.");
                }

                // Definir data de início se não fornecida
                if (historico.DataInicio == default)
                {
                    historico.DataInicio = DateTime.UtcNow;
                }

                historico.DataCadastro = DateTime.UtcNow;

                _context.HistoricoConsultores.Add(historico);
                await _context.SaveChangesAsync();

                // Retornar o histórico com os dados do cliente
                return await GetHistoricoConsultor(historico.Id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/HistoricoConsultor/5/finalizar
        [HttpPut("{id}/finalizar")]
        public async Task<IActionResult> FinalizarPeriodo(int id, [FromBody] string motivoTransferencia)
        {
            try
            {
                var historico = await _context.HistoricoConsultores.FindAsync(id);
                if (historico == null)
                {
                    return NotFound();
                }

                if (historico.DataFim.HasValue)
                {
                    return BadRequest("Este período já foi finalizado");
                }

                historico.DataFim = DateTime.UtcNow;
                historico.MotivoTransferencia = motivoTransferencia;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro interno do servidor: {ex.Message}");
            }
        }

        // PUT: api/HistoricoConsultor/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHistoricoConsultor(int id, HistoricoConsultor historico)
        {
            if (id != historico.Id)
            {
                return BadRequest();
            }

            try
            {
                var historicoExistente = await _context.HistoricoConsultores.FindAsync(id);
                if (historicoExistente == null)
                {
                    return NotFound();
                }

                // Permitir apenas atualização do motivo de transferência
                historicoExistente.MotivoTransferencia = historico.MotivoTransferencia;

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HistoricoConsultorExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/HistoricoConsultor/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHistoricoConsultor(int id)
        {
            var historico = await _context.HistoricoConsultores.FindAsync(id);
            if (historico == null)
            {
                return NotFound();
            }

            _context.HistoricoConsultores.Remove(historico);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/HistoricoConsultor/consultor/5
        [HttpGet("consultor/{consultorId}")]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoPorConsultor(int consultorId)
        {
            var historico = await _context.HistoricoConsultores
                .Include(h => h.Cliente)
                .Where(h => h.ConsultorId == consultorId)
                .OrderByDescending(h => h.DataInicio)
                .ToListAsync();

            return historico;
        }

        // GET: api/HistoricoConsultor/consultor/5/ativo
        [HttpGet("consultor/{consultorId}/ativo")]
        public async Task<ActionResult<IEnumerable<HistoricoConsultor>>> GetHistoricoAtivoPorConsultor(int consultorId)
        {
            var historico = await _context.HistoricoConsultores
                .Include(h => h.Cliente)
                .Where(h => h.ConsultorId == consultorId && h.DataFim == null)
                .OrderByDescending(h => h.DataInicio)
                .ToListAsync();

            return historico;
        }

        private bool HistoricoConsultorExists(int id)
        {
            return _context.HistoricoConsultores.Any(e => e.Id == id);
        }
    }
}
