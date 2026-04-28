# 🐳 Guia Docker para macOS

Este guia explica como usar Docker no macOS para desenvolvimento e teste da aplicação antes de colocar em produção.

## 📋 Pré-requisitos

### 1. Instalar Docker Desktop
```bash
# Baixar do site oficial
# https://www.docker.com/products/docker-desktop
```

### 2. Verificar instalação
```bash
docker --version
docker-compose --version
```

## 🚀 Desenvolvimento

### Opção 1: Script Automático (Recomendado)
```bash
./start-dev-mac.sh
```

### Opção 2: Comando Manual
```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f docker-compose.mac.yml up --build -d

# Ver logs
docker-compose -f docker-compose.mac.yml logs -f

# Parar
docker-compose -f docker-compose.mac.yml down
```

## 🧪 Teste de Produção

### Opção 1: Script Automático
```bash
./test-prod.sh
```

### Opção 2: Comando Manual
```bash
# Iniciar ambiente de produção
docker-compose -f docker-compose.prod.yml up --build -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar
docker-compose -f docker-compose.prod.yml down
```

## 📊 Monitoramento

### Verificar status dos containers
```bash
# Desenvolvimento
docker-compose -f docker-compose.mac.yml ps

# Produção
docker-compose -f docker-compose.prod.yml ps
```

### Ver logs específicos
```bash
# Backend
docker-compose -f docker-compose.mac.yml logs backend

# Frontend
docker-compose -f docker-compose.mac.yml logs frontend

# Database
docker-compose -f docker-compose.mac.yml logs sqlserver
```

### Monitorar recursos
```bash
# Ver uso de recursos
docker stats

# Ver informações detalhadas
docker system df
```

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar apenas o backend
docker-compose -f docker-compose.mac.yml up backend

# Reiniciar um serviço
docker-compose -f docker-compose.mac.yml restart backend

# Acessar container
docker exec -it crm-arrighi-backend-mac bash
docker exec -it crm-arrighi-frontend-mac sh

# Ver logs em tempo real
docker-compose -f docker-compose.mac.yml logs -f backend
```

### Produção
```bash
# Iniciar apenas o backend
docker-compose -f docker-compose.prod.yml up backend

# Reiniciar um serviço
docker-compose -f docker-compose.prod.yml restart backend

# Acessar container
docker exec -it crm-arrighi-backend-prod bash
docker exec -it crm-arrighi-frontend-prod sh
```

## 🗄️ Banco de Dados

### Acessar SQL Server
```bash
# Via container
docker exec -it crm-arrighi-sqlserver-mac /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd

# Via ferramenta externa (Azure Data Studio, DBeaver, etc.)
# Host: localhost
# Port: 1433
# User: sa
# Password: YourStrong@Passw0rd
```

### Backup e Restore
```bash
# Backup
docker exec crm-arrighi-sqlserver-mac /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd \
  -Q "BACKUP DATABASE CrmArrighi TO DISK = '/var/opt/mssql/backup.bak'"

# Copiar backup para host
docker cp crm-arrighi-sqlserver-mac:/var/opt/mssql/backup.bak ./backup.bak
```

## 🧹 Limpeza

### Limpar containers não utilizados
```bash
docker container prune
```

### Limpar imagens não utilizadas
```bash
docker image prune
```

### Limpar volumes não utilizados
```bash
docker volume prune
```

### Limpar tudo
```bash
docker system prune -a
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Porta já em uso**
   ```bash
   # Verificar o que está usando a porta
   lsof -i :3000
   lsof -i :5101
   lsof -i :1433

   # Parar processo
   kill -9 <PID>
   ```

2. **Container não inicia**
   ```bash
   # Ver logs detalhados
   docker-compose -f docker-compose.mac.yml logs

   # Reconstruir
   docker-compose -f docker-compose.mac.yml up --build
   ```

3. **Problemas de permissão**
   ```bash
   # Dar permissão aos scripts
   chmod +x start-dev-mac.sh
   chmod +x test-prod.sh
   ```

4. **Problemas de memória**
   ```bash
   # Aumentar memória no Docker Desktop
   # Settings > Resources > Memory
   ```

### Verificar Health Checks
```bash
# Backend
curl http://localhost:5101/health

# Frontend
curl http://localhost:3000

# Database
docker exec crm-arrighi-sqlserver-mac /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd -Q "SELECT 1"
```

## 📈 Performance

### Otimizações para macOS

1. **Aumentar recursos no Docker Desktop**
   - Memory: 4GB+
   - CPU: 2 cores+
   - Disk: 64GB+

2. **Usar volumes para desenvolvimento**
   ```yaml
   volumes:
     - ./backend:/app
     - /app/bin
     - /app/obj
   ```

3. **Multi-stage builds para produção**
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   # ... build steps
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
   # ... runtime steps
   ```

## 🚀 Deploy

### Preparar para produção
```bash
# Build das imagens de produção
docker-compose -f docker-compose.prod.yml build

# Testar localmente
docker-compose -f docker-compose.prod.yml up -d

# Verificar funcionamento
curl http://localhost:5101/health
curl http://localhost:3000
```

### Deploy em servidor
```bash
# Copiar arquivos para servidor
scp docker-compose.prod.yml user@server:/app/
scp -r backend user@server:/app/
scp -r frontend user@server:/app/

# No servidor
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 Notas Importantes

- **Desenvolvimento**: Usa SQL Server Edge (compatível com Apple Silicon)
- **Produção**: Usa SQL Server completo
- **Volumes**: Dados são persistidos entre restarts
- **Networks**: Containers se comunicam via rede Docker
- **Health Checks**: Monitoramento automático de saúde dos serviços
- **Logs**: Centralizados e acessíveis via Docker Compose

## 🔗 URLs de Acesso

### Desenvolvimento
- Frontend: http://localhost:3000
- Backend: http://localhost:5101
- Health Check: http://localhost:5101/health
- Database: localhost:1433

### Produção
- Frontend: http://localhost:3000
- Backend: http://localhost:5101
- Health Check: http://localhost:5101/health
- Database: localhost:1433
