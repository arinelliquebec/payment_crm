using System.Text;
using System.Runtime.CompilerServices;

namespace CrmArrighi.Services.RAG;

/// <summary>
/// Resultado do processamento RAG
/// </summary>
public class RagResult
{
    public string Query { get; set; } = string.Empty;
    public IntentResult Intent { get; set; } = new();
    public RetrievedContext Context { get; set; } = new();
    public string EnrichedPrompt { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public bool UsedRAG { get; set; }
    public long ProcessingTimeMs { get; set; }
    public List<string> Sources { get; set; } = new();
}

/// <summary>
/// Chunk de streaming RAG
/// </summary>
public class StreamChunk
{
    public string Content { get; set; } = string.Empty;
    public bool Done { get; set; }
    public bool UsedRAG { get; set; }
    public List<string>? DataSources { get; set; }
}

/// <summary>
/// Serviço RAG (Retrieval-Augmented Generation) principal
/// Orquestra a análise de intenção, recuperação de contexto e geração de resposta
/// </summary>
public class RagService : IRagService
{
    private readonly IIntentAnalyzer _intentAnalyzer;
    private readonly IContextRetriever _contextRetriever;
    private readonly IAzureOpenAIService _openAIService;
    private readonly ILogger<RagService> _logger;

    // System prompt base para o assistente com RAG - OTIMIZADO
    private const string RAG_SYSTEM_PROMPT = @"
# Assistente I.A. Arrighi - CRM JURÍDICO

Você é o **Assistente I.A. Arrighi**, assistente virtual inteligente do CRM JURÍDICO Arrighi, especializado em gestão de contratos jurídicos e cobranças para escritórios de advocacia.

## 🎯 Sua Identidade
- **Nome**: Assistente I.A. Arrighi
- **Função**: Auxiliar advogados, consultores e funcionários do escritório Arrighi Advogados
- **Especialidade**: Gestão de contratos jurídicos, cobranças, boletos e relacionamento com clientes
- **Personalidade**: Profissional, preciso, prestativo e proativo

## 🔧 Suas Capacidades
1. **Consultar dados reais** de contratos, boletos, clientes e faturamento
2. **Fornecer análises** e insights sobre a carteira de clientes
3. **Identificar riscos** de inadimplência e sugerir ações
4. **Auxiliar processos** de cobrança e gestão de contratos
5. **Responder dúvidas** sobre procedimentos do escritório

## 📋 Regras de Resposta

### Quando houver DADOS DISPONÍVEIS no contexto:
1. Use os números e informações **EXATOS** fornecidos
2. Apresente dados de forma **clara e organizada**
3. Destaque valores monetários: **R$ X.XXX,XX**
4. Inclua **comparativos** quando relevante (📈 aumento / 📉 queda)
5. **Sugira ações** práticas baseadas nos dados

### Quando NÃO houver dados específicos:
1. Informe que não encontrou dados para a consulta
2. Sugira **onde encontrar** a informação no sistema
3. Pergunte se o usuário quer **refinar** a busca

### Formatação OBRIGATÓRIA:
- Use **markdown** para estruturar respostas
- Use **emojis** para destacar seções: 📊 💰 📋 ⚠️ ✅ 🔴 🟡 🟢
- Organize em **listas** quando houver múltiplos itens
- Destaque **números importantes** em negrito
- Seja **conciso** mas **completo**

## ⚠️ Limitações Importantes
- **NUNCA invente dados** - use apenas o contexto fornecido
- **NUNCA faça cálculos** sem os dados base corretos
- **NUNCA prometa** funcionalidades inexistentes
- Se não souber, **admita claramente**

## 📚 Sobre o Sistema CRM JURÍDICO Arrighi

### Módulos Principais:
- **Dashboard**: Métricas, KPIs, alertas e visão geral
- **Clientes**: Cadastro PF/PJ, histórico, documentos
- **Contratos**: Gestão de pastas, situações, valores negociados
- **Boletos**: Integração Santander, Pix, cobrança automática
- **Financeiro**: Faturamento, comissões, inadimplência
- **Pipeline**: Gestão de leads e prospectos

### Integrações:
- **Santander Cobrança API**: Emissão de boletos com Pix
- **Azure Blob Storage**: Armazenamento de documentos
- **Email (Resend)**: Envio automático de boletos

### Situações de Contrato:
- Lead → Prospecto → Contrato Enviado → Contrato Assinado → Em Andamento → Concluído

### Status de Boletos:
- Pendente → Registrado → Liquidado/Pago | Vencido | Baixado
";

    public RagService(
        IIntentAnalyzer intentAnalyzer,
        IContextRetriever contextRetriever,
        IAzureOpenAIService openAIService,
        ILogger<RagService> logger)
    {
        _intentAnalyzer = intentAnalyzer;
        _contextRetriever = contextRetriever;
        _openAIService = openAIService;
        _logger = logger;
    }

    /// <summary>
    /// Processa uma pergunta usando RAG completo
    /// </summary>
    public async Task<RagResult> ProcessQueryAsync(string query, int? usuarioId = null)
    {
        var startTime = DateTime.UtcNow;
        var result = new RagResult { Query = query };

        try
        {
            _logger.LogInformation("🚀 RAG: Iniciando processamento da query: {Query}", query);

            // 1. Analisar intenção
            _logger.LogInformation("🔍 RAG: Etapa 1 - Análise de intenção");
            result.Intent = _intentAnalyzer.Analyze(query);

            // 2. Verificar se precisa buscar dados
            if (result.Intent.RequiresDataLookup)
            {
                _logger.LogInformation("📚 RAG: Etapa 2 - Recuperação de contexto (intenção: {Intent})",
                    result.Intent.PrimaryIntent);

                result.Context = await _contextRetriever.RetrieveAsync(result.Intent);
                result.UsedRAG = true;
                result.Sources.Add(result.Context.DataSource);

                _logger.LogInformation("✅ RAG: Contexto recuperado - {Chunks} chunks, {Records} registros",
                    result.Context.Chunks.Count, result.Context.TotalRecords);
            }
            else
            {
                _logger.LogInformation("ℹ️ RAG: Pergunta não requer busca de dados - usando conhecimento base");
                result.UsedRAG = false;
            }

            // 3. Construir prompt enriquecido
            _logger.LogInformation("🔧 RAG: Etapa 3 - Construindo prompt enriquecido");
            result.EnrichedPrompt = BuildEnrichedPrompt(query, result.Context, result.Intent);

            // 4. Gerar resposta com Azure OpenAI
            _logger.LogInformation("🤖 RAG: Etapa 4 - Gerando resposta com Azure OpenAI");
            result.Response = await _openAIService.GenerateResponseAsync(
                result.EnrichedPrompt,
                RAG_SYSTEM_PROMPT
            );

            // Calcular tempo de processamento
            result.ProcessingTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;

            _logger.LogInformation("✅ RAG: Processamento concluído em {Time}ms (UsedRAG: {UsedRAG})",
                result.ProcessingTimeMs, result.UsedRAG);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ RAG: Erro no processamento");
            result.ProcessingTimeMs = (long)(DateTime.UtcNow - startTime).TotalMilliseconds;
            result.Response = "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.";
            return result;
        }
    }

    /// <summary>
    /// Processa pergunta simples sem RAG (fallback)
    /// </summary>
    public async Task<string> ProcessSimpleQueryAsync(string query)
    {
        return await _openAIService.GenerateResponseAsync(query, RAG_SYSTEM_PROMPT);
    }

    /// <summary>
    /// Constrói o prompt enriquecido com contexto
    /// </summary>
    private string BuildEnrichedPrompt(string query, RetrievedContext context, IntentResult intent)
    {
        var sb = new StringBuilder();

        // Adicionar contexto de dados se disponível
        if (context.Chunks.Any())
        {
            sb.AppendLine("## DADOS DO SISTEMA (use essas informações para responder)");
            sb.AppendLine();

            // Ordenar chunks por relevância
            var sortedChunks = context.Chunks.OrderByDescending(c => c.Relevance).ToList();

            foreach (var chunk in sortedChunks)
            {
                sb.AppendLine(chunk.Content);
                sb.AppendLine();
            }

            sb.AppendLine("---");
            sb.AppendLine();
        }

        // Adicionar informações sobre entidades extraídas
        if (intent.ExtractedEntities.Any())
        {
            sb.AppendLine("## FILTROS/ENTIDADES IDENTIFICADOS NA PERGUNTA:");
            foreach (var entity in intent.ExtractedEntities)
            {
                sb.AppendLine($"- {entity.Key}: {entity.Value}");
            }
            sb.AppendLine();
        }

        // Adicionar a pergunta do usuário
        sb.AppendLine("## PERGUNTA DO USUÁRIO:");
        sb.AppendLine(query);
        sb.AppendLine();

        // Adicionar instruções específicas baseadas na intenção
        sb.AppendLine("## INSTRUÇÕES:");
        sb.AppendLine(GetIntentSpecificInstructions(intent.PrimaryIntent));

        return sb.ToString();
    }

    /// <summary>
    /// Retorna instruções específicas baseadas na intenção
    /// </summary>
    private string GetIntentSpecificInstructions(IntentType intent)
    {
        return intent switch
        {
            IntentType.ConsultaBoletos =>
                "Responda sobre boletos usando os dados fornecidos. Destaque valores vencidos e status importantes.",

            IntentType.ConsultaClientes =>
                "Responda sobre clientes usando os dados fornecidos. Inclua informações sobre distribuição por tipo e filial.",

            IntentType.ConsultaContratos =>
                "Responda sobre contratos usando os dados fornecidos. Destaque situações e valores negociados.",

            IntentType.ConsultaFaturamento =>
                "Responda sobre faturamento usando os dados fornecidos. Compare períodos e destaque tendências.",

            IntentType.ConsultaInadimplencia =>
                "Responda sobre inadimplência usando os dados fornecidos. Destaque riscos e principais devedores.",

            IntentType.ConsultaComissoes =>
                "Responda sobre comissões usando os dados fornecidos. Inclua distribuição por parceiros.",

            IntentType.ConsultaConsultores =>
                "Responda sobre consultores usando os dados fornecidos. Destaque performance e ranking.",

            IntentType.ConsultaFiliais =>
                "Responda sobre filiais usando os dados fornecidos. Compare performance entre unidades.",

            IntentType.EstatisticasGerais or IntentType.EstatisticasMensais or IntentType.EstatisticasAnuais =>
                "Apresente as estatísticas de forma organizada. Use comparativos quando disponíveis.",

            IntentType.Comparativos =>
                "Destaque as diferenças entre períodos. Use setas (📈/📉) para indicar tendências.",

            IntentType.ProcessoBoleto or IntentType.ProcessoContrato or IntentType.ProcessoCliente =>
                "Explique o processo passo a passo. Indique onde encontrar a funcionalidade no menu.",

            IntentType.AjudaSistema =>
                "Forneça instruções claras sobre como usar o sistema. Seja didático.",

            _ => "Responda de forma clara e objetiva baseado nas informações disponíveis."
        };
    }

    /// <summary>
    /// Verifica se o serviço está configurado e funcionando
    /// </summary>
    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            // Testar análise de intenção
            var intent = _intentAnalyzer.Analyze("teste");
            if (intent == null) return false;

            // Testar OpenAI (se configurado)
            var isConfigured = await _openAIService.IsConfiguredAsync();
            return isConfigured;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Processa uma pergunta usando RAG com streaming
    /// </summary>
    public async IAsyncEnumerable<StreamChunk> ProcessQueryStreamAsync(
        string query,
        int? usuarioId = null,
        List<ChatMessage>? history = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("🚀 RAG Stream: Iniciando processamento da query: {Query}", query);

        // 1. Analisar intenção
        var intent = _intentAnalyzer.Analyze(query);
        RetrievedContext context = new();
        var sources = new List<string>();
        var usedRAG = false;

        // 2. Verificar se precisa buscar dados
        if (intent.RequiresDataLookup)
        {
            _logger.LogInformation("📚 RAG Stream: Recuperando contexto (intenção: {Intent})", intent.PrimaryIntent);
            context = await _contextRetriever.RetrieveAsync(intent);
            usedRAG = true;
            sources.Add(context.DataSource);
        }

        // 3. Construir prompt enriquecido com histórico
        var enrichedPrompt = BuildEnrichedPromptWithHistory(query, context, intent, history);

        // 4. Gerar resposta com streaming
        _logger.LogInformation("🤖 RAG Stream: Iniciando streaming com Azure OpenAI");

        await foreach (var chunk in _openAIService.GenerateResponseStreamAsync(
            enrichedPrompt,
            RAG_SYSTEM_PROMPT,
            history,
            cancellationToken))
        {
            yield return new StreamChunk
            {
                Content = chunk,
                Done = false,
                UsedRAG = usedRAG,
                DataSources = sources
            };
        }

        // Chunk final
        yield return new StreamChunk
        {
            Content = "",
            Done = true,
            UsedRAG = usedRAG,
            DataSources = sources
        };

        _logger.LogInformation("✅ RAG Stream: Streaming concluído");
    }

    /// <summary>
    /// Constrói o prompt enriquecido com histórico de conversa
    /// </summary>
    private string BuildEnrichedPromptWithHistory(
        string query,
        RetrievedContext context,
        IntentResult intent,
        List<ChatMessage>? history)
    {
        var sb = new StringBuilder();

        // Adicionar contexto de dados se disponível
        if (context.Chunks.Any())
        {
            sb.AppendLine("## 📊 DADOS ATUAIS DO SISTEMA (use essas informações para responder)");
            sb.AppendLine();

            var sortedChunks = context.Chunks.OrderByDescending(c => c.Relevance).ToList();
            foreach (var chunk in sortedChunks)
            {
                sb.AppendLine(chunk.Content);
                sb.AppendLine();
            }

            sb.AppendLine("---");
            sb.AppendLine();
        }

        // Adicionar informações sobre entidades extraídas
        if (intent.ExtractedEntities.Any())
        {
            sb.AppendLine("## 🔍 FILTROS IDENTIFICADOS NA PERGUNTA:");
            foreach (var entity in intent.ExtractedEntities)
            {
                sb.AppendLine($"- **{entity.Key}**: {entity.Value}");
            }
            sb.AppendLine();
        }

        // Adicionar resumo do histórico se disponível
        if (history != null && history.Any())
        {
            sb.AppendLine("## 💬 CONTEXTO DA CONVERSA ANTERIOR:");
            var recentHistory = history.TakeLast(6).ToList(); // Últimas 3 trocas
            foreach (var msg in recentHistory)
            {
                var roleEmoji = msg.Role == "user" ? "👤" : "🤖";
                var preview = msg.Content.Length > 100
                    ? msg.Content.Substring(0, 100) + "..."
                    : msg.Content;
                sb.AppendLine($"{roleEmoji} {preview}");
            }
            sb.AppendLine();
        }

        // Adicionar a pergunta do usuário
        sb.AppendLine("## ❓ PERGUNTA ATUAL DO USUÁRIO:");
        sb.AppendLine(query);
        sb.AppendLine();

        // Adicionar instruções específicas baseadas na intenção
        sb.AppendLine("## 📝 INSTRUÇÕES ESPECÍFICAS:");
        sb.AppendLine(GetIntentSpecificInstructions(intent.PrimaryIntent));

        return sb.ToString();
    }
}

/// <summary>
/// Interface para o serviço RAG
/// </summary>
public interface IRagService
{
    Task<RagResult> ProcessQueryAsync(string query, int? usuarioId = null);
    Task<string> ProcessSimpleQueryAsync(string query);
    Task<bool> IsHealthyAsync();
    IAsyncEnumerable<StreamChunk> ProcessQueryStreamAsync(
        string query,
        int? usuarioId = null,
        List<ChatMessage>? history = null,
        CancellationToken cancellationToken = default);
}
