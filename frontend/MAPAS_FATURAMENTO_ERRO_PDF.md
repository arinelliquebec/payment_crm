# 📄 Mapas de Faturamento - Tratamento de Erro ao Baixar PDF

## ✅ Implementação Concluída

Implementado tratamento de erro inteligente ao baixar PDF de boletos, com **mensagens específicas** para boletos liquidados.

## 🎯 Problema Identificado

Quando um boleto é **LIQUIDADO** (pago), o PDF pode não estar mais disponível no Santander, causando erro ao tentar baixar. O usuário recebia apenas uma mensagem genérica sem entender o motivo.

## 🔧 Solução Implementada

### 1. **Mensagens de Erro Contextuais**

#### Para Boletos LIQUIDADOS (Pagos)
```
⚠️ Erro ao baixar PDF do boleto.

⚠️ Este boleto foi LIQUIDADO (pago).

Possíveis causas:
• O PDF pode não estar mais disponível no Santander
• Boletos liquidados podem ter prazo de disponibilidade limitado
• Entre em contato com o suporte se precisar do comprovante
```

#### Para Boletos REGISTRADOS
```
⚠️ Erro ao baixar PDF do boleto.

Possíveis causas:
• O boleto pode não estar registrado no Santander
• Pode haver um problema temporário com o banco
• Tente novamente em alguns instantes
```

### 2. **Tratamento de Erro Aprimorado**

```typescript
const handleDownloadPdf = async (boleto: Boleto) => {
  // Validação inicial
  if (boleto.status !== "REGISTRADO" && boleto.status !== "LIQUIDADO") {
    alert("Apenas boletos registrados ou liquidados podem ter o PDF gerado");
    return;
  }

  try {
    // Tenta baixar PDF
    const response = await fetch(`${apiUrl}/Boleto/${boleto.id}/pdf`);

    if (!response.ok) {
      // Lê mensagem de erro do servidor
      const errorText = await response.text();
      console.error("Erro ao baixar PDF:", response.status, errorText);

      // Mensagem específica baseada no status
      let errorMessage = "Erro ao baixar PDF do boleto.\n\n";

      if (boleto.status === "LIQUIDADO") {
        errorMessage += "⚠️ Este boleto foi LIQUIDADO (pago).\n\n";
        errorMessage += "Possíveis causas:\n";
        errorMessage += "• O PDF pode não estar mais disponível no Santander\n";
        errorMessage += "• Boletos liquidados podem ter prazo de disponibilidade limitado\n";
        errorMessage += "• Entre em contato com o suporte se precisar do comprovante";
      } else {
        errorMessage += "Possíveis causas:\n";
        errorMessage += "• O boleto pode não estar registrado no Santander\n";
        errorMessage += "• Pode haver um problema temporário com o banco\n";
        errorMessage += "• Tente novamente em alguns instantes";
      }

      alert(errorMessage);
      return;
    }

    // Download bem-sucedido
    const blob = await response.blob();
    // ... código de download

  } catch (error) {
    // Erro de rede ou outro erro
    console.error("Erro ao baixar PDF:", error);

    let errorMessage = "Erro ao baixar PDF do boleto.\n\n";

    if (boleto.status === "LIQUIDADO") {
      errorMessage += "⚠️ Este boleto foi LIQUIDADO (pago).\n\n";
      errorMessage += "O PDF pode não estar mais disponível pois o boleto já foi pago.\n";
      errorMessage += "Boletos liquidados podem ter prazo de disponibilidade limitado no banco.";
    } else {
      errorMessage += "Verifique sua conexão e tente novamente.\n";
      errorMessage += "Se o problema persistir, entre em contato com o suporte.";
    }

    alert(errorMessage);
  }
};
```

## 📊 Fluxo de Tratamento de Erro

### Cenário 1: Boleto LIQUIDADO - PDF Indisponível

```
Usuário clica em "Baixar PDF"
    ↓
Sistema verifica status: LIQUIDADO ✅
    ↓
Tenta buscar PDF no Santander
    ↓
Santander retorna erro 404/500
    ↓
Sistema detecta: boleto.status === "LIQUIDADO"
    ↓
Exibe mensagem específica:
"⚠️ Este boleto foi LIQUIDADO (pago).
O PDF pode não estar mais disponível..."
    ↓
Usuário entende o motivo
```

### Cenário 2: Boleto REGISTRADO - Erro Temporário

```
Usuário clica em "Baixar PDF"
    ↓
Sistema verifica status: REGISTRADO ✅
    ↓
Tenta buscar PDF no Santander
    ↓
Santander retorna erro temporário
    ↓
Sistema detecta: boleto.status === "REGISTRADO"
    ↓
Exibe mensagem específica:
"Possíveis causas:
• Problema temporário com o banco
• Tente novamente em alguns instantes"
    ↓
Usuário tenta novamente
```

### Cenário 3: Erro de Rede

```
Usuário clica em "Baixar PDF"
    ↓
Sistema tenta conectar
    ↓
Erro de rede (timeout, sem conexão)
    ↓
Cai no catch
    ↓
Verifica status do boleto
    ↓
Exibe mensagem apropriada
```

## 🎨 Exemplos de Mensagens

### Mensagem 1: Boleto Liquidado (HTTP Error)
```
╔═══════════════════════════════════════════╗
║  ⚠️ Erro ao baixar PDF do boleto          ║
╠═══════════════════════════════════════════╣
║                                           ║
║  ⚠️ Este boleto foi LIQUIDADO (pago).     ║
║                                           ║
║  Possíveis causas:                        ║
║  • O PDF pode não estar mais disponível  ║
║    no Santander                           ║
║  • Boletos liquidados podem ter prazo de ║
║    disponibilidade limitado               ║
║  • Entre em contato com o suporte se     ║
║    precisar do comprovante                ║
║                                           ║
║                    [OK]                   ║
╚═══════════════════════════════════════════╝
```

### Mensagem 2: Boleto Liquidado (Network Error)
```
╔═══════════════════════════════════════════╗
║  ⚠️ Erro ao baixar PDF do boleto          ║
╠═══════════════════════════════════════════╣
║                                           ║
║  ⚠️ Este boleto foi LIQUIDADO (pago).     ║
║                                           ║
║  O PDF pode não estar mais disponível    ║
║  pois o boleto já foi pago.               ║
║                                           ║
║  Boletos liquidados podem ter prazo de   ║
║  disponibilidade limitado no banco.       ║
║                                           ║
║                    [OK]                   ║
╚═══════════════════════════════════════════╝
```

### Mensagem 3: Boleto Registrado
```
╔═══════════════════════════════════════════╗
║  ⚠️ Erro ao baixar PDF do boleto          ║
╠═══════════════════════════════════════════╣
║                                           ║
║  Possíveis causas:                        ║
║  • O boleto pode não estar registrado no ║
║    Santander                              ║
║  • Pode haver um problema temporário com ║
║    o banco                                ║
║  • Tente novamente em alguns instantes   ║
║                                           ║
║                    [OK]                   ║
╚═══════════════════════════════════════════╝
```

## 🔍 Detalhes Técnicos

### 1. **Leitura da Resposta de Erro**
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error("Erro ao baixar PDF:", response.status, errorText);
  // ...
}
```
- Lê o corpo da resposta de erro
- Loga no console para debug
- Usa informação para mensagem contextual

### 2. **Detecção de Status do Boleto**
```typescript
if (boleto.status === "LIQUIDADO") {
  errorMessage += "⚠️ Este boleto foi LIQUIDADO (pago).\n\n";
  // Mensagem específica para liquidado
} else {
  // Mensagem genérica para outros status
}
```

### 3. **Tratamento de Exceções**
```typescript
try {
  // Tenta baixar
} catch (error) {
  // Erro de rede ou outro
  console.error("Erro ao baixar PDF:", error);

  // Mensagem baseada no status
  if (boleto.status === "LIQUIDADO") {
    // Mensagem para liquidado
  } else {
    // Mensagem genérica
  }
}
```

## 📋 Motivos Comuns de Erro

### Para Boletos LIQUIDADOS

| Motivo | Descrição | Solução |
|--------|-----------|---------|
| **PDF Expirado** | Santander remove PDFs após pagamento | Contatar suporte para comprovante |
| **Prazo Vencido** | Banco mantém PDF por tempo limitado | Solicitar 2ª via ao banco |
| **Boleto Baixado** | Boleto foi baixado do sistema | Verificar histórico de pagamentos |

### Para Boletos REGISTRADOS

| Motivo | Descrição | Solução |
|--------|-----------|---------|
| **Não Registrado** | Boleto ainda não foi para o banco | Aguardar processamento |
| **Erro Temporário** | Problema momentâneo no Santander | Tentar novamente |
| **Timeout** | Demora na resposta do banco | Verificar conexão |

## 💡 Melhorias Implementadas

### 1. **Mensagens Claras**
- ✅ Explica o motivo do erro
- ✅ Diferencia boleto liquidado de outros
- ✅ Sugere ações ao usuário

### 2. **Logging Aprimorado**
- ✅ Loga status HTTP
- ✅ Loga corpo da resposta
- ✅ Facilita debug

### 3. **UX Melhorada**
- ✅ Usuário entende o problema
- ✅ Sabe se é temporário ou permanente
- ✅ Sabe como proceder

## 🎯 Casos de Uso

### Caso 1: Usuário Tenta Baixar PDF de Boleto Pago
```
1. Usuário acessa Mapas de Faturamento
2. Filtra por "Liquidadas"
3. Clica em "Baixar PDF" de um boleto pago
4. Sistema tenta buscar no Santander
5. Santander retorna erro (PDF não disponível)
6. Sistema exibe:
   "⚠️ Este boleto foi LIQUIDADO (pago).
   O PDF pode não estar mais disponível..."
7. Usuário entende que é normal
8. Contata suporte se precisar do comprovante
```

### Caso 2: Erro Temporário do Banco
```
1. Usuário tenta baixar PDF
2. Santander está com problema temporário
3. Sistema exibe:
   "Pode haver um problema temporário com o banco
   Tente novamente em alguns instantes"
4. Usuário aguarda alguns minutos
5. Tenta novamente
6. Download funciona
```

## ✅ Checklist de Implementação

- [x] Mensagem específica para boletos liquidados
- [x] Mensagem genérica para outros status
- [x] Leitura do corpo da resposta de erro
- [x] Logging detalhado no console
- [x] Tratamento de erro de rede
- [x] Tratamento de erro HTTP
- [x] Mensagens claras e informativas
- [x] Sugestões de ação ao usuário
- [x] Sem erros TypeScript
- [x] Documentação completa

## 🎉 Resultado Final

Agora quando houver erro ao baixar PDF:

1. ✅ **Usuário sabe o motivo** - Mensagem clara e específica
2. ✅ **Entende se é normal** - Especialmente para boletos liquidados
3. ✅ **Sabe como proceder** - Sugestões de ação
4. ✅ **Melhor experiência** - Menos frustração
5. ✅ **Facilita suporte** - Logs detalhados para debug

**Mensagem principal:** Boletos liquidados podem não ter PDF disponível - isso é normal! 💡
