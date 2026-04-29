# 📊 API de Consulta de Status de Boletos - Santander

## 📋 Visão Geral

Este documento descreve os endpoints implementados para consulta detalhada de status de boletos através da API do Santander.

A API permite consultar:
- ✅ Status atual do boleto (Ativo, Liquidado, Baixado, etc.)
- ✅ Informações de pagamento e liquidação
- ✅ Dados completos para segunda via
- ✅ Informações de cartório
- ✅ Histórico de baixas e liquidações

---

## 🔗 Endpoints Disponíveis

### Base URL
```
https://seu-backend.com/api/Boleto
```

### Lista de Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/Boleto/{id}/status` | Consulta status de um boleto do sistema pelo ID |
| `GET` | `/api/Boleto/status/nosso-numero` | Consulta status por Nosso Número (beneficiaryCode + bankNumber) |
| `GET` | `/api/Boleto/status/seu-numero` | Consulta status por Seu Número (clientNumber + dueDate + valor) |
| `GET` | `/api/Boleto/status/por-tipo/{billId}` | Consulta detalhada por tipo (default, duplicate, bankslip, settlement, registry) |

---

## 📖 Documentação Detalhada dos Endpoints

### 1. Consultar Status por ID do Boleto

Consulta o status de um boleto cadastrado no sistema usando seu ID interno.

**Endpoint:**
```http
GET /api/Boleto/{id}/status
```

**Parâmetros:**
- `id` (path, obrigatório): ID do boleto no banco de dados

**Exemplo de Requisição:**
```http
GET https://seu-backend.com/api/Boleto/123/status
Authorization: Bearer {seu-token}
X-Usuario-Id: 1
```

**Exemplo de Resposta (200 OK):**
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "clientNumber": "CONT123",
  "nsuCode": "FAT000001",
  "nsuDate": "2024-01-15",
  "status": "ATIVO",
  "statusDescription": "Boleto em aberto (vencido ou a vencer)",
  "dueDate": "2024-02-15",
  "issueDate": "2024-01-15",
  "entryDate": "2024-01-15",
  "nominalValue": 1000.00,
  "paidValue": null,
  "discountValue": null,
  "fineValue": null,
  "interestValue": null,
  "payer": {
    "name": "João da Silva",
    "documentType": "CPF",
    "documentNumber": "12345678900",
    "address": "Rua Exemplo, 123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "qrCodePix": "00020101021226...",
  "qrCodeUrl": "https://pix.santander.com.br/...",
  "barCode": "03399...",
  "digitableLine": "03399.12345...",
  "documentKind": "DUPLICATA_MERCANTIL",
  "messages": ["Mensagem 1", "Mensagem 2"],
  "consultaRealizadaEm": "2024-01-16T10:30:00Z",
  "tipoConsulta": "nossoNumero"
}
```

---

### 2. Consultar Status por Nosso Número

Consulta status usando o código do convênio e o Nosso Número do boleto.

**Endpoint:**
```http
GET /api/Boleto/status/nosso-numero
```

**Query Parameters:**
- `beneficiaryCode` (obrigatório): Código do convênio do beneficiário
- `bankNumber` (obrigatório): Nosso número do boleto (13 caracteres)

**Exemplo de Requisição:**
```http
GET https://seu-backend.com/api/Boleto/status/nosso-numero?beneficiaryCode=0596794&bankNumber=1234567890123
Authorization: Bearer {seu-token}
X-Application-Key: {seu-client-id}
```

**Exemplo de Resposta (200 OK):**
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "LIQUIDADO",
  "statusDescription": "Boleto liquidado (pagamento via linha digitável/código de barras)",
  "settlementDate": "2024-01-20",
  "paidValue": 1000.00,
  "nominalValue": 1000.00,
  "consultaRealizadaEm": "2024-01-21T14:00:00Z",
  "tipoConsulta": "nossoNumero"
}
```

---

### 3. Consultar Status por Seu Número

Consulta status usando o Seu Número (ClientNumber), data de vencimento e valor nominal.

**Endpoint:**
```http
GET /api/Boleto/status/seu-numero
```

**Query Parameters:**
- `beneficiaryCode` (obrigatório): Código do convênio do beneficiário
- `clientNumber` (obrigatório): Seu número do boleto
- `dueDate` (obrigatório): Data de vencimento no formato `YYYY-MM-DD`
- `nominalValue` (obrigatório): Valor nominal com até 2 casas decimais

**Exemplo de Requisição:**
```http
GET https://seu-backend.com/api/Boleto/status/seu-numero?beneficiaryCode=0596794&clientNumber=CONT123&dueDate=2024-02-15&nominalValue=1000.00
Authorization: Bearer {seu-token}
X-Application-Key: {seu-client-id}
```

**Exemplo de Resposta (200 OK):**
```json
{
  "beneficiaryCode": "0596794",
  "clientNumber": "CONT123",
  "status": "ATIVO",
  "dueDate": "2024-02-15",
  "nominalValue": 1000.00,
  "consultaRealizadaEm": "2024-01-21T14:00:00Z",
  "tipoConsulta": "seuNumero"
}
```

---

### 4. Consultar Status por Tipo de Consulta

Consulta detalhes do boleto com diferentes níveis de informação conforme o tipo solicitado.

**Endpoint:**
```http
GET /api/Boleto/status/por-tipo/{billId}
```

**Parâmetros:**
- `billId` (path, obrigatório): ID do boleto no formato `beneficiaryCode.bankNumber` (ex: `0596794.1234567890123`)
- `tipoConsulta` (query, opcional): Tipo de consulta (padrão: `default`)

**Tipos de Consulta Disponíveis:**

| Tipo | Descrição |
|------|-----------|
| `default` | Pesquisa padrão, trazendo somente dados básicos do boleto |
| `duplicate` | Pesquisa de dados para emissão de segunda via de boleto |
| `bankslip` | Pesquisa para dados completos do boleto |
| `settlement` | Pesquisa para informações de baixas/liquidações do boleto |
| `registry` | Pesquisa de informações de cartório no boleto |

**Exemplo de Requisição (Consulta Default):**
```http
GET https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=default
Authorization: Bearer {seu-token}
X-Application-Key: {seu-client-id}
```

**Exemplo de Requisição (Consulta Settlement):**
```http
GET https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=settlement
Authorization: Bearer {seu-token}
X-Application-Key: {seu-client-id}
```

**Exemplo de Resposta (200 OK - Settlement):**
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "LIQUIDADO",
  "statusDescription": "Boleto liquidado (pagamento via linha digitável/código de barras)",
  "settlementDate": "2024-01-20",
  "paidValue": 1000.00,
  "nominalValue": 1000.00,
  "settlements": [
    {
      "settlementType": "PAGAMENTO",
      "settlementDate": "2024-01-20",
      "settlementValue": 1000.00,
      "settlementOrigin": "LINHA_DIGITAVEL",
      "bankCode": "033",
      "bankBranch": "0001"
    }
  ],
  "consultaRealizadaEm": "2024-01-21T14:00:00Z",
  "tipoConsulta": "settlement"
}
```

**Exemplo de Resposta (200 OK - Registry):**
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "ATIVO",
  "registryInfo": {
    "registryDate": "2024-03-15",
    "registryNumber": "123456",
    "notaryOffice": "1º Cartório de Protesto de SP",
    "registryCost": 50.00
  },
  "consultaRealizadaEm": "2024-01-21T14:00:00Z",
  "tipoConsulta": "registry"
}
```

---

## 📊 Status Possíveis

Conforme documentação do Santander, os status possíveis são:

| Status | Descrição | Quando ocorre |
|--------|-----------|---------------|
| **ATIVO** | Boleto em aberto | Boleto ainda não pago, vencido ou a vencer |
| **BAIXADO** | Boleto baixado | Pagamento via PIX (imediatamente após pagamento) |
| **LIQUIDADO** | Boleto liquidado | Pagamento via linha digitável/código de barras (aparece no dia seguinte ao pagamento) |
| **LIQUIDADO PARCIALMENTE** | Liquidação parcial | Pagamento parcial do valor do boleto |

### ⚠️ Observações Importantes sobre Status:

1. **Pagamento via Linha Digitável/Código de Barras:**
   - No dia do pagamento: status permanece `ATIVO`
   - No dia seguinte: status muda para `LIQUIDADO` ou `LIQUIDADO PARCIALMENTE`

2. **Pagamento via PIX:**
   - Status muda para `BAIXADO` imediatamente após o pagamento

3. **Consulta de Complemento de Status:**
   - Use os endpoints `GET por Nosso número` ou `Seu número` para ver detalhes adicionais
   - Para status `BAIXADO`, haverá indicação se foi PIX, Baixa Automática, etc.
   - Para status `ATIVO` com pagamento no mesmo dia, pode aparecer "Baixa Operacional"

---

## 🔐 Autenticação

Todas as requisições requerem:

1. **Bearer Token** no header `Authorization`
2. **X-Application-Key** no header (mesmo valor do `client_id`)
3. **X-Usuario-Id** no header (para endpoints protegidos)

**Exemplo de Headers:**
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
X-Application-Key: seu-client-id-aqui
X-Usuario-Id: 1
```

---

## ⚠️ Tratamento de Erros

### Erros Comuns

**400 Bad Request - Parâmetros Inválidos:**
```json
{
  "mensagem": "beneficiaryCode e bankNumber são obrigatórios."
}
```

**400 Bad Request - Tipo de Consulta Inválido:**
```json
{
  "mensagem": "tipoConsulta inválido.",
  "valoresPermitidos": ["default", "duplicate", "bankslip", "settlement", "registry"],
  "descricoes": {
    "default": "Pesquisa padrão, trazendo somente dados básicos do boleto",
    "duplicate": "Pesquisa de dados para emissão de segunda via de boleto",
    "bankslip": "Pesquisa para dados completos do boleto",
    "settlement": "Pesquisa para informações de baixas/liquidações do boleto",
    "registry": "Pesquisa de informações de cartório no boleto"
  }
}
```

**404 Not Found - Boleto Não Encontrado:**
```json
{
  "mensagem": "Boleto com ID 123 não encontrado."
}
```

**500 Internal Server Error:**
```json
{
  "mensagem": "Erro ao consultar status do boleto",
  "detalhes": "Erro na API Santander: Boleto não encontrado",
  "tipo": "InvalidOperationException"
}
```

---

## 🧪 Exemplos de Uso

### Exemplo 1: Consultar Status de um Boleto Específico

```javascript
// JavaScript/TypeScript
async function consultarStatusBoleto(boletoId) {
  const response = await fetch(`https://api.seubackend.com/api/Boleto/${boletoId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Usuario-Id': '1',
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const statusData = await response.json();
    console.log('Status:', statusData.status);
    console.log('Descrição:', statusData.statusDescription);
    
    if (statusData.status === 'LIQUIDADO') {
      console.log('Data de Liquidação:', statusData.settlementDate);
      console.log('Valor Pago:', statusData.paidValue);
    }
    
    return statusData;
  } else {
    throw new Error('Erro ao consultar status');
  }
}
```

### Exemplo 2: Consultar Status por Nosso Número

```javascript
async function consultarPorNossoNumero(beneficiaryCode, bankNumber) {
  const url = new URL('https://api.seubackend.com/api/Boleto/status/nosso-numero');
  url.searchParams.append('beneficiaryCode', beneficiaryCode);
  url.searchParams.append('bankNumber', bankNumber);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return await response.json();
}

// Uso
const status = await consultarPorNossoNumero('0596794', '1234567890123');
```

### Exemplo 3: Consultar Detalhes de Liquidação

```javascript
async function consultarLiquidacao(billId) {
  const response = await fetch(
    `https://api.seubackend.com/api/Boleto/status/por-tipo/${billId}?tipoConsulta=settlement`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  
  if (data.settlements && data.settlements.length > 0) {
    console.log('Liquidações encontradas:');
    data.settlements.forEach(settlement => {
      console.log(`- Tipo: ${settlement.settlementType}`);
      console.log(`  Data: ${settlement.settlementDate}`);
      console.log(`  Valor: R$ ${settlement.settlementValue}`);
      console.log(`  Origem: ${settlement.settlementOrigin}`);
    });
  }
  
  return data;
}
```

### Exemplo 4: Verificar se Boleto Foi Pago

```javascript
async function verificarPagamento(boletoId) {
  const status = await consultarStatusBoleto(boletoId);
  
  const statusPagos = ['LIQUIDADO', 'LIQUIDADO PARCIALMENTE', 'BAIXADO'];
  
  if (statusPagos.includes(status.status)) {
    console.log('✅ Boleto pago!');
    console.log(`Valor pago: R$ ${status.paidValue}`);
    
    if (status.status === 'BAIXADO') {
      console.log('Pagamento realizado via PIX');
    } else {
      console.log('Pagamento realizado via linha digitável/código de barras');
    }
    
    return true;
  } else {
    console.log('❌ Boleto ainda não foi pago');
    console.log(`Status atual: ${status.status}`);
    return false;
  }
}
```

---

## 📝 Notas de Implementação

### Ambiente de Produção

A implementação utiliza as URLs de **PRODUÇÃO** do Santander:
```
https://trust-open.api.santander.com.br/collection_bill_management/v2/bills
```

### Credenciais Necessárias

As seguintes configurações devem estar no `appsettings.json`:

```json
{
  "SantanderAPI": {
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "CovenantCode": "seu-codigo-convenio",
    "ClientId": "seu-client-id",
    "ClientSecret": "seu-client-secret",
    "CertificateThumbprint": "thumbprint-do-certificado",
    "CertificatePath": "caminho/para/certificado.pfx",
    "CertificatePassword": "senha-do-certificado"
  }
}
```

### Certificado mTLS

A API Santander requer autenticação mTLS (mutual TLS). O certificado deve estar:
- Instalado no servidor (Windows/Linux)
- Ou disponível como arquivo .pfx com senha

---

## 🚀 Próximos Passos

1. **Testar os endpoints** em ambiente de desenvolvimento/homologação
2. **Validar respostas** com dados reais do Santander
3. **Implementar frontend** para exibir as informações de status
4. **Criar sincronização automática** para atualizar status periodicamente
5. **Adicionar webhooks** (se disponível) para receber notificações de mudança de status

---

## 📞 Suporte

Para dúvidas sobre a API Santander:
- Documentação oficial: Portal do Desenvolvedor Santander
- Suporte técnico: Entre em contato com seu gerente de relacionamento Santander

Para dúvidas sobre a implementação:
- Verifique os logs do servidor para detalhes de erros
- Consulte o código fonte em `Services/SantanderBoletoService.cs`

---

**Última Atualização:** 2024-01-21  
**Versão da API:** v2  
**Ambiente:** Produção

