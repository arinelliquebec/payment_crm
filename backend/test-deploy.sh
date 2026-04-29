#!/bin/bash

# Script para testar o deploy localmente
# Execute: chmod +x test-deploy.sh && ./test-deploy.sh

echo "🚀 Testando Deploy Local - CRM Arrighi"
echo "======================================"

# Verificar se .NET está instalado
echo "📋 Verificando .NET..."
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET não encontrado. Instale o .NET 8.0 SDK"
    exit 1
fi

dotnet_version=$(dotnet --version)
echo "✅ .NET versão: $dotnet_version"

# Verificar se o projeto existe
if [ ! -f "CadastroPessoas.csproj" ]; then
    echo "❌ Arquivo CadastroPessoas.csproj não encontrado"
    exit 1
fi

echo "✅ Projeto encontrado"

# Limpar builds anteriores
echo ""
echo "🧹 Limpando builds anteriores..."
dotnet clean CadastroPessoas.csproj
rm -rf ./publish

# Restore dependencies
echo ""
echo "📦 Restaurando dependências..."
if ! dotnet restore CadastroPessoas.csproj; then
    echo "❌ Falha ao restaurar dependências"
    exit 1
fi
echo "✅ Dependências restauradas"

# Build
echo ""
echo "🔨 Compilando projeto..."
if ! dotnet build CadastroPessoas.csproj --no-restore --configuration Release; then
    echo "❌ Falha na compilação"
    exit 1
fi
echo "✅ Compilação bem-sucedida"

# Test (se houver testes)
echo ""
echo "🧪 Executando testes..."
if dotnet test CadastroPessoas.csproj --no-build --verbosity normal --configuration Release; then
    echo "✅ Testes executados com sucesso"
else
    echo "⚠️  Testes falharam ou não existem (continuando...)"
fi

# Verificar formatação
echo ""
echo "📝 Verificando formatação..."
if dotnet format CadastroPessoas.csproj --verify-no-changes --verbosity normal; then
    echo "✅ Formatação está correta"
else
    echo "⚠️  Formatação precisa ser corrigida (execute: dotnet format)"
fi

# Verificar vulnerabilidades
echo ""
echo "🔒 Verificando vulnerabilidades..."
if dotnet list CadastroPessoas.csproj package --vulnerable --include-transitive; then
    echo "✅ Verificação de segurança concluída"
else
    echo "⚠️  Possíveis vulnerabilidades encontradas"
fi

# Publish
echo ""
echo "📦 Publicando aplicação..."
if ! dotnet publish CadastroPessoas.csproj -c Release -o ./publish; then
    echo "❌ Falha na publicação"
    exit 1
fi
echo "✅ Aplicação publicada em ./publish"

# Verificar arquivos publicados
echo ""
echo "📁 Arquivos publicados:"
ls -la ./publish/

# Verificar tamanho
publish_size=$(du -sh ./publish | cut -f1)
echo "📊 Tamanho da publicação: $publish_size"

echo ""
echo "🎉 Teste de deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure os secrets no GitHub:"
echo "   - AZURE_WEBAPP_PUBLISH_PROFILE"
echo "   - AZURE_WEBAPP_PUBLISH_PROFILE_STAGING (opcional)"
echo ""
echo "2. Faça push para testar o deploy automático:"
echo "   git add ."
echo "   git commit -m 'feat: configurar deploy github actions'"
echo "   git push origin main"
echo ""
echo "3. Monitore o deploy em: https://github.com/seu-usuario/seu-repo/actions"
echo ""
echo "📚 Documentação completa: DEPLOY_GITHUB_ACTIONS_GUIDE.md"
