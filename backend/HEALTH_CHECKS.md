# 🏥 Health Checks - CRM Arrighi

Sistema completo de monitoramento de saúde da aplicação.

## Endpoints Disponíveis

| Endpoint | Descrição | Uso |
|----------|-----------|-----|
| `GET /health` | Status básico (para load balancers) | Kubernetes/Azure probes |
| `GET /health/details` | Status detalhado em JSON | Debugging, APIs |
| `GET /health/dashboard` | Dashboard visual HTML | Monitoramento humano |
| `GET /health/live` | Liveness probe | Kubernetes |
| `GET /health/ready` | Readiness probe (verifica críticos) | Kubernetes |

## Verificações Implementadas

### 1. PostgreSQL (`postgresql`)
- ✅ Conectividade com banco de dados
- ✅ Tempo de resposta
- ✅ Versão do servidor
- ✅ Database atual
- ✅ Verificação de tabela principal (`Usuarios`)
- ✅ Contagem de usuários

**Tags:** `critical`, `database`

### 2. API Santander (`santander_api`)
- ✅ Configuração (ClientId, ClientSecret)
- ✅ Certificado digital presente
- ✅ Autenticação OAuth2
- ✅ Tempo de resposta da API

**Tags:** `external`, `payments`

### 3. Azure Storage (`azure_storage`)
- ✅ Configuração de connection string
- ✅ Container existe
- ✅ Conectividade
- ✅ Informações da conta

**Tags:** `external`, `storage`

## Acessando o Dashboard

### Desenvolvimento
```
http://localhost:5000/health/dashboard
```

### Produção
```
https://seu-dominio.com/health/dashboard
```

## Exemplo de Resposta JSON

```json
{
  "status": "Healthy",
  "timestamp": "2026-01-03T12:00:00Z",
  "duration": "245ms",
  "checks": [
    {
      "name": "postgresql",
      "status": "Healthy",
      "description": "PostgreSQL operacional",
      "duration": "45ms",
      "data": {
        "ConnectionTimeMs": 45,
        "ServerVersion": "PostgreSQL 16",
        "DatabaseName": "payment_crm_demo",
        "MainTableExists": true,
        "UserCount": 5
      }
    },
    {
      "name": "santander_api",
      "status": "Healthy",
      "description": "API Santander operacional",
      "duration": "1200ms",
      "data": {
        "ClientIdConfigured": true,
        "CertificateExists": true,
        "TokenObtained": true,
        "ResponseTimeMs": 1200
      }
    },
    {
      "name": "azure_storage",
      "status": "Healthy",
      "description": "Azure Storage operacional",
      "duration": "320ms",
      "data": {
        "ContainerName": "contratos",
        "ContainerExists": true,
        "BlobCount": "100+",
        "AccountKind": "StorageV2"
      }
    }
  ]
}
```

## Status Possíveis

| Status | Código HTTP | Descrição |
|--------|-------------|-----------|
| `Healthy` | 200 | Todos os serviços funcionando |
| `Degraded` | 200 | Alguns serviços com problemas menores |
| `Unhealthy` | 503 | Serviços críticos indisponíveis |

## Integração com Kubernetes

### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Integração com Azure App Service

O Azure App Service usa automaticamente o endpoint `/health` se configurado:

1. Vá em **Configuration** → **Health check**
2. Defina o path como `/health`
3. Defina o intervalo de verificação

## Integração com Application Insights

Os health checks são automaticamente rastreados pelo Application Insights quando configurado.

## Adicionando Novos Health Checks

1. Crie uma classe que implemente `IHealthCheck`:

```csharp
public class MeuServicoHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        // Sua lógica aqui
        return HealthCheckResult.Healthy("Serviço OK");
    }
}
```

2. Registre no `Program.cs`:

```csharp
builder.Services.AddHealthChecks()
    .AddCheck<MeuServicoHealthCheck>("meu_servico", tags: new[] { "custom" });
```

## Troubleshooting

### PostgreSQL Unhealthy
- Verificar connection string (`ConnectionStrings__DefaultConnection` ou `PGHOST`/`PGUSER`/`PGPASSWORD`/`PGDATABASE`)
- Verificar firewall/rede
- Verificar credenciais

### Santander API Degraded
- Verificar certificado digital
- Verificar credenciais OAuth
- Verificar validade do certificado

### Azure Storage Degraded
- Verificar connection string
- Verificar container existe
- Verificar permissões de acesso

