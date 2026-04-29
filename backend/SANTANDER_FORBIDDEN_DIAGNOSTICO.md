# 🚨 Erro "Forbidden" na API Santander - Diagnóstico e Solução

## ❌ Erro Atual

```
Erro ao gerar access token: Forbidden (403)
```

**O que significa:** O backend tenta obter um access token OAuth da API Santander mas recebe resposta **403 Forbidden**, indicando que as credenciais ou o certificado estão incorretos, ausentes ou não autorizados.

---

## 🔍 Diagnóstico Rápido

### 1. Testar Endpoint de Diagnóstico (NOVO)

Criamos um endpoint para verificar a configuração do Santander.

**Chamada:**
```
GET https://arrighi-bk...azurewebsites.net/health/santander
```

**Resposta esperada:**
```json
{
  "timestamp": "2026-02-11T10:30:00Z",
  "baseUrl": "https://trust-open.api.santander.com.br",
  "workspaceIdConfigurado": true,
  "covenantCodeConfigurado": true,
  "clientIdConfigurado": true,
  "clientSecretConfigurado": true,
  "certificateThumbprintConfigurado": true,
  "certificatePathConfigurado": false,
  "certificatePasswordConfigurado": true,
  "clientIdParcial": "abc12345...",
  "thumbprint": "A1B2C3D4E5F6...",
  "certificateFileExists": true,
  "certificadosEncontradosAzure": [
    "/var/ssl/private/A1B2C3D4E5F6.p12"
  ],
  "statusGeral": "CONFIGURADO"
}
```

Se algum campo estiver `false` ou aparecer `"configuracoesAusentes": [...]`, essas são as configurações que faltam.

---

## 🛠️ Causas Comuns do "Forbidden"

### 1. **ClientId ou ClientSecret incorretos**

**Verificar no Azure:**
1. Portal Azure → **App Service** (arrighi-bk) → **Configuration** → **Application settings**
2. Conferir se existem:
   - `SantanderAPI:ClientId`
   - `SantanderAPI:ClientSecret`
3. Se não existirem ou estiverem vazios, adicionar/corrigir.

**Valores corretos:** devem vir do contrato/credenciais fornecidos pelo Santander.

---

### 2. **Certificado mTLS ausente ou inválido**

A API Santander exige **autenticação mútua TLS (mTLS)** com certificado digital.

**Verificar:**

#### A. No Azure App Service

1. **Certificates** → **Private Key Certificates (.pfx)**
   - Verificar se o certificado está carregado.
   - Anotar o **Thumbprint** (ex: `A1B2C3D4E5F6...`).

2. **Configuration** → **Application settings**
   - Adicionar/verificar:
     ```
     SantanderAPI:CertificateThumbprint = A1B2C3D4E5F6... (sem espaços)
     ```
   - Ou usar caminho (se upload manual):
     ```
     SantanderAPI:CertificatePath = /var/ssl/private/certificado.p12
     SantanderAPI:CertificatePassword = senha_do_certificado
     ```

3. **TLS/SSL Settings**
   - **HTTPS Only:** Habilitado
   - **Minimum TLS Version:** 1.2
   - **Client certificate mode:** Optional ou Require (depende da config do Azure)

#### B. Certificado expirado

Certificados digitais têm validade (ex: 1-2 anos). Se expirou:
- Renovar com o Santander
- Upload do novo certificado no Azure
- Atualizar thumbprint nas Application settings

---

### 3. **IP não whitelisted**

Algumas APIs bancárias exigem **whitelist de IPs**.

**Verificar:**
1. Obter IP de saída do Azure App Service:
   - **Properties** → **Outbound addresses** (lista de IPs possíveis)
2. Enviar esses IPs para o Santander para liberação (se necessário)

---

### 4. **Configuração de ambiente errada**

A API Santander tem ambientes diferentes:
- **Sandbox/Homologação:** `https://trust-sandbox.api.santander.com.br`
- **Produção:** `https://trust-open.api.santander.com.br`

As credenciais (client_id, client_secret, certificado) são **diferentes** entre os ambientes.

**Verificar:**
- `SantanderAPI:BaseUrl` aponta para o ambiente correto?
- As credenciais configuradas são do ambiente correto?

---

## ✅ Checklist de Configuração Azure

### Application Settings (Configuration)

```
SantanderAPI:BaseUrl = https://trust-open.api.santander.com.br
SantanderAPI:WorkspaceId = seu_workspace_id
SantanderAPI:CovenantCode = seu_convenio (9 dígitos)
SantanderAPI:ClientId = seu_client_id
SantanderAPI:ClientSecret = seu_client_secret
SantanderAPI:CertificateThumbprint = THUMBPRINT_DO_CERTIFICADO (sem espaços)
SantanderAPI:CertificatePassword = senha_do_certificado
```

### Certificado (Private Key Certificates)

- [ ] Certificado .pfx ou .p12 carregado
- [ ] Thumbprint anotado e colocado nas Application Settings
- [ ] Certificado dentro da validade (NotAfter > hoje)
- [ ] Senha do certificado está correta

---

## 🧪 Testes

### 1. Endpoint de Diagnóstico
```bash
curl https://arrighi-bk...azurewebsites.net/health/santander
```
Se retornar `statusGeral: "CONFIGURADO"`, as settings estão ok.

### 2. Health Check Completo
```bash
curl https://arrighi-bk...azurewebsites.net/health/details
```
Procurar pelo check `santander_api`:
- **Status: Healthy** → API respondendo
- **Status: Degraded/Unhealthy** → ver `data` e `exception` para detalhes

### 3. Dashboard Visual
Abrir no navegador:
```
https://arrighi-bk...azurewebsites.net/health/dashboard
```
Ver o card do **santander_api** e os dados retornados.

---

## 🔧 Solução Passo a Passo

### Se as configurações estiverem ausentes:

1. **Portal Azure** → **App Service** → **Configuration** → **Application settings**
2. Clicar em **+ New application setting** para cada config ausente (ver Checklist acima)
3. **Save** → **Restart** o App Service

### Se o certificado estiver ausente/errado:

1. **Portal Azure** → **App Service** → **Certificates** → **Private Key Certificates**
2. **Upload Certificate (.pfx)**:
   - Selecionar o arquivo `.pfx` ou `.p12` fornecido pelo Santander
   - Digitar a senha do certificado
   - Anotar o **Thumbprint** que aparece após o upload
3. **Configuration** → **Application settings**:
   - Adicionar `SantanderAPI:CertificateThumbprint = THUMBPRINT_COPIADO`
4. **Save** → **Restart**

### Se tudo estiver configurado mas ainda der Forbidden:

1. **Verificar expiração do certificado**:
   - No Azure, ao listar o certificado ele mostra **Expiration Date**
   - Se expirado, renovar com o Santander

2. **Verificar credenciais (Client ID / Secret)**:
   - Tentar gerar token manualmente com `curl` ou Postman:
     ```bash
     curl -X POST https://trust-open.api.santander.com.br/auth/oauth/v2/token \
       -H "Content-Type: application/x-www-form-urlencoded" \
       -H "X-Application-Key: SEU_CLIENT_ID" \
       --cert certificado.p12:senha_do_certificado \
       -d "grant_type=client_credentials&client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET"
     ```
   - Se der 403, as credenciais estão erradas ou o IP não está liberado.

3. **Contatar Santander**:
   - Informar que está recebendo 403 Forbidden no endpoint de token
   - Fornecer os IPs de saída do Azure App Service (para whitelist)
   - Confirmar que as credenciais estão ativas e no ambiente correto

---

## 📞 Suporte Santander

Se nada acima resolver:

1. Abrir chamado no portal de APIs do Santander
2. Informar:
   - **Erro:** 403 Forbidden ao obter access token
   - **Endpoint:** `/auth/oauth/v2/token`
   - **ClientId:** (fornecer o ID)
   - **IPs de saída:** (Outbound addresses do Azure App Service)
   - **Certificado:** thumbprint e validade

---

## 🎯 Resumo

| Problema | Verificar | Solução |
|----------|-----------|---------|
| ClientId/Secret errados | Application settings no Azure | Corrigir valores |
| Certificado ausente | Private Key Certificates no Azure | Upload do .pfx |
| Certificado expirado | Expiration date no Azure | Renovar e upload novo |
| IP não liberado | Outbound IPs do App Service | Enviar para Santander |
| Ambiente errado | BaseUrl (sandbox vs produção) | Ajustar credenciais |

**Primeira ação:** chamar `GET /health/santander` no backend para ver o que está faltando.
