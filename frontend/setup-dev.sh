#!/bin/bash

# Script para configurar o modo de desenvolvimento
echo "🔧 Configurando modo de desenvolvimento..."

# Criar arquivo .env.local se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo .env.local..."
    cat > .env.local << EOF
# Configurações de Desenvolvimento
NODE_ENV=development
NEXT_PUBLIC_BYPASS_AUTH=true

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-for-development

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:5058/api/v1
EOF
    echo "✅ Arquivo .env.local criado com sucesso!"
else
    echo "ℹ️  Arquivo .env.local já existe"
fi

# Verificar se NEXT_PUBLIC_BYPASS_AUTH está ativo
if grep -q "NEXT_PUBLIC_BYPASS_AUTH=true" .env.local; then
    echo "✅ Modo de bypass de autenticação está ativo"
else
    echo "⚠️  Modo de bypass não está ativo. Adicione NEXT_PUBLIC_BYPASS_AUTH=true ao .env.local"
fi

echo ""
echo "🚀 Para iniciar o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "🌐 Acesse: http://localhost:3000/contracts"
echo "   (acesso livre sem login)" 