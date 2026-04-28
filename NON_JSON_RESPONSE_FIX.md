# Correção do Erro "Non-JSON response received: null"

## Problema Identificado

Após salvar a filial nova no consultor, ocorria o erro:
```
Console Error: Non-JSON response received: null ""
src/lib/api.ts (107:17) @ ApiClient.request
```

## Causa Raiz

O backend estava retornando `NoContent()` (status 204) que não tem corpo de resposta, mas o frontend estava tentando fazer parse de JSON para todas as respostas.

## Solução Implementada

### ApiClient - Tratamento de Status 204

Modificado o `ApiClient` para lidar corretamente com respostas vazias (status 204):

```typescript
// Verificar se a resposta é JSON
const contentType = response.headers.get("content-type");

// Para status 204 (No Content), não esperamos JSON
if (response.status === 204) {
  return {
    data: undefined,
    status: response.status,
  };
}

if (!contentType || !contentType.includes("application/json")) {
  console.error(
    `Non-JSON response received: ${contentType}`,
    responseText
  );
  return {
    error: `Expected JSON response but got ${contentType}`,
    status: response.status,
  };
}
```

## Por que isso acontece?

1. **Backend**: Retorna `NoContent()` (status 204) para operações de atualização bem-sucedidas
2. **Frontend**: Tentava fazer parse de JSON para todas as respostas
3. **Conflito**: Status 204 não tem corpo de resposta, causando erro de parse

## Funcionalidades Corrigidas

- ✅ **Atualização de consultor**: Sem erros de console
- ✅ **Status 204**: Tratado corretamente
- ✅ **Logs limpos**: Sem erros desnecessários
- ✅ **Compatibilidade**: Mantida com outras operações

## Como Testar

1. Abrir formulário de edição de consultor
2. Alterar a filial
3. Salvar
4. Verificar que não há erros no console
5. Confirmar que a atualização foi bem-sucedida

## Arquivos Modificados

- `frontend/src/lib/api.ts` - Tratamento de status 204 adicionado

## Status HTTP Relevantes

- **200 OK**: Resposta com dados JSON
- **204 No Content**: Resposta vazia (sucesso sem dados)
- **400 Bad Request**: Erro de validação
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro do servidor
