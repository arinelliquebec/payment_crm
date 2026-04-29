#!/bin/bash

echo "================================================"
echo "🔧 Correção de Sessões Ativas para Administradores"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "CadastroPessoas.csproj" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório backend${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Este script irá:${NC}"
echo "  1. Parar o backend se estiver rodando"
echo "  2. Compilar o projeto"
echo "  3. Iniciar o backend (que corrigirá automaticamente o grupo Administrador)"
echo ""
read -p "Deseja continuar? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}⚠️ Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🛑 Passo 1: Parando backend...${NC}"
./kill-backend.sh 2>/dev/null || echo "Backend não estava rodando"

echo ""
echo -e "${YELLOW}🔨 Passo 2: Compilando projeto...${NC}"
dotnet build CadastroPessoas.csproj --configuration Release

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro na compilação!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Compilação concluída!${NC}"
echo ""
echo -e "${YELLOW}🚀 Passo 3: Iniciando backend...${NC}"
echo -e "${YELLOW}📝 Observe os logs para verificar a correção do grupo Administrador${NC}"
echo ""
echo "Procure por:"
echo "  - '🔄 Verificando configuração do grupo Administrador...'"
echo "  - '✅ Grupo Administrador encontrado'"
echo "  - '📋 Lista de Administradores'"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar o backend${NC}"
echo ""
sleep 2

# Iniciar o backend
dotnet run --project CadastroPessoas.csproj
