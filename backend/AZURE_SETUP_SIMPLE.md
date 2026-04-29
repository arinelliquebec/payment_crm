# Configuração Simples - Deploy Azure App Service

## Passos para Configurar:

### 1. Criar Azure App Service
1. Acesse [Portal Azure](https://portal.azure.com)
2. Crie um novo App Service:
   - Nome: `contratos-bk`
   - Runtime: `.NET 8`
   - OS: Windows ou Linux
   - Region: escolha a região

### 2. Obter Publish Profile
1. No Azure Portal, vá para sua App Service
2. Clique em "Get publish profile"
3. Baixe o arquivo `.publishsettings`
4. Abra e copie todo o conteúdo

### 3. Configurar GitHub Secret
1. No GitHub, vá para seu repositório
2. Settings → Secrets and variables → Actions
3. "New repository secret"
4. Nome: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Valor: cole o conteúdo do arquivo `.publishsettings`

### 4. Testar Deploy
1. Faça um push para a branch `main` ou `master`
2. Vá para Actions no GitHub para ver o progresso
3. Verifique se o deploy foi bem-sucedido

## O que o Workflow faz:

1. **Checkout**: Baixa o código
2. **Setup .NET**: Configura .NET 8.0
3. **Restore**: Restaura dependências
4. **Build**: Compila em Release
5. **Publish**: Gera arquivos para deploy
6. **Deploy**: Faz upload para Azure

## URLs importantes:
- GitHub Actions: `https://github.com/seu-usuario/seu-repo/actions`
- Azure App Service: `https://contratos-bk-gag8afd6degtdca4.brazilsouth-01.azurewebsites.net`

## Troubleshooting:
- Se der erro de build: verifique se o .NET 8.0 está instalado
- Se der erro de deploy: verifique se o secret está configurado corretamente
- Se der erro de conexão: verifique se a App Service está ativa