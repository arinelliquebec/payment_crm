# Configuração do Proxy Reverso

Este projeto foi configurado com suporte a proxy reverso para permitir que a aplicação funcione corretamente quando atrás de um proxy, load balancer ou CDN.

## Funcionalidades Implementadas

### 1. Forwarded Headers
- **X-Forwarded-For**: Captura o IP real do cliente
- **X-Forwarded-Proto**: Detecta o protocolo (HTTP/HTTPS) original
- **X-Forwarded-Host**: Preserva o host original da requisição

### 2. Middleware Personalizado
- Processamento customizado dos headers de proxy
- Logging para debugging
- Configuração flexível via appsettings.json

## Configuração

### appsettings.json
```json
{
  "ReverseProxy": {
    "Enabled": true,
    "TrustedProxies": [],
    "ForwardedHeaders": {
      "XForwardedFor": true,
      "XForwardedProto": true,
      "XForwardedHost": true
    }
  }
}
```

### Configurações de Produção

Para ambientes de produção, configure os IPs confiáveis do seu proxy:

```csharp
// No Program.cs
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    
    // Adicione os IPs do seu proxy
    options.KnownProxies.Add(IPAddress.Parse("10.0.0.1"));
    options.KnownProxies.Add(IPAddress.Parse("10.0.0.2"));
    
    options.RequireHeaderSymmetry = false;
    options.ForwardLimit = null;
});
```

## Exemplos de Uso

### 1. Nginx como Proxy Reverso
```nginx
location /api/ {
    proxy_pass http://localhost:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```

### 2. Apache como Proxy Reverso
```apache
ProxyPass /api/ http://localhost:5000/
ProxyPassReverse /api/ http://localhost:5000/

RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
RequestHeader set X-Forwarded-Proto %{REQUEST_SCHEME}s
RequestHeader set X-Forwarded-Host %{HTTP_HOST}s
```

### 3. Azure Application Gateway
Configure as seguintes regras:
- **Backend Pool**: Aponte para sua aplicação
- **HTTP Settings**: Configure para preservar headers
- **Routing Rules**: Configure para rotear tráfego

## Verificação

Para verificar se o proxy reverso está funcionando:

1. **Logs da Aplicação**: Verifique os logs para ver os IPs reais dos clientes
2. **Headers**: Use ferramentas como Postman para verificar se os headers estão sendo processados
3. **Teste de IP**: Acesse um endpoint que retorna o IP do cliente

## Segurança

### Em Produção:
1. Configure apenas IPs confiáveis em `KnownProxies`
2. Use HTTPS em todas as comunicações
3. Configure CORS adequadamente
4. Monitore logs para detectar tentativas de spoofing

### Headers de Segurança Adicionais:
```csharp
// Adicione headers de segurança
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    await next();
});
```

## Troubleshooting

### Problema: IP do cliente sempre mostra o IP do proxy
**Solução**: Verifique se o proxy está enviando o header `X-Forwarded-For` corretamente

### Problema: HTTPS não é detectado
**Solução**: Configure o header `X-Forwarded-Proto` no seu proxy

### Problema: Host incorreto
**Solução**: Configure o header `X-Forwarded-Host` no seu proxy

## Monitoramento

Adicione logging para monitorar o funcionamento:

```csharp
// No middleware personalizado
var logger = context.RequestServices.GetRequiredService<ILogger<ReverseProxyMiddleware>>();
logger.LogInformation("Original IP: {OriginalIP}, Forwarded IP: {ForwardedIP}", 
    context.Connection.RemoteIpAddress, forwardedFor);
``` 