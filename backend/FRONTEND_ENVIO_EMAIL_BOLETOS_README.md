# 📧 Envio de Boletos por Email

**Data:** 12/12/2024  
**Versão:** 1.0

---

## 📋 Resumo

O sistema agora envia automaticamente os boletos por email para os clientes após a geração (manual ou em lote). Também é possível reenviar boletos manualmente.

---

## 🔄 Comportamento Automático

### Geração Manual de Boleto
Quando um boleto é criado via `POST /api/Boleto`:
- ✅ O boleto é registrado no Santander
- ✅ O PDF é baixado automaticamente
- ✅ O email é enviado para o cliente com o PDF anexado
- ✅ A resposta inclui informação sobre o envio do email

### Geração em Lote
Quando boletos são gerados via `POST /api/Boleto/gerar-lote`:
- ✅ Cada boleto é registrado no Santander
- ✅ Cada email é enviado individualmente
- ✅ O resumo final inclui estatísticas de envio de email
- ⚠️ Clientes sem email cadastrado são listados para correção

---

## 🆕 Novo Endpoint: Enviar/Reenviar Email

### `POST /api/Boleto/{id}/enviar-email`

Envia ou reenvia o boleto por email.

#### Request (opcional)
```json
{
  "emailDestino": "outro@email.com"  // Opcional - se não informar, usa o email do cliente
}
```

#### Response - Sucesso (200)
```json
{
  "sucesso": true,
  "erro": null,
  "emailDestino": "cliente@email.com"
}
```

#### Response - Erro (400)
```json
{
  "sucesso": false,
  "erro": "Cliente não possui email cadastrado",
  "emailDestino": null
}
```

---

## 📦 Resposta da Geração Manual (POST /api/Boleto)

A resposta agora inclui informação sobre o envio de email:

```json
{
  "boleto": {
    "id": 123,
    "contratoId": 456,
    "status": "REGISTRADO",
    "dueDate": "2024-12-15",
    "nominalValue": 500.00,
    // ... outros campos do boleto
  },
  "email": {
    "enviado": true,
    "destino": "cliente@email.com",
    "erro": null
  }
}
```

### Possíveis valores de `email`:
| Situação | `enviado` | `destino` | `erro` |
|----------|-----------|-----------|--------|
| Enviado com sucesso | `true` | "email@..." | `null` |
| Cliente sem email | `false` | `null` | "Cliente não possui email cadastrado" |
| Erro no envio | `false` | "email@..." | "Mensagem do erro" |
| Envio desabilitado | `null` | `null` | `null` |

---

## 📦 Resposta da Geração em Lote (POST /api/Boleto/gerar-lote)

A resposta agora inclui resumo de emails:

```json
{
  "iniciado": "2024-12-12T10:00:00",
  "finalizado": "2024-12-12T10:05:00",
  "duracaoSegundos": 300,
  "totalProcessados": 50,
  "totalSucesso": 48,
  "totalErros": 2,
  "valorTotalGerado": 25000.00,
  "status": "PARCIAL",
  "boletosGerados": [
    {
      "boletoId": 123,
      "contratoId": 456,
      "clienteNome": "João Silva",
      "numeroParcela": 5,
      "totalParcelas": 36,
      "dataVencimento": "2024-12-15",
      "valor": 500.00,
      "nsuCode": "100",
      "status": "REGISTRADO",
      "emailStatus": "ENVIADO",
      "emailDestino": "joao@email.com"
    },
    {
      "boletoId": 124,
      "contratoId": 457,
      "clienteNome": "Maria Santos",
      "emailStatus": "SEM_EMAIL",
      "emailDestino": null
    }
  ],
  "erros": [...],
  "logId": 15,
  "resumoEmail": {
    "totalEnviados": 45,
    "totalFalharam": 1,
    "totalSemEmail": 2,
    "clientesSemEmail": [
      "Maria Santos",
      "Pedro Oliveira"
    ]
  }
}
```

### Valores de `emailStatus` em cada boleto:
| Valor | Descrição |
|-------|-----------|
| `"ENVIADO"` | Email enviado com sucesso |
| `"FALHOU: ..."` | Erro no envio (motivo no texto) |
| `"SEM_EMAIL"` | Cliente não possui email cadastrado |
| `null` | Envio automático desabilitado |

---

## 🎨 Sugestão de UI

### 1. Na Geração Manual
Após criar boleto, exibir toast/notificação:

```jsx
// Sucesso
{response.email?.enviado && (
  <Toast type="success">
    ✅ Boleto enviado para {response.email.destino}
  </Toast>
)}

// Sem email
{response.email && !response.email.enviado && !response.email.destino && (
  <Toast type="warning">
    ⚠️ Cliente não possui email cadastrado. Boleto não foi enviado.
  </Toast>
)}

// Erro
{response.email && !response.email.enviado && response.email.erro && (
  <Toast type="error">
    ❌ Erro ao enviar email: {response.email.erro}
  </Toast>
)}
```

### 2. Na Geração em Lote
Exibir resumo após conclusão:

```jsx
<div className="resumo-geracao">
  <h3>Resumo da Geração</h3>
  
  <div className="stats">
    <div>📋 Boletos gerados: {resultado.totalSucesso}</div>
    <div>❌ Erros: {resultado.totalErros}</div>
  </div>

  <h4>📧 Envio de Emails</h4>
  <div className="email-stats">
    <div className="success">✅ Enviados: {resultado.resumoEmail.totalEnviados}</div>
    <div className="error">❌ Falharam: {resultado.resumoEmail.totalFalharam}</div>
    <div className="warning">⚠️ Sem email: {resultado.resumoEmail.totalSemEmail}</div>
  </div>

  {resultado.resumoEmail.clientesSemEmail.length > 0 && (
    <div className="alert-warning">
      <h5>⚠️ Clientes sem email cadastrado:</h5>
      <ul>
        {resultado.resumoEmail.clientesSemEmail.map(nome => (
          <li key={nome}>{nome}</li>
        ))}
      </ul>
      <p>Atualize o cadastro desses clientes para envio automático.</p>
    </div>
  )}
</div>
```

### 3. Botão de Reenvio na Lista de Boletos
Adicionar botão para reenviar email:

```jsx
<Button 
  onClick={() => reenviarEmail(boleto.id)}
  disabled={!boleto.status === 'REGISTRADO'}
>
  📧 Enviar Email
</Button>

// Função
async function reenviarEmail(boletoId, emailAlternativo = null) {
  const response = await fetch(`/api/Boleto/${boletoId}/enviar-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: emailAlternativo ? JSON.stringify({ emailDestino: emailAlternativo }) : null
  });
  
  const result = await response.json();
  
  if (result.sucesso) {
    toast.success(`Email enviado para ${result.emailDestino}`);
  } else {
    toast.error(`Erro: ${result.erro}`);
  }
}
```

### 4. Modal para Enviar para Email Alternativo
```jsx
<Modal title="Enviar Boleto por Email">
  <Input 
    label="Email destino"
    placeholder="Digite o email (ou deixe vazio para usar o cadastrado)"
    value={emailAlternativo}
    onChange={setEmailAlternativo}
  />
  <Button onClick={() => reenviarEmail(boletoId, emailAlternativo)}>
    Enviar
  </Button>
</Modal>
```

---

## ⚙️ Configurações

O envio automático pode ser habilitado/desabilitado no backend via configuração:

```json
// appsettings.json
{
  "Email": {
    "EnviarBoletoAutomaticamente": true,  // true = envia automaticamente
    "MensagemBoletoPadrao": "Em caso de dúvidas, entre em contato conosco."
  }
}
```

---

## 📧 Conteúdo do Email

O email enviado contém:
- ✅ Saudação personalizada com nome do cliente
- ✅ Informações do boleto (valor, vencimento, parcela)
- ✅ Código PIX (copia e cola) - se disponível
- ✅ Linha digitável
- ✅ **PDF do boleto anexado**
- ✅ Mensagem padrão configurável

---

## ✅ Checklist de Implementação Frontend

- [ ] Exibir feedback de envio de email na geração manual
- [ ] Exibir resumo de emails na geração em lote
- [ ] Listar clientes sem email para correção
- [ ] Adicionar botão "Enviar Email" na lista/detalhe do boleto
- [ ] Permitir informar email alternativo no reenvio
- [ ] Tratar erros de envio adequadamente

---

## 🔧 Campos de Email no Cadastro

O sistema busca o email do cliente nesta ordem:
1. **Pessoa Física:** `EmailEmpresarial`
2. **Pessoa Jurídica:** `Email`

Se nenhum estiver preenchido, o boleto é gerado mas o email não é enviado.

---

## 🆘 Dúvidas Frequentes

**P: O que acontece se o email falhar?**
R: O boleto é gerado normalmente, apenas o email não é enviado. O status do email fica registrado para reenvio posterior.

**P: Posso enviar para um email diferente do cadastrado?**
R: Sim! Use o endpoint `POST /api/Boleto/{id}/enviar-email` com o campo `emailDestino`.

**P: O PDF é gerado localmente ou baixado do Santander?**
R: O PDF é baixado diretamente da API do Santander e anexado ao email.

