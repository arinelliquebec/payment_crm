# Correção da URL do Frontend - CRM Arrighi

## Problema Identificado
O frontend está tentando acessar uma URL duplicada:
```
❌ INCORRETO: https://arrighicrm.com/arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/PessoaFisica
```

## Solução
A URL deve ser apenas uma das opções:

### Opção 1: Usar o domínio personalizado
```
✅ CORRETO: https://arrighicrm.com/api/PessoaFisica
```

### Opção 2: Usar o domínio do Azure diretamente
```
✅ CORRETO: https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/PessoaFisica
```

## Endpoints Disponíveis

### Pessoas Físicas
- `GET /api/PessoaFisica` - Listar todas as pessoas físicas
- `GET /api/PessoaFisica/{id}` - Buscar pessoa física por ID
- `GET /api/PessoaFisica/responsaveis-tecnicos` - Listar responsáveis técnicos
- `POST /api/PessoaFisica` - Criar nova pessoa física
- `PUT /api/PessoaFisica/{id}` - Atualizar pessoa física
- `DELETE /api/PessoaFisica/{id}` - Excluir pessoa física

### Pessoas Jurídicas
- `GET /api/PessoaJuridica` - Listar todas as pessoas jurídicas
- `GET /api/PessoaJuridica/{id}` - Buscar pessoa jurídica por ID
- `POST /api/PessoaJuridica` - Criar nova pessoa jurídica
- `PUT /api/PessoaJuridica/{id}` - Atualizar pessoa jurídica
- `DELETE /api/PessoaJuridica/{id}` - Excluir pessoa jurídica

### Usuários
- `GET /api/Usuario` - Listar todos os usuários
- `GET /api/Usuario/{id}` - Buscar usuário por ID
- `POST /api/Usuario` - Criar novo usuário
- `PUT /api/Usuario/{id}` - Atualizar usuário
- `DELETE /api/Usuario/{id}` - Excluir usuário

### Teste
- `GET /api/test` - Teste básico da API

## Como Testar

### Usando cURL
```bash
# Teste básico
curl -X GET "https://arrighicrm.com/api/test"

# Pessoas Físicas
curl -X GET "https://arrighicrm.com/api/PessoaFisica"

# Pessoas Jurídicas
curl -X GET "https://arrighicrm.com/api/PessoaJuridica"
```

### Usando Navegador
1. Abra o navegador
2. Acesse: `https://arrighicrm.com/api/test`
3. Deve retornar JSON

## Configuração no Frontend

### Se estiver usando Axios
```javascript
// ❌ INCORRETO
const api = axios.create({
  baseURL: 'https://arrighicrm.com/arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net'
});

// ✅ CORRETO
const api = axios.create({
  baseURL: 'https://arrighicrm.com'
});
```

### Se estiver usando Fetch
```javascript
// ❌ INCORRETO
fetch('https://arrighicrm.com/arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/PessoaFisica')

// ✅ CORRETO
fetch('https://arrighicrm.com/api/PessoaFisica')
```

## Próximos Passos
1. **Corrigir a URL base** no frontend
2. **Testar os endpoints** usando cURL ou navegador
3. **Verificar se o domínio personalizado** está configurado corretamente no Azure
4. **Reativar o middleware de reverse proxy** se necessário

## Verificação do Domínio Personalizado
Se o domínio `arrighicrm.com` não estiver funcionando, use temporariamente:
```
https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net/api/PessoaFisica
```
