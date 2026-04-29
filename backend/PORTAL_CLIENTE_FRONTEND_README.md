# 🌐 Portal do Cliente - Documentação Frontend

**Data:** 12/12/2024  
**Versão:** 1.0

---

## 📋 Visão Geral

Portal self-service para clientes da Arrighi Advogados onde podem:
- Consultar seus contratos
- Visualizar e baixar boletos
- Acompanhar pagamentos
- Baixar PDFs de contratos e boletos

---

## 🔗 Base URL da API

```
Produção: https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net
Desenvolvimento: http://localhost:5101
```

Todos os endpoints do portal começam com `/api/Portal/`

---

## 🔐 Autenticação

### Fluxo de Primeiro Acesso

```
1. Cliente acessa "Primeiro Acesso"
2. Informa CPF/CNPJ + Email
3. Sistema valida e envia email com link
4. Cliente clica no link e define senha
5. Cliente faz login normalmente
```

### Fluxo de Login Normal

```
1. Cliente informa CPF/CNPJ + Senha
2. API retorna JWT token + dados do cliente
3. Frontend armazena token e usa nos headers
```

### Headers de Autenticação

```http
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 📚 Endpoints

### 1. Autenticação (`/api/Portal/auth`)

#### POST `/api/Portal/auth/login`
Login do cliente.

**Request:**
```json
{
  "documento": "12345678901",  // CPF ou CNPJ (com ou sem formatação)
  "senha": "minhasenha123"
}
```

**Response - Sucesso:**
```json
{
  "sucesso": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "cliente": {
    "clienteId": 123,
    "nome": "João Silva",
    "documento": "12345678901",
    "tipoDocumento": "CPF",
    "email": "joao@email.com",
    "totalContratos": 2,
    "boletosPendentes": 3
  }
}
```

**Response - Erro:**
```json
{
  "sucesso": false,
  "erro": "Senha incorreta"
}
```

---

#### POST `/api/Portal/auth/primeiro-acesso`
Solicita criação de conta/primeiro acesso.

**Request:**
```json
{
  "documento": "12345678901",
  "email": "joao@email.com"
}
```

**Response:**
```json
{
  "sucesso": true,
  "mensagem": "Email enviado com sucesso! Verifique sua caixa de entrada."
}
```

**Erros possíveis:**
- `"CPF/CNPJ não encontrado no sistema ou não está cadastrado como cliente."`
- `"Email não confere com o cadastro."`
- `"Você já possui acesso ao portal. Use 'Esqueci minha senha' se necessário."`

---

#### POST `/api/Portal/auth/definir-senha`
Define senha (primeiro acesso ou recuperação).

**Request:**
```json
{
  "token": "abc123...",
  "novaSenha": "minhasenha123",
  "confirmarSenha": "minhasenha123"
}
```

**Response:**
```json
{
  "sucesso": true,
  "mensagem": "Senha definida com sucesso!"
}
```

---

#### POST `/api/Portal/auth/recuperar-senha`
Solicita recuperação de senha.

**Request:**
```json
{
  "documento": "12345678901"
}
```

**Response:**
```json
{
  "sucesso": true,
  "mensagem": "Se o documento estiver cadastrado, você receberá um email."
}
```

---

#### GET `/api/Portal/auth/validar-token?token=xxx`
Valida se um token de recuperação/primeiro acesso é válido.

**Response:**
```json
{
  "valido": true
}
```

---

### 2. Contratos (`/api/Portal/contratos`)

> ⚠️ **Requer autenticação** - Enviar token no header

#### GET `/api/Portal/contratos`
Lista todos os contratos do cliente.

**Response:**
```json
[
  {
    "id": 1,
    "numeroPasta": "2024/001",
    "situacao": "CLIENTE",
    "primeiroVencimento": "2024-01-15",
    "numeroParcelas": 36,
    "valorParcela": 500.00,
    "valorTotal": 18000.00,
    "parcelasPagas": 11,
    "parcelasPendentes": 25,
    "proximoVencimento": "2024-12-15",
    "temPdfContrato": true
  }
]
```

---

#### GET `/api/Portal/contratos/{id}`
Detalhes de um contrato específico.

**Response:**
```json
{
  "id": 1,
  "numeroPasta": "2024/001",
  "situacao": "CLIENTE",
  "dataContrato": "2023-12-01",
  "primeiroVencimento": "2024-01-15",
  "numeroParcelas": 36,
  "valorParcela": 500.00,
  "valorTotal": 18000.00,
  "observacoes": "Contrato de honorários",
  "totalBoletos": 12,
  "boletosPagos": 11,
  "boletosPendentes": 1,
  "valorPago": 5500.00,
  "valorPendente": 500.00,
  "temPdfContrato": true,
  "boletos": [
    {
      "id": 45,
      "numeroParcela": 12,
      "totalParcelas": 36,
      "parcelaDescricao": "12/36",
      "dataVencimento": "2024-12-15",
      "valor": 500.00,
      "status": "REGISTRADO",
      "statusDescricao": "Aguardando Pagamento",
      "foiPago": false,
      "podeDownloadPdf": true,
      "podePagar": true
    }
  ]
}
```

---

#### GET `/api/Portal/contratos/{id}/pdf`
Download do PDF do contrato.

**Response:** Arquivo PDF (application/pdf)

---

### 3. Boletos (`/api/Portal/boletos`)

> ⚠️ **Requer autenticação** - Enviar token no header

#### GET `/api/Portal/boletos`
Lista todos os boletos do cliente.

**Query Parameters:**
- `status` (opcional): Filtrar por status (REGISTRADO, ATIVO, BAIXADO, LIQUIDADO)
- `pendentes` (opcional): `true` para mostrar apenas pendentes

**Exemplos:**
```
GET /api/Portal/boletos
GET /api/Portal/boletos?pendentes=true
GET /api/Portal/boletos?status=LIQUIDADO
```

**Response:**
```json
[
  {
    "id": 45,
    "contratoId": 1,
    "numeroPasta": "2024/001",
    "numeroParcela": 12,
    "totalParcelas": 36,
    "parcelaDescricao": "12/36",
    "dataVencimento": "2024-12-15",
    "valor": 500.00,
    "status": "REGISTRADO",
    "statusDescricao": "Aguardando Pagamento",
    "foiPago": false,
    "valorPago": null,
    "dataPagamento": null,
    "podeDownloadPdf": true,
    "podePagar": true
  }
]
```

---

#### GET `/api/Portal/boletos/{id}`
Detalhes de um boleto específico.

**Response:**
```json
{
  "id": 45,
  "contratoId": 1,
  "numeroPasta": "2024/001",
  "numeroParcela": 12,
  "totalParcelas": 36,
  "parcelaDescricao": "12/36",
  "dataVencimento": "2024-12-15",
  "dataEmissao": "2024-12-01",
  "valorNominal": 500.00,
  "valorPago": null,
  "status": "REGISTRADO",
  "statusDescricao": "Aguardando Pagamento",
  "foiPago": false,
  "dataPagamento": null,
  "codigoBarras": "23793.38128 60000.000003 00000.000406 1 92310000050000",
  "linhaDigitavel": "23793381286000000000300000004061923100000500 00",
  "qrCodePix": "00020126580014br.gov.bcb.pix...",
  "qrCodeUrl": "https://...",
  "podeDownloadPdf": true,
  "podePagar": true
}
```

---

#### GET `/api/Portal/boletos/{id}/pdf`
Download do PDF do boleto.

**Response:** Arquivo PDF (application/pdf)

---

#### GET `/api/Portal/boletos/dashboard`
Dashboard com resumo geral do cliente.

**Response:**
```json
{
  "cliente": {
    "clienteId": 123,
    "nome": "João Silva",
    "documento": "12345678901",
    "tipoDocumento": "CPF",
    "email": "joao@email.com",
    "totalContratos": 2,
    "boletosPendentes": 3
  },
  "totalContratos": 2,
  "contratosAtivos": 2,
  "totalBoletos": 24,
  "boletosPendentes": 3,
  "boletosVencidos": 1,
  "valorTotalPendente": 1500.00,
  "proximosVencimentos": [
    {
      "id": 45,
      "numeroPasta": "2024/001",
      "parcelaDescricao": "12/36",
      "dataVencimento": "2024-12-15",
      "valor": 500.00,
      "statusDescricao": "Aguardando Pagamento"
    }
  ]
}
```

---

## 🎨 Sugestão de Telas

### 1. Login
```
┌─────────────────────────────────────┐
│          LOGO ARRIGHI               │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ CPF ou CNPJ                 │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │ Senha                       │   │
│   └─────────────────────────────┘   │
│                                     │
│   [        ENTRAR        ]          │
│                                     │
│   Primeiro acesso? | Esqueci senha  │
└─────────────────────────────────────┘
```

### 2. Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Olá, João Silva!                           [Sair]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 2        │  │ 3        │  │ R$1.500  │          │
│  │ Contratos│  │ Boletos  │  │ Pendente │          │
│  └──────────┘  │ Pendentes│  └──────────┘          │
│                └──────────┘                         │
│                                                     │
│  Próximos Vencimentos                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ 2024/001 - Parcela 12/36                    │   │
│  │ Vencimento: 15/12/2024  |  R$ 500,00        │   │
│  │ [Ver Boleto] [Baixar PDF]                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3. Lista de Contratos
```
┌─────────────────────────────────────────────────────┐
│  Meus Contratos                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📁 2024/001                                  │   │
│  │ Status: Ativo  |  Parcelas: 11/36 pagas     │   │
│  │ Valor: R$ 500,00/mês  |  Total: R$ 18.000   │   │
│  │ Próximo venc.: 15/12/2024                    │   │
│  │ [Ver Detalhes] [📄 Contrato PDF]             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📁 2023/045                                  │   │
│  │ Status: Quitado  |  Parcelas: 12/12 pagas   │   │
│  │ [Ver Detalhes]                               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 4. Lista de Boletos
```
┌─────────────────────────────────────────────────────┐
│  Meus Boletos                                       │
│  [Todos] [Pendentes] [Pagos]                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Parcela 12/36 - Contrato 2024/001           │   │
│  │ Vencimento: 15/12/2024  |  R$ 500,00        │   │
│  │ Status: 🟡 Aguardando Pagamento              │   │
│  │ [Ver Detalhes] [📄 PDF] [📋 Copiar PIX]      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Parcela 11/36 - Contrato 2024/001           │   │
│  │ Vencimento: 15/11/2024  |  R$ 500,00        │   │
│  │ Status: 🟢 Pago em 14/11/2024               │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 5. Detalhe do Boleto
```
┌─────────────────────────────────────────────────────┐
│  ← Voltar                                           │
│                                                     │
│  Boleto - Parcela 12/36                            │
│  Contrato: 2024/001                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Vencimento: 15/12/2024                            │
│  Valor: R$ 500,00                                   │
│  Status: 🟡 Aguardando Pagamento                   │
│                                                     │
│  ─────────────────────────────────────             │
│  📱 PIX (Copia e Cola)                             │
│  ┌─────────────────────────────────────────────┐   │
│  │ 00020126580014br.gov.bcb.pix...              │   │
│  │                                [📋 Copiar]   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ─────────────────────────────────────             │
│  📋 Linha Digitável                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 23793.38128 60000.000003 00000.000406...    │   │
│  │                                [📋 Copiar]   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [        📄 Baixar PDF do Boleto        ]         │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Status e Cores Sugeridas

| Status | Cor | Descrição |
|--------|-----|-----------|
| Aguardando Pagamento | 🟡 Amarelo | Boleto disponível para pagamento |
| Pago | 🟢 Verde | Pagamento confirmado |
| Pago (PIX) | 🟢 Verde | Pagamento via PIX confirmado |
| Vencido | 🔴 Vermelho | Vencido e não pago |
| Baixado (Não Pago) | 🟠 Laranja | Expirou sem pagamento |
| Cancelado | ⚫ Cinza | Boleto cancelado |

---

## 💡 Dicas de Implementação

### Armazenamento do Token
```javascript
// Após login bem-sucedido
localStorage.setItem('portal_token', response.token);
localStorage.setItem('portal_cliente', JSON.stringify(response.cliente));

// Configurar axios
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Interceptor para Token Expirado
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('portal_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Copiar para Área de Transferência
```javascript
async function copiarTexto(texto) {
  await navigator.clipboard.writeText(texto);
  toast.success('Copiado!');
}
```

### Download de PDF
```javascript
async function downloadPdf(url, nomeArquivo) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  link.click();
}
```

---

## ✅ Checklist de Implementação

### Autenticação
- [ ] Tela de Login
- [ ] Tela de Primeiro Acesso
- [ ] Tela de Definir Senha (token na URL)
- [ ] Tela de Recuperar Senha
- [ ] Armazenamento seguro do token
- [ ] Interceptor para token expirado
- [ ] Botão de Logout

### Dashboard
- [ ] Cards com resumo
- [ ] Lista de próximos vencimentos
- [ ] Navegação para contratos/boletos

### Contratos
- [ ] Lista de contratos
- [ ] Filtros/busca
- [ ] Detalhe do contrato
- [ ] Download PDF do contrato
- [ ] Lista de boletos do contrato

### Boletos
- [ ] Lista de boletos
- [ ] Filtros (Todos/Pendentes/Pagos)
- [ ] Detalhe do boleto
- [ ] Exibir código PIX com botão copiar
- [ ] Exibir linha digitável com botão copiar
- [ ] Download PDF do boleto
- [ ] Indicadores visuais de status

---

## 🆘 Suporte

Em caso de dúvidas sobre a API, entre em contato com a equipe de backend.

