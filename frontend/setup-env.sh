#!/bin/bash

# Setup script para CRM Arrighi Frontend Environment

echo "🚀 Configurando ambiente do CRM Arrighi Frontend..."
echo ""

# Detectar o ambiente
read -p "Qual ambiente você quer configurar? (dev/prod): " ENV_TYPE

if [ "$ENV_TYPE" = "dev" ] || [ "$ENV_TYPE" = "development" ]; then
    ENV_FILE=".env.local"
    EXAMPLE_FILE=".env.local.example"
    echo "📝 Configurando ambiente de desenvolvimento..."
elif [ "$ENV_TYPE" = "prod" ] || [ "$ENV_TYPE" = "production" ]; then
    ENV_FILE=".env.production"
    EXAMPLE_FILE="env.production.example"
    echo "📝 Configurando ambiente de produção..."
else
    echo "❌ Ambiente inválido! Use 'dev' ou 'prod'"
    exit 1
fi

# Verificar se o arquivo já existe
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE já existe!"
    read -p "Deseja sobrescrever? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelado."
        exit 1
    fi
    # Fazer backup
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup criado: $ENV_FILE.backup"
fi

# Copiar arquivo de exemplo
if [ -f "$EXAMPLE_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "✅ Criado $ENV_FILE a partir de $EXAMPLE_FILE"
else
    echo "❌ $EXAMPLE_FILE não encontrado!"
    exit 1
fi

# Perguntar pela URL da API
echo ""
if [ "$ENV_TYPE" = "dev" ] || [ "$ENV_TYPE" = "development" ]; then
    read -p "URL da API (padrão: http://localhost:5101/api): " API_URL
    API_URL=${API_URL:-http://localhost:5101/api}
else
    echo "Escolha a configuração da API:"
    echo "1) Usar proxy do Next.js (recomendado para Vercel)"
    echo "2) URL direta do backend Azure"
    read -p "Opção (1/2): " API_OPTION

    if [ "$API_OPTION" = "1" ]; then
        API_URL="/api/proxy"
    else
        read -p "URL da API: " API_URL
        API_URL=${API_URL:-https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api}
    fi
fi

# Atualizar o arquivo .env com a URL da API
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
else
    # Linux
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$API_URL|" "$ENV_FILE"
fi

echo "✅ Configurado NEXT_PUBLIC_API_URL=$API_URL"

echo ""
echo "📝 Próximos passos:"
echo "1. Revise o arquivo $ENV_FILE e ajuste se necessário"
echo "2. Instale as dependências: pnpm install"
if [ "$ENV_TYPE" = "dev" ] || [ "$ENV_TYPE" = "development" ]; then
    echo "3. Inicie o servidor de desenvolvimento: pnpm dev"
else
    echo "3. Faça o build: pnpm build"
    echo "4. Inicie o servidor: pnpm start"
fi
echo ""
echo "📖 Para mais informações, veja ENV_SETUP.md"
echo ""
echo "✅ Setup completo!"
