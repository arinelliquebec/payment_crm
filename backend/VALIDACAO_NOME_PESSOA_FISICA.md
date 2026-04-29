# 🔒 Validação de Nome - Pessoa Física (SEM SÍMBOLOS)

## 📋 Problema Identificado

Usuário adicionou **parênteses** `()` no nome de uma pessoa física na tabela, exemplo:
```
"NELSON(VISION TIME)"
```

**Problema**: Nomes de pessoa física **não devem ter símbolos**, apenas letras e espaços.

---

## ✅ Solução Implementada

### 1. Validação no Backend

**Arquivo**: `Services/PessoaFisicaValidationService.cs`

#### Validação Adicionada:

```csharp
// Validar se contém apenas letras (incluindo acentos) e espaços - SEM SÍMBOLOS
if (!IsValidName(dto.Nome))
    result.AddFieldError("nome", "Nome deve conter apenas letras e espaços (sem números ou símbolos como parênteses, hífens, etc)");
```

#### Método `IsValidName()`:
- ✅ **Permite**: Letras (a-z, A-Z)
- ✅ **Permite**: Acentos (á, é, í, ó, ú, ã, õ, â, ê, ô, ç, ü)
- ✅ **Permite**: Espaços entre nomes
- ❌ **Bloqueia**: Números (0-9)
- ❌ **Bloqueia**: Parênteses `( )`
- ❌ **Bloqueia**: Hífen `-`
- ❌ **Bloqueia**: Ponto `.`
- ❌ **Bloqueia**: Vírgula `,`
- ❌ **Bloqueia**: Todos os símbolos

### 2. Sanitização Automática

**Método `SanitizeName()`**: Remove automaticamente símbolos inválidos

```csharp
"NELSON(VISION TIME)" → "NELSON VISION TIME"
"MARIA-PAULA"         → "MARIA PAULA"
"JOÃO.SILVA"          → "JOAO SILVA"
"ANA123"              → "ANA"
```

---

## 📊 Exemplos de Validação

### ✅ ACEITOS:
```
✅ "João Silva"
✅ "Maria da Conceição"
✅ "José Antônio"
✅ "Ana Luíza Souza"
✅ "Françoise Müller"
✅ "Ângela Cristina"
```

### ❌ REJEITADOS:
```
❌ "Nelson(vision time)"    → Parênteses
❌ "João123"                 → Números
❌ "Maria@Silva"             → Arroba
❌ "Pedro-Silva"             → Hífen
❌ "Ana.Paula"               → Ponto
❌ "José/Carlos"             → Barra
❌ "Maria [Teste]"           → Colchetes
❌ "João & Maria"            → E comercial
❌ "Carlos #1"               → Hashtag
```

---

## 🔧 Fluxo de Validação

```
1. Usuário tenta cadastrar "Nelson(vision time)"
   ↓
2. Backend valida (IsValidName)
   ↓
3. ❌ Detecta parênteses
   ↓
4. Retorna erro 400:
   "Nome deve conter apenas letras e espaços (sem números ou símbolos...)"
   ↓
5. Frontend mostra mensagem ao usuário
```

---

## 🛡️ Sanitização Automática

Antes de salvar, o sistema **limpa automaticamente** o nome:

```csharp
// SanitizeName()
"NELSON(VISION TIME)" → Remove () → "NELSON VISION TIME"
"MARIA--PAULA"        → Remove --  → "MARIA PAULA"
"JOÃO123"             → Remove 123 → "JOÃO"
```

**Depois da limpeza**, valida novamente. Se ainda inválido, retorna erro.

---

## 🗄️ Limpeza de Dados Existentes

### Script SQL Criado

**Arquivo**: `limpar_nomes_pessoa_fisica_simbolos.sql`

#### O que o script faz:

1. **Identifica** registros com símbolos no nome
2. **Cria backup** automático antes de alterar
3. **Remove** parênteses, hífens, números e outros símbolos
4. **Limpa** espaços extras
5. **Permite restaurar** se necessário

### Como Usar o Script:

```sql
-- 1. Ver registros problemáticos (não altera nada)
SELECT Id, Nome FROM PessoasFisicas
WHERE Nome LIKE '%(%' OR Nome LIKE '%)%' OR Nome LIKE '%-%';

-- 2. Executar script completo
-- (ele cria backup automaticamente antes de alterar)
```

---

## 📝 Mensagem de Erro

### Quando tentar cadastrar nome com símbolos:

**Status HTTP**: `400 Bad Request`

**Body**:
```json
{
  "fieldErrors": {
    "nome": [
      "Nome deve conter apenas letras e espaços (sem números ou símbolos como parênteses, hífens, etc)"
    ]
  }
}
```

---

## 🔍 Caracteres Bloqueados

### Lista completa de símbolos **NÃO PERMITIDOS**:

```
Números:     0 1 2 3 4 5 6 7 8 9
Parênteses:  ( )
Colchetes:   [ ]
Chaves:      { }
Matemáticos: + - * / = %
Pontuação:   . , ; : ! ?
Outros:      @ # $ & _ ~ ` ^ | \ ' "
Barras:      / \
```

### Caracteres **PERMITIDOS**:

```
Letras:      a-z A-Z
Acentos:     á à ã â é ê í ó ô õ ú ü ç
Espaços:     (entre nomes)
```

---

## 🧪 Testes

### Teste 1: Nome Válido ✅
```http
POST /api/pessoafisica
{
  "nome": "João Silva",
  "emailEmpresarial": "joao@example.com",
  ...
}

✅ Resposta: 201 Created
```

### Teste 2: Nome com Parênteses ❌
```http
POST /api/pessoafisica
{
  "nome": "Nelson(vision time)",
  ...
}

❌ Resposta: 400 Bad Request
{
  "fieldErrors": {
    "nome": ["Nome deve conter apenas letras e espaços..."]
  }
}
```

### Teste 3: Nome com Hífen ❌
```http
POST /api/pessoafisica
{
  "nome": "Maria-Paula",
  ...
}

❌ Resposta: 400 Bad Request
```

### Teste 4: Nome com Número ❌
```http
POST /api/pessoafisica
{
  "nome": "João123",
  ...
}

❌ Resposta: 400 Bad Request
```

---

## 📊 Diferença: Pessoa Física vs Pessoa Jurídica

| Aspecto | Pessoa Física | Pessoa Jurídica |
|---------|---------------|-----------------|
| **Símbolos** | ❌ **NÃO permitido** | ✅ Permitido no cadastro |
| **Exemplos** | "João Silva" | "EMPRESA & CIA LTDA." |
| **Tratamento** | Validação bloqueia | Sanitizado para API Santander |
| **Razão** | Nome próprio | Razão social pode ter símbolos |

---

## 🔄 Impacto

### ANTES da Correção:
```
Usuário: "Nelson(vision time)"
  ↓
Backend: ✅ Aceita
  ↓
Banco: Salvo com parênteses
  ↓
❌ Problema: Nome inválido no sistema
```

### DEPOIS da Correção:
```
Usuário: "Nelson(vision time)"
  ↓
Backend: ❌ Valida e rejeita
  ↓
Erro: "Nome deve conter apenas letras..."
  ↓
✅ Não salva nome inválido
```

---

## 💡 Por Que Bloquear Símbolos?

### 1. **Padronização**
- Nomes próprios não têm símbolos na vida real
- Facilita busca e ordenação

### 2. **Integração com APIs**
- APIs bancárias (Santander) não aceitam símbolos
- Evita problemas ao gerar boletos

### 3. **Qualidade de Dados**
- Evita dados "poluídos"
- Facilita relatórios e análises

### 4. **Segurança**
- Previne tentativas de injeção
- Mantém consistência

---

## 🐛 Troubleshooting

### Problema: "Erro ao cadastrar nome válido"

**Verificar**:
1. Nome tem pelo menos nome e sobrenome?
2. Só tem letras e espaços?
3. Não tem números ou símbolos escondidos?

### Problema: "Nomes antigos com símbolos no banco"

**Solução**:
```sql
-- Executar script de limpeza:
limpar_nomes_pessoa_fisica_simbolos.sql
```

---

## ✅ Checklist

- [x] Validação `IsValidName()` implementada
- [x] Sanitização `SanitizeName()` implementada
- [x] Mensagem de erro clara
- [x] Script SQL de limpeza criado
- [x] Documentação criada
- [ ] Testes executados
- [ ] Script SQL executado em produção
- [ ] Frontend ajustado (se necessário)

---

## 🚀 Próximos Passos

### 1. **Testar** (Desenvolvimento)
```bash
dotnet run
# Testar cadastro com nome válido e inválido
```

### 2. **Limpar Dados** (Produção)
```sql
-- Executar: limpar_nomes_pessoa_fisica_simbolos.sql
-- Revisar registros antes de aplicar!
```

### 3. **Ajustar Frontend** (Opcional)
- Adicionar validação em tempo real
- Mostrar mensagem clara
- Remover símbolos automaticamente no input

---

## 📱 Integração com Frontend

**Recomendação**:
```javascript
// Validação em tempo real no input
const validarNome = (nome) => {
  const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
  return regex.test(nome);
};

// Exemplo de uso
if (!validarNome(nome)) {
  setErro("Nome deve conter apenas letras e espaços");
}

// Sanitização no input (remover símbolos enquanto digita)
const handleNomeChange = (e) => {
  const valor = e.target.value;
  const limpo = valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
  setNome(limpo);
};
```

---

## 🎯 Casos Especiais

### Nomes Estrangeiros ✅

```
✅ "François"    (francês)
✅ "Müller"      (alemão)
✅ "José"        (português)
✅ "Ángel"       (espanhol)
✅ "Søren"       (dinamarquês)
```

### Nomes Compostos ✅

```
✅ "Maria da Silva"
✅ "João de Souza"
✅ "Ana Paula"
```

### ❌ NÃO Aceitos

```
❌ "Maria-Paula"     (hífen)
❌ "Ana.Paula"       (ponto)
❌ "João Jr."        (ponto)
❌ "Pedro (Neto)"    (parênteses)
```

---

**Data**: 21/11/2025  
**Status**: ✅ Validação implementada  
**Testado**: Pendente  
**Deploy**: Pendente

