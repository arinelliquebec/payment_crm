@echo off
echo 🔧 Configurando modo de desenvolvimento...

REM Criar arquivo .env.local se não existir
if not exist .env.local (
    echo 📝 Criando arquivo .env.local...
    (
        echo # Configurações de Desenvolvimento
        echo NODE_ENV=development
        echo NEXT_PUBLIC_BYPASS_AUTH=true
        echo.
        echo # NextAuth
        echo NEXTAUTH_URL=http://localhost:3000
        echo NEXTAUTH_SECRET=your-secret-key-for-development
        echo.
        echo # API Backend
        echo NEXT_PUBLIC_API_URL=http://localhost:5058/api/v1
    ) > .env.local
    echo ✅ Arquivo .env.local criado com sucesso!
) else (
    echo ℹ️  Arquivo .env.local já existe
)

REM Verificar se NEXT_PUBLIC_BYPASS_AUTH está ativo
findstr "NEXT_PUBLIC_BYPASS_AUTH=true" .env.local >nul
if %errorlevel% equ 0 (
    echo ✅ Modo de bypass de autenticação está ativo
) else (
    echo ⚠️  Modo de bypass não está ativo. Adicione NEXT_PUBLIC_BYPASS_AUTH=true ao .env.local
)

echo.
echo 🚀 Para iniciar o servidor de desenvolvimento:
echo    npm run dev
echo.
echo 🌐 Acesse: http://localhost:3000/contracts
echo    (acesso livre sem login)
pause 