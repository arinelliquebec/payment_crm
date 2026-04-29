# Configuração do GitHub Actions para Deploy Automático

## Visão Geral

Este projeto está configurado com dois workflows do GitHub Actions:

1. **CI (Continuous Integration)** - `.github/workflows/ci.yml`
   - Executa em branches de desenvolvimento e pull requests
   - Roda testes, build e verificações de código

2. **Deploy para Azure** - `.github/workflows/deploy-azure.yml`
   - Executa deploy automático na Azure App Service
   - Ativado apenas em push para `main` ou `master`

## Configuração Necessária

### 1. Secrets do GitHub

Configure os seguintes secrets no seu repositório GitHub:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### AZURE_WEBAPP_PUBLISH_PROFILE
1. No [Portal Azure](https://portal.azure.com), vá para sua App Service
2. Clique em **"Get publish profile"**
3. Baixe o arquivo `.publishsettings`
4. Copie todo o conteúdo do arquivo
5. Cole no secret `AZURE_WEBAPP_PUBLISH_PROFILE`

### 2. Configuração da Azure App Service

#### Nome da Aplicação
No arquivo `.github/workflows/deploy-azure.yml`, atualize a variável:
```yaml
AZURE_WEBAPP_NAME: seu-app-name-aqui
```

Atualmente está configurado para: `contratos-bk`

#### Configurações da App Service
No Portal Azure, configure:

1. **Configuration** → **Application settings**:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ASPNETCORE_URLS`: `http://+:80`

2. **Connection Strings** (se não estiver no appsettings.json):
   - `DefaultConnection`: Sua string de conexão SQL Server

### 3. Configuração do Banco de Dados

Certifique-se de que:
- SQL Server permite conexões da Azure
- Firewall está configurado para aceitar IPs da Azure
- String de conexão está correta

## Fluxo de Trabalho

### Desenvolvimento
1. Crie branches a partir de `develop`
2. Faça push - CI será executado automaticamente
3. Abra Pull Request para `main` - CI será executado novamente

### Deploy para Produção
1. Merge para `main` ou `master`
2. Deploy automático será executado
3. Aplicação será atualizada na Azure

## Monitoramento

### GitHub Actions
- Vá para **Actions** no seu repositório
- Monitore status dos workflows
- Veja logs detalhados em caso de erro

### Azure Portal
- **App Service** → **Deployment Center** para histórico de deploys
- **Log stream** para logs em tempo real
- **Application Insights** para monitoramento (se configurado)

## Troubleshooting

### Erro de Build
```bash
# Teste localmente
dotnet restore
dotnet build --configuration Release
dotnet test
```

### Erro de Deploy
1. Verifique se o `AZURE_WEBAPP_PUBLISH_PROFILE` está correto
2. Confirme o nome da App Service no workflow
3. Verifique se a App Service está ativa

### Erro de Banco de Dados
1. Teste a conexão local com a string de conexão
2. Verifique firewall do SQL Server
3. Confirme credenciais

### Erro de CORS
1. Verifique configurações de CORS no `Program.cs`
2. Adicione domínios necessários na política CORS

## Comandos Úteis

```bash
# Testar build local
dotnet build --configuration Release

# Executar testes
dotnet test

# Verificar formatação
dotnet format --verify-no-changes

# Publicar localmente para teste
dotnet publish -c Release -o ./publish
```

## Estrutura dos Workflows

### CI Workflow
- ✅ Restore dependencies
- ✅ Build em Release
- ✅ Executar testes
- ✅ Verificar formatação de código
- ✅ Scan de segurança

### Deploy Workflow
- ✅ Build e testes
- ✅ Publicar aplicação
- ✅ Deploy na Azure App Service
- ✅ Apenas em branches principais (main/master)

## Próximos Passos

1. Configure o secret `AZURE_WEBAPP_PUBLISH_PROFILE`
2. Atualize o nome da App Service se necessário
3. Faça um push para `main` para testar o deploy
4. Monitore os logs para garantir sucesso

## Recursos Adicionais

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [GitHub Actions for .NET](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-net)
- [Azure Web Apps Deploy Action](https://github.com/Azure/webapps-deploy)
