# 💳 Pagamento via PIX - Guia de Implementação Frontend

## 📋 Visão Geral

Sistema agora suporta contratos com **pagamento via PIX** como alternativa ao boleto bancário.

**Diferenças:**
- **Boleto (padrão)**: gera boleto no Santander, consulta status automaticamente
- **PIX**: NÃO gera boleto, cria registro de parcela para controle, financeiro marca manualmente como pago

**Caso de uso:** Clientes que pagam direto no PIX da empresa sem boleto gerado. O sistema cria as parcelas para controle de faturamento, mas o pagamento é confirmado manualmente pelo financeiro.

---

## 🆕 Mudanças no Backend

### 1. Novos Campos

#### Modelo `Contrato`
```typescript
{
  // ... campos existentes ...
  metodoPagamento: string;  // "Boleto" (padrão) ou "Pix"
}
```

#### Modelo `Boleto` (representa parcelas de boleto E PIX)
```typescript
{
  // ... campos existentes ...
  tipoPagamento: string;  // "Boleto" (padrão) ou "Pix"
  foiPago: boolean;       // true quando pago (já existia)
  valorPago: number;      // valor efetivamente pago (já existia)
  dataPagamento: Date;    // data do pagamento (já existia)
}
```

### 2. Novo Endpoint

#### **PUT** `/api/Boleto/{id}/marcar-pago-manual`

Marca uma parcela PIX como paga manualmente.

**Headers:**
```
Content-Type: application/json
X-Usuario-Id: {id_do_usuario_logado}
```

**Request Body:**
```json
{
  "valorPago": 150.00,         // opcional, padrão: valor nominal da parcela
  "dataPagamento": "2026-02-10T10:30:00Z",  // opcional, padrão: data/hora atual
  "observacao": "Pago via PIX Itaú"         // opcional
}
```

**Response 200 OK:**
```json
{
  "message": "Parcela PIX marcada como paga com sucesso",
  "boletoId": 123,
  "valorPago": 150.00,
  "dataPagamento": "2026-02-10T10:30:00Z",
  "status": "LIQUIDADO"
}
```

**Response 400 Bad Request:**
```json
{
  "message": "Esta operação é apenas para parcelas PIX. Use a sincronização com Santander para boletos."
}
```
ou
```json
{
  "message": "Esta parcela já está marcada como paga"
}
```

**Response 404 Not Found:**
```json
{
  "message": "Parcela/Boleto 123 não encontrado"
}
```

---

## 🎨 Implementação Frontend

### 1. Formulário de Criação de Contrato

Adicionar campo de seleção do método de pagamento:

```tsx
// Exemplo React/Angular/Vue
<FormGroup>
  <Label>Método de Pagamento</Label>
  <RadioGroup value={metodoPagamento} onChange={setMetodoPagamento}>
    <Radio value="Boleto">Boleto Bancário (padrão)</Radio>
    <Radio value="Pix">PIX</Radio>
  </RadioGroup>
  
  {/* Ou com checkbox: */}
  <Checkbox 
    checked={metodoPagamento === 'Pix'} 
    onChange={(e) => setMetodoPagamento(e.target.checked ? 'Pix' : 'Boleto')}
  >
    Cliente vai pagar via PIX (não gera boleto)
  </Checkbox>
</FormGroup>
```

**Payload ao criar contrato:**
```json
{
  "clienteId": 10,
  "consultorId": 5,
  "situacao": "Cliente",
  "valorParcela": 150.00,
  "numeroParcelas": 12,
  "primeiroVencimento": "2026-03-01",
  "metodoPagamento": "Pix",  // <-- NOVO CAMPO
  // ... outros campos ...
}
```

---

### 2. Lista de Faturamento / Boletos

#### A. Badge/Tag PIX no Card

Detectar `tipoPagamento` e exibir badge:

```tsx
{boleto.tipoPagamento === 'Pix' && (
  <Badge color="purple" variant="solid">
    PIX
  </Badge>
)}
```

**Exemplo visual:**

```
┌─────────────────────────────────┐
│ 💜 PIX                          │  ← Badge no topo
│                                 │
│ Cliente: MARFLEX INDUSTRIA      │
│ Valor: R$ 100,00                │
│ Vencimento: 18/02/2026          │
│ Status: Aguardando              │
│                                 │
│ [Marcar como Pago] [Detalhes]   │
└─────────────────────────────────┘
```

#### B. Botão "Marcar como Pago" (apenas para PIX pendente)

```tsx
{boleto.tipoPagamento === 'Pix' && !boleto.foiPago && (
  <Button 
    variant="success" 
    onClick={() => marcarPixComoPago(boleto.id)}
  >
    ✓ Marcar como Pago
  </Button>
)}

{boleto.foiPago && (
  <Badge color="green">✓ Pago em {formatDate(boleto.dataPagamento)}</Badge>
)}
```

#### C. Ícone/Visual diferente de Boleto

- **Boleto:** ícone de código de barras
- **PIX:** ícone de celular/QR code ou símbolo PIX 💜

```tsx
{boleto.tipoPagamento === 'Pix' ? (
  <FiSmartphone size={24} color="#7C3AED" />
) : (
  <FiCreditCard size={24} />
)}
```

---

### 3. Modal de Confirmação de Pagamento PIX

Ao clicar em "Marcar como Pago", abrir modal:

```tsx
<Modal show={showModal} onClose={() => setShowModal(false)}>
  <ModalHeader>Confirmar Pagamento via PIX</ModalHeader>
  <ModalBody>
    <FormGroup>
      <Label>Valor Pago</Label>
      <Input 
        type="number" 
        value={valorPago}
        onChange={(e) => setValorPago(e.target.value)}
        placeholder="Valor recebido (ex: 150.00)"
      />
      <HelpText>Deixe em branco para usar o valor da parcela (R$ {boleto.nominalValue})</HelpText>
    </FormGroup>

    <FormGroup>
      <Label>Data do Pagamento</Label>
      <Input 
        type="date" 
        value={dataPagamento}
        onChange={(e) => setDataPagamento(e.target.value)}
      />
      <HelpText>Deixe em branco para usar a data/hora atual</HelpText>
    </FormGroup>

    <FormGroup>
      <Label>Observação (opcional)</Label>
      <Textarea 
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Ex: Pago via PIX Itaú às 10h30"
      />
    </FormGroup>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Cancelar
    </Button>
    <Button variant="success" onClick={confirmarPagamento}>
      ✓ Confirmar Pagamento
    </Button>
  </ModalFooter>
</Modal>
```

---

### 4. Chamada da API

```typescript
async function marcarPixComoPago(boletoId: number) {
  try {
    const response = await fetch(`${API_URL}/api/Boleto/${boletoId}/marcar-pago-manual`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': getUsuarioId(), // ID do usuário logado
      },
      body: JSON.stringify({
        valorPago: valorPago || null,       // opcional
        dataPagamento: dataPagamento || null, // opcional
        observacao: observacao || null      // opcional
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    
    // Atualizar UI
    toast.success('✓ Parcela PIX marcada como paga!');
    recarregarListaBoletos();
    
  } catch (error) {
    toast.error(`Erro: ${error.message}`);
  }
}
```

---

## 🔒 Permissões

A marcação manual de PIX deve ser restrita ao **grupo Financeiro** ou **Administrador**.

No frontend, verificar permissão antes de mostrar o botão:

```typescript
const podeMarcarComoPago = 
  user.grupoAcesso === 'Administrador' || 
  user.grupoAcesso === 'Faturamento';

{podeMarcarComoPago && boleto.tipoPagamento === 'Pix' && !boleto.foiPago && (
  <Button onClick={() => marcarPixComoPago(boleto.id)}>
    Marcar como Pago
  </Button>
)}
```

---

## 📊 Fluxo Completo

### Criação do Contrato com PIX

1. Usuário cria contrato e seleciona **"PIX"** como método de pagamento
2. Backend salva `contrato.metodoPagamento = "Pix"`
3. Ao rodar geração em lote (`POST /api/Boleto/gerar-lote`):
   - Sistema cria registros de parcela com `tipoPagamento = "Pix"`
   - **NÃO** chama API Santander
   - Status fica `PENDENTE`

### Visualização no Faturamento

4. Frontend lista boletos/parcelas (incluindo PIX)
5. Cards de PIX mostram badge **"PIX"** no topo
6. Botão **"Marcar como Pago"** aparece (se usuário for Financeiro/Admin)

### Confirmação de Pagamento

7. Financeiro clica em **"Marcar como Pago"**
8. Modal abre para confirmar valor e data (opcional)
9. Frontend chama `PUT /api/Boleto/{id}/marcar-pago-manual`
10. Backend atualiza:
    - `foiPago = true`
    - `status = "LIQUIDADO"`
    - `valorPago` e `dataPagamento`
11. Card atualiza para mostrar **"✓ Pago em DD/MM/AAAA"**

---

## 🎨 Exemplos de UI

### Card de Boleto (estado atual)
```
┌─────────────────────────────────┐
│ Cliente: EMPRESA XYZ            │
│ Valor: R$ 150,00                │
│ Vencimento: 18/02/2026          │
│ Status: Registrado              │
│                                 │
│ [Email] [PDF] [Sync] [Detalhes] │
└─────────────────────────────────┘
```

### Card de PIX Pendente (novo)
```
┌─────────────────────────────────┐
│ 💜 PIX                          │
│                                 │
│ Cliente: EMPRESA XYZ            │
│ Valor: R$ 150,00                │
│ Vencimento: 18/02/2026          │
│ Status: Aguardando pagamento    │
│                                 │
│ [Marcar como Pago] [Detalhes]   │
└─────────────────────────────────┘
```

### Card de PIX Pago
```
┌─────────────────────────────────┐
│ 💜 PIX  ✓ Pago                  │
│                                 │
│ Cliente: EMPRESA XYZ            │
│ Valor: R$ 150,00                │
│ Vencimento: 18/02/2026          │
│ Pago em: 10/02/2026             │
│                                 │
│ [Detalhes]                      │
└─────────────────────────────────┘
```

---

## 🧪 Testes

### 1. Criar Contrato PIX
- Criar contrato marcando "PIX" como método de pagamento
- Verificar que `contrato.metodoPagamento = "Pix"` foi salvo
- Rodar geração em lote
- Conferir que parcelas foram criadas com `tipoPagamento = "Pix"` e `status = "PENDENTE"`

### 2. Listar Parcelas PIX
- Abrir aba de faturamento/boletos
- Verificar que parcelas PIX aparecem com badge "PIX"
- Confirmar que botão "Marcar como Pago" está visível (para Financeiro/Admin)

### 3. Marcar PIX como Pago
- Clicar em "Marcar como Pago"
- Preencher modal (ou deixar valores padrão)
- Confirmar
- Verificar que:
  - Parcela fica com status "LIQUIDADO"
  - Badge "✓ Pago em DD/MM/AAAA" aparece
  - Botão "Marcar como Pago" desaparece (já pago)

### 4. Não Permitir Marcar Boleto como Pago
- Tentar chamar o endpoint para um boleto (tipoPagamento = "Boleto")
- Deve retornar erro: "Esta operação é apenas para parcelas PIX"

---

## 🚨 Validações Frontend

1. **Checkbox/Radio PIX:** aparece apenas quando:
   - `valorParcela > 0` e `numeroParcelas > 0`
   - (para garantir que há parcelas a serem criadas)

2. **Botão "Marcar como Pago":** aparece apenas quando:
   - `boleto.tipoPagamento === 'Pix'`
   - `!boleto.foiPago` (ainda não pago)
   - Usuário é Administrador ou Faturamento

3. **Confirmação:** ao marcar como pago, exibir modal de confirmação (não marcar direto com um clique)

---

## 📡 Endpoints Relacionados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/Contrato` | Criar contrato (incluir `metodoPagamento: "Pix"` no body) |
| `POST` | `/api/Boleto/gerar-lote` | Gerar parcelas (boletos ou PIX) |
| `GET` | `/api/Boleto` | Listar boletos/parcelas (inclui PIX) |
| `PUT` | `/api/Boleto/{id}/marcar-pago-manual` | **Marcar PIX como pago (novo)** |
| `GET` | `/api/Boleto/{id}` | Detalhes da parcela (boleto ou PIX) |

---

## 🔄 Migration do Banco

Antes de testar, rodar a migration SQL:

```sql
-- Executar no banco de dados:
-- add_metodo_pagamento_pix.sql
```

Adiciona:
- Coluna `MetodoPagamento` na tabela `Contratos` (padrão: "Boleto")
- Coluna `TipoPagamento` na tabela `Boletos` (padrão: "Boleto")
- Atualiza registros existentes para "Boleto"

---

## 📝 Exemplo Completo (TypeScript/React)

```typescript
// Tipos
interface Contrato {
  // ... campos existentes ...
  metodoPagamento: 'Boleto' | 'Pix';
}

interface Boleto {
  id: number;
  contratoId: number;
  tipoPagamento: 'Boleto' | 'Pix';
  status: string;
  foiPago: boolean;
  valorPago?: number;
  dataPagamento?: string;
  dueDate: string;
  nominalValue: number;
  // ... outros campos ...
}

// Componente Card de Boleto/PIX
function BoletoCard({ boleto, onMarcarPago }: Props) {
  const isPix = boleto.tipoPagamento === 'Pix';
  const podeMarcarPago = isPix && !boleto.foiPago && (
    user.grupoAcesso === 'Administrador' || 
    user.grupoAcesso === 'Faturamento'
  );

  return (
    <Card>
      {/* Badge PIX */}
      {isPix && (
        <Badge color="purple" className="mb-2">
          💜 PIX
        </Badge>
      )}
      
      {/* Status Pago */}
      {boleto.foiPago && (
        <Badge color="green">
          ✓ Pago em {formatDate(boleto.dataPagamento)}
        </Badge>
      )}

      <CardBody>
        <Text>Cliente: {boleto.contrato.cliente.nome}</Text>
        <Text>Valor: {formatCurrency(boleto.nominalValue)}</Text>
        <Text>Vencimento: {formatDate(boleto.dueDate)}</Text>
        <Text>Status: {boleto.status}</Text>
      </CardBody>

      <CardFooter>
        {podeMarcarPago && (
          <Button 
            variant="success" 
            onClick={() => onMarcarPago(boleto)}
          >
            ✓ Marcar como Pago
          </Button>
        )}
        
        {!isPix && (
          <>
            <Button onClick={() => baixarPDF(boleto.id)}>PDF</Button>
            <Button onClick={() => sincronizar(boleto.id)}>Sync</Button>
          </>
        )}
        
        <Button onClick={() => verDetalhes(boleto.id)}>Detalhes</Button>
      </CardFooter>
    </Card>
  );
}

// Função para marcar PIX como pago
async function marcarPixComoPago(boleto: Boleto) {
  // Abrir modal para confirmar valor e data
  const { confirmado, valorPago, dataPagamento, observacao } = await abrirModalConfirmacao(boleto);
  
  if (!confirmado) return;

  try {
    const response = await api.put(
      `/api/Boleto/${boleto.id}/marcar-pago-manual`,
      {
        valorPago: valorPago || null,
        dataPagamento: dataPagamento || null,
        observacao: observacao || null
      },
      {
        headers: {
          'X-Usuario-Id': getUsuarioId()
        }
      }
    );

    toast.success('✓ Parcela PIX marcada como paga!');
    recarregarLista();
    
  } catch (error) {
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Erro ao marcar parcela como paga');
    }
  }
}
```

---

## ✅ Checklist de Implementação

### Backend (concluído)
- [x] Adicionar `MetodoPagamento` em `Contrato`
- [x] Adicionar `TipoPagamento` em `Boleto`
- [x] Migration SQL (`add_metodo_pagamento_pix.sql`)
- [x] Endpoint `PUT /api/Boleto/{id}/marcar-pago-manual`
- [x] Lógica de geração: se PIX, não chamar Santander

### Frontend (a fazer)
- [ ] Adicionar campo "Método de Pagamento" no form de contrato (radio ou checkbox)
- [ ] Enviar `metodoPagamento` ao criar contrato
- [ ] Exibir badge "PIX" nos cards de parcelas PIX
- [ ] Botão "Marcar como Pago" (só para PIX pendente + permissão)
- [ ] Modal de confirmação com campos valor, data, observação
- [ ] Função `marcarPixComoPago()` que chama o endpoint
- [ ] Atualizar lista após marcação
- [ ] Não mostrar botões "PDF" e "Sync" para parcelas PIX

---

## 🎯 Resumo para o Dev Frontend

1. **Form de Contrato:** adicione checkbox "Pagar via PIX" e envie `metodoPagamento: "Pix"` no POST.
2. **Lista de Boletos:** mostre badge **"💜 PIX"** quando `tipoPagamento === 'Pix'`.
3. **Botão "Marcar Pago":** só para PIX pendente; abre modal e chama `PUT /api/Boleto/{id}/marcar-pago-manual`.
4. **Ações específicas de boleto** (PDF, Sync): oculte para parcelas PIX.

Qualquer dúvida, consulte o endpoint `/api/Boleto/{id}` para ver a estrutura completa da resposta.
