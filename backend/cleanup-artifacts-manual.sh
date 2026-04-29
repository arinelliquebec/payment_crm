#!/bin/bash

# Script para limpeza manual de artefatos via GitHub CLI
# Requer: gh CLI instalado e autenticado
# Execute: chmod +x cleanup-artifacts-manual.sh && ./cleanup-artifacts-manual.sh

echo "🧹 Limpeza Manual de Artefatos - GitHub Actions"
echo "=============================================="

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não encontrado."
    echo "📥 Instale: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI não está autenticado."
    echo "🔐 Execute: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado"

# Obter informações do repositório
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repositório: $REPO"

echo ""
echo "📊 Listando artefatos atuais..."

# Listar artefatos
gh api repos/$REPO/actions/artifacts --paginate | jq -r '.artifacts[] | "\(.id) \(.name) \(.size_in_bytes) \(.created_at)"' > /tmp/artifacts.txt

if [ ! -s /tmp/artifacts.txt ]; then
    echo "✅ Nenhum artefato encontrado"
    exit 0
fi

echo "📋 Artefatos encontrados:"
echo "ID | Nome | Tamanho (MB) | Data"
echo "---|------|-------------|-----"

total_size=0
count=0

while read -r line; do
    id=$(echo $line | cut -d' ' -f1)
    name=$(echo $line | cut -d' ' -f2)
    size=$(echo $line | cut -d' ' -f3)
    date=$(echo $line | cut -d' ' -f4)

    size_mb=$(echo "scale=2; $size / 1024 / 1024" | bc -l)
    total_size=$(echo "$total_size + $size" | bc -l)
    count=$((count + 1))

    echo "$id | $name | ${size_mb} MB | $date"
done < /tmp/artifacts.txt

total_size_mb=$(echo "scale=2; $total_size / 1024 / 1024" | bc -l)
echo ""
echo "📊 Total: $count artefatos, ${total_size_mb} MB"

echo ""
read -p "🗑️  Deseja remover TODOS os artefatos? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  Removendo artefatos..."

    deleted=0
    while read -r line; do
        id=$(echo $line | cut -d' ' -f1)
        name=$(echo $line | cut -d' ' -f2)

        echo "Removendo: $name (ID: $id)"

        if gh api repos/$REPO/actions/artifacts/$id -X DELETE; then
            deleted=$((deleted + 1))
            echo "✅ Removido"
        else
            echo "❌ Erro ao remover"
        fi
    done < /tmp/artifacts.txt

    echo ""
    echo "🎉 Limpeza concluída!"
    echo "📊 $deleted artefatos removidos"
    echo "💾 ~${total_size_mb} MB liberados"
else
    echo "❌ Operação cancelada"
fi

# Limpeza
rm -f /tmp/artifacts.txt

echo ""
echo "💡 Dicas para evitar o problema:"
echo "1. Configure retenção automática: Settings → Actions → General"
echo "2. Use o workflow de limpeza automática criado"
echo "3. Monitore o uso regularmente"
