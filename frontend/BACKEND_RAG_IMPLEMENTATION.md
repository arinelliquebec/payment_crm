# 🤖 Guia de Implementação RAG - Backend .NET

Este guia detalha como implementar RAG (Retrieval-Augmented Generation) no backend .NET para integração com Azure OpenAI.

# 📋 Índice

1. [Pacotes NuGet Necessários](#1-pacotes-nuget-necessários)
2. [Configurações (appsettings.json)](#2-configurações-appsettingsjson)
3. [Models](#3-models)
4. [Services](#4-services)
5. [Controller](#5-controller)
6. [System Prompt Otimizado](#6-system-prompt-otimizado)
7. [Implementação de Streaming](#7-implementação-de-streaming)

---

## 1. Pacotes NuGet Necessários

```xml
<!-- No arquivo .csproj -->
<ItemGroup>
  <PackageReference Include="Azure.AI.OpenAI" Version="2.0.0" />
  <PackageReference Include="Microsoft.SemanticKernel" Version="1.25.0" />
  <PackageReference Include="Microsoft.SemanticKernel.Connectors.AzureOpenAI" Version="1.25.0" />
</ItemGroup>
```

Ou via CLI:
```bash
dotnet add package Azure.AI.OpenAI
dotnet add package Microsoft.SemanticKernel
dotnet add package Microsoft.SemanticKernel.Connectors.AzureOpenAI
```

---

## 2. Configurações (appsettings.json)

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://seu-recurso.openai.azure.com/",
    "ApiKey": "sua-api-key",
    "DeploymentName": "gpt-4o",
    "EmbeddingDeploymentName": "text-embedding-ada-002",
    "MaxTokens": 4000,
    "Temperature": 0.3,
    "TopP": 0.9,
    "FrequencyPenalty": 0.3,
    "PresencePenalty": 0.3
  },
  "RAG": {
    "Enabled": true,
    "MaxContextTokens": 4000,
    "MaxHistoryMessages": 10,
    "StreamingEnabled": true
  }
}
```

---

## 3. Models

### ChatModels.cs

```csharp
namespace ArrighiCRM.API.Models.Chat
{
    /// <summary>
    /// Requisição de mensagem do chat
    /// </summary>
    public class ChatMessageRequest
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatHistoryMessage>? History { get; set; }
        public bool IncludeContext { get; set; } = true;
    }

    /// <summary>
    /// Mensagem do histórico
    /// </summary>
    public class ChatHistoryMessage
    {
        public string Role { get; set; } = "user"; // "user" ou "assistant"
        public string Content { get; set; } = string.Empty;
    }

    /// <summary>
    /// Resposta do chat
    /// </summary>
    public class ChatMessageResponse
    {
        public string Message { get; set; } = string.Empty;
        public bool UsedRAG { get; set; }
        public List<string> DataSources { get; set; } = new();
        public long ProcessingTimeMs { get; set; }
        public string? Intent { get; set; }
    }

    /// <summary>
    /// Status do chat
    /// </summary>
    public class ChatStatusResponse
    {
        public bool Configured { get; set; }
        public bool RagEnabled { get; set; }
        public bool StreamingEnabled { get; set; }
        public string Provider { get; set; } = "Azure OpenAI";
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Sugestões de perguntas
    /// </summary>
    public class ChatSuggestionsResponse
    {
        public List<SuggestionCategory> Suggestions { get; set; } = new();
    }

    public class SuggestionCategory
    {
        public string Category { get; set; } = string.Empty;
        public List<string> Questions { get; set; } = new();
    }

    /// <summary>
    /// Chunk de streaming
    /// </summary>
    public class StreamChunk
    {
        public string Content { get; set; } = string.Empty;
        public bool Done { get; set; }
    }

    /// <summary>
    /// Contexto RAG extraído do banco
    /// </summary>
    public class RAGContext
    {
        public string Intent { get; set; } = string.Empty;
        public List<string> DataSources { get; set; } = new();
        public string ContextText { get; set; } = string.Empty;
        public Dictionary<string, object> ExtractedData { get; set; } = new();
    }
}
```

---

## 4. Services

### IChatService.cs

```csharp
namespace ArrighiCRM.API.Services.Interfaces
{
    public interface IChatService
    {
        Task<ChatStatusResponse> GetStatusAsync();
        Task<ChatSuggestionsResponse> GetSuggestionsAsync();
        Task<ChatMessageResponse> ProcessMessageAsync(ChatMessageRequest request, int usuarioId);
        IAsyncEnumerable<StreamChunk> ProcessMessageStreamAsync(ChatMessageRequest request, int usuarioId);
    }
}
```

### ChatService.cs

```csharp
using Azure;
using Azure.AI.OpenAI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using ArrighiCRM.API.Data;
using ArrighiCRM.API.Models.Chat;
using ArrighiCRM.API.Services.Interfaces;

namespace ArrighiCRM.API.Services
{
    public class AzureOpenAISettings
    {
        public string Endpoint { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string DeploymentName { get; set; } = "gpt-4o";
        public int MaxTokens { get; set; } = 4000;
        public float Temperature { get; set; } = 0.3f;
        public float TopP { get; set; } = 0.9f;
        public float FrequencyPenalty { get; set; } = 0.3f;
        public float PresencePenalty { get; set; } = 0.3f;
    }

    public class RAGSettings
    {
        public bool Enabled { get; set; } = true;
        public int MaxContextTokens { get; set; } = 4000;
        public int MaxHistoryMessages { get; set; } = 10;
        public bool StreamingEnabled { get; set; } = true;
    }

    public class ChatService : IChatService
    {
        private readonly ApplicationDbContext _context;
        private readonly AzureOpenAISettings _openAISettings;
        private readonly RAGSettings _ragSettings;
        private readonly ILogger<ChatService> _logger;
        private readonly AzureOpenAIClient _openAIClient;

        public ChatService(
            ApplicationDbContext context,
            IOptions<AzureOpenAISettings> openAISettings,
            IOptions<RAGSettings> ragSettings,
            ILogger<ChatService> logger)
        {
            _context = context;
            _openAISettings = openAISettings.Value;
            _ragSettings = ragSettings.Value;
            _logger = logger;

            // Inicializa cliente Azure OpenAI
            _openAIClient = new AzureOpenAIClient(
                new Uri(_openAISettings.Endpoint),
                new AzureKeyCredential(_openAISettings.ApiKey));
        }

        public Task<ChatStatusResponse> GetStatusAsync()
        {
            var isConfigured = !string.IsNullOrEmpty(_openAISettings.Endpoint) &&
                              !string.IsNullOrEmpty(_openAISettings.ApiKey);

            return Task.FromResult(new ChatStatusResponse
            {
                Configured = isConfigured,
                RagEnabled = _ragSettings.Enabled,
                StreamingEnabled = _ragSettings.StreamingEnabled,
                Provider = "Azure OpenAI",
                Message = isConfigured
                    ? "Assistente configurado e pronto"
                    : "Azure OpenAI não configurado"
            });
        }

        public Task<ChatSuggestionsResponse> GetSuggestionsAsync()
        {
            var suggestions = new ChatSuggestionsResponse
            {
                Suggestions = new List<SuggestionCategory>
                {
                    new SuggestionCategory
                    {
                        Category = "📊 Boletos",
                        Questions = new List<string>
                        {
                            "Quantos boletos estão vencidos?",
                            "Qual o valor total de boletos pendentes?",
                            "Mostre os boletos que vencem esta semana"
                        }
                    },
                    new SuggestionCategory
                    {
                        Category = "👥 Clientes",
                        Questions = new List<string>
                        {
                            "Quantos clientes ativos temos?",
                            "Quais clientes têm maior inadimplência?",
                            "Liste os novos clientes do mês"
                        }
                    },
                    new SuggestionCategory
                    {
                        Category = "📄 Contratos",
                        Questions = new List<string>
                        {
                            "Quantos contratos ativos existem?",
                            "Qual o valor total negociado?",
                            "Contratos que vencem nos próximos 30 dias"
                        }
                    },
                    new SuggestionCategory
                    {
                        Category = "💰 Financeiro",
                        Questions = new List<string>
                        {
                            "Qual o faturamento do mês?",
                            "Resumo da inadimplência",
                            "Previsão de recebimentos"
                        }
                    }
                }
            };

            return Task.FromResult(suggestions);
        }

        public async Task<ChatMessageResponse> ProcessMessageAsync(
            ChatMessageRequest request,
            int usuarioId)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                // 1. Detectar intenção e buscar contexto RAG
                var ragContext = await BuildRAGContextAsync(request.Message, usuarioId);

                // 2. Construir mensagens para o modelo
                var messages = BuildChatMessages(request, ragContext);

                // 3. Chamar Azure OpenAI
                var chatClient = _openAIClient.GetChatClient(_openAISettings.DeploymentName);

                var options = new ChatCompletionOptions
                {
                    MaxOutputTokenCount = _openAISettings.MaxTokens,
                    Temperature = _openAISettings.Temperature,
                    TopP = _openAISettings.TopP,
                    FrequencyPenalty = _openAISettings.FrequencyPenalty,
                    PresencePenalty = _openAISettings.PresencePenalty
                };

                var completion = await chatClient.CompleteChatAsync(messages, options);

                stopwatch.Stop();

                return new ChatMessageResponse
                {
                    Message = completion.Value.Content[0].Text,
                    UsedRAG = !string.IsNullOrEmpty(ragContext.ContextText),
                    DataSources = ragContext.DataSources,
                    ProcessingTimeMs = stopwatch.ElapsedMilliseconds,
                    Intent = ragContext.Intent
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar mensagem do chat");
                stopwatch.Stop();

                return new ChatMessageResponse
                {
                    Message = "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.",
                    UsedRAG = false,
                    ProcessingTimeMs = stopwatch.ElapsedMilliseconds
                };
            }
        }

        public async IAsyncEnumerable<StreamChunk> ProcessMessageStreamAsync(
            ChatMessageRequest request,
            int usuarioId,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            // 1. Detectar intenção e buscar contexto RAG
            var ragContext = await BuildRAGContextAsync(request.Message, usuarioId);

            // 2. Construir mensagens para o modelo
            var messages = BuildChatMessages(request, ragContext);

            // 3. Chamar Azure OpenAI com streaming
            var chatClient = _openAIClient.GetChatClient(_openAISettings.DeploymentName);

            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = _openAISettings.MaxTokens,
                Temperature = _openAISettings.Temperature,
                TopP = _openAISettings.TopP,
                FrequencyPenalty = _openAISettings.FrequencyPenalty,
                PresencePenalty = _openAISettings.PresencePenalty
            };

            await foreach (var update in chatClient.CompleteChatStreamingAsync(messages, options, cancellationToken))
            {
                foreach (var contentPart in update.ContentUpdate)
                {
                    if (!string.IsNullOrEmpty(contentPart.Text))
                    {
                        yield return new StreamChunk
                        {
                            Content = contentPart.Text,
                            Done = false
                        };
                    }
                }
            }

            yield return new StreamChunk { Content = "", Done = true };
        }

        #region RAG - Retrieval Augmented Generation

        /// <summary>
        /// Constrói o contexto RAG buscando dados relevantes do banco
        /// </summary>
        private async Task<RAGContext> BuildRAGContextAsync(string userMessage, int usuarioId)
        {
            var context = new RAGContext();
            var sb = new StringBuilder();

            if (!_ragSettings.Enabled)
            {
                return context;
            }

            var messageLower = userMessage.ToLower();

            // Detectar intenção baseado em palavras-chave
            var intent = DetectIntent(messageLower);
            context.Intent = intent;

            try
            {
                switch (intent)
                {
                    case "boletos":
                        await AddBoletosContext(sb, context, messageLower, usuarioId);
                        break;

                    case "clientes":
                        await AddClientesContext(sb, context, messageLower, usuarioId);
                        break;

                    case "contratos":
                        await AddContratosContext(sb, context, messageLower, usuarioId);
                        break;

                    case "financeiro":
                        await AddFinanceiroContext(sb, context, messageLower, usuarioId);
                        break;

                    case "geral":
                    default:
                        // Busca contexto geral resumido
                        await AddResumoGeralContext(sb, context, usuarioId);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao construir contexto RAG para intent: {Intent}", intent);
            }

            context.ContextText = sb.ToString();
            return context;
        }

        /// <summary>
        /// Detecta a intenção do usuário baseado em palavras-chave
        /// </summary>
        private string DetectIntent(string message)
        {
            // Palavras-chave para cada categoria
            var boletoKeywords = new[] { "boleto", "boletos", "vencido", "vencidos", "pago", "pagos", "pendente", "pendentes", "cobrança" };
            var clienteKeywords = new[] { "cliente", "clientes", "pessoa", "empresa", "inadimplente", "cpf", "cnpj" };
            var contratoKeywords = new[] { "contrato", "contratos", "acordo", "negociação", "pasta" };
            var financeiroKeywords = new[] { "faturamento", "receita", "valor", "dinheiro", "financeiro", "inadimplência", "pagamento" };

            if (boletoKeywords.Any(k => message.Contains(k)))
                return "boletos";
            if (clienteKeywords.Any(k => message.Contains(k)))
                return "clientes";
            if (contratoKeywords.Any(k => message.Contains(k)))
                return "contratos";
            if (financeiroKeywords.Any(k => message.Contains(k)))
                return "financeiro";

            return "geral";
        }

        /// <summary>
        /// Adiciona contexto de boletos
        /// </summary>
        private async Task AddBoletosContext(StringBuilder sb, RAGContext context, string message, int usuarioId)
        {
            context.DataSources.Add("Boletos");

            var hoje = DateTime.Today;

            // Estatísticas gerais de boletos
            var totalBoletos = await _context.Boletos.CountAsync();
            var boletosVencidos = await _context.Boletos
                .Where(b => b.DataVencimento < hoje && b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .CountAsync();
            var boletosPagos = await _context.Boletos
                .Where(b => b.Status == "PAGO" || b.Status == "LIQUIDADO")
                .CountAsync();
            var boletosPendentes = await _context.Boletos
                .Where(b => b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .CountAsync();

            var valorVencido = await _context.Boletos
                .Where(b => b.DataVencimento < hoje && b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .SumAsync(b => b.Valor);

            var valorPendente = await _context.Boletos
                .Where(b => b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .SumAsync(b => b.Valor);

            sb.AppendLine("=== DADOS DE BOLETOS ===");
            sb.AppendLine($"Total de boletos: {totalBoletos}");
            sb.AppendLine($"Boletos vencidos: {boletosVencidos} (R$ {valorVencido:N2})");
            sb.AppendLine($"Boletos pendentes: {boletosPendentes} (R$ {valorPendente:N2})");
            sb.AppendLine($"Boletos pagos: {boletosPagos}");

            // Se pergunta sobre boletos específicos que vencem em breve
            if (message.Contains("semana") || message.Contains("próximos"))
            {
                var proximaSemana = hoje.AddDays(7);
                var boletosProximos = await _context.Boletos
                    .Include(b => b.Contrato)
                    .ThenInclude(c => c.Cliente)
                    .Where(b => b.DataVencimento >= hoje &&
                               b.DataVencimento <= proximaSemana &&
                               b.Status != "PAGO" && b.Status != "LIQUIDADO")
                    .OrderBy(b => b.DataVencimento)
                    .Take(10)
                    .ToListAsync();

                sb.AppendLine($"\nBoletos que vencem nos próximos 7 dias ({boletosProximos.Count}):");
                foreach (var boleto in boletosProximos)
                {
                    var clienteNome = boleto.Contrato?.Cliente?.Nome ??
                                     boleto.Contrato?.Cliente?.RazaoSocial ?? "N/A";
                    sb.AppendLine($"- {boleto.NossoNumero}: R$ {boleto.Valor:N2} - Venc: {boleto.DataVencimento:dd/MM/yyyy} - Cliente: {clienteNome}");
                }
            }

            // Top 5 maiores boletos vencidos
            var maioresVencidos = await _context.Boletos
                .Include(b => b.Contrato)
                .ThenInclude(c => c.Cliente)
                .Where(b => b.DataVencimento < hoje && b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .OrderByDescending(b => b.Valor)
                .Take(5)
                .ToListAsync();

            if (maioresVencidos.Any())
            {
                sb.AppendLine("\nTop 5 maiores boletos vencidos:");
                foreach (var boleto in maioresVencidos)
                {
                    var clienteNome = boleto.Contrato?.Cliente?.Nome ??
                                     boleto.Contrato?.Cliente?.RazaoSocial ?? "N/A";
                    var diasAtraso = (hoje - boleto.DataVencimento).Days;
                    sb.AppendLine($"- R$ {boleto.Valor:N2} - {diasAtraso} dias de atraso - Cliente: {clienteNome}");
                }
            }

            context.ExtractedData["totalBoletos"] = totalBoletos;
            context.ExtractedData["boletosVencidos"] = boletosVencidos;
            context.ExtractedData["valorVencido"] = valorVencido;
        }

        /// <summary>
        /// Adiciona contexto de clientes
        /// </summary>
        private async Task AddClientesContext(StringBuilder sb, RAGContext context, string message, int usuarioId)
        {
            context.DataSources.Add("Clientes");

            var totalClientes = await _context.Clientes.CountAsync();
            var clientesPF = await _context.Clientes.Where(c => c.TipoPessoa == "PF").CountAsync();
            var clientesPJ = await _context.Clientes.Where(c => c.TipoPessoa == "PJ").CountAsync();

            sb.AppendLine("=== DADOS DE CLIENTES ===");
            sb.AppendLine($"Total de clientes: {totalClientes}");
            sb.AppendLine($"Pessoas Físicas: {clientesPF}");
            sb.AppendLine($"Pessoas Jurídicas: {clientesPJ}");

            // Clientes com mais inadimplência
            if (message.Contains("inadimpl") || message.Contains("devedor"))
            {
                context.DataSources.Add("Boletos");

                var clientesInadimplentes = await _context.Boletos
                    .Include(b => b.Contrato)
                    .ThenInclude(c => c.Cliente)
                    .Where(b => b.DataVencimento < DateTime.Today &&
                               b.Status != "PAGO" && b.Status != "LIQUIDADO")
                    .GroupBy(b => b.Contrato.ClienteId)
                    .Select(g => new
                    {
                        ClienteId = g.Key,
                        TotalDivida = g.Sum(b => b.Valor),
                        QuantidadeBoletos = g.Count(),
                        Cliente = g.First().Contrato.Cliente
                    })
                    .OrderByDescending(x => x.TotalDivida)
                    .Take(10)
                    .ToListAsync();

                sb.AppendLine("\nTop 10 clientes inadimplentes:");
                foreach (var item in clientesInadimplentes)
                {
                    var nome = item.Cliente?.Nome ?? item.Cliente?.RazaoSocial ?? "N/A";
                    sb.AppendLine($"- {nome}: R$ {item.TotalDivida:N2} ({item.QuantidadeBoletos} boletos)");
                }
            }

            // Novos clientes do mês
            if (message.Contains("novo") || message.Contains("mês"))
            {
                var inicioMes = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
                var novosClientes = await _context.Clientes
                    .Where(c => c.DataCadastro >= inicioMes)
                    .OrderByDescending(c => c.DataCadastro)
                    .Take(10)
                    .ToListAsync();

                sb.AppendLine($"\nNovos clientes do mês ({novosClientes.Count}):");
                foreach (var cliente in novosClientes)
                {
                    var nome = cliente.Nome ?? cliente.RazaoSocial ?? "N/A";
                    sb.AppendLine($"- {nome} - Cadastrado em: {cliente.DataCadastro:dd/MM/yyyy}");
                }
            }

            context.ExtractedData["totalClientes"] = totalClientes;
        }

        /// <summary>
        /// Adiciona contexto de contratos
        /// </summary>
        private async Task AddContratosContext(StringBuilder sb, RAGContext context, string message, int usuarioId)
        {
            context.DataSources.Add("Contratos");

            var totalContratos = await _context.Contratos.CountAsync();
            var contratosAtivos = await _context.Contratos
                .Where(c => c.Status == "ATIVO" || c.Status == "EM_ANDAMENTO")
                .CountAsync();

            var valorTotalNegociado = await _context.Contratos.SumAsync(c => c.ValorNegociado);
            var valorTotalRecebido = await _context.Contratos.SumAsync(c => c.ValorRecebido);

            sb.AppendLine("=== DADOS DE CONTRATOS ===");
            sb.AppendLine($"Total de contratos: {totalContratos}");
            sb.AppendLine($"Contratos ativos: {contratosAtivos}");
            sb.AppendLine($"Valor total negociado: R$ {valorTotalNegociado:N2}");
            sb.AppendLine($"Valor total recebido: R$ {valorTotalRecebido:N2}");
            sb.AppendLine($"Percentual recebido: {(valorTotalNegociado > 0 ? (valorTotalRecebido / valorTotalNegociado * 100) : 0):N1}%");

            // Contratos que vencem em breve
            if (message.Contains("venc") || message.Contains("próximos"))
            {
                var proximos30Dias = DateTime.Today.AddDays(30);
                var contratosVencendo = await _context.Contratos
                    .Include(c => c.Cliente)
                    .Where(c => c.DataFim >= DateTime.Today && c.DataFim <= proximos30Dias)
                    .OrderBy(c => c.DataFim)
                    .Take(10)
                    .ToListAsync();

                sb.AppendLine($"\nContratos que vencem nos próximos 30 dias ({contratosVencendo.Count}):");
                foreach (var contrato in contratosVencendo)
                {
                    var clienteNome = contrato.Cliente?.Nome ?? contrato.Cliente?.RazaoSocial ?? "N/A";
                    sb.AppendLine($"- Pasta {contrato.NumeroPasta}: R$ {contrato.ValorNegociado:N2} - Venc: {contrato.DataFim:dd/MM/yyyy} - Cliente: {clienteNome}");
                }
            }

            context.ExtractedData["totalContratos"] = totalContratos;
            context.ExtractedData["valorNegociado"] = valorTotalNegociado;
        }

        /// <summary>
        /// Adiciona contexto financeiro
        /// </summary>
        private async Task AddFinanceiroContext(StringBuilder sb, RAGContext context, string message, int usuarioId)
        {
            context.DataSources.Add("Boletos");
            context.DataSources.Add("Contratos");

            var hoje = DateTime.Today;
            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
            var fimMes = inicioMes.AddMonths(1).AddDays(-1);

            // Faturamento do mês (boletos pagos)
            var faturamentoMes = await _context.Boletos
                .Where(b => (b.Status == "PAGO" || b.Status == "LIQUIDADO") &&
                           b.DataPagamento >= inicioMes && b.DataPagamento <= fimMes)
                .SumAsync(b => b.ValorPago ?? b.Valor);

            // Previsão de recebimentos (boletos pendentes)
            var previsaoRecebimentos = await _context.Boletos
                .Where(b => b.Status != "PAGO" && b.Status != "LIQUIDADO" &&
                           b.DataVencimento >= hoje && b.DataVencimento <= fimMes)
                .SumAsync(b => b.Valor);

            // Total inadimplência
            var inadimplencia = await _context.Boletos
                .Where(b => b.DataVencimento < hoje && b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .SumAsync(b => b.Valor);

            sb.AppendLine("=== DADOS FINANCEIROS ===");
            sb.AppendLine($"Faturamento do mês atual: R$ {faturamentoMes:N2}");
            sb.AppendLine($"Previsão de recebimentos (até fim do mês): R$ {previsaoRecebimentos:N2}");
            sb.AppendLine($"Total inadimplência: R$ {inadimplencia:N2}");

            // Comparativo com mês anterior
            var inicioMesAnterior = inicioMes.AddMonths(-1);
            var fimMesAnterior = inicioMes.AddDays(-1);

            var faturamentoMesAnterior = await _context.Boletos
                .Where(b => (b.Status == "PAGO" || b.Status == "LIQUIDADO") &&
                           b.DataPagamento >= inicioMesAnterior && b.DataPagamento <= fimMesAnterior)
                .SumAsync(b => b.ValorPago ?? b.Valor);

            var variacao = faturamentoMesAnterior > 0
                ? ((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior * 100)
                : 0;

            sb.AppendLine($"\nComparativo:");
            sb.AppendLine($"Faturamento mês anterior: R$ {faturamentoMesAnterior:N2}");
            sb.AppendLine($"Variação: {(variacao >= 0 ? "+" : "")}{variacao:N1}%");

            context.ExtractedData["faturamentoMes"] = faturamentoMes;
            context.ExtractedData["inadimplencia"] = inadimplencia;
        }

        /// <summary>
        /// Adiciona resumo geral
        /// </summary>
        private async Task AddResumoGeralContext(StringBuilder sb, RAGContext context, int usuarioId)
        {
            context.DataSources.Add("Resumo Geral");

            var hoje = DateTime.Today;

            var totalClientes = await _context.Clientes.CountAsync();
            var totalContratos = await _context.Contratos.CountAsync();
            var totalBoletos = await _context.Boletos.CountAsync();
            var boletosVencidos = await _context.Boletos
                .Where(b => b.DataVencimento < hoje && b.Status != "PAGO" && b.Status != "LIQUIDADO")
                .CountAsync();

            sb.AppendLine("=== RESUMO GERAL DO CRM ===");
            sb.AppendLine($"Total de clientes: {totalClientes}");
            sb.AppendLine($"Total de contratos: {totalContratos}");
            sb.AppendLine($"Total de boletos: {totalBoletos}");
            sb.AppendLine($"Boletos vencidos: {boletosVencidos}");
            sb.AppendLine($"Data de referência: {hoje:dd/MM/yyyy}");
        }

        #endregion

        #region Helpers

        /// <summary>
        /// Constrói as mensagens do chat incluindo system prompt e contexto RAG
        /// </summary>
        private List<ChatMessage> BuildChatMessages(ChatMessageRequest request, RAGContext ragContext)
        {
            var messages = new List<ChatMessage>();

            // System Prompt otimizado
            var systemPrompt = BuildSystemPrompt(ragContext);
            messages.Add(new SystemChatMessage(systemPrompt));

            // Adiciona histórico (se houver)
            if (request.History != null && request.History.Any())
            {
                var historyToAdd = request.History
                    .TakeLast(_ragSettings.MaxHistoryMessages)
                    .ToList();

                foreach (var historyMsg in historyToAdd)
                {
                    if (historyMsg.Role == "user")
                        messages.Add(new UserChatMessage(historyMsg.Content));
                    else
                        messages.Add(new AssistantChatMessage(historyMsg.Content));
                }
            }

            // Adiciona mensagem atual do usuário
            messages.Add(new UserChatMessage(request.Message));

            return messages;
        }

        /// <summary>
        /// Constrói o System Prompt otimizado com contexto RAG
        /// </summary>
        private string BuildSystemPrompt(RAGContext ragContext)
        {
            var sb = new StringBuilder();

            sb.AppendLine(@"Você é o Assistente I.A. Arrighi, um assistente virtual especializado do CRM JURÍDICO Arrighi.

## Sua Identidade
- Nome: Assistente I.A. Arrighi
- Função: Auxiliar advogados, consultores e funcionários do escritório Arrighi
- Especialidade: Gestão de contratos jurídicos, cobranças e relacionamento com clientes

## Suas Capacidades
- Consultar dados reais de contratos, boletos, clientes e faturamento
- Fornecer análises e insights sobre a carteira de clientes
- Ajudar com dúvidas sobre procedimentos do escritório
- Sugerir ações para melhorar a recuperação de créditos

## Regras de Comportamento
1. Seja CONCISO e DIRETO nas respostas
2. Use linguagem profissional mas acessível
3. Formate números como moeda brasileira (R$) quando apropriado
4. Cite a fonte dos dados quando disponível
5. Se não souber algo, admita claramente
6. Sugira ações práticas quando relevante

## Formatação
- Use markdown para melhor legibilidade
- Use listas numeradas para passos ou rankings
- Use bullet points para informações relacionadas
- Destaque valores importantes em **negrito**");

            // Adiciona contexto RAG se disponível
            if (!string.IsNullOrEmpty(ragContext.ContextText))
            {
                sb.AppendLine();
                sb.AppendLine("## Dados Atuais do Sistema (use para responder)");
                sb.AppendLine("```");
                sb.AppendLine(ragContext.ContextText);
                sb.AppendLine("```");
                sb.AppendLine();
                sb.AppendLine("IMPORTANTE: Use APENAS os dados fornecidos acima para responder. Se a pergunta não puder ser respondida com esses dados, informe educadamente.");
            }

            return sb.ToString();
        }

        #endregion
    }
}
```

---

## 5. Controller

### ChatController.cs

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using ArrighiCRM.API.Models.Chat;
using ArrighiCRM.API.Services.Interfaces;

namespace ArrighiCRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(
            IChatService chatService,
            ILogger<ChatController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        /// <summary>
        /// Retorna o status do chat e configurações
        /// </summary>
        [HttpGet("status")]
        public async Task<ActionResult<ChatStatusResponse>> GetStatus()
        {
            var status = await _chatService.GetStatusAsync();
            return Ok(status);
        }

        /// <summary>
        /// Retorna sugestões de perguntas
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<ActionResult<ChatSuggestionsResponse>> GetSuggestions()
        {
            var suggestions = await _chatService.GetSuggestionsAsync();
            return Ok(suggestions);
        }

        /// <summary>
        /// Processa uma mensagem do usuário (modo tradicional)
        /// </summary>
        [HttpPost("message")]
        public async Task<ActionResult<ChatMessageResponse>> ProcessMessage(
            [FromBody] ChatMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "Mensagem não pode estar vazia" });
            }

            var usuarioId = GetUsuarioId();
            var response = await _chatService.ProcessMessageAsync(request, usuarioId);
            return Ok(response);
        }

        /// <summary>
        /// Processa uma mensagem do usuário com streaming (SSE)
        /// </summary>
        [HttpPost("message/stream")]
        public async Task StreamMessage([FromBody] ChatMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                Response.StatusCode = 400;
                await Response.WriteAsync("Mensagem não pode estar vazia");
                return;
            }

            Response.Headers.Append("Content-Type", "text/event-stream");
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            var usuarioId = GetUsuarioId();

            try
            {
                await foreach (var chunk in _chatService.ProcessMessageStreamAsync(request, usuarioId))
                {
                    var data = System.Text.Json.JsonSerializer.Serialize(chunk);
                    await Response.WriteAsync($"data: {data}\n\n");
                    await Response.Body.FlushAsync();

                    if (chunk.Done)
                    {
                        await Response.WriteAsync("data: [DONE]\n\n");
                        await Response.Body.FlushAsync();
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro durante streaming de mensagem");
                var errorChunk = new StreamChunk
                {
                    Content = "Erro ao processar mensagem.",
                    Done = true
                };
                var errorData = System.Text.Json.JsonSerializer.Serialize(errorChunk);
                await Response.WriteAsync($"data: {errorData}\n\n");
                await Response.WriteAsync("data: [DONE]\n\n");
                await Response.Body.FlushAsync();
            }
        }

        private int GetUsuarioId()
        {
            var userIdClaim = User.FindFirst("UsuarioId")?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            // Tentar obter do header
            if (Request.Headers.TryGetValue("X-Usuario-Id", out var headerValue) &&
                int.TryParse(headerValue, out var headerUserId))
            {
                return headerUserId;
            }

            return 0;
        }
    }
}
```

---

## 6. System Prompt Otimizado

O System Prompt está incluído no `ChatService.cs` no método `BuildSystemPrompt()`. Principais características:

### ✅ Pontos Fortes do System Prompt

1. **Identidade Clara**: Define nome, função e especialidade
2. **Capacidades Definidas**: Lista o que a IA pode fazer
3. **Regras de Comportamento**: Define como a IA deve responder
4. **Formatação Padronizada**: Instruções para usar markdown
5. **Contexto Dinâmico**: Injeta dados reais do banco quando disponíveis
6. **Limitação Explícita**: Instrui a usar apenas dados fornecidos

---

## 7. Implementação de Streaming

O streaming usa **Server-Sent Events (SSE)** para enviar chunks da resposta em tempo real.

### Formato do Streaming

```
data: {"content": "Texto ", "done": false}

data: {"content": "parcial ", "done": false}

data: {"content": "da resposta.", "done": false}

data: {"content": "", "done": true}

data: [DONE]
```

### Frontend já preparado

O frontend em `src/components/chat/AssistenteIA.tsx` e `src/lib/api.ts` já estão preparados para consumir o streaming.

---

## 8. Registro de Serviços (Program.cs)

```csharp
// Adicionar no Program.cs

// Configurações
builder.Services.Configure<AzureOpenAISettings>(
    builder.Configuration.GetSection("AzureOpenAI"));
builder.Services.Configure<RAGSettings>(
    builder.Configuration.GetSection("RAG"));

// Serviços
builder.Services.AddScoped<IChatService, ChatService>();
```

---

## 9. Checklist de Implementação

- [ ] Instalar pacotes NuGet
- [ ] Adicionar configurações no `appsettings.json`
- [ ] Criar Models em `Models/Chat/`
- [ ] Criar Interface `IChatService`
- [ ] Criar `ChatService` com RAG
- [ ] Criar `ChatController`
- [ ] Registrar serviços no `Program.cs`
- [ ] Testar endpoint `/api/Chat/status`
- [ ] Testar endpoint `/api/Chat/message`
- [ ] Testar endpoint `/api/Chat/message/stream`
- [ ] Ajustar queries SQL para seu modelo de dados

---

## 10. Notas Importantes

### Ajustes Necessários

1. **Nomes das Entidades**: Ajuste os nomes (`Boletos`, `Clientes`, `Contratos`) para corresponder ao seu DbContext
2. **Propriedades**: Ajuste as propriedades das entidades para corresponder ao seu modelo
3. **Status de Boletos**: Ajuste os valores de status (`PAGO`, `LIQUIDADO`, etc.)

### Boas Práticas

1. **Logging**: Adicione logging adequado para debug
2. **Rate Limiting**: Considere adicionar rate limiting no controller
3. **Caching**: Para queries frequentes, considere implementar cache
4. **Testes**: Crie testes unitários para o ChatService

---

*Documento gerado para implementação do RAG no backend .NET do CRM JURÍDICO Arrighi*
