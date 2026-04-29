@echo off
echo 🔄 Parando processos antigos na porta 5101...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5101') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

echo 🚀 Iniciando backend...
cd /d "%~dp0"
dotnet run --project CadastroPessoas.csproj

