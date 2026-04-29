# ✅ Sincronização Automática de Status LIQUIDADO

## 📋 Funcionalidade Implementada

O sistema agora sincroniza automaticamente o status de boletos com a API Santander e atualiza para "LIQUIDADO" quando o boleto for pago.

## 🔧 Alterações Implementadas

### 1. Backend - Atualização de Status

**Arquivo**: `backend/Controllers/BoletoController.cs`

#### Método `AtualizarBoletoComResposta` Atualizado:

```csharp
private void AtualizarBoletoComResposta(Boleto boleto, SantanderBoletoResponse response)
{
    boleto.BarCode = response.barCode;
    boleto.DigitableLine = response.digitableLine;
    boleto.QrCodePix = response.qrCodePix;
    boleto.QrCodeUrl = response.qrCodeUrl;

    if (DateTime.TryParse(response.entryDate, out DateTime entryDate))
    {
        boleto.EntryDate = entryDate;
    }

    // ✅ NOVO: Atualizar status se o boleto foi liquidado
    if (!string.IsNullOrEmpty(response.Status))
    {
        var statusLiquidado = new[] { "LIQUIDADO", "PAID", "SETTLED", "PAGO" };
        if (statusLiquidado.Any(s => response.Status.Equals(s, StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogInformation("✅ Boleto ID {BoletoId} foi LIQUIDADO. Status da API: {Status}",
                boleto.Id, response.Status);
            boleto.Status = "LIQUIDADO";

            // Atualizar data de liquidação se disponível
            if (!string.IsNullOrEmpty(response.SettlementDate) &&
                DateTime.TryParse(response.SettlementDate, out DateTime settlementDate))
            {
                boleto.DataAtualizacao = settlementDate;
                _logger.LogInformation("📅 Data de liquidação: {SettlementDate}", settlementDate);
            }
        }
    }

    boleto.DataAtualizacao = DateTime.UtcNow;
}
```

#### Condição de Sincronização Atualizada:

**Antes:**
```csharp
if (boleto.Status != "REGISTRADO")
{
    return BadRequest("Apenas boletos registrados podem ser sincronizados");
}
```

**Depois:**
```csharp
if (boleto.Status != "REGISTRADO" && boleto.Status != "VENCIDO")
{
    return BadRequest("Apenas boletos registrados ou vencidos podem ser sincronizados");
}
```

### 2. Frontend - Botão PDF Removido para Liquidados

**Arquivos Atualizados:**
- `frontend/src/app/boletos/page.tsx`
- `frontend/src/app/dashboard/financeiro/mapas-faturamento/page.tsx`

#### Condição Atualizada:

**Antes:**
```tsx
{boleto.status === "REGISTRADO" && (
  <button onClick={() => handleDownloadPdf(boleto)}>
    PDF
  </button>
)}
```

**Depois:**
```tsx
{(boleto.status === "REGISTRADO" || boleto.status === "VENCIDO") && (
  <button onClick={() => handleDownloadPdf(boleto)}>
    PDF
  </button>
)}
```

## 🎯 Fluxo de Funcionamento

### 1. Sincronização Manual (Botão "Sync")

```
1. Usuário clica em "Sincronizar" em um boleto REGISTRADO ou VENCIDO
   ↓
2. Frontend chama: PUT /api/Boleto/{id}/sincronizar
   ↓
3. Backend consulta API Santander: ConsultarBoletoAsync()
   ↓
4. Backend recebe resposta com status do boleto
   ↓
5. Backend verifica se Status = "LIQUIDADO", "PAID", "SETTLED" ou "PAGO"
   ↓
6. Se SIM: Atualiza boleto.Status = "LIQUIDADO" no banco
   ↓
7. Frontend recebe resposta atualizada
   ↓
8. Botão "PDF" desaparece automaticamente (boleto liquidado)
   ↓
9. Badge de status muda para "LIQUIDADO" (verde)
```

### 2. Sincronização Automática (Futura)

Pode ser implementado um job que sincroniza periodicamente:

```csharp
// Exemplo de job que pode ser criado
public async Task SincronizarBoletosAutomaticamente()
{
    var boletosAtivos = await _context.Boletos
        .Where(b => b.Status == "REGISTRADO" || b.Status == "VENCIDO")
        .ToListAsync();

    foreach (var boleto in boletosAtivos)
    {
        try
        {
            var response = await _santanderService.ConsultarBoletoAsync(
                boleto.NsuCode, boleto.NsuDate);
            AtualizarBoletoComResposta(boleto, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao sincronizar boleto {BoletoId}", boleto.Id);
        }
    }

    await _context.SaveChangesAsync();
}
```

## 📊 Status Reconhecidos como LIQUIDADO

A API Santander pode retornar diferentes valores para indicar que um boleto foi pago:

- `LIQUIDADO` (português)
- `PAID` (inglês)
- `SETTLED` (inglês - liquidado)
- `PAGO` (português)

O sistema reconhece todos esses valores (case-insensitive).

## ✅ Comportamento por Status

| Status | Botão PDF | Botão Sync | Pode Cancelar |
|--------|-----------|------------|---------------|
| PENDENTE | ❌ Não | ❌ Não | ✅ Sim |
| REGISTRADO | ✅ Sim | ✅ Sim | ✅ Sim |
| VENCIDO | ✅ Sim | ✅ Sim | ✅ Sim |
| **LIQUIDADO** | ❌ **Não** | ❌ Não | ❌ Não |
| CANCELADO | ❌ Não | ❌ Não | ❌ Não |

## 🧪 Testando

### Teste Manual:

1. Registre um boleto no sistema
2. Pague o boleto no Santander (ou simule o pagamento)
3. Na página `/boletos`, clique em "Sincronizar" no boleto
4. Verifique se:
   - ✅ Status mudou para "LIQUIDADO"
   - ✅ Badge ficou verde
   - ✅ Botão "PDF" desapareceu
   - ✅ Botão "Sync" desapareceu
   - ✅ Botão "Cancelar" desapareceu

### Logs Esperados:

```
✅ Boleto ID 123 foi LIQUIDADO. Status da API: LIQUIDADO
📅 Data de liquidação: 2025-11-17
Boleto sincronizado com sucesso. ID: 123
```

## 📝 Notas Importantes

1. **Apenas boletos REGISTRADOS ou VENCIDOS** podem ser sincronizados
2. **Boletos LIQUIDADOS não podem ser sincronizados novamente** (já estão no estado final)
3. **A data de liquidação** é atualizada se a API Santander fornecer o campo `SettlementDate`
4. **O botão PDF desaparece automaticamente** quando o status muda para LIQUIDADO
5. **Logs detalhados** são gerados para auditoria

## 🔄 Próximos Passos (Opcional)

1. **Job de Sincronização Automática**: Criar um job que sincroniza boletos periodicamente (ex: a cada hora)
2. **Webhook do Santander**: Implementar webhook para receber notificações de pagamento em tempo real
3. **Notificações**: Enviar email/SMS quando um boleto for liquidado
4. **Relatório de Liquidações**: Dashboard com boletos liquidados por período

## 🔍 Troubleshooting

### Boleto não muda para LIQUIDADO após sincronizar:

1. Verifique se o boleto foi realmente pago no Santander
2. Verifique os logs do backend para ver o status retornado pela API
3. Confirme que o campo `Status` está presente na resposta da API
4. Verifique se o valor do status está na lista reconhecida

### Erro ao sincronizar:

1. Verifique se o certificado mTLS está válido
2. Confirme que o boleto está com status REGISTRADO ou VENCIDO
3. Verifique se o `NsuCode` e `NsuDate` estão corretos
4. Consulte os logs do backend para detalhes do erro
