# Debug de Produção - Página de Contratos

## Problema Identificado
A página `/contratos` não funciona em produção no Vercel.

## Possíveis Causas Identificadas

### 1. **Inconsistência na Configuração de API**
- **Problema**: `vercel.json` define `NEXT_PUBLIC_API_URL` como `/api/proxy`
- **Solução**: `env.config.ts` foi corrigido para priorizar variável de ambiente

### 2. **Configuração do Proxy no Vercel**
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "/api/proxy"
  },
  "rewrites": [
    {
      "source": "/api/proxy/:path*",
      "destination": "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/:path*"
    }
  ]
}
```

### 3. **Backend CORS**
- ✅ CORS configurado como "AllowAll" no backend
- ✅ URLs do Vercel incluídas na política de CORS

## Logs de Debug Adicionados

### Frontend (`api.ts`)
- ✅ Logs de URL de requisição sempre ativos
- ✅ Logs de ambiente e configuração
- ✅ Base URL sendo logada

### Frontend (`contratos/page.tsx`)
- ✅ Logs de carregamento da página
- ✅ Logs de estado dos hooks (contratos, clientes, consultores)
- ✅ Logs de erros específicos

### Backend
- ✅ CORS "AllowAll" ativo
- ✅ Middleware de proxy reverso configurado

## Verificações Necessárias

### 1. **Verificar Console do Navegador em Produção**
Acessar a página em produção e verificar:
- Logs de configuração da API
- Erros de rede
- Status das requisições

### 2. **Verificar Conectividade do Backend**
Testar diretamente:
```bash
curl https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/Contrato
```

### 3. **Verificar Proxy do Vercel**
Testar o proxy:
```bash
curl https://[seu-dominio-vercel]/api/proxy/Contrato
```

## Próximos Passos

1. **Deploy das Correções**
   - Fazer deploy das correções no `env.config.ts`
   - Verificar logs no console do navegador

2. **Testar Backend Diretamente**
   - Verificar se o backend Azure está respondendo
   - Verificar se os endpoints estão funcionando

3. **Verificar Configuração do Vercel**
   - Confirmar se as variáveis de ambiente estão corretas
   - Verificar se o proxy está funcionando

## Comandos Úteis

### Testar Backend Diretamente
```bash
# Testar endpoint de contratos
curl -X GET "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/Contrato" \
  -H "Accept: application/json"

# Testar endpoint de clientes
curl -X GET "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/Cliente" \
  -H "Accept: application/json"
```

### Verificar Logs do Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs em tempo real
vercel logs --follow
```

## Status das Correções

- ✅ `env.config.ts` corrigido para priorizar `NEXT_PUBLIC_API_URL`
- ✅ Logs de debug adicionados no frontend
- ✅ Tratamento de erro melhorado
- ⏳ Aguardando deploy e testes em produção
