# 🏦 Configuração da API Santander - PRODUÇÃO

## ⚠️ AÇÃO NECESSÁRIA

O sistema está configurado para usar a **API REAL do Santander**, mas você precisa:

### 1️⃣ Obter o Certificado Digital (.pfx)

Você precisa do arquivo de certificado digital fornecido pelo Santander:
- Arquivo: `certificado.pfx` ou `certificado.p12`
- Senha do certificado

### 2️⃣ Instalar o Certificado

**No seu Mac (desenvolvimento local):**

```bash
# 1. Importar certificado no Keychain
open certificado.pfx

# 2. Digite a senha quando solicitado

# 3. Obter o thumbprint (SHA-1)
security find-certificate -a -Z | grep -B 1 "Santander"
```

**No Azure (produção):**
1. Vá para Azure Portal → App Service
2. Settings → TLS/SSL settings → Private Key Certificates
3. Upload o certificado .pfx
4. Anote o Thumbprint

### 3️⃣ Configurar as Credenciais

Edite `backend/appsettings.Production.json`:

```json
{
  "SantanderAPI": {
    "ModoSimulacao": "false",
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "6a4c5cda-ff64-43e8-9219-25882afa3f52",
    "ClientId": "Kw9j93z9m4NC5nCNpu77c50ViTtvfegV",
    "ClientSecret": "9OgpxGoZSFLnAeK5",
    "CovenantCode": "0596794",
    "BankNumber": "1020",
    "CertificateThumbprint": "SEU_THUMBPRINT_AQUI",
    "CertificatePath": "",
    "CertificatePassword": "1234"
  }
}
```

**✅ As credenciais já estão corretas, você só precisa:**
- Colocar o **Thumbprint correto** do certificado instalado
- OU colocar o **CertificatePath** se preferir usar arquivo

### 4️⃣ Reiniciar o Backend

```bash
cd backend
dotnet run
```

## 🔍 Verificar se Funcionou

Após reiniciar, você deve ver nos logs:

```
✅ Certificado carregado com sucesso
✅ Certificado mTLS configurado no HttpClient
🔑 Gerando novo access token...
✅ Access token gerado com sucesso. Expira em: 60 minutos
```

## 🚨 Se Ainda Houver Erro 403

O erro "Forbidden" significa que:

1. **Certificado não foi encontrado** → Verifique o Thumbprint
2. **Certificado expirado** → Solicite novo certificado ao Santander
3. **Certificado não corresponde ao ClientId** → Verifique com o Santander

## 📞 Próximos Passos

1. ✅ Credenciais já configuradas no `appsettings.Production.json`
2. ⚠️ **VOCÊ PRECISA:** Instalar o certificado e configurar o Thumbprint
3. ✅ Reiniciar o backend
4. ✅ Testar sincronização de boletos

## 🎯 Resumo

**O que já está pronto:**
- ✅ Código funcionando
- ✅ Credenciais configuradas (WorkspaceId, ClientId, ClientSecret)
- ✅ CovenantCode correto (0596794)

**O que você precisa fazer:**
- ⚠️ Instalar o certificado digital do Santander
- ⚠️ Configurar o CertificateThumbprint no appsettings.Production.json
- ⚠️ Reiniciar o backend

---

**Data:** 21/11/2025

