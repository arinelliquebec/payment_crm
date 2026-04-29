using Microsoft.AspNetCore.Mvc;
using CrmArrighi.Services;
using CrmArrighi.Services.RAG;

namespace CrmArrighi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IAzureOpenAIService _openAIService;
        private readonly IRagService _ragService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IAzureOpenAIService openAIService,
            IRagService ragService,
            ILogger<ChatController> logger)
        {
            _openAIService = openAIService;
            _ragService = ragService;
            _logger = logger;
        }

        /// <summary>
        /// Envia uma mensagem para o assistente de IA com RAG (busca dados reais do sistema)
        /// </summary>
        [HttpPost("message")]
        public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { error = "Mensagem não pode estar vazia" });
                }

                // Obter ID do usuário do header
                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                int.TryParse(usuarioIdHeader, out int usuarioId);

                _logger.LogInformation("💬 Chat RAG: Mensagem recebida de usuário {UserId}: {MessagePreview}",
                    usuarioId, request.Message.Length > 50 ? request.Message[..50] + "..." : request.Message);

                // Usar RAG para processar a pergunta
                var ragResult = await _ragService.ProcessQueryAsync(request.Message, usuarioId);

                _logger.LogInformation("✅ Chat RAG: Resposta enviada (UsedRAG: {UsedRAG}, Time: {Time}ms)",
                    ragResult.UsedRAG, ragResult.ProcessingTimeMs);

                return Ok(new ChatResponse
                {
                    Message = ragResult.Response,
                    Timestamp = DateTime.UtcNow,
                    UsedRAG = ragResult.UsedRAG,
                    DataSources = ragResult.Sources,
                    ProcessingTimeMs = ragResult.ProcessingTimeMs,
                    Intent = ragResult.Intent.PrimaryIntent.ToString(),
                    Confidence = ragResult.Intent.Confidence
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro no chat RAG");
                return StatusCode(500, new { error = "Erro ao processar mensagem", details = ex.Message });
            }
        }

        /// <summary>
        /// Envia uma mensagem simples sem RAG (modo legacy)
        /// </summary>
        [HttpPost("simple")]
        public async Task<ActionResult<ChatResponse>> SendSimpleMessage([FromBody] ChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { error = "Mensagem não pode estar vazia" });
                }

                var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
                var userId = usuarioIdHeader ?? "anonymous";

                _logger.LogInformation("💬 Chat Simples: Mensagem recebida de usuário {UserId}", userId);

                string response;

                if (request.History != null && request.History.Any())
                {
                    var messages = request.History
                        .Select(h => new ChatMessage { Role = h.Role, Content = h.Content })
                        .ToList();

                    messages.Add(new ChatMessage { Role = "user", Content = request.Message });

                    response = await _openAIService.GetChatResponseWithHistoryAsync(messages, userId);
                }
                else
                {
                    response = await _openAIService.GetChatResponseAsync(request.Message, userId);
                }

                return Ok(new ChatResponse
                {
                    Message = response,
                    Timestamp = DateTime.UtcNow,
                    UsedRAG = false
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro no chat simples");
                return StatusCode(500, new { error = "Erro ao processar mensagem", details = ex.Message });
            }
        }

        /// <summary>
        /// Analisa uma pergunta e retorna a intenção identificada (útil para debug)
        /// </summary>
        [HttpPost("analyze")]
        public ActionResult<object> AnalyzeIntent([FromBody] ChatRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { error = "Mensagem não pode estar vazia" });
                }

                var intentAnalyzer = HttpContext.RequestServices.GetRequiredService<IIntentAnalyzer>();
                var result = intentAnalyzer.Analyze(request.Message);

                return Ok(new
                {
                    Query = result.OriginalQuery,
                    NormalizedQuery = result.NormalizedQuery,
                    PrimaryIntent = result.PrimaryIntent.ToString(),
                    SecondaryIntents = result.SecondaryIntents.Select(i => i.ToString()),
                    Confidence = result.Confidence,
                    Keywords = result.Keywords,
                    ExtractedEntities = result.ExtractedEntities,
                    RequiresDataLookup = result.RequiresDataLookup
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro na análise de intenção");
                return StatusCode(500, new { error = "Erro ao analisar mensagem", details = ex.Message });
            }
        }

        /// <summary>
        /// Verifica se o serviço de IA e RAG estão configurados
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<object>> GetStatus()
        {
            var isConfigured = await _openAIService.IsConfiguredAsync();
            var ragHealthy = await _ragService.IsHealthyAsync();

            return Ok(new
            {
                Configured = isConfigured,
                RagEnabled = ragHealthy,
                Provider = "I.A. Arrighi",
                Features = new
                {
                    RAG = ragHealthy ? "Habilitado - Respostas com dados reais do sistema" : "Desabilitado",
                    IntentAnalysis = "Habilitado - Identifica intenção das perguntas",
                    ContextRetrieval = "Habilitado - Busca dados relevantes do banco"
                },
                Message = isConfigured && ragHealthy
                    ? "🤖 Assistente de IA com RAG configurado e pronto para responder com dados reais!"
                    : isConfigured
                        ? "⚠️ Azure OpenAI configurado, mas RAG com problemas"
                        : "❌ Azure OpenAI não configurado"
            });
        }

        /// <summary>
        /// Retorna sugestões de perguntas frequentes (atualizadas para RAG)
        /// </summary>
        [HttpGet("suggestions")]
        public ActionResult<object> GetSuggestions()
        {
            var suggestions = new[]
            {
                new { category = "📊 Dados do Sistema", questions = new[]
                {
                    "Quantos boletos estão vencidos?",
                    "Qual o faturamento deste mês?",
                    "Quantos clientes temos cadastrados?",
                    "Qual o valor total em inadimplência?"
                }},
                new { category = "📈 Análises", questions = new[]
                {
                    "Como está o faturamento comparado ao mês passado?",
                    "Quais são os maiores devedores?",
                    "Qual a performance dos consultores este mês?",
                    "Quantos contratos foram fechados este mês?"
                }},
                new { category = "📋 Consultas", questions = new[]
                {
                    "Liste os boletos a vencer nos próximos 30 dias",
                    "Quais clientes estão inadimplentes há mais de 90 dias?",
                    "Mostre o ranking de consultores",
                    "Qual filial tem mais clientes?"
                }},
                new { category = "❓ Ajuda", questions = new[]
                {
                    "Como gerar um boleto?",
                    "Como cadastrar um novo cliente?",
                    "Onde vejo os contratos?",
                    "Como funciona o pipeline de leads?"
                }}
            };

            return Ok(new { suggestions });
        }

        /// <summary>
        /// Processa mensagem com streaming (Server-Sent Events)
        /// </summary>
        [HttpPost("message/stream")]
        public async Task StreamMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Mensagem não pode estar vazia");
                return;
            }

            // Configurar headers para SSE
            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("X-Accel-Buffering", "no");

            var usuarioIdHeader = Request.Headers["X-Usuario-Id"].FirstOrDefault();
            int.TryParse(usuarioIdHeader, out int usuarioId);

            _logger.LogInformation("🔄 Chat Stream: Iniciando streaming para usuário {UserId}", usuarioId);

            try
            {
                // Preparar histórico se disponível
                var history = request.History?.Select(h => new ChatMessage
                {
                    Role = h.Role,
                    Content = h.Content
                }).ToList();

                // Processar com streaming
                await foreach (var chunk in _ragService.ProcessQueryStreamAsync(
                    request.Message,
                    usuarioId,
                    history))
                {
                    var data = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        content = chunk.Content,
                        done = chunk.Done,
                        usedRAG = chunk.UsedRAG,
                        dataSources = chunk.DataSources
                    });

                    await Response.WriteAsync($"data: {data}\n\n");
                    await Response.Body.FlushAsync();

                    if (chunk.Done)
                    {
                        await Response.WriteAsync("data: [DONE]\n\n");
                        await Response.Body.FlushAsync();
                        break;
                    }
                }

                _logger.LogInformation("✅ Chat Stream: Streaming concluído para usuário {UserId}", usuarioId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro no streaming de chat");
                var errorData = System.Text.Json.JsonSerializer.Serialize(new
                {
                    content = "Erro ao processar mensagem.",
                    done = true,
                    error = true
                });
                await Response.WriteAsync($"data: {errorData}\n\n");
                await Response.WriteAsync("data: [DONE]\n\n");
                await Response.Body.FlushAsync();
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = "";
        public List<ChatHistoryItem>? History { get; set; }
        public bool IncludeContext { get; set; } = true;
    }

    public class ChatHistoryItem
    {
        public string Role { get; set; } = "user";
        public string Content { get; set; } = "";
    }

    public class ChatResponse
    {
        public string Message { get; set; } = "";
        public DateTime Timestamp { get; set; }
        public bool UsedRAG { get; set; }
        public List<string>? DataSources { get; set; }
        public long ProcessingTimeMs { get; set; }
        public string? Intent { get; set; }
        public double Confidence { get; set; }
        public bool StreamingEnabled { get; set; } = true;
    }
}
