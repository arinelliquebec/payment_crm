#!/bin/bash

echo "🔄 Reconstruindo Frontend..."
echo ""

# Parar processos na porta 3000
echo "🛑 Parando processos na porta 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Porta 3000 já está livre"

# Remover .next
echo "🗑️  Removendo cache do Next.js..."
rm -rf .next

# Remover node_modules/.cache
echo "🗑️  Removendo cache do node_modules..."
rm -rf node_modules/.cache

echo ""
echo "✅ Cache limpo!"
echo ""
echo "📝 Agora execute:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "   OU"
echo ""
echo "   pnpm dev"
echo ""
