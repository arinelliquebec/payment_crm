# 🔐 Configuração do Certificado no Azure - CONCLUÍDO ✅

## ✅ Status: Certificado Carregado no Azure

**Certificado:** ARRIGHI ADVOGADOS E ASSOCIADOS  
**Thumbprint:** `6F72CE7C8D2209127F10578F356E11C44A4D1AA8`  
**Validade:** 05/08/2026  
**Status:** ✅ Carregado com sucesso

---

## 🚀 Próximos Passos para Finalizar

### **Passo 1: Configurar o App Service para Carregar o Certificado**

1. No **Azure Portal**, acesse seu **App Service**
2. No menu lateral, vá em: **Configuration** → **Application settings**
3. Clique em **+ New application setting**
4. Adicione a configuração:

```
Nome: WEBSITE_LOAD_CERTIFICATES
Valor: 6F72CE7C8D2209127F10578F356E11C44A4D1AA8
```

**OU** se preferir carregar todos os certificados:
```
Nome: WEBSITE_LOAD_CERTIFICATES
Valor: *
```

5. Clique em **OK**
6. Clique em **Save** (no topo da página)
7. **Reinicie o App Service**

---

### **Passo 2: Fazer Deploy das Alterações**

As configurações já foram atualizadas:

✅ `appsettings.Production.json` configurado com:
- `CertificateThumbprint`: `6F72CE7C8D2209127F10578F356E11C44A4D1AA8`
- `CertificatePath`: vazio (não necessário quando usa Thumbprint)

Agora faça o commit e push:

```bash
git add appsettings.Production.json Controllers/ContratoController.cs
git commit -m "Config: Certificado Azure + Resolução conflitos merge"
git push
```

---

### **Passo 3: Testar em Produção**

Após o deploy, teste a criação de um boleto:

```bash
POST https://seu-backend.azurewebsites.net/api/Boleto
Content-Type: application/json
X-Usuario-Id: SEU_USUARIO_ID

{
  "contratoId": 123,
  "dataVencimento": "2025-11-30",
  "valor": 100.00
}
```

---

## 📋 Configurações Finais no appsettings.Production.json

```json
{
  "SantanderAPI": {
    "ModoSimulacao": "false",
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "6a4c5cda-ff64-43e8-9219-25882afa3f52",
    "ClientId": "Kw9j93z9m4NC5nCNpu77c50ViTtvfegV",
    "ClientSecret": "9OgpxGoZSFLnAeK5",
    "CovenantCode": "596794",
    "BankNumber": "1020",
    "CertificateThumbprint": "6F72CE7C8D2209127F10578F356E11C44A4D1AA8",
    "CertificatePath": "",
    "CertificatePassword": "1234"
  }
}
```

---

## ⚠️ Importante: Código que Precisa Ser Atualizado

O `SantanderBoletoService.cs` precisa ser atualizado para usar o Thumbprint em vez do Path. Vou verificar se precisa de alteração.

---

## 🔄 Renovação do Certificado (Lembrete)

**Data de Vencimento:** 05/08/2026

**30 dias antes (05/07/2026):**
1. Solicitar novo certificado ao Santander
2. Fazer upload no Azure (mesma tela de certificados)
3. Atualizar o Thumbprint no `appsettings.Production.json`
4. Fazer deploy
5. Remover o certificado antigo

---

## ✅ Checklist Final

- [x] Certificado carregado no Azure
- [x] Thumbprint copiado
- [ ] **WEBSITE_LOAD_CERTIFICATES** configurado no App Service
- [ ] App Service reiniciado
- [x] `appsettings.Production.json` atualizado
- [x] Conflitos de merge resolvidos
- [ ] Commit e push feitos
- [ ] Teste de criação de boleto em produção

---

## 📞 Suporte

Se o certificado não funcionar após o deploy:

1. Verifique se `WEBSITE_LOAD_CERTIFICATES` está configurado
2. Verifique se o App Service foi reiniciado
3. Verifique os logs do App Service para erros de certificado
4. Verifique se o Thumbprint está correto (sem espaços)
