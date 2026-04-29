# 🔐 Erro 403 Forbidden ao Gerar Access Token - API Santander

## 📋 Problema Identificado

Erro ao baixar PDF de boleto:
```json
{
  "mensagem": "Erro interno do servidor",
  "detalhes": "Erro ao gerar access token: Forbidden",
  "tipo": "InvalidOperationException"
}
```

**Status HTTP:** 403 Forbidden
**Endpoint afetado:** `/auth/oauth/v2/token`
**Operação:** Geração de access token para autenticação na API Santander

## 🔍 Causa Raiz

O erro 403 Forbidden ao gerar access token geralmente indica um problema com a autenticação mTLS (mutual TLS) ou com as credenciais fornecidas.

### Possíveis Causas

1. **Certificado mTLS não carregado ou não enviado**
   - O certificado não foi encontrado nos caminhos configurados
   - O certificado não está sendo anexado corretamente à requisição HTTP
   - Problema com a configuração do HttpClientHandler

2. **Certificado mTLS inválido ou expirado**
   - Certificado expirado (verificar data de validade)
   - Certificado corrompido ou inválido
   - Certificado não corresponde ao ClientId configurado

3. **Credenciais incorretas**
   - ClientId incorreto
   - ClientSecret incorreto
   - WorkspaceId incorreto

4. **Problemas de configuração**
   - Certificado não corresponde ao ClientId
   - IP não autorizado
   - Limite de requisições excedido

## ✅ Melhorias Implementadas

### 1. Logs Detalhados de Diagnóstico

O código agora registra informações detalhadas quando ocorre erro 403:

```csharp
_logger.LogError("🔐 ERRO 403 FORBIDDEN ao gerar token:");
_logger.LogError("   → BaseUrl: {BaseUrl}", _baseUrl);
_logger.LogError("   → ClientId: {ClientId}", _clientId);
_logger.LogError("   → WorkspaceId: {WorkspaceId}", _workspaceId);
_logger.LogError("   → Certificado carregado: {HasCert}", ...);
```

### 2. Mensagem de Erro Melhorada

A mensagem de erro agora inclui contexto sobre o problema:

```csharp
"Erro ao gerar access token: Forbidden. Verifique se o certificado mTLS está configurado corretamente e corresponde ao ClientId."
```

### 3. Tratamento Específico no Controller

O controller agora detecta erros de autenticação e retorna mensagens mais claras:

```csharp
catch (InvalidOperationException invalidOpEx) when (invalidOpEx.Message.Contains("access token"))
{
    return StatusCode(500, new {
        mensagem = "Erro de autenticação com a API Santander",
        detalhes = invalidOpEx.Message + " Verifique se o certificado mTLS está configurado corretamente.",
        tipo = "AuthenticationException"
    });
}
```

## 🔧 Como Diagnosticar

### 1. Verificar Logs do Servidor

Procure por estas mensagens nos logs:

```
🔐 Iniciando configuração do certificado mTLS...
✅ Certificado carregado...
✅ Certificado mTLS configurado no HttpClient...
```

Se você ver:
```
❌ NENHUM certificado foi carregado! API Santander VAI FALHAR!
```

O certificado não está sendo carregado corretamente.

### 2. Verificar Configuração do Certificado

Verifique no `appsettings.json` ou variáveis de ambiente:

```json
{
  "SantanderAPI": {
    "CertificatePath": "/caminho/para/certificado.pfx",
    "CertificatePassword": "senha_do_certificado",
    "CertificateThumbprint": "thumbprint_do_certificado"
  }
}
```

### 3. Verificar Validade do Certificado

O certificado deve estar válido. Verifique a data de expiração:

```bash
# Windows PowerShell
Get-PfxCertificate -FilePath "caminho\certificado.pfx"

# Linux (OpenSSL)
openssl pkcs12 -in certificado.pfx -nokeys -clcerts | openssl x509 -noout -dates
```

### 4. Verificar Credenciais

Confirme que as credenciais estão corretas:

- `ClientId`: Deve corresponder ao certificado
- `ClientSecret`: Deve estar correto
- `WorkspaceId`: Deve estar correto
- `BaseUrl`: Deve ser `https://trust-open.api.santander.com.br`

## 🛠️ Soluções Possíveis

### Solução 1: Verificar Caminho do Certificado

**Problema:** Certificado não encontrado no caminho especificado

**Solução:**
1. Verifique se o caminho está correto no `appsettings.json`
2. Verifique se o arquivo existe no caminho especificado
3. Verifique permissões de leitura do arquivo

### Solução 2: Verificar Senha do Certificado

**Problema:** Senha incorreta do certificado

**Solução:**
1. Verifique se a senha no `appsettings.json` está correta
2. Tente abrir o certificado manualmente com a senha para confirmar

### Solução 3: Verificar Certificado no Azure (Produção)

**Problema:** Em produção no Azure, o certificado pode estar em caminhos diferentes

**Solução:**
1. Verifique se o certificado foi carregado no Azure App Service
2. Use o `CertificateThumbprint` ao invés do `CertificatePath`
3. Verifique os caminhos padrão do Azure:
   - `/var/ssl/private/{thumbprint}.p12`
   - `/var/ssl/certs/{thumbprint}.pfx`

### Solução 4: Verificar Correspondência ClientId/Certificado

**Problema:** O certificado não corresponde ao ClientId

**Solução:**
1. Confirme com o Santander que o certificado está associado ao ClientId correto
2. Verifique se está usando o certificado correto para o ambiente (dev/prod)

### Solução 5: Verificar Configuração do HttpClientHandler

**Problema:** O certificado não está sendo enviado na requisição

**Solução:**
O código já configura o certificado corretamente:
```csharp
handler.ClientCertificates.Add(certificate);
handler.ClientCertificateOptions = ClientCertificateOption.Manual;
```

Se ainda assim não funcionar, pode ser necessário verificar:
- Versão do .NET (deve ser 6.0 ou superior)
- Configurações de TLS do servidor
- Firewall/proxy que possa estar bloqueando

## 📊 Checklist de Diagnóstico

- [ ] Certificado existe no caminho especificado
- [ ] Senha do certificado está correta
- [ ] Certificado não está expirado
- [ ] ClientId está correto
- [ ] ClientSecret está correto
- [ ] WorkspaceId está correto
- [ ] Certificado corresponde ao ClientId
- [ ] Logs mostram que o certificado foi carregado
- [ ] BaseUrl está correto (`https://trust-open.api.santander.com.br`)
- [ ] IP do servidor está autorizado (se aplicável)

## 📝 Próximos Passos

1. **Verificar logs detalhados** - Os logs agora mostram mais informações sobre o problema
2. **Verificar configuração** - Confirme todas as credenciais e caminhos
3. **Contatar Santander** - Se tudo estiver correto, pode ser necessário verificar com o suporte do Santander:
   - Status da conta/workspace
   - Validação do certificado
   - Limites de requisição
   - IPs autorizados

## 🔗 Referências

- Documentação da API Santander sobre autenticação mTLS
- Arquivo de configuração: `backend/SANTANDER_CONFIG_BACKEND.md`
- Guia de configuração do certificado: `backend/CONFIGURACAO_CERTIFICADO_AZURE.md`

## 📅 Data da Correção

17/11/2025

