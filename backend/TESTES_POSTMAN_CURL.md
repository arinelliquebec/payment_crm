# 🧪 Testes - APIs de Consulta de Status de Boletos

## 📋 Pré-requisitos

Antes de testar, você precisará de:
- ✅ Token de autenticação válido
- ✅ X-Usuario-Id (ID do usuário logado)
- ✅ ID de um boleto existente no sistema
- ✅ BankNumber de um boleto registrado no Santander
- ✅ Código do convênio (BeneficiaryCode)

---

## 🔐 1. Obter Token de Autenticação

### Postman
```
POST {{base_url}}/api/Auth/login
Content-Type: application/json

{
  "email": "seu-email@exemplo.com",
  "senha": "sua-senha"
}
```

### cURL
```bash
curl -X POST "https://seu-backend.com/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu-email@exemplo.com",
    "senha": "sua-senha"
  }'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "seu-email@exemplo.com"
  }
}
```

---

## 📊 2. Consultar Status de Boleto por ID

### Postman

**Request:**
```
GET {{base_url}}/api/Boleto/{{boleto_id}}/status
Authorization: Bearer {{token}}
X-Usuario-Id: {{usuario_id}}
```

**Variáveis do Postman:**
- `base_url`: `https://seu-backend.com`
- `boleto_id`: `123`
- `token`: (cole o token obtido no login)
- `usuario_id`: `1`

### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/123/status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Usuario-Id: 1"
```

### Resposta Esperada (200 OK)
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
  "qrCodePix": "00020101021226900014br.gov.bcb.pix...",
  "qrCodeUrl": "https://pix.santander.com.br/qr/...",
  "barCode": "03399123450000010000001234567890123",
  "digitableLine": "03399.12345 00001.000000 12345.678901 2 34567890123",
  "documentKind": "DUPLICATA_MERCANTIL",
  "messages": ["Mensagem 1", "Mensagem 2"],
  "consultaRealizadaEm": "2024-01-16T10:30:00Z",
  "tipoConsulta": "nossoNumero"
}
```

### Possíveis Erros

**404 Not Found:**
```json
{
  "mensagem": "Boleto com ID 123 não encontrado."
}
```

**400 Bad Request:**
```json
{
  "mensagem": "Boleto não possui BankNumber válido para consulta de status."
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

## 🔍 3. Consultar Status por Nosso Número

### Postman

**Request:**
```
GET {{base_url}}/api/Boleto/status/nosso-numero?beneficiaryCode={{beneficiary_code}}&bankNumber={{bank_number}}
Authorization: Bearer {{token}}
```

**Variáveis:**
- `beneficiary_code`: `0596794` (código do convênio)
- `bank_number`: `1234567890123` (nosso número - 13 dígitos)

### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/nosso-numero?beneficiaryCode=0596794&bankNumber=1234567890123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Resposta Esperada (Boleto Liquidado)
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "LIQUIDADO",
  "statusDescription": "Boleto liquidado (pagamento via linha digitável/código de barras)",
  "dueDate": "2024-02-15",
  "issueDate": "2024-01-15",
  "settlementDate": "2024-02-16",
  "nominalValue": 1000.00,
  "paidValue": 1000.00,
  "discountValue": 0,
  "fineValue": 0,
  "interestValue": 0,
  "consultaRealizadaEm": "2024-02-17T10:00:00Z",
  "tipoConsulta": "nossoNumero"
}
```

### Possíveis Erros

**400 Bad Request:**
```json
{
  "mensagem": "beneficiaryCode e bankNumber são obrigatórios."
}
```

**500 Internal Server Error (Boleto não encontrado na API Santander):**
```json
{
  "mensagem": "Erro ao consultar status do boleto",
  "detalhes": "Erro na API Santander: Boleto não encontrado na base de cobrança",
  "tipo": "InvalidOperationException"
}
```

---

## 📝 4. Consultar Status por Seu Número

### Postman

**Request:**
```
GET {{base_url}}/api/Boleto/status/seu-numero?beneficiaryCode={{beneficiary_code}}&clientNumber={{client_number}}&dueDate={{due_date}}&nominalValue={{nominal_value}}
Authorization: Bearer {{token}}
```

**Variáveis:**
- `beneficiary_code`: `0596794`
- `client_number`: `CONT123`
- `due_date`: `2024-02-15` (formato YYYY-MM-DD)
- `nominal_value`: `1000.00`

### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/seu-numero?beneficiaryCode=0596794&clientNumber=CONT123&dueDate=2024-02-15&nominalValue=1000.00" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Resposta Esperada
```json
{
  "beneficiaryCode": "0596794",
  "clientNumber": "CONT123",
  "status": "ATIVO",
  "statusDescription": "Boleto em aberto (vencido ou a vencer)",
  "dueDate": "2024-02-15",
  "nominalValue": 1000.00,
  "consultaRealizadaEm": "2024-01-17T14:30:00Z",
  "tipoConsulta": "seuNumero"
}
```

### Possíveis Erros

**400 Bad Request (Parâmetros faltando):**
```json
{
  "mensagem": "beneficiaryCode, clientNumber, dueDate e nominalValue são obrigatórios."
}
```

**400 Bad Request (Data inválida):**
```json
{
  "mensagem": "dueDate deve estar no formato YYYY-MM-DD."
}
```

---

## 📋 5. Consultar Status por Tipo

### Tipo: Default (Dados Básicos)

#### Postman
```
GET {{base_url}}/api/Boleto/status/por-tipo/{{bill_id}}?tipoConsulta=default
Authorization: Bearer {{token}}
```

**Variáveis:**
- `bill_id`: `0596794.1234567890123` (formato: beneficiaryCode.bankNumber)

#### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=default" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Tipo: Duplicate (Segunda Via)

#### Postman
```
GET {{base_url}}/api/Boleto/status/por-tipo/{{bill_id}}?tipoConsulta=duplicate
Authorization: Bearer {{token}}
```

#### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=duplicate" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta esperada:** Dados completos para gerar segunda via do boleto

---

### Tipo: Bankslip (Dados Completos)

#### Postman
```
GET {{base_url}}/api/Boleto/status/por-tipo/{{bill_id}}?tipoConsulta=bankslip
Authorization: Bearer {{token}}
```

#### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=bankslip" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta esperada:** Todos os dados do boleto incluindo mensagens, descontos, multas, etc.

---

### Tipo: Settlement (Liquidações)

#### Postman
```
GET {{base_url}}/api/Boleto/status/por-tipo/{{bill_id}}?tipoConsulta=settlement
Authorization: Bearer {{token}}
```

#### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=settlement" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Resposta Esperada (Boleto Liquidado)
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "LIQUIDADO",
  "statusDescription": "Boleto liquidado (pagamento via linha digitável/código de barras)",
  "settlementDate": "2024-02-16",
  "paidValue": 1000.00,
  "nominalValue": 1000.00,
  "settlements": [
    {
      "settlementType": "PAGAMENTO",
      "settlementDate": "2024-02-16",
      "settlementValue": 1000.00,
      "settlementOrigin": "LINHA_DIGITAVEL",
      "bankCode": "033",
      "bankBranch": "0001"
    }
  ],
  "consultaRealizadaEm": "2024-02-17T14:00:00Z",
  "tipoConsulta": "settlement"
}
```

---

### Tipo: Registry (Cartório)

#### Postman
```
GET {{base_url}}/api/Boleto/status/por-tipo/{{bill_id}}?tipoConsulta=registry
Authorization: Bearer {{token}}
```

#### cURL
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=registry" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Resposta Esperada (Boleto Protestado)
```json
{
  "beneficiaryCode": "0596794",
  "bankNumber": "1234567890123",
  "status": "ATIVO",
  "statusDescription": "Boleto em aberto (vencido ou a vencer)",
  "registryInfo": {
    "registryDate": "2024-03-15",
    "registryNumber": "123456",
    "notaryOffice": "1º Cartório de Protesto de São Paulo",
    "registryCost": 50.00
  },
  "consultaRealizadaEm": "2024-03-20T10:00:00Z",
  "tipoConsulta": "registry"
}
```

---

### Possíveis Erros (Por Tipo)

**400 Bad Request (BillId inválido):**
```json
{
  "mensagem": "billId é obrigatório (formato: beneficiaryCode.bankNumber)."
}
```

**400 Bad Request (Tipo inválido):**
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

---

## 🧪 Cenários de Teste

### Cenário 1: Boleto Ativo (Não Pago)

**Request:**
```bash
curl -X GET "https://seu-backend.com/api/Boleto/123/status" \
  -H "Authorization: Bearer {token}" \
  -H "X-Usuario-Id: 1"
```

**Resultado Esperado:**
- Status: `ATIVO`
- `paidValue`: `null`
- `settlementDate`: `null`

---

### Cenário 2: Boleto Liquidado (Pago via Linha Digitável)

**Request:**
```bash
curl -X GET "https://seu-backend.com/api/Boleto/124/status" \
  -H "Authorization: Bearer {token}" \
  -H "X-Usuario-Id: 1"
```

**Resultado Esperado:**
- Status: `LIQUIDADO`
- `paidValue`: valor pago (ex: 1000.00)
- `settlementDate`: data do pagamento (ex: "2024-02-16")
- Nota: Status muda para LIQUIDADO no dia seguinte ao pagamento

---

### Cenário 3: Boleto Baixado (Pago via PIX)

**Request:**
```bash
curl -X GET "https://seu-backend.com/api/Boleto/125/status" \
  -H "Authorization: Bearer {token}" \
  -H "X-Usuario-Id: 1"
```

**Resultado Esperado:**
- Status: `BAIXADO`
- `paidValue`: valor pago
- `settlementDate`: data do pagamento
- Nota: Status muda para BAIXADO imediatamente após pagamento via PIX

---

### Cenário 4: Verificar Liquidações Detalhadas

**Request:**
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=settlement" \
  -H "Authorization: Bearer {token}"
```

**Resultado Esperado:**
- Array `settlements` com histórico de liquidações
- Cada item contém: tipo, data, valor, origem, banco
- Útil para reconciliação financeira

---

### Cenário 5: Boleto Protestado em Cartório

**Request:**
```bash
curl -X GET "https://seu-backend.com/api/Boleto/status/por-tipo/0596794.1234567890123?tipoConsulta=registry" \
  -H "Authorization: Bearer {token}"
```

**Resultado Esperado:**
- Objeto `registryInfo` com dados do protesto
- Contém: data, número, cartório, custo

---

## 📦 Collection do Postman

### Importar Collection

Crie um arquivo `boleto-status-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Boleto Status API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://seu-backend.com"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "usuario_id",
      "value": "1"
    },
    {
      "key": "boleto_id",
      "value": "123"
    },
    {
      "key": "beneficiary_code",
      "value": "0596794"
    },
    {
      "key": "bank_number",
      "value": "1234567890123"
    }
  ],
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"seu-email@exemplo.com\",\n  \"senha\": \"sua-senha\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/Auth/login",
          "host": ["{{base_url}}"],
          "path": ["api", "Auth", "login"]
        }
      }
    },
    {
      "name": "2. Consultar Status por ID",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "X-Usuario-Id",
            "value": "{{usuario_id}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/Boleto/{{boleto_id}}/status",
          "host": ["{{base_url}}"],
          "path": ["api", "Boleto", "{{boleto_id}}", "status"]
        }
      }
    },
    {
      "name": "3. Consultar por Nosso Número",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/Boleto/status/nosso-numero?beneficiaryCode={{beneficiary_code}}&bankNumber={{bank_number}}",
          "host": ["{{base_url}}"],
          "path": ["api", "Boleto", "status", "nosso-numero"],
          "query": [
            {
              "key": "beneficiaryCode",
              "value": "{{beneficiary_code}}"
            },
            {
              "key": "bankNumber",
              "value": "{{bank_number}}"
            }
          ]
        }
      }
    },
    {
      "name": "4. Consultar por Tipo (Settlement)",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/Boleto/status/por-tipo/{{beneficiary_code}}.{{bank_number}}?tipoConsulta=settlement",
          "host": ["{{base_url}}"],
          "path": ["api", "Boleto", "status", "por-tipo", "{{beneficiary_code}}.{{bank_number}}"],
          "query": [
            {
              "key": "tipoConsulta",
              "value": "settlement"
            }
          ]
        }
      }
    }
  ]
}
```

### Como Usar

1. Abrir Postman
2. File → Import → Arrastar o arquivo JSON
3. Editar variáveis (base_url, etc.)
4. Executar "1. Login" para obter token
5. Copiar token para variável `token`
6. Executar outros endpoints

---

## ✅ Checklist de Testes

### Testes Básicos
- [ ] Login funcionando e retornando token
- [ ] Consultar status por ID retorna 200 OK
- [ ] Consultar status por Nosso Número retorna 200 OK
- [ ] Consultar status por Seu Número retorna 200 OK
- [ ] Consultar por tipo=default retorna 200 OK
- [ ] Consultar por tipo=settlement retorna 200 OK

### Testes de Validação
- [ ] Consultar sem token retorna 401 Unauthorized
- [ ] Consultar ID inexistente retorna 404 Not Found
- [ ] Consultar com parâmetros faltando retorna 400 Bad Request
- [ ] Consultar com tipo inválido retorna 400 Bad Request com lista de tipos válidos

### Testes de Dados
- [ ] Status "ATIVO" retorna campos corretos
- [ ] Status "LIQUIDADO" retorna paidValue e settlementDate
- [ ] Status "BAIXADO" retorna dados de pagamento via PIX
- [ ] Tipo "settlement" retorna array de liquidações
- [ ] Tipo "registry" retorna dados de cartório (se aplicável)

### Testes de Performance
- [ ] Resposta em menos de 3 segundos (primeira chamada)
- [ ] Resposta em menos de 1 segundo (com token cacheado)
- [ ] Consultas simultâneas funcionam corretamente

---

## 🚀 Próximos Passos

1. ✅ **Testar com dados reais** do Santander
2. ✅ **Validar todos os status** possíveis
3. ✅ **Testar cenários de erro** da API Santander
4. ✅ **Verificar logs** do servidor durante testes
5. ✅ **Documentar casos especiais** encontrados

---

**Pronto para testar! 🎉**

