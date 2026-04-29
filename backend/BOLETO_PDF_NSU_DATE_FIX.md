# ✅ Correção: Download de PDF usando NSU Date (Estratégia Dupla)

## 📋 Problema Identificado

O método `BaixarPdfBoletoAsync` estava usando um endpoint incorreto e não aproveitava o método `ConsultarBoletoAsync` que já funciona corretamente.

Além disso, havia um erro "Forbidden" ao tentar gerar um novo access token em algumas situações.

## 🔧 Solução Implementada

### Backend - Service Layer

**Arquivo**: `backend/Services/SantanderBoletoService.cs`

#### Antes:
```csharp
public async Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, string payerDocumentNumber)
{
    // Usava endpoint incorreto e data atual
    var endpoint = $"/collection/v1/bank-slip/{covenantCode}/{bankNumber}/pdf";
    // ...
}
```

#### Depois:
```csharp
public async Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, DateTime nsuDate)
{
    // Reutiliza método que funciona (ConsultarBoletoAsync)
    var boletoResponse = await ConsultarBoletoAsync(covenantCode, bankNumber, nsuDate);

    // Extrai o link do PDF da resposta
    if (!string.IsNullOrEmpty(boletoResponse.PdfUrl))
        return boletoResponse.PdfUrl;

    if (!string.IsNullOrEmpty(boletoResponse.BankSlipUrl))
        return boletoResponse.BankSlipUrl;

    if (!string.IsNullOrEmpty(boletoResponse.Url))
        return boletoResponse.Url;

    throw new Exception("PDF não disponível na resposta da API Santander");
}
```

### Backend - Interface

**Arquivo**: `backend/Services/ISantanderBoletoService.cs`

#### Antes:
```csharp
Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, string payerDocumentNumber);
```

#### Depois:
```csharp
Task<string> BaixarPdfBoletoAsync(string bankNumber, string covenantCode, DateTime nsuDate);
```

### Backend - Controller

**Arquivo**: `backend/Controllers/BoletoController.cs`

O controller já estava correto, usando `boleto.NsuDate`:

```csharp
[HttpGet("{id}/pdf")]
public async Task<IActionResult> BaixarPdfBoleto(int id)
{
    // ...
    var pdfLink = await _santanderService.BaixarPdfBoletoAsync(
        boleto.BankNumber,
        covenantCode,
        boleto.NsuDate  // ✅ Já estava usando NsuDate
    );
    // ...
}
```

### Backend - Models

**Arquivo**: `backend/Models/BoletoResponseDTO.cs`

Adicionados campos de PDF à resposta:

```csharp
public class SantanderBoletoResponse
{
    // ... campos existentes ...

    // Campos de PDF adicionados
    public string? PdfUrl { get; set; }
    public string? BankSlipUrl { get; set; }
    public string? Url { get; set; }
}
```

### Frontend

**Arquivo**: `frontend/src/types/boleto.ts`

O tipo já possui o campo necessário:

```typescript
export interface Boleto {
  id: number;
  nsuDate: string;  // ✅ Campo disponível
  // ... outros campos ...
}
```

**Arquivo**: `frontend/src/app/boletos/page.tsx`

O frontend já está correto, chamando o endpoint apropriado:

```typescript
const handleDownloadPdf = async (boleto: Boleto) => {
  const response = await fetch(`${apiUrl}/Boleto/${boleto.id}/pdf`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  // ... download do PDF ...
};
```

## ✅ Vantagens da Solução

1. **Reutiliza código que funciona**: Usa `ConsultarBoletoAsync` que já está testado e funcionando
2. **Mesma autenticação**: Usa o mesmo fluxo de autenticação que funciona para QR Code
3. **Data NSU correta**: Usa `boleto.NsuDate` em vez de data atual
4. **Código mais simples**: Menos duplicação de código
5. **Mais confiável**: Aproveita endpoint que já está validado

## 🎯 Como Funciona Agora

1. Frontend chama: `GET /api/Boleto/{id}/pdf`
2. Controller busca o boleto no banco de dados
3. Controller chama: `BaixarPdfBoletoAsync(bankNumber, covenantCode, nsuDate)`
4. Service chama: `ConsultarBoletoAsync(covenantCode, bankNumber, nsuDate)` (método que funciona)
5. Service extrai o link do PDF da resposta (`PdfUrl`, `BankSlipUrl` ou `Url`)
6. Controller baixa o PDF do link fornecido pelo Santander
7. Controller retorna o PDF para o frontend

## 📝 Notas Importantes

- O método `ConsultarBoletoAsync` já funciona corretamente para obter QR Code
- A API Santander retorna o link do PDF na resposta da consulta
- Não é necessário chamar um endpoint separado para PDF
- A data NSU (`nsuDate`) é essencial para a consulta correta

## 🧪 Testando

Para testar o download de PDF:

1. Acesse a página de boletos: `/boletos`
2. Localize um boleto com status "REGISTRADO"
3. Clique no botão "PDF" (ícone de download)
4. O PDF oficial do Santander deve ser baixado

## 🔍 Troubleshooting

Se o PDF não for baixado:

1. Verifique se o boleto está com status "REGISTRADO"
2. Verifique se o `NsuDate` está correto no banco de dados
3. Verifique os logs do backend para ver a resposta da API Santander
4. Confirme que a API Santander está retornando os campos `PdfUrl`, `BankSlipUrl` ou `Url`

## 📚 Referências

- Documentação da API Santander: Endpoint de consulta de boleto
- Método `ConsultarBoletoAsync` em `SantanderBoletoService.cs`
- Controller `BoletoController.cs` - método `BaixarPdfBoleto`
