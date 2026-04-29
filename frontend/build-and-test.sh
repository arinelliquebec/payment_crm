#!/bin/bash

# Script para build e teste de produção local
echo "🔧 Iniciando build de produção..."

# Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf .next
rm -rf out

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    pnpm install
fi

# Fazer build de produção
echo "🏗️ Fazendo build de produção..."
NODE_ENV=production NEXT_PUBLIC_API_URL="https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api" pnpm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "🚀 Iniciando servidor de produção..."
    echo "📝 Acesse: http://localhost:3000"
    echo "🔍 Monitore o console do browser para erros..."

    # Iniciar servidor de produção
    NODE_ENV=production pnpm run start
else
    echo "❌ Build falhou! Verifique os erros acima."
    exit 1
fi
