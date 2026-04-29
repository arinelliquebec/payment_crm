# Teste: E-mail Compartilhado para Empresas

## 📋 Cenário de Teste

Testar o cadastro de múltiplas empresas usando o **mesmo e-mail corporativo**.

**Caso Real:** Grupo ANFOLABOR
- Empresa 1: ANFOLABOR ARMAZENAGEM
- Empresa 2: ANFOLABOR QUÍMICA
- **Mesmo e-mail:** `ih@anfolabor.com.br`

---

## ✅ Pré-requisitos

### 1. Aplicar Migration

```bash
cd D:\Projetos\Arrighi\BackendAtualizado\backendcrmArrighi-1\backendcrmArrighi
dotnet ef database update --context CrmArrighiContext
```

**O que a migration faz:**
- Remove índice único `IX_PessoasJuridicas_Email`
- Recria o índice **sem** a flag `unique`
- Permite múltiplas empresas com mesmo e-mail

### 2. Verificar Banco

```sql
-- Verificar que o índice não é mais único
SELECT 
    i.name AS IndexName,
    i.is_unique AS IsUnique,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('PessoasJuridicas')
AND i.name = 'IX_PessoasJuridicas_Email';

-- Resultado esperado: IsUnique = 0 (false)
```

---

## 🧪 Teste 1: Cadastro de Duas Empresas com Mesmo E-mail

### Passo 1: Cadastrar Responsável Técnico

**POST** `/api/PessoaFisica`

```json
{
  "nome": "João Campanini",
  "emailEmpresarial": "joao@anfolabor.com.br",
  "cpf": "123.456.789-00",
  "telefone1": "(11) 98817-5402",
  "endereco": {
    "cidade": "São Paulo",
    "estado": "SP",
    "bairro": "Centro",
    "logradouro": "Av Paulista",
    "cep": "01310-100",
    "numero": "1000"
  }
}
```

**Resposta esperada:** `201 Created`
```json
{
  "id": 123,
  "nome": "João Campanini",
  ...
}
```

📝 **Anotar o ID:** `ResponsavelTecnicoId = 123`

---

### Passo 2: Cadastrar Empresa 1 (ANFOLABOR ARMAZENAGEM)

**POST** `/api/PessoaJuridica`

```json
{
  "razaoSocial": "ANFOLABOR ARMAZENAGEM DE ALIMENTOS LTDA",
  "nomeFantasia": "ANFOLABOR ARMAZENAGEM",
  "cnpj": "02.892.407/0001-04",
  "email": "ih@anfolabor.com.br",
  "telefone1": "(11) 98817-5402",
  "responsavelTecnicoId": 123,
  "endereco": {
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "bairro": "Carlos Prates",
    "logradouro": "Av Nossa Senhora de Fátima",
    "cep": "30170-182",
    "numero": "100"
  }
}
```

**Resposta esperada:** ✅ `201 Created`
```json
{
  "id": 456,
  "razaoSocial": "ANFOLABOR ARMAZENAGEM DE ALIMENTOS LTDA",
  "cnpj": "02.892.407/0001-04",
  "email": "ih@anfolabor.com.br",
  ...
}
```

---

### Passo 3: Cadastrar Empresa 2 (ANFOLABOR QUÍMICA) - **MESMO E-MAIL**

**POST** `/api/PessoaJuridica`

```json
{
  "razaoSocial": "ANFOLABOR QUÍMICA INDÚSTRIA E COMÉRCIO LTDA",
  "nomeFantasia": "ANFOLABOR QUÍMICA",
  "cnpj": "67.521.963/0001-01",
  "email": "ih@anfolabor.com.br",  
  "telefone1": "(11) 4788-1600",
  "responsavelTecnicoId": 123,
  "endereco": {
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "bairro": "Carlos Prates",
    "logradouro": "Av Nossa Senhora de Fátima",
    "cep": "30170-182",
    "numero": "200"
  }
}
```

**Resposta esperada:** ✅ `201 Created` (AGORA FUNCIONA!)

**ANTES da alteração:** ❌ `409 Conflict` - "E-mail já cadastrado"
**DEPOIS da alteração:** ✅ `201 Created` - Cadastro bem-sucedido!

```json
{
  "id": 457,
  "razaoSocial": "ANFOLABOR QUÍMICA INDÚSTRIA E COMÉRCIO LTDA",
  "cnpj": "67.521.963/0001-01",
  "email": "ih@anfolabor.com.br",  
  ...
}
```

---

## 🔍 Verificação no Banco

```sql
-- Verificar que ambas empresas foram cadastradas com o mesmo e-mail
SELECT 
    Id,
    RazaoSocial,
    Cnpj,
    Email
FROM PessoasJuridicas
WHERE Email = 'ih@anfolabor.com.br'
ORDER BY Id;
```

**Resultado esperado:**
```
Id  | RazaoSocial                                  | Cnpj               | Email
----|----------------------------------------------|--------------------|-----------------------
456 | ANFOLABOR ARMAZENAGEM DE ALIMENTOS LTDA     | 02.892.407/0001-04 | ih@anfolabor.com.br
457 | ANFOLABOR QUÍMICA INDÚSTRIA E COMÉRCIO LTDA | 67.521.963/0001-01 | ih@anfolabor.com.br
```

✅ **Sucesso!** Duas empresas com o mesmo e-mail cadastradas.

---

## 🧪 Teste 2: Validações Mantidas

### Teste 2.1: CNPJ Duplicado (deve falhar)

**POST** `/api/PessoaJuridica`

```json
{
  "razaoSocial": "TESTE EMPRESA LTDA",
  "cnpj": "02.892.407/0001-04",  
  "email": "outro@email.com.br",
  "telefone1": "(11) 1111-1111",
  "responsavelTecnicoId": 123,
  "endereco": { ... }
}
```

**Resposta esperada:** ❌ `409 Conflict`
```json
{
  "message": "CNPJ já cadastrado.",
  "field": "cnpj"
}
```

✅ **Validação de CNPJ único mantida!**

---

### Teste 2.2: E-mails Diferentes (deve funcionar)

**POST** `/api/PessoaJuridica`

```json
{
  "razaoSocial": "OUTRA EMPRESA LTDA",
  "cnpj": "11.222.333/0001-44",
  "email": "contato@outraempresa.com.br",
  "telefone1": "(11) 2222-2222",
  "responsavelTecnicoId": 123,
  "endereco": { ... }
}
```

**Resposta esperada:** ✅ `201 Created`

---

## 📊 Teste 3: Envio de Boletos

### Criar Cliente e Contrato

1. Criar cliente para Empresa 1:
```json
POST /api/Cliente
{
  "tipoPessoa": "Juridica",
  "pessoaId": 456,  // ANFOLABOR ARMAZENAGEM
  "filialId": 1
}
```

2. Criar contrato e boleto (seguir fluxo normal)

3. **Verificar:** E-mail do boleto deve ser `ih@anfolabor.com.br`

4. Repetir para Empresa 2 (PessoaId: 457)

**Resultado esperado:** 
- Ambos boletos são enviados para `ih@anfolabor.com.br`
- ✅ Centralização de recebimento no mesmo e-mail corporativo

---

## ✅ Checklist de Testes

- [ ] Migration aplicada com sucesso
- [ ] Índice não é mais único no banco
- [ ] Cadastro de Empresa 1 com sucesso
- [ ] Cadastro de Empresa 2 com **mesmo e-mail** com sucesso
- [ ] Verificação no banco mostra 2 empresas com mesmo e-mail
- [ ] Validação de CNPJ duplicado ainda funciona
- [ ] Cadastro com e-mails diferentes funciona
- [ ] Boletos são enviados para o e-mail correto

---

## 🔄 Rollback (se necessário)

Se precisar voltar atrás:

```bash
# Reverter migration
dotnet ef migrations remove --context CrmArrighiContext

# Ou aplicar Down da migration
dotnet ef database update PreviousMigrationName --context CrmArrighiContext
```

**Atenção:** Rollback só é possível se não houver empresas com e-mails duplicados no banco.

---

## 📝 Notas Finais

### ✅ O que foi testado:

- Cadastro de múltiplas empresas com mesmo e-mail
- Validações de segurança mantidas (CNPJ único)
- Funcionalidade de e-mails diferentes
- Integridade do banco de dados

### 🎯 Resultado esperado:

**SUCESSO TOTAL** - Sistema permite e-mails compartilhados sem comprometer segurança.

---

**Data do Teste:** ___/___/_____  
**Testador:** _______________________  
**Status:** [ ] Aprovado [ ] Reprovado  
**Observações:** ________________________________

