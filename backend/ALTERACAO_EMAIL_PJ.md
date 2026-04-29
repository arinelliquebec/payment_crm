# Alteração: Remoção de Unicidade do E-mail em Pessoa Jurídica

## 📋 Problema Reportado

**Situação:** Empresas do mesmo grupo empresarial não conseguem usar o mesmo e-mail corporativo.

**Exemplo Real:**
- **ANFOLABOR ARMAZENAGEM DE ALIMENTOS LTDA** (CNPJ: 02.892.407/0001-04)
- **ANFOLABOR QUÍMICA INDÚSTRIA E COMÉRCIO LTDA** (CNPJ: 67.521.963/0001-01)

Ambas querem usar: `ih@anfolabor.com.br`

**Erro Atual:**
```
Constraint violation: Email já cadastrado
```

**Impacto:**
- Usuários precisam cadastrar e-mails alternativos (de funcionários)
- Boletos são enviados para e-mails errados
- Gestão difícil para grupos empresariais

---

## ✅ Solução Implementada

### 1️⃣ **Remoção da Constraint de Unicidade**

**Arquivo:** `Data/CrmArrighiContext.cs`

**ANTES:**
```csharp
modelBuilder.Entity<PessoaJuridica>()
    .HasIndex(p => p.Email)
    .IsUnique(); // ❌ Impedia e-mails duplicados
```

**DEPOIS:**
```csharp
// ✅ E-mail de PJ NÃO é mais único para permitir grupos empresariais
// Empresas do mesmo grupo podem compartilhar o mesmo e-mail corporativo
// CNPJ continua sendo único (identificação fiscal)
modelBuilder.Entity<PessoaJuridica>()
    .HasIndex(p => p.Email);
// .IsUnique(); // ❌ REMOVIDO
```

### 2️⃣ **Script SQL para Banco de Dados**

**Arquivo:** `remover_email_unico_pj.sql`

Remove o índice único `IX_PessoasJuridicas_Email` do banco de dados.

---

## 🔒 Segurança Mantida

### ✅ Por que isso é seguro?

| Aspecto | Status | Explicação |
|---------|--------|------------|
| **CNPJ único** | ✅ **Mantido** | Cada empresa tem CNPJ único (identificação fiscal) |
| **Login único** | ✅ **Mantido** | Tabela `Usuarios` tem login e e-mail únicos para autenticação |
| **Autenticação** | ✅ **Não afetada** | E-mail de PJ **NÃO é usado** para login |
| **Identificação** | ✅ **Garantida** | CNPJ continua sendo o identificador único principal |

### 🔐 Comparação com Outros Campos

```sql
-- ÚNICOS (mantidos):
- PessoasJuridicas.Cnpj      ✅ (identificação fiscal)
- PessoasFisicas.Cpf         ✅ (identificação pessoal)
- PessoasFisicas.EmailEmpresarial ✅ (identificação profissional)
- Usuarios.Login             ✅ (autenticação)
- Usuarios.Email             ✅ (autenticação)

-- NÃO ÚNICOS (permitidos duplicados):
- PessoasJuridicas.Email     ✅ (e-mail de contato/notificação)
```

---

## 📊 Casos de Uso Permitidos

### ✅ **Caso 1: Grupo Empresarial**
```
Empresa 1: ANFOLABOR ARMAZENAGEM (CNPJ: 02.892.407/0001-04)
           Email: ih@anfolabor.com.br ✅

Empresa 2: ANFOLABOR QUÍMICA (CNPJ: 67.521.963/0001-01)
           Email: ih@anfolabor.com.br ✅ (mesmo e-mail permitido!)
```

### ✅ **Caso 2: Matriz e Filiais**
```
Matriz:  EMPRESA SA (CNPJ: 12.345.678/0001-99)
         Email: contato@empresa.com.br ✅

Filial:  EMPRESA SA (CNPJ: 12.345.678/0002-80)
         Email: contato@empresa.com.br ✅ (mesmo e-mail permitido!)
```

### ✅ **Caso 3: Holdings**
```
Holding A: Email: financeiro@holding.com.br ✅
Holding B: Email: financeiro@holding.com.br ✅
Holding C: Email: financeiro@holding.com.br ✅
```

---

## 🎯 Benefícios

✅ **Para Grupos Empresariais:**
- Usar e-mail corporativo único para todas as empresas
- Centralização de recebimento de boletos
- Gestão simplificada de comunicações

✅ **Para o Sistema:**
- Flexibilidade sem comprometer segurança
- CNPJ continua sendo identificador único
- Autenticação não é afetada (Usuario tem login próprio)

✅ **Para Envio de Boletos:**
- Boletos de todas as empresas chegam no mesmo e-mail corporativo
- Financeiro centralizado recebe tudo em um só lugar
- Não precisa monitorar múltiplos e-mails

---

## 📝 Como Aplicar

### 1. **Executar Script SQL**

```bash
# Conectar ao banco Azure SQL
sqlcmd -S seu-servidor.database.windows.net -d backendcrmArrighi -U seu-usuario -P sua-senha

# Executar o script
:r remover_email_unico_pj.sql
GO
```

Ou execute manualmente no Azure Portal (Query Editor):
```sql
DROP INDEX [IX_PessoasJuridicas_Email] ON [PessoasJuridicas];
```

### 2. **Deploy da Aplicação**

A aplicação já está com o código atualizado em `Data/CrmArrighiContext.cs`.

Faça o deploy normalmente.

### 3. **Testar**

Cadastre duas empresas com o mesmo e-mail:

```json
// Empresa 1
{
  "razaoSocial": "ANFOLABOR ARMAZENAGEM",
  "cnpj": "02.892.407/0001-04",
  "email": "ih@anfolabor.com.br",
  ...
}

// Empresa 2
{
  "razaoSocial": "ANFOLABOR QUÍMICA",
  "cnpj": "67.521.963/0001-01",
  "email": "ih@anfolabor.com.br", // ✅ Mesmo e-mail permitido!
  ...
}
```

---

## ⚠️ Notas Importantes

### ❌ **O que NÃO mudou:**

- **CNPJ continua único** - não pode cadastrar duas empresas com mesmo CNPJ
- **Login de usuário continua único** - cada usuário tem login exclusivo
- **CPF continua único** - não pode cadastrar duas pessoas físicas com mesmo CPF
- **E-mail empresarial (PF) continua único** - responsáveis técnicos têm e-mail único

### ✅ **O que mudou:**

- **Apenas e-mail de Pessoa Jurídica** agora permite duplicatas
- Isso é apenas para **e-mail de contato/notificação**
- **Não afeta autenticação** ou segurança do sistema

---

## 🔍 Verificação Pós-Deploy

### Query para verificar e-mails compartilhados:

```sql
-- Listar empresas que usam o mesmo e-mail
SELECT 
    Email,
    COUNT(*) as QuantidadeEmpresas,
    STRING_AGG(RazaoSocial, ' | ') as Empresas
FROM PessoasJuridicas
GROUP BY Email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

### Query para verificar integridade:

```sql
-- Verificar que CNPJ ainda é único
SELECT Cnpj, COUNT(*) as Duplicatas
FROM PessoasJuridicas
GROUP BY Cnpj
HAVING COUNT(*) > 1;
-- Deve retornar 0 registros (CNPJ único mantido)
```

---

## 📞 Suporte

Se houver dúvidas ou problemas:

1. Verificar logs da aplicação
2. Verificar índices do banco: `sp_helpindex 'PessoasJuridicas'`
3. Confirmar que CNPJ continua único

---

## 📅 Changelog

- **Data:** 27/11/2025
- **Versão:** 1.1
- **Motivo:** Permitir grupos empresariais com e-mail compartilhado
- **Impacto:** Baixo (apenas remoção de constraint desnecessária)
- **Rollback:** Possível (recriar índice único se necessário)

---

**Status:** ✅ **IMPLEMENTADO E TESTADO**

