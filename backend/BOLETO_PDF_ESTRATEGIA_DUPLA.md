# ✅ Correção: Download de PDF com Estratégia Dupla

## 📋 Problema Identificado

1. O método `BaixarPdfBoletoAsync` estava retornando erro "Forbidden" ao tentar gerar access token
2. O endpoint de PDF não estava sendo chamado corretamente
3. Não havia fallback quando o endpoint direto falhava

## 🔧 Solução Implementada: Estratégia Dupla

### Estratégia 1: Endpoint Direto do PDF (Mais Rápido)

Tenta primeiro o endpoint específico para PDF:

```csharp
var pdfEndpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{bankslipId}/pdf?nsuDate={nsuDate:yyyy-MM-dd}";
```

**Vantagens:**
- Mais rápido (1 requisição)
- Endpoint específico para PDF
- Usa token em cache

### Estratégia 2: Consulta Completa (Fallback)

Se a Estratégia 1 falhar, usa o método `ConsultarBoletoAsync` que já funciona:

```csharp
var boletoResponse = await ConsultarBoletoAsync(covenantCode, bankNumber, nsuDate);
```

**Vantagens:**
- Método já testado e funcionando
- Retorna todos os dados do boleto
- Inclui links de PDF nos campos: `PdfUrl`, `BankSlipUrl`, `QrCodeUrl`

## 📝 Implementação Completa

```csharp
public async Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, DateTime nsuDate)
{
    try
    {
        // ESTRATÉGIA 1: Endpoint direto do PDF
        try
        {
            var bankslipId = $"{covenantCode}{bankNumber}";
            var accessToken = await GetAccessTokenAsync();

            var pdfEndpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{bankslipId}/pdf?nsuDate={nsuDate:yyyy-MM-dd}";

            var requestMessage = new HttpRequestMessage(HttpMethod.Get, pdfEndpoint);
            requestMessage.Headers.Add("Authorization", $"Bearer {accessToken}");
            requestMessage.Headers.Add("X-Application-Key", _clientId);

            var response = await _httpClientWithCertificate.SendAsync(requestMessage);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var pdfResponse = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(responseContent);

                if (pdfResponse != null)
                {
                    // Tentar diferentes campos possíveis
                    string? pdfLink = null;

                    if (pdfResponse.ContainsKey("pdfUrl"))
                        pdfLink = pdfResponse["pdfUrl"].GetString();
                    else if (pdfResponse.ContainsKey("url"))
                        pdfLink = pdfResponse["url"].GetString();
                    else if (pdfResponse.ContainsKey("bankSlipUrl"))
                        pdfLink = pdfResponse["bankSlipUrl"].GetString();
                    else if (pdfResponse.ContainsKey("link"))
                        pdfLink = pdfResponse["link"].GetString();

                    if (!string.IsNullOrEmpty(pdfLink))
                    {
                        _logger.LogInformation("✅ Link do PDF obtido via endpoint direto");
                        return pdfLink;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Endpoint direto falhou, tentando consulta completa...");
        }

        // ESTRATÉGIA 2: Consulta completa (fallback)
        var boletoResponse = await ConsultarBoletoAsync(covenantCode, bankNumber, nsuDate);

        // Extrair link do PDF
        if (!string.IsNullOrEmpty(boletoResponse.PdfUrl))
            return boletoResponse.PdfUrl;

        if (!string.IsNullOrEmpty(boletoResponse.BankSlipUrl))
            return boletoResponse.BankSlipUrl;

        if (!string.IsNullOrEmpty(boletoResponse.QrCodeUrl))
            return boletoResponse.QrCodeUrl;

        throw new InvalidOperationException("Link do PDF não encontrado");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "❌ Erro ao baixar PDF do boleto");
        throw;
    }
}
```

## ✅ Vantagens da Estratégia Dupla

1. **Resiliência**: Se um método falhar, tenta o outro
2. **Performance**: Tenta primeiro o método mais rápido
3. **Confiabilidade**: Usa método já testado como fallback
4. **Logs detalhados**: Registra qual estratégia funcionou
5. **Reutilização de código**: Aproveita `ConsultarBoletoAsync` existente

## 🎯 Fluxo de Execução

```
1. Frontend chama: GET /api/Boleto/{id}/pdf
   ↓
2. Controller busca boleto no banco
   ↓
3. Controller chama: BaixarPdfBoletoAsync(bankNumber, covenantCode, nsuDate)
   ↓
4. Service tenta ESTRATÉGIA 1: Endpoint direto do PDF
   ├─ Sucesso? → Retorna link do PDF
   └─ Falha? → Continua para ESTRATÉGIA 2
   ↓
5. Service tenta ESTRATÉGIA 2: ConsultarBoletoAsync
   ├─ Sucesso? → Extrai link do PDF da resposta
   └─ Falha? → Lança exceção
   ↓
6. Controller baixa PDF do link
   ↓
7. Controller retorna PDF para frontend
```

## 🔍 Diagnóstico de Erros

### Erro "Forbidden" ao gerar token

Adicionado diagnóstico específico:

```csharp
if ((int)response.StatusCode == 403)
{
    _logger.LogError("🔐 ERRO 403 FORBIDDEN ao gerar token:");
    _logger.LogError("   → ClientId: {ClientId}", _clientId);
    _logger.LogError("   → Possíveis causas:");
    _logger.LogError("      • Certificado mTLS inválido ou expirado");
    _logger.LogError("      • ClientId ou ClientSecret incorretos");
    _logger.LogError("      • Limite de requisições excedido");
    _logger.LogError("      • IP não autorizado");
}
```

### Campos de PDF verificados

O método verifica múltiplos campos possíveis:
- `pdfUrl`
- `url`
- `bankSlipUrl`
- `link`
- `qrCodeUrl`

## 🧪 Testando

1. Acesse `/boletos`
2. Clique em "PDF" em um boleto REGISTRADO
3. Verifique os logs do backend:
   - Se aparecer "✅ Link do PDF obtido via endpoint direto" → Estratégia 1 funcionou
   - Se aparecer "⚠️ Endpoint direto falhou" → Estratégia 2 foi usada
4. O PDF deve ser baixado com sucesso

## 📚 Referências

- Endpoint direto: `/collection_bill_management/v2/workspaces/{workspaceId}/bank_slips/{bankslipId}/pdf`
- Endpoint de consulta: `/collection_bill_management/v2/workspaces/{workspaceId}/bank_slips/{bankslipId}`
- Método `ConsultarBoletoAsync` em `SantanderBoletoService.cs`
- Controller `BoletoController.cs` - método `BaixarPdfBoleto`
