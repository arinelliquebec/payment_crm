# ✅ Build e Publish Concluídos - Commit ad9ef4d

## 🎉 Status: PRONTO PARA DEPLOY

**Data**: 21/11/2025 16:59  
**Commit**: ad9ef4d (descerealização)  
**Versão .NET**: 8.0  
**Modo**: Release (Produção)

---

## 📦 Arquivos Prontos Para Deploy

### Localização:
```
D:\Projetos\Arrighi\BackendAtualizado\backendcrmArrighi-1\backendcrmArrighi\publish\
```

### Arquivos Principais:
- ✅ `CadastroPessoas.dll` (1.5 MB)
- ✅ `CadastroPessoas.exe` (150 KB)
- ✅ `appsettings.json`
- ✅ `appsettings.Production.json`
- ✅ Todas as dependências (.dll)
- ✅ Runtime completo

---

## 🚀 Como Fazer Deploy

### Opção 1: Azure App Service (Recomendado)

#### Via Portal Azure:
1. Acesse o Azure Portal
2. Vá para seu App Service
3. Deployment Center → FTP ou Local Git
4. Faça upload da pasta `publish\*` para `D:\home\site\wwwroot\`

#### Via Azure CLI:
```bash
# Fazer zip da pasta publish
Compress-Archive -Path .\publish\* -DestinationPath deploy.zip

# Deploy via Azure CLI
az webapp deployment source config-zip `
  --resource-group SEU_RESOURCE_GROUP `
  --name SEU_APP_SERVICE `
  --src deploy.zip
```

#### Via FTP:
```
Host: SEU_APP_SERVICE.scm.azurewebsites.net
Usuário: (do portal Azure)
Senha: (do portal Azure)
Pasta destino: /site/wwwroot/
```

---

### Opção 2: Servidor Windows IIS

1. **Copiar arquivos**:
   ```
   Copiar todo o conteúdo de:
   D:\Projetos\Arrighi\BackendAtualizado\backendcrmArrighi-1\backendcrmArrighi\publish\
   
   Para o servidor em:
   C:\inetpub\wwwroot\backendcrmArrighi\
   ```

2. **Configurar IIS**:
   - Criar novo Application Pool (.NET 8.0)
   - Criar novo Site
   - Apontar para a pasta dos arquivos
   - Configurar binding (porta 80/443)

3. **Reiniciar**:
   ```
   iisreset
   ```

---

### Opção 3: Servidor Linux

1. **Copiar arquivos via SCP**:
   ```bash
   scp -r publish/* usuario@servidor:/var/www/backendcrmArrighi/
   ```

2. **Configurar systemd service**:
   ```bash
   sudo nano /etc/systemd/system/backendcrm.service
   ```

   ```ini
   [Unit]
   Description=Backend CRM Arrighi
   
   [Service]
   WorkingDirectory=/var/www/backendcrmArrighi
   ExecStart=/usr/bin/dotnet /var/www/backendcrmArrighi/CadastroPessoas.dll
   Restart=always
   RestartSec=10
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Iniciar serviço**:
   ```bash
   sudo systemctl enable backendcrm
   sudo systemctl start backendcrm
   sudo systemctl status backendcrm
   ```

---

## ⚙️ Configurações de Produção

### ANTES de fazer deploy, ajustar:

#### 1. `appsettings.Production.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "VERIFICAR_CONNECTION_STRING_PRODUCAO"
  },
  "AzureStorage": {
    "ConnectionString": "VERIFICAR_AZURE_STORAGE",
    "ContainerName": "contratos"
  },
  "SantanderAPI": {
    "ModoSimulacao": "false",  // ⚠️ IMPORTANTE: false em produção
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "PRODUCAO",
    "ClientId": "...",
    "ClientSecret": "..."
  }
}
```

#### 2. Variáveis de Ambiente (Azure)
```
ASPNETCORE_ENVIRONMENT = Production
ASPNETCORE_URLS = http://+:80
```

---

## ✅ Checklist Pré-Deploy

- [ ] Connection string atualizada
- [ ] Azure Storage configurado
- [ ] Santander API em modo produção (não simulação)
- [ ] Certificado Santander no servidor
- [ ] Backup do banco de dados feito
- [ ] Versão anterior com backup
- [ ] Plano de rollback preparado

---

## 🧪 Testar Após Deploy

### 1. Health Check
```bash
curl https://SEU_DOMINIO.com/health
```

### 2. Login
```bash
POST https://SEU_DOMINIO.com/api/auth/login
{
  "email": "admin@example.com",
  "senha": "senha"
}
```

### 3. Listar Pessoas
```bash
GET https://SEU_DOMINIO.com/api/pessoafisica
Authorization: Bearer {TOKEN}
```

### 4. Criar Boleto (Teste)
```bash
POST https://SEU_DOMINIO.com/api/boleto
Authorization: Bearer {TOKEN}
{
  "contratoId": 1,
  "nominalValue": 100.00,
  "dueDate": "2025-12-31"
}
```

---

## 📊 Informações do Build

### Compilação:
- ✅ Build em modo Release: **SUCESSO**
- ✅ Publish para pasta: **SUCESSO**
- ⚠️ Warnings: 26 (normais, não críticos)
- ❌ Erros: 0

### Tempo:
- Limpeza: 0.9s
- Build: 6.0s
- Publish: 2.7s
- **Total**: ~9.6s

### Tamanho:
- DLL Principal: 1.5 MB
- Executável: 150 KB
- Total com dependências: ~50-100 MB

---

## 🔄 APÓS o Deploy

### IMPORTANTE: Voltar para a versão mais recente!

```bash
# No terminal Git:
git checkout main
```

**NÃO esqueça de fazer isso!**

---

## 📝 Logs de Deploy

### Build:
```
✅ Restauração concluída (0,3s)
✅ CadastroPessoas êxito(s) com 26 aviso(s) (5,2s)
✅ Construir êxito(s) com 26 aviso(s) em 6,0s
```

### Publish:
```
✅ Restauração concluída (0,3s)
✅ CadastroPessoas êxito(s) com 1 aviso(s) (1,9s)
✅ Construir êxito(s) com 1 aviso(s) em 2,7s
```

---

## 🐛 Se Algo Der Errado

### Rollback Rápido:

1. **Restaurar versão anterior** no servidor
2. **Reiniciar aplicação**
3. **Verificar logs**

### Voltar para Main:
```bash
git checkout main
```

### Ver diferenças:
```bash
git diff ad9ef4d main
```

---

## 📞 Comandos Úteis

### Ver arquivos publicados:
```bash
ls publish
```

### Criar ZIP para deploy:
```bash
Compress-Archive -Path .\publish\* -DestinationPath deploy.zip
```

### Testar localmente antes de deploy:
```bash
cd publish
dotnet CadastroPessoas.dll
# Acessar: http://localhost:5000
```

---

## 📌 Resumo

| Item | Status |
|------|--------|
| **Commit** | ad9ef4d ✅ |
| **Build** | ✅ Sucesso |
| **Publish** | ✅ Sucesso |
| **Arquivos** | ✅ Prontos |
| **Próximo Passo** | 🚀 Fazer upload para servidor |

---

## 🎯 Próximas Ações

1. **AGORA**: Fazer upload dos arquivos da pasta `publish\` para o servidor
2. **DEPOIS**: Reiniciar aplicação no servidor
3. **TESTAR**: Endpoints principais
4. **MONITORAR**: Logs por 30 minutos
5. **VOLTAR**: `git checkout main` quando estabilizar

---

**Build realizado em**: 21/11/2025 16:59  
**Commit**: ad9ef4d (descerealização)  
**Status**: ✅ PRONTO PARA DEPLOY

**⚠️ LEMBRE-SE: Após deploy, volte para main!**
```bash
git checkout main
```

