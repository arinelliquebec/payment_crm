#!/bin/bash
# ============================================================================
# Script para configurar Application Insights no Azure
# CRM Arrighi - Setup de Monitoramento
# ============================================================================

# Configurações - ALTERE CONFORME NECESSÁRIO
RESOURCE_GROUP="rg-arrighi"
LOCATION="brazilsouth"
APP_INSIGHTS_NAME="crm-arrighi-insights"
LOG_ANALYTICS_NAME="crm-arrighi-logs"
APP_SERVICE_NAME="contratos-bk"

echo "🔧 Configurando Application Insights para CRM Arrighi..."
echo ""

# 1. Verificar login no Azure
echo "📌 Verificando autenticação no Azure..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Você não está logado no Azure. Execute: az login"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Conectado à subscription: $SUBSCRIPTION"
echo ""

# 2. Criar Resource Group (se não existir)
echo "📌 Verificando Resource Group..."
az group show --name $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 Criando Resource Group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location $LOCATION
else
    echo "✅ Resource Group já existe: $RESOURCE_GROUP"
fi
echo ""

# 3. Criar Log Analytics Workspace
echo "📌 Criando Log Analytics Workspace..."
az monitor log-analytics workspace create \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_NAME \
    --location $LOCATION \
    --sku PerGB2018 \
    --retention-time 30 \
    2>/dev/null || echo "ℹ️ Log Analytics já existe ou erro ao criar"

LOG_ANALYTICS_ID=$(az monitor log-analytics workspace show \
    --resource-group $RESOURCE_GROUP \
    --workspace-name $LOG_ANALYTICS_NAME \
    --query id -o tsv 2>/dev/null)

echo "✅ Log Analytics Workspace ID: $LOG_ANALYTICS_ID"
echo ""

# 4. Criar Application Insights
echo "📌 Criando Application Insights..."
az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --application-type web \
    --workspace $LOG_ANALYTICS_ID \
    2>/dev/null || echo "ℹ️ Application Insights já existe"

# 5. Obter Connection String
echo ""
echo "📌 Obtendo Connection String..."
CONNECTION_STRING=$(az monitor app-insights component show \
    --app $APP_INSIGHTS_NAME \
    --resource-group $RESOURCE_GROUP \
    --query connectionString -o tsv)

echo ""
echo "=============================================="
echo "🎉 APPLICATION INSIGHTS CRIADO COM SUCESSO!"
echo "=============================================="
echo ""
echo "📊 Connection String:"
echo "$CONNECTION_STRING"
echo ""

# 6. Configurar no App Service (se existir)
echo "📌 Verificando App Service..."
az webapp show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "📦 Configurando Application Insights no App Service: $APP_SERVICE_NAME"

    az webapp config appsettings set \
        --name $APP_SERVICE_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            APPLICATIONINSIGHTS_CONNECTION_STRING="$CONNECTION_STRING" \
            ApplicationInsights__ConnectionString="$CONNECTION_STRING"

    echo "✅ App Service configurado!"
else
    echo "⚠️ App Service '$APP_SERVICE_NAME' não encontrado. Configure manualmente."
fi

echo ""
echo "=============================================="
echo "📋 PRÓXIMOS PASSOS:"
echo "=============================================="
echo ""
echo "1. Copie a Connection String acima"
echo ""
echo "2. Atualize o appsettings.Production.json:"
echo "   {\"ApplicationInsights\": {\"ConnectionString\": \"$CONNECTION_STRING\"}}"
echo ""
echo "3. Faça deploy da aplicação"
echo ""
echo "4. Acesse o Portal Azure > Application Insights para ver os dados"
echo ""
echo "🔗 Link direto: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/components/$APP_INSIGHTS_NAME/overview"
echo ""

