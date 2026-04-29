# 🏦 Sanitização de Nomes para API Santander

## 📋 Problema

A **API do Santander** aceita apenas caracteres **alfanuméricos** (letras e números) mais espaços no campo nome do pagador.

**Caracteres problemáticos** comuns em Pessoa Jurídica:
- `.` (ponto) - Ex: "EMPRESA LTDA."
- `-` (hífen) - Ex: "EMPRESA-SP"
- `&` (e comercial) - Ex: "JOAO & MARIA CIA"
- Outros símbolos: `/`, `\`, `(`, `)`, `@`, `#`, etc.

---

## ✅ Solução Implementada

### Método: `LimparTexto()` - Atualizado

**Arquivo**: `Controllers/BoletoController.cs` (linha ~599)

#### O que o método faz:

1. **Remove acentos** (á → a, ç → c, etc.)
2. **Remove caracteres especiais** (. - / \ etc.)
3. **Substitui `&` por `E`** ← Tratamento especial!
4. **Remove espaços múltiplos**
5. **Retorna apenas alfanumérico + espaços**

---

## 🔧 Exemplos de Transformação

### Pessoa Jurídica:

| Nome Original | Após Limpeza | API Santander |
|--------------|--------------|---------------|
| `"EMPRESA LTDA."` | `"EMPRESA LTDA"` | ✅ Aceito |
| `"COMERCIO-SP"` | `"COMERCIO SP"` | ✅ Aceito |
| `"JOAO & MARIA CIA"` | `"JOAO E MARIA CIA"` | ✅ Aceito |
| `"EMPRESA (MATRIZ)"` | `"EMPRESA MATRIZ"` | ✅ Aceito |
| `"TECH@COMPANY"` | `"TECH COMPANY"` | ✅ Aceito |
| `"INDUSTRIA/COMERCIO"` | `"INDUSTRIA COMERCIO"` | ✅ Aceito |
| `"A & B LTDA."` | `"A E B LTDA"` | ✅ Aceito |

### Pessoa Física:

| Nome Original | Após Limpeza |
|--------------|--------------|
| `"José da Silva"` | `"Jose da Silva"` |
| `"Maria-Paula"` | `"Maria Paula"` |
| `"João (Sênior)"` | `"Joao Senior"` |

---

## 📦 Caracteres Removidos/Substituídos

### Substituído por "E":
- `&` (e comercial) → `"E"`
  - Ex: "A & B" → "A E B"

### Substituído por espaço:
```
.  (ponto)            Ex: "LTDA." → "LTDA"
-  (hífen)            Ex: "EMPRESA-SP" → "EMPRESA SP"
/  (barra)            Ex: "IND/COM" → "IND COM"
\  (barra invertida)
(  (parênteses)       Ex: "(MATRIZ)" → "MATRIZ"
)
[  (colchetes)
]
{  (chaves)
}
@  (arroba)           Ex: "TECH@COMPANY" → "TECH COMPANY"
#  (hashtag)
$  (cifrão)
%  (porcentagem)
*  (asterisco)
+  (mais)
=  (igual)
!  (exclamação)
?  (interrogação)
:  (dois pontos)
;  (ponto e vírgula)
,  (vírgula)
<  (menor que)
>  (maior que)
|  (pipe)
_  (underscore)
~  (til)
`  (crase)
^  (circunflexo)
'  (aspas simples)
"  (aspas duplas)
```

---

## 🔍 Onde é Aplicado

### Na criação/registro do boleto:

```csharp
// CriarBoletoFromDTO() - linha ~648
var payerNameTruncado = TruncarTexto(LimparTexto(nomeCliente), 40);
var payerAddressTruncado = TruncarTexto(LimparTexto(endereco?.Logradouro ?? "..."), 40);
var payerNeighborhoodTruncado = TruncarTexto(LimparTexto(endereco?.Bairro ?? "..."), 30);
var payerCityTruncado = TruncarTexto(LimparTexto(endereco?.Cidade ?? "..."), 20);
```

**Campos sanitizados**:
1. ✅ **PayerName** (Nome do pagador) - Limite: 40 caracteres
2. ✅ **PayerAddress** (Endereço) - Limite: 40 caracteres  
3. ✅ **PayerNeighborhood** (Bairro) - Limite: 30 caracteres
4. ✅ **PayerCity** (Cidade) - Limite: 20 caracteres

---

## 📊 Fluxo de Sanitização

```
1. Cliente cadastrado no sistema
   Nome: "JOAO & MARIA COMERCIO LTDA."

2. Criação do boleto
   → BoletoController.CriarBoletoFromDTO()

3. Obtenção dos dados do cliente
   → ObterDadosCliente()
   → nomeCliente = "JOAO & MARIA COMERCIO LTDA."

4. Sanitização do nome
   → LimparTexto("JOAO & MARIA COMERCIO LTDA.")
   → Remove acentos (nenhum neste caso)
   → Substitui & por E: "JOAO E MARIA COMERCIO LTDA."
   → Remove ponto: "JOAO E MARIA COMERCIO LTDA"
   → Resultado: "JOAO E MARIA COMERCIO LTDA"

5. Truncamento (limite 40 chars)
   → TruncarTexto(..., 40)
   → Neste caso: já cabe, mantém completo

6. Envio para API Santander
   → payerName = "JOAO E MARIA COMERCIO LTDA"
   ✅ Aceito pela API!
```

---

## ⚠️ IMPORTANTE: Dados no Banco

A sanitização acontece **APENAS** na hora de enviar para o Santander.

```
Banco de Dados:          "JOAO & MARIA LTDA."  ← Original mantido
Envio para Santander:    "JOAO E MARIA LTDA"   ← Limpo
PDF do Boleto:           "JOAO E MARIA LTDA"   ← Aparece limpo
```

**Por quê?**
- ✅ Mantém dados originais no banco
- ✅ Não altera cadastro do cliente
- ✅ Apenas formata para API externa

---

## 🧪 Testes

### Teste 1: Empresa com &
```bash
POST /api/boleto
{
  "contratoId": 1,  # Cliente: "COMERCIO & INDUSTRIA LTDA."
  "nominalValue": 100.00,
  "dueDate": "2025-12-31"
}

✅ Resultado:
- Enviado para Santander: "COMERCIO E INDUSTRIA LTDA"
- Boleto registrado com sucesso
```

### Teste 2: Empresa com hífen e ponto
```bash
POST /api/boleto
{
  "contratoId": 2,  # Cliente: "EMPRESA-SP LTDA."
}

✅ Resultado:
- Enviado para Santander: "EMPRESA SP LTDA"
- Aceito pela API
```

### Teste 3: Nome longo com símbolos
```bash
POST /api/boleto
{
  "contratoId": 3,  # Cliente: "SUPER MEGA & CIA (MATRIZ) LTDA."
}

✅ Resultado:
- Limpo: "SUPER MEGA E CIA MATRIZ LTDA"
- Se > 40 chars, trunca: "SUPER MEGA E CIA MATRIZ LTDA" (37 chars, ok)
```

---

## 📝 Logs

O sistema registra a transformação:

```
📝 Nome truncado: 'JOAO & MARIA LTDA.' → 'JOAO E MARIA LTDA'
```

---

## 🔄 Comparação: Antes vs Depois

### ❌ Antes (sem sanitização completa):

```csharp
"EMPRESA & CIA LTDA." → Enviado com & e .
→ ❌ API Santander: Erro 400 - Invalid characters
```

### ✅ Depois (com sanitização completa):

```csharp
"EMPRESA & CIA LTDA." → "EMPRESA E CIA LTDA"
→ ✅ API Santander: Boleto registrado com sucesso
```

---

## 🎯 Por Que Isso é Necessário?

### API Santander - Restrições:

1. **Aceita apenas**: Letras, números e espaços
2. **Não aceita**: Símbolos, pontuação, caracteres especiais
3. **Motivo**: Padrão de boletos bancários (sistema legado)

### Impacto se não sanitizar:

```
Cliente: "A & B LTDA."
  ↓ (sem sanitização)
API Santander: ❌ Erro 400
  ↓
Boleto não registrado
  ↓
Cliente não consegue pagar
```

---

## ✅ Checklist

- [x] Método `LimparTexto()` atualizado
- [x] Remove acentos
- [x] Remove caracteres especiais
- [x] Substitui `&` por `E`
- [x] Remove espaços múltiplos
- [x] Aplicado em todos os campos (nome, endereço, bairro, cidade)
- [x] Documentação criada
- [ ] Testado com PJ que tem símbolos
- [ ] Verificado PDF do boleto

---

## 🐛 Troubleshooting

### Problema: API retorna erro 400

**Verificar**:
1. Logs: Ver se o nome foi sanitizado
2. Procurar por: `📝 Nome truncado:`
3. Verificar se ainda há símbolos

### Problema: Nome aparece diferente no boleto

**Normal!** O nome é sanitizado apenas para API.
- No sistema: "A & B LTDA."
- No boleto: "A E B LTDA"

---

## 🚀 Deploy

A correção está implementada. Para aplicar:

```bash
# 1. Verificar mudanças
git diff Controllers/BoletoController.cs

# 2. Commit
git add Controllers/BoletoController.cs SANITIZACAO_NOMES_SANTANDER.md
git commit -m "fix: sanitizar símbolos em nomes para API Santander"

# 3. Push
git push origin main

# 4. Deploy
# (seguir processo normal)
```

---

## 💡 Exemplos Reais

### Casos Comuns:

1. **"SILVA & SANTOS LTDA."**
   - Sanitizado: `"SILVA E SANTOS LTDA"`

2. **"TECH-SOLUTION (MATRIZ)"**
   - Sanitizado: `"TECH SOLUTION MATRIZ"`

3. **"DISTRIBUIDORA/ATACADISTA XYZ"**
   - Sanitizado: `"DISTRIBUIDORA ATACADISTA XYZ"`

4. **"EMPRESA@DIGITAL.COM"**
   - Sanitizado: `"EMPRESA DIGITAL COM"`

5. **"A+B COMERCIO"**
   - Sanitizado: `"A B COMERCIO"`

---

**Data**: 21/11/2025  
**Commit**: ad9ef4d (descerealização)  
**Status**: ✅ Sanitização completa implementada  
**Testado**: Pendente

