# Correção do Campo Estado em Boletos Santander

## 📋 Problema Identificado

A API do Santander estava recusando boletos com o erro:

```json
{
  "_code": "0909",
  "_field": "payer.state",
  "_message": "O campo 'state' permite apenas as siglas dos estados."
}
```

### Causa Raiz

O campo `state` estava sendo enviado como **"BH"** (sigla da cidade Belo Horizonte) ao invés de **"MG"** (sigla do estado Minas Gerais).

Análise detalhada:
1. **Campo `Enderecos.Cidade`** no banco de dados continha: `"BELO HORIZONTE MG"` (cidade + UF juntos)
2. **Campo `Enderecos.Estado`** no banco de dados continha: `"BH"` (sigla incorreta da cidade)
3. O código enviava o valor do campo `Estado` sem validação → API rejeitava

### Exemplo do JSON Enviado (ERRADO)

```json
{
  "payer": {
    "city": "BELO HORIZONTE MG",
    "state": "BH"  // ❌ ERRADO - deveria ser "MG"
  }
}
```

### Exemplo Correto

```json
{
  "payer": {
    "city": "BELO HORIZONTE",  // ✅ Apenas cidade
    "state": "MG"              // ✅ UF válida
  }
}
```

---

## ✅ Solução Implementada

### 1. Validação e Normalização de Estados

**Arquivo:** `Controllers/BoletoController.cs`

Criado método `NormalizarEstado()` que:

✅ **Valida** se o estado é uma UF válida (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)

✅ **Extrai** a UF do campo cidade se vier no formato "CIDADE UF" (ex: "BELO HORIZONTE MG" → "MG")

✅ **Mapeia** cidades conhecidas para seus estados:
- BELO HORIZONTE → MG
- SÃO PAULO → SP
- RIO DE JANEIRO → RJ
- SALVADOR → BA
- BRASÍLIA → DF
- E outras capitais...

✅ **Fallback** para "SP" se não conseguir determinar

### 2. Limpeza do Campo Cidade

Criado método `LimparCidade()` que:

✅ Remove a UF do final do nome da cidade
- "BELO HORIZONTE MG" → "BELO HORIZONTE"
- "SAO PAULO SP" → "SAO PAULO"

✅ Evita enviar campos com formato incorreto para a API

### 3. Logs Informativos

Os métodos incluem logs detalhados:

```csharp
⚠️ Estado inválido detectado: 'BH' - Tentando corrigir...
✅ Estado extraído do campo cidade: 'BELO HORIZONTE MG' → UF: MG
🧹 Cidade limpa: 'BELO HORIZONTE MG' → 'BELO HORIZONTE'
```

---

## 🔧 Como Usar

### Aplicação Automática

A correção é **automática** e ocorre ao:
1. Criar um novo boleto
2. A aplicação detecta estado inválido
3. Corrige automaticamente extraindo do campo cidade ou usando mapeamento
4. Envia dados corretos para a API Santander

### Código Modificado

**Antes:**
```csharp
PayerState = !string.IsNullOrWhiteSpace(endereco?.Estado) 
    ? endereco.Estado.ToUpper() 
    : "SP"
```

**Depois:**
```csharp
PayerState = NormalizarEstado(endereco?.Estado, endereco?.Cidade)
```

**Cidade - Antes:**
```csharp
PayerCity = TruncarTexto(LimparTexto(endereco?.Cidade ?? "Cidade nao informada"), 20)
```

**Cidade - Depois:**
```csharp
var cidadeLimpa = LimparCidade(endereco?.Cidade);
var payerCityTruncado = TruncarTexto(LimparTexto(cidadeLimpa), 20);
```

---

## 🗃️ Correção no Banco de Dados

### Script SQL Fornecido

Foi criado o arquivo `corrigir_estados_enderecos.sql` que:

✅ Corrige estados inválidos na tabela `Enderecos`
✅ Remove UF do final do campo `Cidade`
✅ Gera relatório de estados antes/depois
✅ Lista registros que ainda precisam correção manual

### Como Executar

1. **Backup do banco** (importante!)
2. Execute o script: `corrigir_estados_enderecos.sql`
3. Revise o relatório gerado
4. Corrija manualmente registros pendentes (se houver)

---

## 📊 Estados Válidos no Brasil

```
AC - Acre                 AL - Alagoas              AP - Amapá
AM - Amazonas             BA - Bahia                CE - Ceará
DF - Distrito Federal     ES - Espírito Santo       GO - Goiás
MA - Maranhão             MT - Mato Grosso          MS - Mato Grosso do Sul
MG - Minas Gerais         PA - Pará                 PB - Paraíba
PR - Paraná               PE - Pernambuco           PI - Piauí
RJ - Rio de Janeiro       RN - Rio Grande do Norte  RS - Rio Grande do Sul
RO - Rondônia             RR - Roraima              SC - Santa Catarina
SP - São Paulo            SE - Sergipe              TO - Tocantins
```

---

## 🧪 Teste da Correção

### Cenários Testados

| Entrada (Estado) | Entrada (Cidade)      | Saída (Estado) | Saída (Cidade)   |
|------------------|-----------------------|----------------|------------------|
| `"BH"`           | `"BELO HORIZONTE MG"` | `"MG"`         | `"BELO HORIZONTE"` |
| `null`           | `"SAO PAULO SP"`      | `"SP"`         | `"SAO PAULO"`    |
| `""`             | `"RIO DE JANEIRO"`    | `"RJ"`         | `"RIO DE JANEIRO"` |
| `"MG"`           | `"UBERLANDIA"`        | `"MG"`         | `"UBERLANDIA"`   |
| `"XYZ"`          | `"SALVADOR"`          | `"BA"`         | `"SALVADOR"`     |

---

## 🎯 Benefícios da Solução

✅ **Correção automática** - não precisa intervenção manual
✅ **Validação robusta** - múltiplas estratégias de detecção
✅ **Logs detalhados** - fácil rastreamento e debug
✅ **Mapeamento extensível** - fácil adicionar novas cidades
✅ **Retrocompatível** - não quebra funcionamento existente
✅ **Documentado** - código com comentários claros

---

## 📝 Notas Importantes

⚠️ **Estados no banco** - O ideal é que o campo `Estado` no banco esteja sempre correto (UF válida)

⚠️ **Importação de dados** - Ao importar planilhas/dados externos, valide o campo estado antes de inserir

⚠️ **Fallback para SP** - Se não conseguir determinar o estado, usa "SP" como padrão (pode ser ajustado)

⚠️ **Logs de produção** - Os logs ajudam a identificar padrões e melhorar o mapeamento

---

## 🔍 Monitoramento

Para verificar se ainda há estados incorretos:

```sql
-- Listar estados inválidos
SELECT Estado, COUNT(*) as Quantidade
FROM Enderecos
WHERE Estado NOT IN (
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
)
OR Estado IS NULL
OR Estado = ''
GROUP BY Estado;
```

---

## 👥 Responsáveis

- **Identificação do problema:** Logs da API Santander
- **Análise da causa raiz:** Análise do código e banco de dados
- **Implementação da solução:** Correções em `BoletoController.cs`
- **Script SQL:** `corrigir_estados_enderecos.sql`

---

## 📅 Data de Implementação

- Data: 25/11/2025
- Versão: 1.0

---

## 🚀 Próximos Passos Recomendados

1. ✅ Executar script SQL de correção no banco de produção
2. ✅ Monitorar logs após deploy para verificar correções automáticas
3. ✅ Adicionar validação no frontend para evitar entrada de dados incorretos
4. ✅ Atualizar formulários de cadastro com dropdown de UFs
5. ✅ Criar rotina periódica de validação de dados no banco

---

**Status:** ✅ **IMPLEMENTADO E TESTADO**

