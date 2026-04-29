using System.Text.RegularExpressions;

namespace CrmArrighi.Services.RAG;

/// <summary>
/// Tipos de intenção que o sistema pode identificar
/// </summary>
public enum IntentType
{
    // Consultas de dados
    ConsultaBoletos,
    ConsultaClientes,
    ConsultaContratos,
    ConsultaFaturamento,
    ConsultaInadimplencia,
    ConsultaComissoes,
    ConsultaConsultores,
    ConsultaFiliais,

    // Estatísticas e métricas
    EstatisticasGerais,
    EstatisticasMensais,
    EstatisticasAnuais,
    Comparativos,

    // Operações e processos
    ProcessoBoleto,
    ProcessoContrato,
    ProcessoCliente,

    // Ajuda e documentação
    AjudaSistema,
    DuvidaGeral,

    // Não identificado
    NaoIdentificado
}

/// <summary>
/// Resultado da análise de intenção
/// </summary>
public class IntentResult
{
    public IntentType PrimaryIntent { get; set; }
    public List<IntentType> SecondaryIntents { get; set; } = new();
    public double Confidence { get; set; }
    public Dictionary<string, string> ExtractedEntities { get; set; } = new();
    public List<string> Keywords { get; set; } = new();
    public bool RequiresDataLookup { get; set; }
    public string OriginalQuery { get; set; } = string.Empty;
    public string NormalizedQuery { get; set; } = string.Empty;
}

/// <summary>
/// Serviço para análise de intenção das perguntas do usuário
/// </summary>
public class IntentAnalyzer : IIntentAnalyzer
{
    private readonly ILogger<IntentAnalyzer> _logger;

    // Padrões de keywords para cada intenção
    private static readonly Dictionary<IntentType, string[]> IntentKeywords = new()
    {
        [IntentType.ConsultaBoletos] = new[] {
            "boleto", "boletos", "pagamento", "pagamentos", "vencido", "vencidos",
            "vencimento", "pago", "pagos", "pendente", "pendentes", "cobrança",
            "qrcode", "pix", "liquidado", "liquidados", "emitido", "emitidos"
        },
        [IntentType.ConsultaClientes] = new[] {
            "cliente", "clientes", "cadastro", "cadastros", "pessoa", "pessoas",
            "cpf", "cnpj", "empresa", "empresas", "devedor", "devedores"
        },
        [IntentType.ConsultaContratos] = new[] {
            "contrato", "contratos", "acordo", "acordos", "parcela", "parcelas",
            "negociação", "negociado", "fechado", "ativo", "ativos", "pasta"
        },
        [IntentType.ConsultaFaturamento] = new[] {
            "faturamento", "receita", "receitas", "valor", "valores", "total",
            "ganho", "ganhos", "lucro", "lucros", "entrada", "entradas", "arrecadação"
        },
        [IntentType.ConsultaInadimplencia] = new[] {
            "inadimplência", "inadimplente", "inadimplentes", "atraso", "atrasado",
            "atrasados", "risco", "riscos", "devendo", "dívida", "dívidas"
        },
        [IntentType.ConsultaComissoes] = new[] {
            "comissão", "comissões", "comissao", "comissoes", "repasse", "repasses",
            "parceiro", "parceiros", "honorário", "honorários"
        },
        [IntentType.ConsultaConsultores] = new[] {
            "consultor", "consultores", "vendedor", "vendedores", "responsável",
            "atendente", "atendentes", "equipe", "performance", "desempenho"
        },
        [IntentType.ConsultaFiliais] = new[] {
            "filial", "filiais", "unidade", "unidades", "escritório", "escritórios",
            "regional", "regionais", "sede"
        },
        [IntentType.EstatisticasGerais] = new[] {
            "estatística", "estatísticas", "resumo", "dashboard", "visão geral",
            "overview", "métricas", "indicadores", "kpi", "kpis"
        },
        [IntentType.EstatisticasMensais] = new[] {
            "mês", "mensal", "mensais", "este mês", "mês atual", "mês passado",
            "último mês", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        },
        [IntentType.EstatisticasAnuais] = new[] {
            "ano", "anual", "anuais", "este ano", "ano atual", "ano passado",
            "2024", "2025", "2026"
        },
        [IntentType.Comparativos] = new[] {
            "comparar", "comparação", "comparativo", "versus", "vs", "diferença",
            "crescimento", "queda", "aumento", "diminuição", "evolução", "tendência"
        },
        [IntentType.ProcessoBoleto] = new[] {
            "gerar boleto", "criar boleto", "emitir boleto", "enviar boleto",
            "cancelar boleto", "baixar boleto", "segunda via"
        },
        [IntentType.ProcessoContrato] = new[] {
            "criar contrato", "novo contrato", "fechar contrato", "cancelar contrato",
            "encerrar contrato", "renovar contrato"
        },
        [IntentType.ProcessoCliente] = new[] {
            "cadastrar cliente", "novo cliente", "editar cliente", "atualizar cliente",
            "excluir cliente", "inativar cliente"
        },
        [IntentType.AjudaSistema] = new[] {
            "como", "onde", "qual", "menu", "funciona", "usar", "acessar",
            "encontrar", "localizar", "ajuda", "tutorial", "passo"
        }
    };

    // Padrões para extração de entidades
    private static readonly Dictionary<string, string> EntityPatterns = new()
    {
        ["cliente_nome"] = @"cliente\s+([A-Za-zÀ-ÿ\s]+)",
        ["cpf"] = @"(\d{3}\.?\d{3}\.?\d{3}-?\d{2})",
        ["cnpj"] = @"(\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2})",
        ["valor"] = @"R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)",
        ["data"] = @"(\d{2}/\d{2}/\d{4})",
        ["numero_contrato"] = @"contrato\s+(?:n[úu]mero\s+)?(\d+)",
        ["numero_pasta"] = @"pasta\s+(?:n[úu]mero\s+)?(\d+)",
        ["periodo_dias"] = @"(\d+)\s*dias?",
        ["periodo_meses"] = @"(\d+)\s*m[eê]s(?:es)?",
        ["quantidade"] = @"(\d+)\s+(?:boletos?|clientes?|contratos?)"
    };

    public IntentAnalyzer(ILogger<IntentAnalyzer> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Analisa a pergunta do usuário e identifica a intenção
    /// </summary>
    public IntentResult Analyze(string query)
    {
        _logger.LogInformation("🔍 Analisando intenção: {Query}", query);

        var normalizedQuery = NormalizeQuery(query);
        var result = new IntentResult
        {
            OriginalQuery = query,
            NormalizedQuery = normalizedQuery
        };

        // Extrair keywords encontradas
        var foundKeywords = ExtractKeywords(normalizedQuery);
        result.Keywords = foundKeywords;

        // Calcular scores para cada intenção
        var intentScores = CalculateIntentScores(normalizedQuery, foundKeywords);

        // Determinar intenção principal
        var topIntent = intentScores.OrderByDescending(x => x.Value).FirstOrDefault();
        if (topIntent.Value > 0)
        {
            result.PrimaryIntent = topIntent.Key;
            result.Confidence = Math.Min(topIntent.Value / 10.0, 1.0); // Normalizar para 0-1

            // Identificar intenções secundárias (score > 50% do principal)
            var threshold = topIntent.Value * 0.5;
            result.SecondaryIntents = intentScores
                .Where(x => x.Key != topIntent.Key && x.Value >= threshold)
                .OrderByDescending(x => x.Value)
                .Select(x => x.Key)
                .Take(3)
                .ToList();
        }
        else
        {
            result.PrimaryIntent = IntentType.DuvidaGeral;
            result.Confidence = 0.3;
        }

        // Extrair entidades
        result.ExtractedEntities = ExtractEntities(query);

        // Determinar se precisa buscar dados
        result.RequiresDataLookup = DetermineIfRequiresDataLookup(result);

        _logger.LogInformation("✅ Intenção identificada: {Intent} (Confiança: {Confidence:P0})",
            result.PrimaryIntent, result.Confidence);

        return result;
    }

    private string NormalizeQuery(string query)
    {
        // Converter para minúsculas e remover acentos extras
        var normalized = query.ToLowerInvariant().Trim();

        // Remover pontuação excessiva
        normalized = Regex.Replace(normalized, @"[?!.,;:]+", " ");

        // Normalizar espaços
        normalized = Regex.Replace(normalized, @"\s+", " ");

        return normalized;
    }

    private List<string> ExtractKeywords(string normalizedQuery)
    {
        var foundKeywords = new List<string>();

        foreach (var intentKeywords in IntentKeywords)
        {
            foreach (var keyword in intentKeywords.Value)
            {
                if (normalizedQuery.Contains(keyword))
                {
                    foundKeywords.Add(keyword);
                }
            }
        }

        return foundKeywords.Distinct().ToList();
    }

    private Dictionary<IntentType, double> CalculateIntentScores(string normalizedQuery, List<string> foundKeywords)
    {
        var scores = new Dictionary<IntentType, double>();

        foreach (var intentKeywords in IntentKeywords)
        {
            double score = 0;

            foreach (var keyword in intentKeywords.Value)
            {
                if (normalizedQuery.Contains(keyword))
                {
                    // Keywords mais longas têm peso maior
                    score += keyword.Length > 5 ? 2 : 1;

                    // Bonus se a keyword aparece no início
                    if (normalizedQuery.StartsWith(keyword) || normalizedQuery.Contains($" {keyword}"))
                    {
                        score += 0.5;
                    }
                }
            }

            // Bonus para perguntas com quantificadores
            if (score > 0 && HasQuantifier(normalizedQuery))
            {
                score += 2;
            }

            scores[intentKeywords.Key] = score;
        }

        return scores;
    }

    private bool HasQuantifier(string query)
    {
        var quantifiers = new[] {
            "quantos", "quantas", "quanto", "quanta", "total", "todos", "todas",
            "lista", "listar", "mostrar", "exibir", "quais", "qual"
        };
        return quantifiers.Any(q => query.Contains(q));
    }

    private Dictionary<string, string> ExtractEntities(string query)
    {
        var entities = new Dictionary<string, string>();

        foreach (var pattern in EntityPatterns)
        {
            var match = Regex.Match(query, pattern.Value, RegexOptions.IgnoreCase);
            if (match.Success && match.Groups.Count > 1)
            {
                entities[pattern.Key] = match.Groups[1].Value.Trim();
            }
        }

        // Extrair períodos temporais
        if (query.Contains("hoje"))
            entities["periodo"] = "hoje";
        else if (query.Contains("esta semana") || query.Contains("essa semana"))
            entities["periodo"] = "semana";
        else if (query.Contains("este mês") || query.Contains("esse mês") || query.Contains("mês atual"))
            entities["periodo"] = "mes_atual";
        else if (query.Contains("mês passado") || query.Contains("último mês"))
            entities["periodo"] = "mes_passado";
        else if (query.Contains("este ano") || query.Contains("esse ano") || query.Contains("ano atual"))
            entities["periodo"] = "ano_atual";
        else if (query.Contains("ano passado") || query.Contains("último ano"))
            entities["periodo"] = "ano_passado";

        return entities;
    }

    private bool DetermineIfRequiresDataLookup(IntentResult result)
    {
        // Intenções que sempre precisam de dados
        var dataRequiredIntents = new[]
        {
            IntentType.ConsultaBoletos,
            IntentType.ConsultaClientes,
            IntentType.ConsultaContratos,
            IntentType.ConsultaFaturamento,
            IntentType.ConsultaInadimplencia,
            IntentType.ConsultaComissoes,
            IntentType.ConsultaConsultores,
            IntentType.ConsultaFiliais,
            IntentType.EstatisticasGerais,
            IntentType.EstatisticasMensais,
            IntentType.EstatisticasAnuais,
            IntentType.Comparativos
        };

        return dataRequiredIntents.Contains(result.PrimaryIntent);
    }
}

/// <summary>
/// Interface para o analisador de intenção
/// </summary>
public interface IIntentAnalyzer
{
    IntentResult Analyze(string query);
}
