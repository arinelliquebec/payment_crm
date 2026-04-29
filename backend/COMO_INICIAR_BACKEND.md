# 🚀 Como Iniciar o Backend

## 🎯 Método Mais Simples (RECOMENDADO)

### No Mac/Linux:
```bash
cd backend
./start-backend.sh
```

### No Windows:
```cmd
cd backend
start-backend.bat
```

**O script automaticamente:**
- ✅ Mata processos antigos na porta 5101
- ✅ Aguarda 2 segundos
- ✅ Inicia o backend

---

## 🔧 Método Manual

Se preferir fazer manualmente:

### 1. Matar processos antigos

**Mac/Linux:**
```bash
lsof -ti:5101 | xargs kill -9
```

**Windows:**
```cmd
netstat -ano | findstr :5101
taskkill /F /PID [número_do_processo]
```

### 2. Iniciar o backend

```bash
cd backend
dotnet run --project CadastroPessoas.csproj
```

---

## ❌ Erro Comum: "Address already in use"

**Problema:**
```
System.IO.IOException: Failed to bind to address http://127.0.0.1:5101: address already in use.
```

**Solução:**
Use o script `start-backend.sh` (Mac/Linux) ou `start-backend.bat` (Windows) que resolve automaticamente.

---

## 🌐 Backend Rodando

Quando o backend iniciar com sucesso, você verá:

```
✅ Tabela PasswordResets pronta!
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5101
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

**Backend disponível em:** http://localhost:5101

---

## 🧪 Testar se está funcionando

```bash
curl http://localhost:5101/api/Estatisticas/test
```

Deve retornar:
```json
{
  "message": "API está funcionando!",
  "timestamp": "2024-10-16T..."
}
```

---

## 📝 Desenvolvimento

### Compilar sem executar:
```bash
dotnet build CadastroPessoas.csproj
```

### Verificar porta em uso:
**Mac/Linux:**
```bash
lsof -i:5101
```

**Windows:**
```cmd
netstat -ano | findstr :5101
```

### Parar o backend:
- Pressione `Ctrl+C` no terminal onde está rodando
- OU use os scripts acima para matar o processo

---

## 🔍 Logs e Debug

### Ver logs em tempo real:
O backend mostra logs diretamente no terminal.

### Logs importantes a observar:
- ✅ "Tabela PasswordResets pronta!" - Sistema de reset de senha OK
- ✅ "Now listening on: http://localhost:5101" - Servidor iniciado
- ✅ "Application started" - Aplicação pronta

---

## ⚙️ Configurações

### Porta do servidor:
Configurada em `Properties/launchSettings.json` - porta **5101**

### Banco de dados:
Configurado em `appsettings.json` - Azure SQL Database

### Email (Reset de Senha):
Configurado em `appsettings.json` - seção `Email`

---

## 🆘 Troubleshooting

### Backend não inicia:
1. Verifique se a porta 5101 está livre
2. Use o script `start-backend.sh` ou `start-backend.bat`
3. Verifique se o .NET 8 SDK está instalado: `dotnet --version`

### Erro de compilação:
```bash
dotnet clean
dotnet restore
dotnet build
```

### Erro de conexão com banco:
Verifique a string de conexão em `appsettings.json`

---

**Criado para facilitar o desenvolvimento do CRM Arrighi** 🚀

