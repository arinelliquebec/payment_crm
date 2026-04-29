# 🔧 Correção: Status de Pagamento de Boletos

**Data:** 11/12/2024  
**Prioridade:** Alta  
**Tipo:** Correção de Bug

---

## 📋 Resumo do Problema

O status "BAIXADO" da API do Santander era interpretado incorretamente como "Pago (PIX)" em todos os casos. Porém, o Santander retorna "BAIXADO" em **duas situações diferentes**:

1. ✅ **Boleto pago via PIX** → Deve mostrar "Pago (PIX)"
2. ❌ **Boleto expirado (30 dias sem pagamento)** → Deve mostrar "Baixado (Não Pago)"

---

## 🆕 Novos Campos Disponíveis na API

Foram adicionados 3 novos campos na resposta dos boletos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `foiPago` | `boolean` | **PRINCIPAL** - Indica se o boleto foi efetivamente pago |
| `valorPago` | `decimal?` | Valor pago pelo cliente (null se não pago) |
| `dataPagamento` | `datetime?` | Data do pagamento (null se não pago) |

---

## 📦 Exemplo de Resposta da API

### Boleto PAGO via PIX:
```json
{
  "id": 46,
  "contratoId": 123,
  "status": "BAIXADO",
  "foiPago": true,
  "valorPago": 759.00,
  "dataPagamento": "2024-11-15T14:30:00",
  "nominalValue": 759.00,
  "dueDate": "2024-11-10T00:00:00"
}
```

### Boleto PAGO via Código de Barras:
```json
{
  "id": 48,
  "contratoId": 124,
  "status": "LIQUIDADO",
  "foiPago": true,
  "valorPago": 1000.00,
  "dataPagamento": "2024-11-20T10:15:00",
  "nominalValue": 1000.00,
  "dueDate": "2024-11-18T00:00:00"
}
```

### Boleto NÃO PAGO (expirado após 30 dias):
```json
{
  "id": 37,
  "contratoId": 100,
  "status": "BAIXADO",
  "foiPago": false,
  "valorPago": null,
  "dataPagamento": null,
  "nominalValue": 500.00,
  "dueDate": "2024-10-01T00:00:00"
}
```

### Boleto ATIVO (aguardando pagamento):
```json
{
  "id": 44,
  "contratoId": 105,
  "status": "ATIVO",
  "foiPago": false,
  "valorPago": null,
  "dataPagamento": null,
  "nominalValue": 800.00,
  "dueDate": "2024-12-15T00:00:00"
}
```

---

## ⚠️ O que precisa ser alterado no Frontend

### ❌ Código ANTIGO (INCORRETO - remover):

```javascript
// NÃO USAR MAIS ESTA LÓGICA!
function getStatusDisplay(boleto) {
  switch (boleto.status) {
    case "BAIXADO":
      return "Pago (PIX)";  // ❌ ERRADO! BAIXADO pode ser expirado também
    case "LIQUIDADO":
      return "Pago";
    // ...
  }
}
```

### ✅ Código NOVO (CORRETO - implementar):

```javascript
/**
 * Retorna o texto de exibição do status do boleto
 * IMPORTANTE: Usar o campo 'foiPago' para determinar se foi pago
 */
function getStatusDisplay(boleto) {
  // 1. Primeiro verificar se foi pago usando o novo campo
  if (boleto.foiPago === true) {
    if (boleto.status === "LIQUIDADO") {
      return "Pago (Código de Barras)";
    } else if (boleto.status === "BAIXADO") {
      return "Pago (PIX)";
    }
    return "Pago";
  }
  
  // 2. Se não foi pago, verificar o status
  switch (boleto.status?.toUpperCase()) {
    case "BAIXADO":
      return "Baixado (Não Pago)"; // Expirou após 30 dias sem pagamento
    case "CANCELADO":
      return "Cancelado";
    case "ATIVO":
    case "REGISTRADO":
      return "Aguardando Pagamento";
    case "PENDENTE":
      return "Pendente";
    default:
      return boleto.status || "Desconhecido";
  }
}

/**
 * Retorna a cor/classe CSS para o status
 */
function getStatusColor(boleto) {
  if (boleto.foiPago === true) {
    return "success"; // Verde - Pago
  }
  
  switch (boleto.status?.toUpperCase()) {
    case "BAIXADO":
      return "warning"; // Amarelo/Laranja - Expirado não pago
    case "CANCELADO":
      return "error"; // Vermelho - Cancelado
    case "ATIVO":
    case "REGISTRADO":
      return "info"; // Azul - Aguardando
    default:
      return "default";
  }
}

/**
 * Verifica se o boleto foi pago
 * USE ESTA FUNÇÃO em vez de comparar status diretamente
 */
function isPago(boleto) {
  return boleto.foiPago === true;
}
```

---

## 🎨 Sugestão de Cores/Badges

| Status | foiPago | Texto Exibido | Cor Sugerida |
|--------|---------|---------------|--------------|
| LIQUIDADO | true | Pago (Código de Barras) | 🟢 Verde |
| BAIXADO | true | Pago (PIX) | 🟢 Verde |
| BAIXADO | false | Baixado (Não Pago) | 🟠 Laranja |
| CANCELADO | false | Cancelado | 🔴 Vermelho |
| ATIVO | false | Aguardando Pagamento | 🔵 Azul |
| REGISTRADO | false | Aguardando Pagamento | 🔵 Azul |
| PENDENTE | false | Pendente | ⚪ Cinza |

---

## 📊 Exemplo de Componente React

```jsx
const BoletoStatusBadge = ({ boleto }) => {
  const getStatusInfo = () => {
    // Usar o campo foiPago para determinar se foi pago
    if (boleto.foiPago) {
      return {
        text: boleto.status === "LIQUIDADO" ? "Pago (Cód. Barras)" : "Pago (PIX)",
        color: "bg-green-500",
        icon: "✓"
      };
    }

    // Se não foi pago, verificar o status
    switch (boleto.status?.toUpperCase()) {
      case "BAIXADO":
        return { text: "Baixado (Não Pago)", color: "bg-orange-500", icon: "⚠" };
      case "CANCELADO":
        return { text: "Cancelado", color: "bg-red-500", icon: "✕" };
      case "ATIVO":
      case "REGISTRADO":
        return { text: "Aguardando", color: "bg-blue-500", icon: "⏳" };
      default:
        return { text: boleto.status, color: "bg-gray-500", icon: "?" };
    }
  };

  const { text, color, icon } = getStatusInfo();

  return (
    <span className={`px-2 py-1 rounded text-white text-sm ${color}`}>
      {icon} {text}
    </span>
  );
};
```

---

## 📝 Exibindo Informações de Pagamento

Quando `foiPago === true`, você pode exibir informações adicionais:

```jsx
{boleto.foiPago && (
  <div className="payment-info">
    <p>💰 Valor Pago: R$ {boleto.valorPago?.toFixed(2)}</p>
    <p>📅 Data: {new Date(boleto.dataPagamento).toLocaleDateString('pt-BR')}</p>
  </div>
)}
```

---

## 🔄 Endpoints Afetados

Todos os endpoints que retornam boletos agora incluem os novos campos:

- `GET /api/Boleto` - Lista de boletos
- `GET /api/Boleto/{id}` - Boleto específico
- `GET /api/Boleto/contrato/{contratoId}` - Boletos do contrato
- `GET /api/Boleto/{id}/status` - Status do boleto
- `PUT /api/Boleto/{id}/sincronizar` - Sincronizar boleto
- `PUT /api/Boleto/sincronizar-todos` - Sincronizar todos

---

## ✅ Checklist de Implementação

- [ ] Atualizar função de exibição de status para usar `foiPago`
- [ ] Atualizar cores/badges dos status
- [ ] Remover lógica antiga que assumia `BAIXADO = Pago (PIX)`
- [ ] Exibir `valorPago` e `dataPagamento` quando disponíveis
- [ ] Testar com boletos de diferentes status
- [ ] Verificar listagens e detalhes de boletos

---

## 🆘 Dúvidas?

A regra é simples:

```
SE boleto.foiPago === true  → MOSTRAR COMO PAGO (verde)
SE boleto.foiPago === false → MOSTRAR COMO NÃO PAGO (verificar status para texto específico)
```

**Não confie apenas no `status`!** Use sempre o campo `foiPago` como fonte da verdade para saber se o boleto foi pago ou não.

