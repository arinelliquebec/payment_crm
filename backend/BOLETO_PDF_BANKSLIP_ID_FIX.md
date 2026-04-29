# 🔧 Fix: Erro "Formato da chave bankslip_id inválido" no Download de PDF

## 📋 Problema Identificado

Erro ao baixar PDF de boleto:
```
"Formato da chave bankslip_id inválido"
Error Code: 2084
Field: bankslip_id
```

**Erro completo:**
```json
{
  "mensagem": "Erro interno do servidor",
  "detalhes": "Erro ao consultar boleto: BadRequest - {\"_errorCode\":400,\"_message\":\"Request validation exception\",\"_timestamp\":\"2025-11-17T03:46:23.254388344-03:00\",\"_traceId\":\"95d7a208-49f0-4a0d-9c6a-bc4e88d3ab79\",\"_errors\":[{\"_code\":\"2084\",\"_field\":\"bankslip_id\",\"_message\":\"Formato da chave bankslip_id inválido\"}]}",
  "tipo": "InvalidOperationException"
}
```

## 🔍 Causa Raiz

O método `DownloadPdf` no `BoletoController` estava usando o `CovenantCode` da **configuração** ao invés do `CovenantCode` **armazenado no boleto**.

### Por que isso causa erro?

1. Quando um boleto é criado, ele é registrado no Santander usando: `bankslip_id = {CovenantCode}{BankNumber}`
2. O `CovenantCode` usado no registro é salvo no campo `boleto.CovenantCode`
3. Ao baixar o PDF, o código estava construindo: `bankslip_id = {CovenantCode_da_configuração}{BankNumber}`
4. Se o `CovenantCode` da configuração for diferente do usado no registro, o `bankslip_id` não corresponde e a API retorna erro 400

### Código Problemático

**Antes (linha 799):**
```csharp
var covenantCode = _configuration["SantanderAPI:CovenantCode"] ?? "0596794";
```

Isso ignorava o `CovenantCode` armazenado no boleto, causando inconsistência.

## ✅ Solução Implementada

### Correção no `BoletoController.cs` - Método `DownloadPdf`

**Depois:**
```csharp
if (string.IsNullOrEmpty(boleto.CovenantCode))
{
    return BadRequest(new { mensagem = "Boleto não possui CovenantCode válido. O boleto precisa ter sido registrado na API Santander para realizar o download do PDF." });
}

// Usar APENAS o CovenantCode do boleto (usado quando foi registrado) para garantir que o bankslip_id seja correto
// Não usar fallback - apenas dados reais da API Santander
var covenantCode = boleto.CovenantCode;
```

### Por que essa solução funciona?

1. **Usa APENAS dados reais**: Garante que apenas boletos registrados na API Santander possam ter PDF baixado
2. **Validação rigorosa**: Retorna erro claro se o boleto não tiver `CovenantCode` (não foi registrado)
3. **Consistência**: O `bankslip_id` construído será sempre: `{CovenantCode_do_registro}{BankNumber}` usando dados reais da API
4. **Sem fallbacks fictícios**: Não usa valores padrão da configuração, apenas dados reais do boleto registrado

## 📊 Verificação de Outros Métodos

Verificados outros métodos que usam `bankslip_id`:

✅ **`ConsultarBoletoAsync` (linha 258)**: Já usa `boleto.CovenantCode` corretamente
✅ **`CancelarBoletoAsync` (linha 304)**: Já usa `boleto.CovenantCode` corretamente
✅ **`BaixarPdfBoletoAsync` (linha 810)**: Agora corrigido para usar `covenantCode` que prioriza `boleto.CovenantCode`

## 🧪 Como Testar

1. Criar um boleto (ele será registrado com um `CovenantCode` específico)
2. Verificar que o `CovenantCode` foi salvo no banco de dados
3. Tentar baixar o PDF do boleto
4. O download deve funcionar corretamente, usando o mesmo `CovenantCode` do registro

## 📝 Formato do bankslip_id

Segundo a documentação da API Santander:
```
bankslip_id = {CovenantCode}{BankNumber}
```

**Exemplo:**
- CovenantCode: `0596794` (9 caracteres)
- BankNumber: `0000000001234` (13 caracteres)
- bankslip_id: `05967940000000001234` (22 caracteres)

## 🎯 Impacto

- ✅ Corrige o erro 400 "Formato da chave bankslip_id inválido"
- ✅ Garante consistência entre registro e download
- ✅ Usa APENAS dados reais da API Santander (sem fallbacks fictícios)
- ✅ Retorna erro claro se o boleto não foi registrado na API Santander
- ✅ Não requer mudanças no frontend

## 📅 Data da Correção

17/11/2025

