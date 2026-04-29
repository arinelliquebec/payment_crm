# 🔧 Configuração Santander API - Backend

## ✅ Status da Configuração

**Data de Configuração:** 15/10/2025  
**Ambiente:** PRODUÇÃO  
**Status:** ✅ CONFIGURADO E PRONTO PARA USO

---

## 📋 Credenciais Configuradas

### Configuração no `appsettings.json` e `appsettings.Production.json`:

```json
{
  "SantanderAPI": {
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "6a4c5cda-ff64-43e8-9219-25882afa3f52",
    "ClientId": "Kw9j93z9m4NC5nCNpu77c50ViTtvfegV",
    "ClientSecret": "9OgpxGoZSFLnAeK5",
    "CovenantCode": "596794",
    "BankNumber": "1020",
    "CertificatePath": "C:/Certificados/ARRIGHI ADVOGADOS E ASSOCIADOS - SENHA 1234 - VENC. 05.08.2026 (1).pfx",
    "CertificatePassword": "1234"
  }
}
```

---

## 🔐 Informações das Credenciais

| Campo | Valor | Status |
|-------|-------|--------|
| **BaseUrl** | `https://trust-open.api.santander.com.br` | ✅ Configurado |
| **WorkspaceId** | `6a4c5cda-ff64-43e8-9219-25882afa3f52` | ✅ Configurado |
| **ClientId** | `Kw9j93z9m4NC5nCNpu77c50ViTtvfegV` | ✅ Configurado |
| **ClientSecret** | `9OgpxGoZSFLnAeK5` | ✅ Configurado |
| **CovenantCode** | `596794` | ✅ Configurado |
| **BankNumber** | `1020` | ⚠️ Confirmar com Santander |
| **CertificatePath** | `C:/Certificados/ARRIGHI...pfx` | ✅ Configurado |
| **CertificatePassword** | `1234` | ✅ Configurado |

---

## 📜 Certificado Digital

**Nome:** ARRIGHI ADVOGADOS E ASSOCIADOS  
**Arquivo:** `ARRIGHI ADVOGADOS E ASSOCIADOS - SENHA 1234 - VENC. 05.08.2026 (1).pfx`  
**Senha:** `1234`  
**Validade:** 05/08/2026  

### ⚠️ ALERTA DE RENOVAÇÃO

**Data de Vencimento:** 05/08/2026

**Ações necessárias ANTES de 05/08/2026:**
1. Solicitar renovação ao Santander (30 dias antes)
2. Atualizar arquivo `.pfx` no servidor
3. Atualizar senha no `appsettings.json` (se mudou)
4. Testar autenticação
5. Deploy em produção

---

## 🔑 Chave PIX

**Tipo:** CNPJ  
**Chave:** `09039684000100`  
**Status:** ✅ Cadastrada e Funcionando

---

## ⚠️ Informações Pendentes de Confirmação

As seguintes informações estão configuradas mas **PRECISAM SER CONFIRMADAS** com o Santander:

### 1. ClientNumber (Número do Cliente)
- **Atual:** "SEU NUMERO" (placeholder)
- **Ação:** Solicitar ao Santander o número correto
- **Onde usar:** Campo `clientNumber` nas requisições de boleto

### 2. ParticipantCode (Código de Participante)
- **Atual:** "CODIGO 1234" (placeholder)
- **Ação:** Solicitar ao Santander o código correto
- **Onde usar:** Campo `participantCode` nas requisições de boleto

### 3. BankNumber (Número da Agência)
- **Atual:** "1020"
- **Ação:** Confirmar se está correto
- **Onde usar:** Campo `bankNumber` nas requisições de boleto

---

## 📞 Como Obter as Informações Pendentes

**Contato:** Suporte Técnico Santander Open Banking

**Solicitar especificamente:**
1. Número do Cliente (ClientNumber) para boletos
2. Código de Participante (ParticipantCode)
3. Confirmação do Número da Agência (BankNumber: 1020)

**Portal:** https://developer.santander.com.br

---

## 🚀 Checklist de Deploy

Antes de fazer deploy para produção:

- [x] Credenciais configuradas no `appsettings.json`
- [x] Credenciais configuradas no `appsettings.Production.json`
- [x] Certificado digital instalado no servidor
- [x] Chave PIX cadastrada no Santander
- [ ] **ClientNumber confirmado e atualizado no código**
- [ ] **ParticipantCode confirmado e atualizado no código**
- [ ] **BankNumber confirmado**
- [ ] Testar criação de 1 boleto em produção
- [ ] Validar QR Code PIX
- [ ] Validar linha digitável
- [ ] Confirmar registro no Santander

---

## 🔄 Fluxo de Autenticação (Automático)

O sistema gerencia automaticamente:

1. ✅ Autenticação OAuth2 com ClientId + ClientSecret
2. ✅ Uso do certificado digital para mTLS
3. ✅ Geração automática do Access Token
4. ✅ Renovação automática quando expira
5. ✅ Cache do token em memória

**Você NÃO precisa:**
- ❌ Configurar Access Token manualmente
- ❌ Gerenciar renovação de token
- ❌ Implementar lógica de autenticação

---

## 📝 Exemplo de Requisição de Boleto

```json
{
  "contratoId": 123,
  "dataVencimento": "2025-11-30",
  "valor": 1500.50,
  "descricao": "Prestação de serviços - Novembro/2025",
  "juros": 0.033,
  "multa": 2.0,
  "mensagens": [
    "Pagamento referente à prestação de serviços",
    "Pagamento via PIX disponível"
  ]
}
```

O backend automaticamente adiciona:
- `covenantCode`: 596794
- `bankNumber`: 1020
- `clientNumber`: (PRECISA CONFIRMAR)
- `participantCode`: (PRECISA CONFIRMAR)
- `key.type`: CNPJ
- `key.dictKey`: 09039684000100

---

## 🎯 Próximos Passos

### Imediato (Urgente):
1. ✅ Configurações atualizadas
2. ✅ README para frontend criado
3. ⏳ Confirmar ClientNumber e ParticipantCode com Santander
4. ⏳ Atualizar código com valores corretos
5. ⏳ Testar em produção

### Médio Prazo:
- Monitorar vencimento do certificado (05/08/2026)
- Documentar processo de renovação
- Criar alertas automáticos para renovação

---

## 📚 Documentação Relacionada

- `FRONTEND_API_BOLETOS_README.md` - Guia para integração do frontend
- `FRONTEND_BOLETOS_README.md` - Documentação adicional de boletos
- `FINANCEIRO_README.md` - Documentação do módulo financeiro

---

## 🆘 Troubleshooting

### Erro: "Certificate not found"
**Solução:** Verificar se o arquivo `.pfx` está no caminho correto no servidor

### Erro: "Invalid credentials"
**Solução:** Verificar ClientId e ClientSecret

### Erro: "Certificate password incorrect"
**Solução:** Verificar senha do certificado (1234)

### Erro: "Workspace not found"
**Solução:** Verificar WorkspaceId

### Erro: "Invalid covenant code"
**Solução:** Verificar CovenantCode (596794)

---

**Última Atualização:** 15/10/2025  
**Responsável:** Equipe Backend  
**Status:** ✅ PRONTO PARA PRODUÇÃO (após confirmar ClientNumber e ParticipantCode)
