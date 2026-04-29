using System.Text;
using System.Text.Json;
using System.Runtime.CompilerServices;

namespace CrmArrighi.Services
{
    public interface IAzureOpenAIService
    {
        Task<string> GetChatResponseAsync(string userMessage, string? userId = null);
        Task<string> GetChatResponseWithHistoryAsync(List<ChatMessage> messages, string? userId = null);

        /// <summary>
        /// Gera resposta com system prompt customizado (usado pelo RAG)
        /// </summary>
        Task<string> GenerateResponseAsync(string userMessage, string customSystemPrompt);

        /// <summary>
        /// Gera resposta com streaming (usado pelo RAG)
        /// </summary>
        IAsyncEnumerable<string> GenerateResponseStreamAsync(
            string userMessage,
            string customSystemPrompt,
            List<ChatMessage>? history = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Verifica se o serviço está configurado
        /// </summary>
        Task<bool> IsConfiguredAsync();
    }

    public class ChatMessage
    {
        public string Role { get; set; } = "user"; // "system", "user", "assistant"
        public string Content { get; set; } = "";
    }

    public class AzureOpenAIService : IAzureOpenAIService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AzureOpenAIService> _logger;
        private readonly IConfiguration _configuration;

        private readonly string _endpoint;
        private readonly string _apiKey;
        private readonly string _deploymentName;
        private readonly string _apiVersion;

        // System prompt com contexto sobre o CRM Arrighi
        private const string SystemPrompt = @"
Você é o Assistente Virtual do CRM Arrighi, um sistema de gestão para escritórios de advocacia.

## Sobre o Sistema:
- **CRM Arrighi** é uma plataforma completa para gestão de clientes, contratos, boletos e leads
- Desenvolvido especificamente para escritórios de advocacia
- Possui integração com Santander para geração de boletos bancários
- Armazena contratos no Azure Blob Storage

## Funcionalidades Principais:

### 📋 Gestão de Clientes
- Cadastro de Pessoa Física e Jurídica
- Histórico completo de interações
- Busca por CPF/CNPJ

### 📄 Contratos
- Criação e gestão de contratos
- Upload de documentos (PDF)
- Situações: Leed, Prospecto, Contrato Enviado, Contrato Assinado
- Campos: Valor Negociado, Comissão, Parcelas, Data de Fechamento

### 💰 Boletos
- Integração com Santander Cobrança API
- Geração de boletos individuais ou em lote
- Status: Pendente, Registrado, Liquidado, Vencido, Baixado
- Sincronização automática com o banco

### 📊 Dashboard
- Métricas de receita (baseada em boletos pagos)
- Contratos por situação
- Alertas de contatos pendentes
- Health status do sistema

### 🎯 Pipeline (Leads)
- Gestão de leads por etapas
- Acompanhamento de prospectos
- Histórico de interações

### 👥 Usuários e Permissões
- Grupos de acesso configuráveis
- Permissões por módulo
- Sessões ativas

## Instruções:
1. Responda APENAS sobre funcionalidades do CRM Arrighi
2. Seja claro e objetivo
3. Use exemplos práticos quando possível
4. Se não souber algo específico, sugira contatar o suporte
5. Responda sempre em português brasileiro
6. Use emojis para tornar as respostas mais amigáveis
";

        public AzureOpenAIService(
            HttpClient httpClient,
            ILogger<AzureOpenAIService> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;

            _endpoint = (configuration["AzureOpenAI:Endpoint"] ?? "").TrimEnd('/');
            _apiKey = configuration["AzureOpenAI:ApiKey"] ?? "";
            _deploymentName = configuration["AzureOpenAI:DeploymentName"] ?? "gpt-4o-mini";
            _apiVersion = configuration["AzureOpenAI:ApiVersion"] ?? "2024-08-01-preview";

            if (!string.IsNullOrEmpty(_apiKey))
            {
                _httpClient.DefaultRequestHeaders.Add("api-key", _apiKey);
            }
        }

        public async Task<string> GetChatResponseAsync(string userMessage, string? userId = null)
        {
            var messages = new List<ChatMessage>
            {
                new() { Role = "system", Content = SystemPrompt },
                new() { Role = "user", Content = userMessage }
            };

            return await GetChatResponseWithHistoryAsync(messages, userId);
        }

        public async Task<string> GetChatResponseWithHistoryAsync(List<ChatMessage> messages, string? userId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(_endpoint) || string.IsNullOrEmpty(_apiKey))
                {
                    _logger.LogWarning("Azure OpenAI não configurado. Endpoint ou ApiKey ausente.");
                    return "⚠️ O assistente de IA não está configurado. Por favor, configure as credenciais do Azure OpenAI nas variáveis de ambiente.";
                }

                // Garantir que o system prompt está no início
                var allMessages = new List<ChatMessage>();
                if (!messages.Any(m => m.Role == "system"))
                {
                    allMessages.Add(new ChatMessage { Role = "system", Content = SystemPrompt });
                }
                allMessages.AddRange(messages);

                var requestBody = new
                {
                    messages = allMessages.Select(m => new { role = m.Role, content = m.Content }),
                    max_completion_tokens = 1000
                };

                var url = $"{_endpoint}/openai/deployments/{_deploymentName}/chat/completions?api-version={_apiVersion}";

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("🤖 Azure OpenAI URL: {Url}", url);
                _logger.LogInformation("🤖 Enviando requisição para Azure OpenAI. UserId: {UserId}", userId);
                Console.WriteLine($"🤖 Azure OpenAI URL: {url}");

                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Erro na API Azure OpenAI: {StatusCode} - {Response}",
                        response.StatusCode, responseJson);
                    _logger.LogError("❌ URL chamada: {Url}", url);
                    _logger.LogError("❌ Request body: {Body}", json);

                    // Tentar extrair mensagem de erro do JSON
                    try
                    {
                        using var errorDoc = JsonDocument.Parse(responseJson);
                        if (errorDoc.RootElement.TryGetProperty("error", out var errorObj) &&
                            errorObj.TryGetProperty("message", out var errorMsg))
                        {
                            return $"❌ Erro do Azure OpenAI: {errorMsg.GetString()}";
                        }
                    }
                    catch { }

                    return $"❌ Erro ao processar sua pergunta. Por favor, tente novamente. (Erro: {response.StatusCode})";
                }

                using var doc = JsonDocument.Parse(responseJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var message) &&
                        message.TryGetProperty("content", out var contentElement))
                    {
                        var assistantResponse = contentElement.GetString() ?? "";
                        _logger.LogInformation("✅ Resposta recebida do Azure OpenAI");
                        return assistantResponse;
                    }
                }

                _logger.LogWarning("⚠️ Resposta inesperada do Azure OpenAI: {Response}", responseJson);
                return "⚠️ Não consegui processar a resposta. Por favor, tente novamente.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao chamar Azure OpenAI");
                return $"❌ Ocorreu um erro ao processar sua pergunta: {ex.Message}";
            }
        }

        /// <summary>
        /// Gera resposta com system prompt customizado (usado pelo RAG)
        /// </summary>
        public async Task<string> GenerateResponseAsync(string userMessage, string customSystemPrompt)
        {
            var messages = new List<ChatMessage>
            {
                new() { Role = "system", Content = customSystemPrompt },
                new() { Role = "user", Content = userMessage }
            };

            return await SendToAzureOpenAI(messages);
        }

        /// <summary>
        /// Verifica se o serviço está configurado
        /// </summary>
        public Task<bool> IsConfiguredAsync()
        {
            var isConfigured = !string.IsNullOrEmpty(_endpoint) && !string.IsNullOrEmpty(_apiKey);
            return Task.FromResult(isConfigured);
        }

        /// <summary>
        /// Gera resposta com streaming (usado pelo RAG)
        /// </summary>
        public async IAsyncEnumerable<string> GenerateResponseStreamAsync(
            string userMessage,
            string customSystemPrompt,
            List<ChatMessage>? history = null,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrEmpty(_endpoint) || string.IsNullOrEmpty(_apiKey))
            {
                yield return "⚠️ O assistente de IA não está configurado.";
                yield break;
            }

            var messages = new List<ChatMessage>
            {
                new() { Role = "system", Content = customSystemPrompt }
            };

            // Adicionar histórico se disponível
            if (history != null && history.Any())
            {
                // Limitar a 10 mensagens do histórico para não exceder tokens
                var recentHistory = history.TakeLast(10).ToList();
                messages.AddRange(recentHistory);
            }

            // Adicionar mensagem atual
            messages.Add(new ChatMessage { Role = "user", Content = userMessage });

            var requestBody = new
            {
                messages = messages.Select(m => new { role = m.Role, content = m.Content }),
                max_completion_tokens = 2000,
                stream = true,
                temperature = 0.3,
                top_p = 0.9,
                frequency_penalty = 0.3,
                presence_penalty = 0.3
            };

            var url = $"{_endpoint}/openai/deployments/{_deploymentName}/chat/completions?api-version={_apiVersion}";
            var json = JsonSerializer.Serialize(requestBody);

            _logger.LogInformation("🔄 Azure OpenAI Stream: Iniciando requisição");

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
            request.Headers.Add("api-key", _apiKey);

            using var response = await _httpClient.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("❌ Azure OpenAI Stream Error: {Status} - {Error}",
                    response.StatusCode, errorContent);
                yield return $"❌ Erro ao processar: {response.StatusCode}";
                yield break;
            }

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);

                if (string.IsNullOrEmpty(line))
                    continue;

                if (!line.StartsWith("data: "))
                    continue;

                var data = line.Substring(6);

                if (data == "[DONE]")
                    break;

                // Extrair texto fora do try/catch para poder usar yield
                var extractedText = ExtractTextFromStreamChunk(data);
                if (!string.IsNullOrEmpty(extractedText))
                {
                    yield return extractedText;
                }
            }

            _logger.LogInformation("✅ Azure OpenAI Stream: Concluído");
        }

        /// <summary>
        /// Extrai texto de um chunk de streaming (separado para evitar yield dentro de try/catch)
        /// </summary>
        private string? ExtractTextFromStreamChunk(string data)
        {
            try
            {
                using var doc = JsonDocument.Parse(data);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) &&
                    choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("delta", out var delta) &&
                        delta.TryGetProperty("content", out var content))
                    {
                        return content.GetString();
                    }
                }
            }
            catch (JsonException)
            {
                // Ignorar linhas que não são JSON válido
            }
            return null;
        }

        /// <summary>
        /// Método interno para enviar requisição ao Azure OpenAI
        /// </summary>
        private async Task<string> SendToAzureOpenAI(List<ChatMessage> messages)
        {
            try
            {
                if (string.IsNullOrEmpty(_endpoint) || string.IsNullOrEmpty(_apiKey))
                {
                    _logger.LogWarning("Azure OpenAI não configurado. Endpoint ou ApiKey ausente.");
                    return "⚠️ O assistente de IA não está configurado. Por favor, configure as credenciais do Azure OpenAI nas variáveis de ambiente.";
                }

                var requestBody = new
                {
                    messages = messages.Select(m => new { role = m.Role, content = m.Content }),
                    max_completion_tokens = 2000 // Aumentado para RAG
                };

                var url = $"{_endpoint}/openai/deployments/{_deploymentName}/chat/completions?api-version={_apiVersion}";

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("🤖 Azure OpenAI (RAG) URL: {Url}", url);

                var response = await _httpClient.PostAsync(url, content);
                var responseJson = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ Erro na API Azure OpenAI: {StatusCode} - {Response}",
                        response.StatusCode, responseJson);

                    try
                    {
                        using var errorDoc = JsonDocument.Parse(responseJson);
                        if (errorDoc.RootElement.TryGetProperty("error", out var errorObj) &&
                            errorObj.TryGetProperty("message", out var errorMsg))
                        {
                            return $"❌ Erro do Azure OpenAI: {errorMsg.GetString()}";
                        }
                    }
                    catch { }

                    return $"❌ Erro ao processar sua pergunta. Por favor, tente novamente. (Erro: {response.StatusCode})";
                }

                using var doc = JsonDocument.Parse(responseJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var message) &&
                        message.TryGetProperty("content", out var contentElement))
                    {
                        var assistantResponse = contentElement.GetString() ?? "";
                        _logger.LogInformation("✅ Resposta RAG recebida do Azure OpenAI");
                        return assistantResponse;
                    }
                }

                _logger.LogWarning("⚠️ Resposta inesperada do Azure OpenAI: {Response}", responseJson);
                return "⚠️ Não consegui processar a resposta. Por favor, tente novamente.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Erro ao chamar Azure OpenAI (RAG)");
                return $"❌ Ocorreu um erro ao processar sua pergunta: {ex.Message}";
            }
        }
    }
}

