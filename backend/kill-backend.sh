#!/bin/bash

echo "🔪 Matando todos os processos do backend..."
echo ""

# Matar todos os processos dotnet
pkill -9 -f "dotnet" 2>/dev/null
echo "✅ Processos dotnet finalizados"

# Matar processo específico CadastroPessoas
pkill -9 -f "CadastroPessoas" 2>/dev/null
echo "✅ Processos CadastroPessoas finalizados"

# Matar script de inicialização
pkill -9 -f "start-backend" 2>/dev/null

# Matar todos os processos usando a porta 5101
for pid in $(lsof -ti:5101 2>/dev/null); do
    kill -9 $pid 2>/dev/null
    echo "✅ Processo PID $pid finalizado (porta 5101)"
done

# Aguardar processos terminarem
sleep 2

echo ""
echo "=== VERIFICAÇÃO FINAL ==="
echo ""

# Verificar processos
if ps aux | grep -E "(dotnet|CadastroPessoas)" | grep -v grep > /dev/null; then
    echo "⚠️  Ainda há processos backend rodando:"
    ps aux | grep -E "(dotnet|CadastroPessoas)" | grep -v grep
else
    echo "✅ Nenhum processo backend rodando"
fi

echo ""

# Verificar porta
if lsof -i:5101 > /dev/null 2>&1; then
    echo "⚠️  Porta 5101 ainda em uso:"
    lsof -i:5101
else
    echo "✅ Porta 5101 totalmente LIVRE"
fi

echo ""
echo "🎉 Limpeza concluída!"

