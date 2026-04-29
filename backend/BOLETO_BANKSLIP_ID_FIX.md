# Fix: Formato do bankslip_id na API Santander

## Problema Identificado

Erro ao sincronizar boleto:
```
"Formato da chave bankslip_id inválido"
Error Code: 2084
```

## Causa Raiz

O código estava usando apenas o `NsuCode` como `bankslip_id` na URL da API Santander, mas a API espera o formato correto: `{covenantCode}{bankNumber}`

## Correções Aplicadas

### 1. SantanderBoletoService.cs - ConsultarBoletoAsync

**Antes:**
```csharp
public async Task<SantanderBoletoResponse> ConsultarBoletoAsync(string nsuCode, DateTime nsuDate)
{
    var endpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{nsuCode}?nsuDate={nsuDate:yyyy-MM-dd}";
}
```

**Depois:**
```csharp
public async Task<SantanderBoletoResponse> ConsultarBoletoAsync(string covenantCode, string bankNumber, DateTime nsuDate)
{
    var bankslipId = $"{covenantCode}{bankNumber}";
    var endpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{bankslipId}?nsuDate={nsuDate:yyyy-MM-dd}";
}
```

### 2. SantanderBoletoService.cs - CancelarBoletoAsync

**Antes:**
```csharp
public async Task<bool> CancelarBoletoAsync(string nsuCode, DateTime nsuDate)
{
    var endpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{nsuCode}?nsuDate={nsuDate:yyyy-MM-dd}";
}
```

**Depois:**
```csharp
public async Task<bool> CancelarBoletoAsync(string covenantCode, string bankNumber, DateTime nsuDate)
{
    var bankslipId = $"{covenantCode}{bankNumber}";
    var endpoint = $"/collection_bill_management/v2/workspaces/{_workspaceId}/bank_slips/{bankslipId}?nsuDate={nsuDate:yyyy-MM-dd}";
}
```

### 3. BoletoController.cs - Sincronizar endpoint

**Antes:**
```csharp
var santanderResponse = await _santanderService.ConsultarBoletoAsync(boleto.NsuCode, boleto.NsuDate);
```

**Depois:**
```csharp
var santanderResponse = await _santanderService.ConsultarBoletoAsync(boleto.CovenantCode, boleto.BankNumber, boleto.NsuDate);
```

## Formato Correto do bankslip_id

Segundo a documentação da API Santander:

```
bankslip_id = {covenantCode}{bankNumber}
```

Exemplo:
- CovenantCode: `0012345`
- BankNumber: `0000000001234`
- bankslip_id: `00123450000000001234`

## Campos do Modelo Boleto Utilizados

- `CovenantCode`: Código do convênio (9 caracteres)
- `BankNumber`: Nosso número (13 caracteres)
- `NsuDate`: Data do NSU para consulta

## Teste

Após as correções, o endpoint de sincronização deve funcionar corretamente:

```http
PUT /api/Boleto/{id}/sincronizar
```

O sistema agora constrói o `bankslip_id` corretamente concatenando `CovenantCode` + `BankNumber`.
