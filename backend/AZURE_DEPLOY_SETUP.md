# Configuração do Deploy na Azure App Services

## Pré-requisitos

1. Uma conta Azure ativa
2. Uma aplicação Azure App Service criada
3. Acesso ao GitHub repository

## Passos para Configuração

### 1. Criar Azure App Service

1. Acesse o [Portal Azure](https://portal.azure.com)
2. Crie um novo App Service:
   - Nome: `backendcrm-arrighi` (ou o nome desejado)
   - Runtime stack: `.NET 8`
   - Operating System: `Windows` ou `Linux`
   - Region: escolha a região mais próxima

### 2. Obter o Publish Profile

1. No Azure Portal, vá para sua App Service
2. Clique em "Get publish profile"
3. Baixe o arquivo `.publishsettings`
4. Abra o arquivo e copie todo o conteúdo

### 3. Configurar GitHub Secrets

1. No seu repositório GitHub, vá para `Settings` > `Secrets and variables` > `Actions`
2. Clique em "New repository secret"
3. Adicione o seguinte secret:
   - **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Value**: Cole todo o conteúdo do arquivo `.publishsettings`

### 4. Atualizar o Workflow

No arquivo `.github/workflows/deploy-azure.yml`, substitua:
```yaml
app-name: 'your-azure-app-name'
```

Pelo nome real da sua aplicação Azure:
```yaml
app-name: 'backendcrm-arrighi'
```

### 5. Configurar Variáveis de Ambiente (Opcional)

Se necessário, configure as seguintes variáveis de ambiente na Azure App Service:

1. No Azure Portal, vá para sua App Service
2. Clique em `Configuration` > `Application settings`
3. Adicione as seguintes variáveis:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: Sua string de conexão do SQL Server

### 6. Configurar CORS (Se necessário)

Se você estiver usando CORS, configure as origens permitidas na Azure App Service ou no código.

## Estrutura do Workflow

O workflow criado faz o seguinte:

1. **Checkout**: Baixa o código do repositório
2. **Setup .NET**: Configura o ambiente .NET 8.0
3. **Restore**: Restaura as dependências do projeto
4. **Build**: Compila o projeto em modo Release
5. **Test**: Executa os testes (se houver)
6. **Publish**: Gera os arquivos de publicação
7. **Deploy**: Faz o deploy na Azure App Service

## Triggers

O workflow é executado quando:
- Há um push para as branches `main` ou `master`
- Há um pull request para as branches `main` ou `master`

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no arquivo `.csproj`
- Certifique-se de que o .NET 8.0 está sendo usado

### Erro de Deploy
- Verifique se o `AZURE_WEBAPP_PUBLISH_PROFILE` está configurado corretamente
- Confirme se o nome da aplicação está correto no workflow
- Verifique se a App Service está ativa no Azure

### Erro de Conexão com Banco
- Verifique se a string de conexão está correta
- Confirme se o firewall do SQL Server permite conexões da Azure
- Verifique se as credenciais estão corretas

## Monitoramento

Após o deploy, você pode monitorar:
- Logs da aplicação no Azure Portal
- Status do deploy no GitHub Actions
- Métricas da aplicação no Azure Application Insights (se configurado)