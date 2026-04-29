using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;
using CrmArrighi.Models;

namespace CrmArrighi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificacaoController : ControllerBase
    {
        private readonly INotificacaoService _notificacaoService;
        private readonly ILogger<NotificacaoController> _logger;

        public NotificacaoController(INotificacaoService notificacaoService, ILogger<NotificacaoController> logger)
        {
            _notificacaoService = notificacaoService;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/Notificacao
        /// Retorna notificações do usuário logado
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<NotificacaoDTO>>> GetNotificacoes(
            [FromQuery] bool apenasNaoLidas = false,
            [FromQuery] int limite = 50)
        {
            try
            {
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    return Unauthorized("Usuário não identificado");
                }

                var notificacoes = await _notificacaoService.GetNotificacoesUsuarioAsync(usuarioId, apenasNaoLidas, limite);

                var response = notificacoes.Select(n => new NotificacaoDTO
                {
                    Id = n.Id,
                    Tipo = n.Tipo,
                    Titulo = n.Titulo,
                    Mensagem = n.Mensagem,
                    Lida = n.Lida,
                    DataCriacao = n.DataCriacao,
                    DataLeitura = n.DataLeitura,
                    Prioridade = n.Prioridade,
                    Link = n.Link,
                    BoletoId = n.BoletoId,
                    ContratoId = n.ContratoId,
                    ClienteId = n.ClienteId,
                    NomeCliente = n.Cliente?.PessoaFisica?.Nome ?? n.Cliente?.PessoaJuridica?.RazaoSocial
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar notificações");
                return StatusCode(500, "Erro ao buscar notificações");
            }
        }

        /// <summary>
        /// GET: api/Notificacao/count
        /// Retorna contagem de notificações não lidas
        /// </summary>
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetCountNaoLidas()
        {
            try
            {
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    return Unauthorized("Usuário não identificado");
                }

                var count = await _notificacaoService.GetCountNaoLidasAsync(usuarioId);
                return Ok(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao contar notificações não lidas");
                return StatusCode(500, "Erro ao contar notificações");
            }
        }

        /// <summary>
        /// PUT: api/Notificacao/5/marcar-lida
        /// Marca uma notificação como lida
        /// </summary>
        [HttpPut("{id}/marcar-lida")]
        public async Task<IActionResult> MarcarComoLida(int id)
        {
            try
            {
                await _notificacaoService.MarcarComoLidaAsync(id);
                return Ok(new { success = true, message = "Notificação marcada como lida" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao marcar notificação {id} como lida");
                return StatusCode(500, "Erro ao marcar notificação como lida");
            }
        }

        /// <summary>
        /// PUT: api/Notificacao/marcar-todas-lidas
        /// Marca todas as notificações do usuário como lidas
        /// </summary>
        [HttpPut("marcar-todas-lidas")]
        public async Task<IActionResult> MarcarTodasComoLidas()
        {
            try
            {
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                if (!int.TryParse(usuarioIdHeader, out int usuarioId))
                {
                    return Unauthorized("Usuário não identificado");
                }

                await _notificacaoService.MarcarTodasComoLidasAsync(usuarioId);
                return Ok(new { success = true, message = "Todas as notificações foram marcadas como lidas" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar todas as notificações como lidas");
                return StatusCode(500, "Erro ao marcar notificações como lidas");
            }
        }
    }

    // DTO para resposta
    public class NotificacaoDTO
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Mensagem { get; set; } = string.Empty;
        public bool Lida { get; set; }
        public DateTime DataCriacao { get; set; }
        public DateTime? DataLeitura { get; set; }
        public string Prioridade { get; set; } = string.Empty;
        public string? Link { get; set; }
        public int? BoletoId { get; set; }
        public int? ContratoId { get; set; }
        public int? ClienteId { get; set; }
        public string? NomeCliente { get; set; }
    }
}
