# 📊 Azure Application Insights - CRM Arrighi

## Visão Geral

O Application Insights está configurado para monitorar toda a aplicação CRM Arrighi, incluindo:

- ✅ **Performance de requisições HTTP**
- ✅ **Dependências externas** (API Santander, banco de dados, Azure Storage)
- ✅ **Exceções e erros**
- ✅ **Métricas customizadas de negócio**
- ✅ **Rastreamento distribuído**
- ✅ **Live Metrics Stream**

---

## 🔧 Configuração no Azure

### 1. Criar recurso Application Insights

```bash
# Via Azure CLI
az monitor app-insights component create \
  --app crm-arrighi-insights \
  --location brazilsouth \
  --resource-group rg-arrighi \
  --application-type web
```

### 2. Obter Connection String

No Portal Azure:
1. Acesse seu recurso **Application Insights**
2. Vá em **Settings > Properties**
3. Copie a **Connection String**

### 3. Configurar no appsettings.json

```json
{
  "ApplicationInsights": {
    "ConnectionString": "InstrumentationKey=xxxxx;IngestionEndpoint=https://brazilsouth-1.in.applicationinsights.azure.com/"
  }
}
```

### 4. Configurar via Variável de Ambiente (Produção)

```bash
# Azure App Service
az webapp config appsettings set \
  --name contratos-bk \
  --resource-group rg-arrighi \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="sua-connection-string"
```

---

## 📈 Uso do TelemetryService

### Injetar no Controller/Service

```csharp
public class BoletoController : ControllerBase
{
    private readonly ITelemetryService _telemetry;

    public BoletoController(ITelemetryService telemetry)
    {
        _telemetry = telemetry;
    }
}
```

### Exemplos de Uso

#### Rastrear Boleto Gerado
```csharp
_telemetry.TrackBoletoGerado(
    boletoId: boleto.Id,
    valor: boleto.NominalValue,
    clienteNome: cliente.Nome,
    contratoId: contrato.Id
);
```

#### Rastrear Boleto Pago
```csharp
_telemetry.TrackBoletoPago(
    boletoId: boleto.Id,
    valor: boleto.PaidValue,
    metodoPagamento: "PIX" // ou "BOLETO"
);
```

#### Rastrear Integração Bancária
```csharp
var stopwatch = Stopwatch.StartNew();
try
{
    await _santanderService.GerarBoleto(dto);
    stopwatch.Stop();

    _telemetry.TrackIntegracaoBancaria(
        banco: "Santander",
        operacao: "GerarBoleto",
        sucesso: true,
        duracaoMs: stopwatch.ElapsedMilliseconds
    );
}
catch (Exception ex)
{
    stopwatch.Stop();

    _telemetry.TrackIntegracaoBancaria(
        banco: "Santander",
        operacao: "GerarBoleto",
        sucesso: false,
        duracaoMs: stopwatch.ElapsedMilliseconds,
        erro: ex.Message
    );

    _telemetry.TrackException(ex, new Dictionary<string, string>
    {
        { "Operacao", "GerarBoleto" },
        { "ClienteId", clienteId.ToString() }
    });
}
```

#### Rastrear Eventos Genéricos
```csharp
_telemetry.TrackEvent("Login_Sucesso", new Dictionary<string, string>
{
    { "UsuarioId", usuario.Id.ToString() },
    { "IP", clientIp }
});
```

---

## 📊 Consultas KQL no Azure

### Boletos Pagos por Dia
```kql
customEvents
| where name == "Boleto_Pago"
| summarize
    TotalPago = sum(todouble(customMeasurements["Valor"])),
    Quantidade = count()
    by bin(timestamp, 1d)
| order by timestamp desc
```

### Taxa de Sucesso Integração Santander
```kql
customEvents
| where name == "Integracao_Bancaria" and customDimensions["Banco"] == "Santander"
| summarize
    Sucesso = countif(customDimensions["Sucesso"] == "True"),
    Falha = countif(customDimensions["Sucesso"] == "False"),
    DuracaoMedia = avg(todouble(customMeasurements["DuracaoMs"]))
    by bin(timestamp, 1h)
```

### Top 10 Erros
```kql
exceptions
| summarize Count = count() by outerMessage
| top 10 by Count
```

### Performance de APIs
```kql
requests
| summarize
    Count = count(),
    AvgDuration = avg(duration),
    P95Duration = percentile(duration, 95),
    FailureRate = countif(success == false) * 100.0 / count()
    by name
| order by Count desc
```

### Leads por Origem
```kql
customEvents
| where name == "Lead_Criado"
| summarize Count = count() by tostring(customDimensions["Origem"])
| render piechart
```

---

## 🚨 Alertas Recomendados

### 1. Alta Taxa de Erros
- **Condição:** Percentage of failed requests > 5%
- **Severidade:** Critical
- **Ação:** Enviar email + criar ticket

### 2. Integração Santander Falhando
- **Consulta KQL:**
```kql
customEvents
| where name == "Integracao_Bancaria"
    and customDimensions["Banco"] == "Santander"
    and customDimensions["Sucesso"] == "False"
| summarize FailCount = count() by bin(timestamp, 5m)
| where FailCount > 3
```
- **Severidade:** High
- **Ação:** Notificar equipe técnica

### 3. Tempo de Resposta Alto
- **Condição:** Average response time > 5000ms
- **Severidade:** Warning
- **Ação:** Escalar para análise

---

## 🔐 Propriedades Customizadas em Toda Telemetria

O `CrmTelemetryInitializer` adiciona automaticamente:

| Propriedade | Descrição |
|-------------|-----------|
| `Environment` | Ambiente (Development/Production) |
| `UsuarioId` | ID do usuário autenticado |
| `FilialId` | ID da filial do usuário |
| `CorrelationId` | ID para rastreamento distribuído |
| `UserAgent` | Browser/cliente do usuário |

---

## 📱 Dashboard Recomendado

Criar um Azure Dashboard com:

1. **Painel de Saúde**
   - Disponibilidade (%)
   - Taxa de erros (%)
   - Tempo de resposta médio

2. **Painel Financeiro**
   - Total de boletos pagos (R$)
   - Boletos vencidos
   - Taxa de conversão de leads

3. **Painel de Integrações**
   - Status Santander API
   - Tempo de resposta por operação
   - Falhas por tipo

4. **Painel de Usuários**
   - Usuários ativos
   - Sessões por hora
   - Top páginas acessadas

---

## 🔄 Amostragem Adaptativa

A amostragem adaptativa está configurada para:
- **Máximo:** 5 itens/segundo por tipo de telemetria
- **Objetivo:** Reduzir custos mantendo visibilidade

Para desabilitar (não recomendado em produção):
```csharp
options.EnableAdaptiveSampling = false;
```

---

## 📚 Referências

- [Documentação Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [SDK .NET](https://docs.microsoft.com/azure/azure-monitor/app/asp-net-core)
- [Consultas KQL](https://docs.microsoft.com/azure/data-explorer/kusto/query/)

