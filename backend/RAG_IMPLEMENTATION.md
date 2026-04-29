# 🧠 RAG - Retrieval-Augmented Generation

## Visão Geral

O sistema RAG (Retrieval-Augmented Generation) foi implementado para permitir que o assistente de IA responda perguntas usando **dados reais do sistema CRM Arrighi**, em vez de apenas conhecimento genérico.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE PROCESSAMENTO RAG                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. USUÁRIO PERGUNTA                                                     │
│     "Quantos boletos estão vencidos?"                                   │
│                           │                                              │
│                           ▼                                              │
│  2. INTENT ANALYZER (IntentAnalyzer.cs)                                 │
│     ┌─────────────────────────────────────────┐                         │
│     │ • Normaliza a pergunta                   │                         │
│     │ • Identifica keywords: "boletos", "vencidos"                      │
│     │ • Determina intenção: ConsultaBoletos    │                         │
│     │ • Extrai entidades: período, valores     │                         │
│     │ • Define: RequiresDataLookup = true      │                         │
│     └─────────────────────────────────────────┘                         │
│                           │                                              │
│                           ▼                                              │
│  3. CONTEXT RETRIEVER (ContextRetriever.cs)                             │
│     ┌─────────────────────────────────────────┐                         │
│     │ • Consulta SQL Server                    │                         │
│     │ • Busca: boletos vencidos, valores       │                         │
│     │ • Busca: top devedores                   │                         │
│     │ • Formata contexto estruturado           │                         │
│     └─────────────────────────────────────────┘                         │
│                           │                                              │
│                           ▼                                              │
│  4. RAG SERVICE (RagService.cs)                                         │
│     ┌─────────────────────────────────────────┐                         │
│     │ • Combina contexto + pergunta            │                         │
│     │ • Adiciona instruções específicas        │                         │
│     │ • Envia para Azure OpenAI                │                         │
│     └─────────────────────────────────────────┘                         │
│                           │                                              │
│                           ▼                                              │
│  5. AZURE OPENAI                                                         │
│     ┌─────────────────────────────────────────┐                         │
│     │ System Prompt + Contexto Real + Pergunta │                         │
│     │ ─────────────────────────────────────────                         │
│     │ "Baseado nos dados:                      │                         │
│     │  - 47 boletos vencidos (R$ 125.430)      │                         │
│     │  - Top devedor: Cliente X (R$ 15.000)    │                         │
│     │  Responda: Quantos boletos estão vencidos?"                       │
│     └─────────────────────────────────────────┘                         │
│                           │                                              │
│                           ▼                                              │
│  6. RESPOSTA COM DADOS REAIS                                            │
│     "📊 Atualmente existem 47 boletos vencidos,                         │
│      totalizando R$ 125.430,00. O maior devedor                         │
│      é Cliente X com R$ 15.000,00..."                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. IntentAnalyzer (`Services/RAG/IntentAnalyzer.cs`)

Responsável por analisar a pergunta do usuário e identificar:

- **Intenção Principal**: O que o usuário quer saber (boletos, clientes, faturamento, etc.)
- **Keywords**: Palavras-chave encontradas na pergunta
- **Entidades**: Valores específicos (datas, CPFs, valores monetários)
- **Confiança**: Nível de certeza na identificação

**Intenções Suportadas:**
- `ConsultaBoletos` - Perguntas sobre boletos
- `ConsultaClientes` - Perguntas sobre clientes
- `ConsultaContratos` - Perguntas sobre contratos
- `ConsultaFaturamento` - Perguntas sobre receita/faturamento
- `ConsultaInadimplencia` - Perguntas sobre inadimplência
- `ConsultaComissoes` - Perguntas sobre comissões
- `ConsultaConsultores` - Perguntas sobre consultores
- `ConsultaFiliais` - Perguntas sobre filiais
- `EstatisticasGerais` - Visão geral do sistema
- `EstatisticasMensais` - Dados do mês
- `EstatisticasAnuais` - Dados do ano
- `Comparativos` - Comparações entre períodos
- `AjudaSistema` - Dúvidas sobre como usar

### 2. ContextRetriever (`Services/RAG/ContextRetriever.cs`)

Busca dados relevantes do banco de dados baseado na intenção identificada:

**Dados de Boletos:**
- Total de boletos
- Boletos vencidos (quantidade e valor)
- Boletos pagos no mês
- Top 5 maiores boletos vencidos

**Dados de Clientes:**
- Total de clientes (PF/PJ)
- Distribuição por filial
- Novos clientes do mês

**Dados de Faturamento:**
- Receita do mês atual
- Receita do mês passado
- Variação percentual
- Receita do ano
- Faturamento últimos 6 meses

**Dados de Inadimplência:**
- Valor total em atraso
- Distribuição por faixa (0-30, 31-60, 61-90, +90 dias)
- Top 10 maiores devedores

### 3. RagService (`Services/RAG/RagService.cs`)

Orquestra todo o processo:

1. Recebe a pergunta
2. Analisa intenção
3. Recupera contexto
4. Constrói prompt enriquecido
5. Envia para Azure OpenAI
6. Retorna resposta

## API Endpoints

### POST `/api/Chat/message`
Endpoint principal com RAG habilitado.

**Request:**
```json
{
  "message": "Quantos boletos estão vencidos?"
}
```

**Response:**
```json
{
  "message": "📊 Atualmente existem 47 boletos vencidos...",
  "timestamp": "2026-01-12T15:30:00Z",
  "usedRAG": true,
  "dataSources": ["Boletos"],
  "processingTimeMs": 1250,
  "intent": "ConsultaBoletos",
  "confidence": 0.95
}
```

### POST `/api/Chat/analyze`
Endpoint para debug - mostra análise de intenção.

**Request:**
```json
{
  "message": "Qual o faturamento do mês passado?"
}
```

**Response:**
```json
{
  "query": "Qual o faturamento do mês passado?",
  "normalizedQuery": "qual o faturamento do mês passado",
  "primaryIntent": "ConsultaFaturamento",
  "secondaryIntents": ["EstatisticasMensais"],
  "confidence": 0.9,
  "keywords": ["faturamento", "mês passado"],
  "extractedEntities": {
    "periodo": "mes_passado"
  },
  "requiresDataLookup": true
}
```

### GET `/api/Chat/status`
Verifica status do serviço.

**Response:**
```json
{
  "configured": true,
  "ragEnabled": true,
  "provider": "Azure OpenAI + RAG",
  "features": {
    "RAG": "Habilitado - Respostas com dados reais do sistema",
    "IntentAnalysis": "Habilitado - Identifica intenção das perguntas",
    "ContextRetrieval": "Habilitado - Busca dados relevantes do banco"
  },
  "message": "🤖 Assistente de IA com RAG configurado e pronto para responder com dados reais!"
}
```

## Exemplos de Perguntas

### 📊 Dados do Sistema
- "Quantos boletos estão vencidos?"
- "Qual o faturamento deste mês?"
- "Quantos clientes temos cadastrados?"
- "Qual o valor total em inadimplência?"

### 📈 Análises
- "Como está o faturamento comparado ao mês passado?"
- "Quais são os maiores devedores?"
- "Qual a performance dos consultores este mês?"
- "Quantos contratos foram fechados este mês?"

### 📋 Consultas
- "Liste os boletos a vencer nos próximos 30 dias"
- "Quais clientes estão inadimplentes há mais de 90 dias?"
- "Mostre o ranking de consultores"
- "Qual filial tem mais clientes?"

## Configuração

### Requisitos
- Azure OpenAI configurado em `appsettings.json`
- Banco de dados SQL Server com dados

### Registro de Serviços (Program.cs)
```csharp
builder.Services.AddScoped<IIntentAnalyzer, IntentAnalyzer>();
builder.Services.AddScoped<IContextRetriever, ContextRetriever>();
builder.Services.AddScoped<IRagService, RagService>();
```

## Performance

- **Análise de Intenção**: ~1ms (em memória)
- **Recuperação de Contexto**: ~50-200ms (depende da query SQL)
- **Azure OpenAI**: ~500-2000ms (depende do tamanho do contexto)
- **Total médio**: ~800-2500ms

## Limitações

1. **Dados em tempo real**: Os dados são consultados no momento da pergunta, mas não há cache
2. **Contexto limitado**: Máximo de ~4000 tokens de contexto para o modelo
3. **Queries complexas**: Perguntas muito específicas podem não ser identificadas corretamente

## Futuras Melhorias

- [ ] Cache de contexto frequente
- [ ] Azure AI Search para busca semântica
- [ ] Histórico de conversas persistente
- [ ] Exportação de relatórios via chat
- [ ] Alertas proativos baseados em dados

## Troubleshooting

### Erro: "Desculpe, não consegui processar sua pergunta"
1. Verifique se Azure OpenAI está configurado
2. Verifique logs do backend para erros detalhados
3. Teste o endpoint `/api/Chat/status`

### Resposta não usa dados reais
1. Verifique se `usedRAG: true` na resposta
2. Use `/api/Chat/analyze` para ver a intenção identificada
3. Reformule a pergunta com keywords mais específicas

### Performance lenta
1. Verifique índices no SQL Server
2. Considere limitar o período de dados consultados
3. Monitore o tempo de resposta do Azure OpenAI
