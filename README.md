# CRM Arrighi - Sistema de Cadastro de Pessoas

Sistema completo de cadastro de pessoas físicas e jurídicas com interface moderna e API robusta.

## 🚀 Início Rápido

### Opção 1: Script Automático (Recomendado)

**Linux/macOS:**
```bash
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

### Opção 2: Docker Compose

```bash
docker-compose -f docker-compose.dev.yml up
```

### Opção 3: Manual

1. **Backend:**
   ```bash
   cd backend
   dotnet run
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📋 Pré-requisitos

- .NET 8.0 SDK
- Node.js 18+
- npm ou pnpm
- SQL Server LocalDB (para desenvolvimento local)

## 🏗️ Arquitetura

- **Backend**: ASP.NET Core 8.0 com Entity Framework
- **Frontend**: Next.js 15 com TypeScript e Tailwind CSS
- **Banco de Dados**: SQL Server
- **Estilo**: Design moderno com animações suaves

## 🔧 Configuração

### Desenvolvimento

O projeto está configurado para funcionar automaticamente em desenvolvimento:

- Backend: `http://localhost:5101`
- Frontend: `http://localhost:3000`
- API: `http://localhost:5101/api`
- Health Check: `http://localhost:5101/health`

### Produção

Para configurar para produção, consulte o arquivo `SETUP.md` para instruções detalhadas.

## 📁 Estrutura do Projeto

```
monoRepoArrighiOfficial/
├── backend/                 # API .NET Core
│   ├── Controllers/        # Controladores da API
│   ├── Models/            # Modelos de dados
│   ├── Data/              # Contexto do Entity Framework
│   └── appsettings.*.json # Configurações por ambiente
├── frontend/              # Aplicação Next.js
│   ├── src/
│   │   ├── app/          # Páginas da aplicação
│   │   ├── components/   # Componentes React
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilitários e configurações
│   │   └── types/        # Definições TypeScript
│   └── env.config.ts     # Configuração de ambiente
├── start-dev.sh          # Script de inicialização (Linux/macOS)
├── start-dev.bat         # Script de inicialização (Windows)
├── docker-compose.dev.yml # Configuração Docker para desenvolvimento
└── SETUP.md              # Guia completo de configuração
```

## 🎯 Funcionalidades

### Cadastros Disponíveis

- **Pessoas Físicas**: CPF, nome, email, telefone, endereço
- **Pessoas Jurídicas**: CNPJ, razão social, email, telefone, endereço
- **Usuários**: Sistema de usuários para gerenciamento

### Recursos Técnicos

- ✅ Interface responsiva e moderna
- ✅ Validação de dados em tempo real
- ✅ Animações suaves com Framer Motion
- ✅ API RESTful completa
- ✅ Configuração automática por ambiente
- ✅ Logs detalhados em desenvolvimento
- ✅ Health check endpoint
- ✅ CORS configurado automaticamente
- ✅ Timeout de requisições
- ✅ Tratamento de erros robusto

## 🛠️ Scripts Disponíveis

### Frontend
```bash
npm run dev          # Desenvolvimento
npm run dev:debug    # Desenvolvimento com debug
npm run build        # Build padrão
npm run build:prod   # Build de produção
npm run start        # Servidor padrão
npm run start:prod   # Servidor de produção
npm run lint         # Verificar código
npm run type-check   # Verificar tipos TypeScript
```

### Backend
```bash
dotnet run                           # Desenvolvimento
dotnet run --environment Production  # Produção
dotnet publish -c Release           # Build de produção
```

## 🔍 Verificação

Após iniciar o projeto, verifique:

1. **Backend**: http://localhost:5101/health
2. **Frontend**: http://localhost:3000
3. **API**: Teste os endpoints em http://localhost:5101/api

## 📚 Documentação

- [Guia de Configuração](SETUP.md) - Instruções detalhadas para desenvolvimento e produção
- [API Documentation](backend/README.md) - Documentação da API
- [Frontend Guide](frontend/README.md) - Guia do frontend

## 🐛 Troubleshooting

### Problemas Comuns

1. **CORS Error**: Verifique se o backend está rodando na porta 5101
2. **Database Error**: Certifique-se de que o SQL Server LocalDB está instalado
3. **Build Errors**: Execute `npm install` e `dotnet restore`
4. **Porta em uso**: Verifique se as portas 3000 e 5101 estão livres

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas, abra uma issue no repositório.