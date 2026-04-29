using CrmArrighi.DTOs;
using CrmArrighi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize] // TEMPORARIAMENTE REMOVIDO - Adicionar autenticação JWT no Program.cs
    public class LeadController : ControllerBase
    {
        private readonly LeadService _leadService;

        public LeadController(LeadService leadService)
        {
            _leadService = leadService;
        }

        private int GetUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        /// <summary>
        /// Lista todos os leads com filtros opcionais
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<LeadDTO>>> GetLeads(
            [FromQuery] int? responsavelId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? origem = null)
        {
            try
            {
                var leads = await _leadService.GetAllLeadsAsync(responsavelId, status, origem);
                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar leads", error = ex.Message });
            }
        }

        /// <summary>
        /// Busca um lead por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<LeadDTO>> GetLead(int id)
        {
            try
            {
                var lead = await _leadService.GetLeadByIdAsync(id);
                if (lead == null)
                    return NotFound(new { message = "Lead não encontrado" });

                return Ok(lead);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar lead", error = ex.Message });
            }
        }

        /// <summary>
        /// Cria um novo lead
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<LeadDTO>> CreateLead([FromBody] CreateLeadDTO dto)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var lead = await _leadService.CreateLeadAsync(dto, usuarioId);
                return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, lead);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao criar lead", error = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza um lead
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<LeadDTO>> UpdateLead(int id, [FromBody] UpdateLeadDTO dto)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var lead = await _leadService.UpdateLeadAsync(id, dto, usuarioId);

                if (lead == null)
                    return NotFound(new { message = "Lead não encontrado" });

                return Ok(lead);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atualizar lead", error = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza o status de um lead (usado no drag & drop do Kanban)
        /// </summary>
        [HttpPut("{id}/status")]
        public async Task<ActionResult<LeadDTO>> UpdateLeadStatus(int id, [FromBody] UpdateLeadStatusDTO dto)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var lead = await _leadService.UpdateLeadStatusAsync(id, dto, usuarioId);

                if (lead == null)
                    return NotFound(new { message = "Lead não encontrado" });

                return Ok(lead);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atualizar status do lead", error = ex.Message });
            }
        }

        /// <summary>
        /// Deleta um lead
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteLead(int id)
        {
            try
            {
                var success = await _leadService.DeleteLeadAsync(id);

                if (!success)
                    return NotFound(new { message = "Lead não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao deletar lead", error = ex.Message });
            }
        }

        /// <summary>
        /// Lista interações de um lead
        /// </summary>
        [HttpGet("{id}/interacoes")]
        public async Task<ActionResult<List<LeadInteracaoDTO>>> GetLeadInteracoes(int id)
        {
            try
            {
                var interacoes = await _leadService.GetLeadInteracoesAsync(id);
                return Ok(interacoes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar interações", error = ex.Message });
            }
        }

        /// <summary>
        /// Adiciona uma interação a um lead
        /// </summary>
        [HttpPost("{id}/interacoes")]
        public async Task<ActionResult<LeadInteracaoDTO>> AddInteracao(int id, [FromBody] CreateLeadInteracaoDTO dto)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                var interacao = await _leadService.AddInteracaoAsync(id, dto, usuarioId);
                return CreatedAtAction(nameof(GetLeadInteracoes), new { id }, interacao);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao adicionar interação", error = ex.Message });
            }
        }

        /// <summary>
        /// Retorna estatísticas do pipeline
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<PipelineStatsDTO>> GetPipelineStats([FromQuery] int? responsavelId = null)
        {
            try
            {
                var stats = await _leadService.GetPipelineStatsAsync(responsavelId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar estatísticas", error = ex.Message });
            }
        }
    }
}
