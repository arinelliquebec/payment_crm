# 🚀 Geração em Lote de Boletos - Guia do Frontend

**Atualizado em:** 08/12/2025

---

## Visão Geral

Sistema de geração automática de boletos para contratos com situação **"CLIENTE"** (case insensitive).

### Regras de Negócio Atualizadas

| Regra | Descrição |
|-------|-----------|
| **Situação do Contrato** | `Contrato.Situacao = 'cliente'` (ignora maiúsculas/minúsculas) |
| **Janela de Geração** | Gera boleto apenas quando faltam **7 dias ou menos** para o vencimento |
| **Contratos Correntes** | `NumeroParcelas = 0` → Cobrança mensal sem fim (gera todo mês) |
| **Contratos Finalizados** | Se todas parcelas acabaram → Sistema atualiza para "liquidado" automaticamente |
| **Baixa Automática** | Boletos configurados para baixa automática após 30 dias sem pagamento |

---

## Endpoints Disponíveis

### 1️⃣ Preview de Geração

**Mostra quais boletos serão gerados nos próximos 7 dias.**

```
GET /api/Boleto/gerar-lote/preview
```

**Headers OBRIGATÓRIOS:**
```
X-Usuario-Id: {id_do_usuario_logado}
Content-Type: application/json
```

**Exemplo com cURL:**
```bash
curl -X GET "https://sua-api.azurewebsites.net/api/Boleto/gerar-lote/preview" \
  -H "X-Usuario-Id: 1" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "totalContratosAtivos": 45,
  "contratosParaGerar": 3,
  "valorTotal": 1948.06,
  "contratos": [
    {
      "contratoId": 412,
      "clienteId": 205,
      "clienteNome": "MAURO MELLO BENETTI",
      "clienteDocumento": "145.869.097-06",
      "numeroPasta": "",
      "numeroParcela": 1,
      "totalParcelas": 5,
      "parcelaDescricao": "1/5",
      "dataVencimento": "2025-12-10T00:00:00",
      "valor": 1.00,
      "diasAteVencimento": 2,
      "filialNome": "Rio de Janeiro - RJ"
    },
    {
      "contratoId": 409,
      "clienteId": 200,
      "clienteNome": "DARLI DE JESUS BORGES DE FREITAS",
      "clienteDocumento": "177.953.110-91",
      "numeroPasta": "",
      "numeroParcela": 1,
      "totalParcelas": 3,
      "parcelaDescricao": "1/3",
      "dataVencimento": "2025-12-31T00:00:00",
      "valor": 500.00,
      "diasAteVencimento": 23,
      "filialNome": "Rio de Janeiro - RJ"
    }
  ]
}
```

**Contrato Corrente (sem fim):**
```json
{
  "parcelaDescricao": "5/∞ (corrente)",
  "totalParcelas": 0
}
```

---

### 2️⃣ Executar Geração em Lote

**Gera os boletos. ATENÇÃO: Pode demorar alguns minutos!**

```
POST /api/Boleto/gerar-lote
```

**Headers OBRIGATÓRIOS:**
```
X-Usuario-Id: {id_do_usuario_logado}
Content-Type: application/json
```

**Body:** Vazio (não precisa enviar nada)

**Exemplo com cURL:**
```bash
curl -X POST "https://sua-api.azurewebsites.net/api/Boleto/gerar-lote" \
  -H "X-Usuario-Id: 1" \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "iniciado": "2025-12-08T10:30:00",
  "finalizado": "2025-12-08T10:35:00",
  "duracaoSegundos": 300,
  "totalProcessados": 45,
  "totalSucesso": 3,
  "totalErros": 0,
  "valorTotalGerado": 1948.06,
  "status": "SUCESSO",
  "logId": 15,
  "boletosGerados": [
    {
      "boletoId": 234,
      "contratoId": 412,
      "clienteNome": "MAURO MELLO BENETTI",
      "numeroParcela": 1,
      "totalParcelas": 5,
      "dataVencimento": "2025-12-10T00:00:00",
      "valor": 1.00,
      "nsuCode": "FAT000234",
      "status": "REGISTRADO"
    }
  ],
  "erros": []
}
```

**Valores possíveis para `status`:**
| Status | Descrição |
|--------|-----------|
| `SUCESSO` | Todos os boletos foram gerados com sucesso |
| `PARCIAL` | Alguns boletos geraram erro, outros foram gerados |
| `ERRO` | Todos os boletos falharam |
| `NENHUM` | Nenhum contrato estava na janela de geração |

---

### 3️⃣ Histórico de Gerações

```
GET /api/Boleto/logs-geracao?pagina=1&tamanhoPagina=20
```

**Headers:**
```
X-Usuario-Id: {id_do_usuario_logado}
```

---

### 4️⃣ Detalhes de uma Geração

```
GET /api/Boleto/logs-geracao/{id}
```

---

## ⚠️ IMPORTANTE: Checklist do Frontend

### Antes de chamar os endpoints, verifique:

- [ ] **URL correta?** `https://sua-api/api/Boleto/gerar-lote/preview`
- [ ] **Header X-Usuario-Id presente?** Obrigatório!
- [ ] **Método HTTP correto?** GET para preview, POST para gerar
- [ ] **Content-Type?** `application/json`

### Código de Exemplo (JavaScript/TypeScript):

```javascript
// Função para buscar preview
async function buscarPreviewGeracaoLote() {
  try {
    const usuarioId = localStorage.getItem('usuarioId'); // ou de onde você guarda
    
    const response = await fetch('/api/Boleto/gerar-lote/preview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': usuarioId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Preview:', data);
    return data;
    
  } catch (error) {
    console.error('Erro ao buscar preview:', error);
    throw error;
  }
}

// Função para executar geração
async function executarGeracaoLote() {
  try {
    const usuarioId = localStorage.getItem('usuarioId');
    
    const response = await fetch('/api/Boleto/gerar-lote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': usuarioId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Resultado:', data);
    return data;
    
  } catch (error) {
    console.error('Erro ao gerar boletos:', error);
    throw error;
  }
}
```

### Código de Exemplo (Axios):

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sua-api.azurewebsites.net'
});

// Interceptor para adicionar X-Usuario-Id automaticamente
api.interceptors.request.use(config => {
  const usuarioId = localStorage.getItem('usuarioId');
  if (usuarioId) {
    config.headers['X-Usuario-Id'] = usuarioId;
  }
  return config;
});

// Preview
export const getPreviewGeracaoLote = () => 
  api.get('/api/Boleto/gerar-lote/preview');

// Gerar
export const postGeracaoLote = () => 
  api.post('/api/Boleto/gerar-lote');

// Logs
export const getLogsGeracao = (pagina = 1, tamanhoPagina = 20) => 
  api.get(`/api/Boleto/logs-geracao?pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`);
```

---

## Fluxo de UI Sugerido

### 1. Botão "Gerar Boletos do Mês"

```jsx
<Button 
  onClick={handleAbrirModal}
  disabled={loading}
>
  📋 Gerar Boletos do Mês
</Button>
```

### 2. Modal de Preview

```jsx
// Ao abrir o modal, chamar o preview
useEffect(() => {
  if (modalAberto) {
    buscarPreviewGeracaoLote()
      .then(data => setPreview(data))
      .catch(err => toast.error('Erro ao carregar preview'));
  }
}, [modalAberto]);
```

### 3. Mostrar Resumo

```jsx
{preview && (
  <div>
    <p>Total de contratos ativos: {preview.totalContratosAtivos}</p>
    <p>Boletos a gerar: {preview.contratosParaGerar}</p>
    <p>Valor total: R$ {preview.valorTotal.toFixed(2)}</p>
    
    {preview.contratosParaGerar === 0 ? (
      <Alert type="info">
        Nenhum boleto para gerar nos próximos 7 dias.
      </Alert>
    ) : (
      <Table>
        {preview.contratos.map(c => (
          <TableRow key={c.contratoId}>
            <td>{c.clienteNome}</td>
            <td>{c.parcelaDescricao}</td>
            <td>{formatDate(c.dataVencimento)}</td>
            <td>R$ {c.valor.toFixed(2)}</td>
            <td>{c.diasAteVencimento} dias</td>
          </TableRow>
        ))}
      </Table>
    )}
  </div>
)}
```

### 4. Botão de Confirmação

```jsx
<Button 
  onClick={handleGerarBoletos}
  disabled={preview?.contratosParaGerar === 0 || gerando}
>
  {gerando ? 'Gerando...' : 'Confirmar Geração'}
</Button>
```

---

## Critérios para um Contrato Aparecer no Preview

O contrato SÓ aparece no preview se **TODOS** estes critérios forem atendidos:

| Critério | Campo | Valor Esperado |
|----------|-------|----------------|
| Contrato ativo | `Contrato.Ativo` | `true` |
| Situação cliente | `Contrato.Situacao` | `"cliente"` ou `"CLIENTE"` |
| Primeiro vencimento | `Contrato.PrimeiroVencimento` | Preenchido |
| Valor da parcela | `Contrato.ValorParcela` | > 0 |
| Próxima parcela válida | Calculado | <= NumeroParcelas (ou corrente) |
| Dentro da janela | Calculado | 0 < dias <= 7 |

---

## Troubleshooting

### "Nenhum boleto para gerar"

1. **Verifique a Situação do Contrato** - Deve ser exatamente "cliente" ou "CLIENTE"
2. **Verifique o Primeiro Vencimento** - Deve estar preenchido
3. **Verifique o Valor da Parcela** - Deve ser > 0
4. **Verifique a Janela de 7 dias** - O vencimento deve estar entre 1 e 7 dias no futuro

### "401 Unauthorized"

- Verifique se o header `X-Usuario-Id` está sendo enviado

### "500 Internal Server Error"

- Verifique os logs do servidor
- Pode ser problema de certificado do Santander

---

## Dúvidas?

Contate a equipe de backend.

**Versão:** 2.0
**Última atualização:** 08/12/2025
