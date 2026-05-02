# Configuração do Projeto - Desenvolvimento e Produção

Este documento explica como configurar o projeto para funcionar tanto em desenvolvimento quanto em produção.

## 🚀 Configuração de Desenvolvimento

### Backend (.NET)

1. **Configuração do Banco de Dados**
   - O projeto usa SQL Server LocalDB por padrão
   - Certifique-se de ter o SQL Server LocalDB instalado
   - A string de conexão está configurada em `backend/appsettings.Development.json`

2. **Executar o Backend**
   ```bash
   cd backend
   dotnet run
   ```
   - O servidor será iniciado em `http://localhost:5101`
   - Endpoint de health check: `http://localhost:5101/health`

3. **Configurações de Desenvolvimento**
   - Logs detalhados habilitados
   - CORS configurado para permitir a origem do Next.js (ex.: `http://localhost:3000`)
   - Logs de queries SQL habilitados

### Frontend (Next.js)

1. **Configuração de Ambiente**
   - Crie um arquivo `.env.local` na pasta `frontend/` com:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5101/api
   NEXT_PUBLIC_ENVIRONMENT=development
   ```

2. **Executar o Frontend**
   ```bash
   cd frontend
   npm run dev
   # ou
   npm run dev:debug
   ```
   - O servidor será iniciado em `http://localhost:3000`

3. **Funcionalidades de Desenvolvimento**
   - Logs detalhados de requisições API
   - Timeout configurado para 10 segundos
   - Debug habilitado

## 🏭 Configuração de Produção

### Backend

1. **Configuração do Banco de Dados**
   - Edite `backend/appsettings.Production.json`
   - Configure a string de conexão para seu servidor de produção
   - Substitua `your-production-server`, `your-user`, `your-password`

2. **Configuração de CORS**
   - Edite `backend/appsettings.Production.json`
   - Configure `AllowedOrigins` com seus domínios de produção

3. **Deploy**
   ```bash
   cd backend
   dotnet publish -c Release -o ./publish
   ```

### Frontend

1. **Configuração de Ambiente**
   - Configure as variáveis de ambiente de produção:
   ```
   NEXT_PUBLIC_API_URL=https://seu-dominio.com/api
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

2. **Build de Produção**
   ```bash
   cd frontend
   npm run build:prod
   npm run start:prod
   ```

## 🔧 Scripts Disponíveis

### Frontend
- `npm run dev` - Desenvolvimento padrão
- `npm run dev:debug` - Desenvolvimento com debug habilitado
- `npm run build` - Build padrão
- `npm run build:prod` - Build de produção
- `npm run start` - Iniciar servidor padrão
- `npm run start:prod` - Iniciar servidor de produção
- `npm run lint` - Verificar código
- `npm run type-check` - Verificar tipos TypeScript

### Backend
- `dotnet run` - Executar em desenvolvimento
- `dotnet run --environment Production` - Executar em produção
- `dotnet publish -c Release` - Build de produção

## 📁 Estrutura de Configuração

```
backend/
├── appsettings.json              # Configuração base
├── appsettings.Development.json  # Configuração de desenvolvimento
└── appsettings.Production.json   # Configuração de produção

frontend/
├── env.config.ts                 # Configuração de ambiente
├── src/lib/api.ts               # Cliente API com configuração
└── .env.local                   # Variáveis de ambiente (criar)
```

## 🔍 Verificação de Configuração

1. **Backend**: Acesse `http://localhost:5101/health`
2. **Frontend**: Verifique os logs no console do navegador
3. **API**: Teste uma requisição para verificar a conectividade

## 🐛 Troubleshooting

### Problemas Comuns

1. **CORS Error**
   - Verifique se o backend está rodando na porta 5101
   - Confirme as configurações de CORS em `appsettings.Development.json`

2. **Database Connection Error**
   - Verifique se o SQL Server LocalDB está instalado
   - Execute `sqllocaldb start` se necessário

3. **API Timeout**
   - Verifique se o backend está respondendo
   - Confirme a URL da API no frontend

4. **Build Errors**
   - Execute `npm install` no frontend
   - Execute `dotnet restore` no backend

## 📝 Notas Importantes

- Em desenvolvimento, logs detalhados são habilitados
- Em produção, logs são reduzidos para melhor performance
- CORS é configurado automaticamente baseado no ambiente
- Timeout de requisições é de 10 segundos
- Health check endpoint disponível em `/health`