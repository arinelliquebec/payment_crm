#!/bin/bash

# Script para configurar o banco de dados
echo "🗄️ Configurando banco de dados..."

# Verificar se o .NET está instalado
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET não está instalado. Por favor, instale o .NET SDK."
    exit 1
fi

echo "✅ .NET verificado"

# Navegar para o backend
cd backend

echo "🔧 Verificando se o banco existe..."
if dotnet ef database update --verbose; then
    echo "✅ Banco de dados configurado com sucesso!"
else
    echo "❌ Erro ao configurar banco de dados"
    echo ""
    echo "📋 Possíveis soluções:"
    echo "1. Instalar SQL Server LocalDB"
    echo "2. Usar Docker (recomendado)"
    echo "3. Usar bypass (mais rápido)"
    echo ""
    echo "Para usar bypass: ./start-frontend-bypass.sh"
    echo "Para usar Docker: ./start-dev-mac.sh"
    exit 1
fi

cd ..

echo ""
echo "🎉 Banco de dados configurado!"
echo "Agora você pode usar a API real:"
echo "cd backend && dotnet run"
