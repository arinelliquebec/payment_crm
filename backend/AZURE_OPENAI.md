# 🤖 Azure OpenAI - Assistente de IA do CRM Arrighi

## Visão Geral

O CRM Arrighi possui um assistente de IA integrado para ajudar os usuários com dúvidas sobre o sistema. Ele usa o Azure OpenAI Service para fornecer respostas inteligentes e contextualizadas.

## Configuração no Azure Portal

### 1. Criar Recurso Azure OpenAI

1. Acesse o [Azure Portal](https://portal.azure.com)
2. Clique em **"Create a resource"**
3. Busque por **"Azure OpenAI"**
4. Clique em **"Create"**
5. Preencha os campos:
   - **Subscription**: Sua assinatura
   - **Resource group**: Selecione ou crie um grupo
   - **Region**: East US (ou outra região disponível)
   - **Name**: `crm-arrighi-openai`
   - **Pricing tier**: Standard S0

### 2. Fazer Deploy do Modelo

1. Após criar o recurso, vá para **"Model deployments"**
2. Clique em **"+ Create new deployment"**
3. Selecione o modelo:
   - **Model**: `gpt-4o-mini` (recomendado para custo-benefício)
   - **Deployment name**: `gpt-4o-mini`
   - **Deployment type**: Standard
4. Clique em **"Create"**

### 3. Obter Credenciais

1. No recurso Azure OpenAI, vá para **"Keys and Endpoint"**
2. Copie:
   - **Endpoint**: `https://SEU-RECURSO.openai.azure.com/`
   - **Key 1** ou **Key 2**: Sua API Key

## Configuração no Backend

### appsettings.json (desenvolvimento)

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://crm-arrighi-openai.openai.azure.com/",
    "ApiKey": "SUA_API_KEY_AQUI",
    "DeploymentName": "gpt-4o-mini",
    "ApiVersion": "2024-08-01-preview"
  }
}
```

### Variáveis de Ambiente (produção)

```bash
# No Azure App Service ou ambiente de produção
AzureOpenAI__Endpoint=https://crm-arrighi-openai.openai.azure.com/
AzureOpenAI__ApiKey=SUA_API_KEY_AQUI
AzureOpenAI__DeploymentName=gpt-4o-mini
AzureOpenAI__ApiVersion=2024-08-01-preview
```

## Uso no Sistema

### Componente Visual

O assistente aparece como um **botão flutuante** no canto inferior direito de todas as páginas do sistema.

- 💬 Clique no botão para abrir o chat
- 🗑️ Use o ícone de lixeira para limpar a conversa
- ❌ Clique no X para fechar

### Funcionalidades

1. **Perguntas sobre o sistema**: O assistente conhece todas as funcionalidades do CRM
2. **Sugestões de perguntas**: Ao abrir, mostra perguntas frequentes por categoria
3. **Histórico de conversa**: Mantém contexto durante a sessão
4. **Formatação rica**: Suporta markdown (negrito, listas, títulos)

## Endpoints da API

### POST /api/Chat/message

Envia uma mensagem para o assistente.

```json
// Request
{
  "message": "Como gerar um boleto?",
  "history": [
    { "role": "user", "content": "Olá" },
    { "role": "assistant", "content": "Olá! Como posso ajudar?" }
  ]
}

// Response
{
  "message": "Para gerar um boleto no CRM Arrighi, siga os passos...",
  "timestamp": "2026-01-04T12:00:00Z"
}
```

### GET /api/Chat/status

Verifica se o serviço está configurado.

```json
{
  "configured": true,
  "provider": "Azure OpenAI",
  "message": "Assistente de IA configurado e pronto"
}
```

### GET /api/Chat/suggestions

Retorna sugestões de perguntas frequentes.

## Custos Estimados

| Modelo | Input (1K tokens) | Output (1K tokens) |
|--------|-------------------|---------------------|
| gpt-4o-mini | $0.00015 | $0.0006 |
| gpt-4o | $0.005 | $0.015 |

**Estimativa mensal** (1000 conversas/mês, ~500 tokens cada):
- gpt-4o-mini: ~$0.50/mês
- gpt-4o: ~$15/mês

## Personalizando o Assistente

O prompt do sistema está em `backend/Services/AzureOpenAIService.cs`:

```csharp
private const string SystemPrompt = @"
Você é o Assistente Virtual do CRM Arrighi...
// Edite aqui para personalizar o comportamento
";
```

### Dicas de Personalização

1. **Adicionar novas funcionalidades**: Descreva no prompt
2. **Mudar tom de voz**: Ajuste as instruções
3. **Restringir assuntos**: Seja explícito sobre o que não responder
4. **Adicionar exemplos**: Ajuda o modelo a entender o formato esperado

## Troubleshooting

### "Assistente não configurado"
- Verifique se `AzureOpenAI:ApiKey` está definido
- Verifique se o endpoint está correto

### Respostas lentas
- Use `gpt-4o-mini` em vez de `gpt-4o`
- Reduza `max_tokens` no request

### Respostas imprecisas
- Melhore o SystemPrompt com mais contexto
- Adicione exemplos de perguntas/respostas

## Segurança

- ✅ API Key armazenada em configuração segura
- ✅ Não exposta no frontend
- ✅ Logs não incluem conteúdo das mensagens
- ✅ Headers de autenticação do usuário enviados

## Modelos Alternativos

Se preferir outro provedor:

1. **OpenAI direto**: Altere o endpoint para `https://api.openai.com/v1`
2. **Claude (Anthropic)**: Requer adaptação do serviço
3. **LLaMA local**: Para maior privacidade

---

📧 **Suporte**: Em caso de dúvidas, contate a equipe de desenvolvimento.

