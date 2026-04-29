# 🚨 SOLUÇÃO URGENTE - Erro EmailEmpresarial/EmailPessoal

## Status Atual
❌ O erro ainda está ocorrendo em produção na página `/contratos`

## Ações Imediatas Necessárias

### 1. PRIMEIRO: Executar Diagnóstico
Acesse este endpoint para verificar o estado atual do banco:
```
GET https://arrighicrm.com/api/Contrato/admin/diagnose-email-columns
```

### 2. SEGUNDO: Executar Migração
Execute a migração manual das colunas:
```
POST https://arrighicrm.com/api/Contrato/admin/migrate-columns
```

### 3. TERCEIRO: Testar a Página
Acesse novamente:
```
https://arrighicrm.com/contratos
```

## Como Executar os Endpoints

### Via Browser (GET)
1. Cole a URL do diagnóstico no browser
2. Verifique o JSON retornado para entender o estado das colunas

### Via curl/Postman (POST)
```bash
curl -X POST https://arrighicrm.com/api/Contrato/admin/migrate-columns \
  -H "Content-Type: application/json"
```

### Via JavaScript (Console do Browser)
```javascript
// Diagnóstico
fetch('https://arrighicrm.com/api/Contrato/admin/diagnose-email-columns')
  .then(r => r.json())
  .then(console.log);

// Migração
fetch('https://arrighicrm.com/api/Contrato/admin/migrate-columns', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'}
})
  .then(r => r.json())
  .then(console.log);
```

## O Que a Migração Faz

1. **Verifica estrutura atual** da tabela `PessoasFisicas`
2. **Se só existe coluna `Email`**: renomeia para `EmailEmpresarial`
3. **Se não existe `EmailEmpresarial`**: cria a coluna
4. **Se não existe `EmailPessoal`**: cria a coluna
5. **Tenta criar índice** para `EmailEmpresarial`

## Cenários Cobertos

✅ Banco com coluna `Email` apenas → Renomeia para `EmailEmpresarial`
✅ Banco sem as colunas → Cria ambas
✅ Banco com as colunas → Não faz nada
✅ Problemas com índices → Cria índice não-único como fallback

## Logs para Acompanhar

Após executar, verifique os logs do servidor para mensagens como:
- `🔧 EnsureEmailColumnsExist: Verificando se colunas...`
- `➕ EnsureEmailColumnsExist: Renomeando coluna Email...`
- `✅ EnsureEmailColumnsExist: Coluna EmailEmpresarial...`

## Se o Problema Persistir

1. Verifique os logs do servidor
2. Execute o diagnóstico novamente
3. Verifique se o deploy foi feito com as alterações
4. Considere executar migração manual no banco:

```sql
-- Verificar colunas atuais
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'PessoasFisicas';

-- Se só existe Email, renomear
EXEC sp_rename 'PessoasFisicas.Email', 'EmailEmpresarial', 'COLUMN';

-- Se não existe EmailPessoal, criar
ALTER TABLE PessoasFisicas ADD EmailPessoal NVARCHAR(150) NULL;
```

## Contato
Se o problema persistir, verificar logs detalhados no servidor e considerar acesso direto ao banco de dados.
