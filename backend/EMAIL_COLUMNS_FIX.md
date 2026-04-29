# Correção do Erro "Invalid column name 'EmailEmpresarial'/'EmailPessoal'"

## Problema Identificado

O erro ocorria na página `/contratos` em produção porque o banco de dados não possuía as colunas `EmailEmpresarial` e `EmailPessoal` na tabela `PessoasFisicas`. Essas colunas foram adicionadas na migração `20250907213641_AddEmailPessoalToPessoaFisica`, mas aparentemente não foram aplicadas no ambiente de produção.

## Solução Implementada

### 1. Verificação Automática de Colunas

Adicionado o método `EnsureEmailColumnsExist()` no `ContratoController` que:
- Verifica se as colunas `EmailEmpresarial` e `EmailPessoal` existem na tabela `PessoasFisicas`
- Se não existirem, as cria automaticamente
- Renomeia a coluna `Email` existente para `EmailEmpresarial` se necessário
- Adiciona a coluna `EmailPessoal` como nullable
- Cria o índice único para `EmailEmpresarial`

### 2. Execução Automática

O método `EnsureEmailColumnsExist()` é chamado automaticamente sempre que:
- O endpoint `GET /api/Contrato` é executado
- O endpoint `POST /api/Contrato/admin/migrate-columns` é executado

### 3. Tratamento de Erros

- Os erros são logados mas não interrompem a aplicação
- Se as colunas não puderem ser criadas, a aplicação continua funcionando
- Logs detalhados para acompanhar o processo de migração

## Como Usar

### Opção 1: Automática
As colunas serão criadas automaticamente na primeira chamada para listar contratos.

### Opção 2: Manual
Execute o endpoint de migração:
```
POST /api/Contrato/admin/migrate-columns
```

## Estrutura das Colunas Criadas

```sql
-- Se a coluna Email existir, ela será renomeada para EmailEmpresarial
EXEC sp_rename 'PessoasFisicas.Email', 'EmailEmpresarial', 'COLUMN'

-- Ou se não existir, será criada
ALTER TABLE PessoasFisicas ADD EmailEmpresarial NVARCHAR(150) NOT NULL DEFAULT ''

-- Coluna EmailPessoal sempre criada
ALTER TABLE PessoasFisicas ADD EmailPessoal NVARCHAR(150) NULL

-- Índice único para EmailEmpresarial
CREATE UNIQUE INDEX IX_PessoasFisicas_EmailEmpresarial ON PessoasFisicas (EmailEmpresarial)
```

## Logs de Acompanhamento

Os seguintes logs serão exibidos durante a execução:

- `🔧 EnsureEmailColumnsExist: Verificando se colunas EmailEmpresarial e EmailPessoal existem na tabela PessoasFisicas`
- `➕ EnsureEmailColumnsExist: Adicionando coluna EmailEmpresarial`
- `✅ EnsureEmailColumnsExist: Coluna EmailEmpresarial configurada com sucesso`
- `ℹ️ EnsureEmailColumnsExist: Coluna EmailEmpresarial já existe`

## Compatibilidade

Esta solução é compatível com:
- Bancos que já possuem as colunas (não faz nada)
- Bancos que possuem apenas a coluna `Email` (renomeia para `EmailEmpresarial`)
- Bancos que não possuem nenhuma das colunas (cria ambas)

## Próximos Passos

1. Fazer deploy da correção
2. Acessar a página `/contratos` para trigger automático da migração
3. Verificar os logs para confirmar que as colunas foram criadas
4. Confirmar que o erro não ocorre mais
