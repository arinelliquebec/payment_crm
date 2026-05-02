# Guia Completo de Deploy com GitHub Actions

## 📋 Visão Geral

Este projeto está configurado com workflows automatizados do GitHub Actions para:

- **CI (Continuous Integration)** - Testes e validações em branches de desenvolvimento
- **Deploy para Produção** - Deploy automático na Azure App Service (branch `main`)
- **Deploy para Staging** - Deploy automático no ambiente de staging (branch `develop`)

## 🚀 Workflows Configurados

### 1. CI - Continuous Integration (`.github/workflows/ci.yml`)
- **Triggers**: Push em `develop`, `feature/*`, `hotfix/*` e PRs para `main`, `develop`
- **Ações**:
  - ✅ Setup .NET 8.0
  - ✅ Cache de pacotes NuGet
  - ✅ Restore dependencies
  - ✅ Build em Release
  - ✅ Executar testes
  - ✅ Verificar formatação de código
  - ✅ Scan de segurança

### 2. Deploy para Produção (`.github/workflows/deploy-azure.yml`)
- **Triggers**: Push em `main` ou `master`
- **Ambiente**: Production
- **Ações**:
  - ✅ Build e testes
  - ✅ Publicar aplicação
  - ✅ Deploy na Azure App Service (`arrighi-bk`)

### 3. Deploy para Staging (`.github/workflows/deploy-staging.yml`)
- **Triggers**: Push em `develop`
- **Ambiente**: Staging
- **Ações**:
  - ✅ Build e testes
  - ✅ Deploy na Azure App Service de staging (`arrighi-staging`)

## 🔐 Configuração de Secrets

### Secrets Necessários

Configure os seguintes secrets no GitHub:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 1. `AZURE_WEBAPP_PUBLISH_PROFILE` (Produção)
```bash
# Como obter:
1. Acesse o Portal Azure (https://portal.azure.com)
2. Vá para sua App Service de produção (arrighi-bk)
3. Clique em "Get publish profile"
4. Baixe o arquivo .publishsettings
5. Copie TODO o conteúdo do arquivo
6. Cole no secret AZURE_WEBAPP_PUBLISH_PROFILE
```

#### 2. `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` (Staging - Opcional)
```bash
# Como obter:
1. Acesse o Portal Azure
2. Vá para sua App Service de staging (arrighi-staging)
3. Clique em "Get publish profile"
4. Baixe o arquivo .publishsettings
5. Copie TODO o conteúdo do arquivo
6. Cole no secret AZURE_WEBAPP_PUBLISH_PROFILE_STAGING
```

## ⚙️ Configuração da Azure App Service

### 1. Configurações da Aplicação (Production)

No Portal Azure, vá para sua App Service → **Configuration** → **Application settings**:

```json
{
  "ASPNETCORE_ENVIRONMENT": "Production",
  "ASPNETCORE_URLS": "http://+:80"
}
```

### 2. String de Conexão

Backend usa PostgreSQL via Npgsql. Configure em **Configuration** → **Connection strings** (ou via env vars `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`):

```json
{
  "DefaultConnection": {
    "value": "Host=seu-host;Port=5432;Database=seu-banco;Username=usuario;Password=senha;SSL Mode=Require;Trust Server Certificate=true",
    "type": "Custom"
  }
}
```

### 3. Configurações CORS

Certifique-se de que as origens estão configuradas corretamente no `Program.cs`:

```csharp
options.AddPolicy("AllowVercel", builder =>
{
    builder.WithOrigins(
        "https://arrighi-front-v1-copy.vercel.app",
        "https://arrighicrm-front-v1.vercel.app",
        "https://arrighicrm.com",
        "https://www.arrighicrm.com",
        "http://localhost:3000"
    )
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials();
});
```

## 🔄 Fluxo de Trabalho

### Desenvolvimento
```bash
# 1. Criar branch de feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer alterações e commit
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 3. Push - CI será executado automaticamente
git push origin feature/nova-funcionalidade

# 4. Abrir Pull Request para develop
# CI será executado novamente
```

### Deploy para Staging
```bash
# 1. Merge para develop
git checkout develop
git merge feature/nova-funcionalidade

# 2. Push para develop - Deploy automático para staging
git push origin develop
```

### Deploy para Produção
```bash
# 1. Merge para main
git checkout main
git merge develop

# 2. Push para main - Deploy automático para produção
git push origin main
```

## 📊 Monitoramento

### GitHub Actions
- Vá para **Actions** no seu repositório
- Monitore status dos workflows
- Veja logs detalhados em caso de erro

### Azure Portal
- **App Service** → **Deployment Center** para histórico de deploys
- **Log stream** para logs em tempo real
- **Application Insights** para monitoramento (se configurado)

## 🛠️ Troubleshooting

### Erro de Build
```bash
# Teste localmente
dotnet restore ./CadastroPessoas.csproj
dotnet build ./CadastroPessoas.csproj --configuration Release
dotnet test ./CadastroPessoas.csproj
```

### Erro de Deploy
1. ✅ Verifique se o `AZURE_WEBAPP_PUBLISH_PROFILE` está correto
2. ✅ Confirme o nome da App Service no workflow
3. ✅ Verifique se a App Service está ativa
4. ✅ Verifique se há slots de deployment disponíveis

### Erro de Banco de Dados
1. ✅ Teste a conexão local com a string de conexão
2. ✅ Verifique firewall do SQL Server
3. ✅ Confirme credenciais
4. ✅ Verifique se o banco existe

### Erro de CORS
1. ✅ Verifique configurações de CORS no `Program.cs`
2. ✅ Adicione domínios necessários na política CORS
3. ✅ Teste com diferentes origens

## 🔧 Comandos Úteis

```bash
# Testar build local
dotnet build ./CadastroPessoas.csproj --configuration Release

# Executar testes
dotnet test ./CadastroPessoas.csproj

# Verificar formatação
dotnet format ./CadastroPessoas.csproj --verify-no-changes

# Publicar localmente para teste
dotnet publish ./CadastroPessoas.csproj -c Release -o ./publish

# Verificar vulnerabilidades
dotnet list ./CadastroPessoas.csproj package --vulnerable --include-transitive
```

## 📝 Próximos Passos

### 1. Configurar Secrets
- [ ] `AZURE_WEBAPP_PUBLISH_PROFILE` (Produção)
- [ ] `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` (Staging - Opcional)

### 2. Verificar Configurações Azure
- [ ] Nome da App Service está correto nos workflows
- [ ] Configurações de ambiente estão corretas
- [ ] String de conexão está configurada
- [ ] CORS está configurado

### 3. Testar Deploy
- [ ] Fazer push para `develop` para testar staging
- [ ] Fazer push para `main` para testar produção
- [ ] Monitorar logs para garantir sucesso

### 4. Configurações Opcionais
- [ ] Configurar Application Insights
- [ ] Configurar alertas de monitoramento
- [ ] Configurar backup automático
- [ ] Configurar SSL/TLS personalizado

## 📚 Recursos Adicionais

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [GitHub Actions for .NET](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-net)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
- [.NET 8 Documentation](https://docs.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)

## 🆘 Suporte

Em caso de problemas:

1. Verifique os logs do GitHub Actions
2. Verifique os logs da Azure App Service
3. Teste o build localmente
4. Verifique a documentação oficial
5. Consulte a equipe de desenvolvimento

---

**Última atualização**: Setembro 2025
**Versão**: 1.0
