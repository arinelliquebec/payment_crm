#!/bin/bash

echo "🔄 Parando TODOS os processos na porta 5101..."
# Primeira tentativa: lsof
lsof -ti:5101 | xargs kill -9 2>/dev/null

# Segunda tentativa: matar todos os processos dotnet relacionados
pkill -9 -f "CadastroPessoas" 2>/dev/null
pkill -9 -f "dotnet.*5101" 2>/dev/null

echo "⏳ Aguardando 3 segundos..."
sleep 3

# Verificar se a porta está livre
if lsof -ti:5101 > /dev/null 2>&1; then
    echo "⚠️  Porta 5101 ainda está em uso. Tentando novamente..."
    lsof -ti:5101 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "✅ Porta 5101 liberada!"
echo "🚀 Iniciando backend..."
cd "$(dirname "$0")"
dotnet run --project CadastroPessoas.csproj

