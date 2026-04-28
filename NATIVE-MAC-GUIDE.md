# 🍎 Guia de Desenvolvimento Nativo no macOS

Este guia mostra como rodar o projeto no macOS **sem Docker**, **sem SQLite** e **sem modificar o backend**.

## 🚀 Opções Disponíveis

### Opção 1: **Frontend + Backend Nativo** (Recomendado)
```bash
./start-native-mac.sh
```

### Opção 2: **Apenas Frontend** (Para visualizar a interface)
```bash
./start-frontend-only.sh
```

### Opção 3: **Manual** (Controle total)
```bash
# Terminal 1 - Backend
cd backend
dotnet run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📋 Pré-requisitos

### 1. .NET 8.0 SDK
```bash
# Verificar se está instalado
dotnet --version

# Se não estiver, baixar de:
# https://dotnet.microsoft.com/download
```

### 2. Node.js 18+
```bash
# Verificar se está instalado
node --version
npm --version

# Se não estiver, baixar de:
# https://nodejs.org/
```

### 3. SQL Server LocalDB (Opcional)
```bash
# Verificar se está instalado
sqlcmd -?

# Se não estiver, instalar via:
# https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb
```

## 🔧 Configuração

### Arquivo de Ambiente
O script criará automaticamente o arquivo `.env.local` no frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:5101/api
NEXT_PUBLIC_ENVIRONMENT=development
```

### Portas Utilizadas
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5101
- **Health Check**: http://localhost:5101/health

## 🎯 Cenários de Uso

### Cenário 1: **Desenvolvimento Completo**
```bash
./start-native-mac.sh
```
- ✅ Frontend funcional
- ✅ Backend funcional
- ✅ Banco de dados funcional
- ✅ Todas as funcionalidades disponíveis

### Cenário 2: **Visualização da Interface**
```bash
./start-frontend-only.sh
```
- ✅ Frontend funcional
- ❌ Backend não disponível
- ❌ Dados não carregam
- ✅ Interface visual disponível

### Cenário 3: **Desenvolvimento Frontend**
```bash
cd frontend
npm run dev
```
- ✅ Hot reload
- ✅ Desenvolvimento rápido
- ❌ API não responde
- ✅ Interface funcional

## 🔍 Troubleshooting

### Problema: **SQL Server LocalDB não encontrado**
```bash
# Solução 1: Instalar SQL Server LocalDB
# https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb

# Solução 2: Usar Docker
./start-dev-mac.sh

# Solução 3: Rodar apenas frontend
./start-frontend-only.sh
```

### Problema: **Porta já em uso**
```bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :5101

# Parar processo
kill -9 <PID>
```

### Problema: **.NET não encontrado**
```bash
# Instalar .NET SDK
# https://dotnet.microsoft.com/download
```

### Problema: **Node.js não encontrado**
```bash
# Instalar Node.js
# https://nodejs.org/
```

## 📊 Comparação de Opções

| Opção | Frontend | Backend | Banco | Complexidade | Recomendação |
|-------|----------|---------|-------|--------------|--------------|
| **Nativo Completo** | ✅ | ✅ | ✅ | Média | ⭐⭐⭐⭐⭐ |
| **Apenas Frontend** | ✅ | ❌ | ❌ | Baixa | ⭐⭐⭐ |
| **Docker** | ✅ | ✅ | ✅ | Alta | ⭐⭐⭐⭐⭐ |
| **Manual** | ✅ | ✅ | ✅ | Média | ⭐⭐⭐⭐ |

## 🛠️ Comandos Úteis

### Verificar Status
```bash
# Verificar se o backend está rodando
curl http://localhost:5101/health

# Verificar se o frontend está rodando
curl http://localhost:3000

# Verificar processos
ps aux | grep dotnet
ps aux | grep node
```

### Logs
```bash
# Backend logs (se rodando)
# Os logs aparecem no terminal onde o backend foi iniciado

# Frontend logs (se rodando)
# Os logs aparecem no terminal onde o frontend foi iniciado
```

### Limpeza
```bash
# Parar todos os processos
pkill -f dotnet
pkill -f node

# Limpar cache do frontend
cd frontend
rm -rf .next
npm run dev
```

## 🎨 Desenvolvimento Frontend

### Hot Reload
```bash
cd frontend
npm run dev
```
- ✅ Mudanças automáticas
- ✅ Fast refresh
- ✅ TypeScript checking

### Build de Produção
```bash
cd frontend
npm run build
npm run start
```

### Linting
```bash
cd frontend
npm run lint
```

## 🔧 Desenvolvimento Backend

### Hot Reload
```bash
cd backend
dotnet watch run
```
- ✅ Mudanças automáticas
- ✅ Rebuild automático

### Build
```bash
cd backend
dotnet build
dotnet run
```

### Testes
```bash
cd backend
dotnet test
```

## 📱 URLs de Acesso

### Desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5101
- **Health Check**: http://localhost:5101/health
- **API Endpoints**: http://localhost:5101/api/*

### Produção (se buildado)
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5101

## 🚀 Deploy

### Frontend para Produção
```bash
cd frontend
npm run build
npm run start
```

### Backend para Produção
```bash
cd backend
dotnet publish -c Release
dotnet CadastroPessoas.dll
```

## 📝 Notas Importantes

- **SQL Server LocalDB**: Necessário para backend completo
- **Portas**: 3000 e 5101 devem estar livres
- **Dependências**: Node.js e .NET SDK obrigatórios
- **Performance**: Nativo é mais rápido que Docker
- **Compatibilidade**: Funciona em qualquer macOS

## 🔗 Recursos Adicionais

- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [SQL Server LocalDB](https://docs.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb)
