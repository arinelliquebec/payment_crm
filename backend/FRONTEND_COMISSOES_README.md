# 📊 Endpoint de Comissões - Correção do Filtro por Período

## 🔴 Problema Identificado

O filtro por período na tela de Comissões (`/gestao/comissoes`) estava filtrando pela **data do contrato**, quando deveria filtrar pela **data de pagamento dos boletos**.

---

## ✅ Solução Implementada

Foi criado um **novo endpoint específico para comissões** que filtra corretamente pela data de pagamento.

### Novo Endpoint

```
GET /api/Estatisticas/comissoes
```

---

## 📋 Regras de Negócio Implementadas

| Tipo | Contratos | Comissão |
|------|-----------|----------|
| **Consultor** | Contratos vinculados ao consultor com situação "cliente" | **10% fixo** |
| **Parceiro** | Contratos vinculados ao parceiro com situação "cliente" | **Campo `Comissao` do contrato** |
| **Gestor** | Soma de todos os contratos dos consultores da filial | **5% fixo** |

### Regras Gerais:
- **Contratos**: Mostra TODOS (sem filtro de período)
- **Parcelas/Valor/Comissão**: Filtra pela **DATA DE PAGAMENTO** dos boletos no período

---

## 🔧 Parâmetros de Query (opcionais)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `dataInicio` | `DateTime` | Data inicial do período (formato: `YYYY-MM-DD`) |
| `dataFim` | `DateTime` | Data final do período (formato: `YYYY-MM-DD`) |
| `tipo` | `string` | Filtro: `"consultor"`, `"parceiro"`, `"gestor"` ou omitir para todos |

---

## 📝 Exemplos de Chamada

```javascript
// Todas as comissões (consultores + parceiros + gestores)
GET /api/Estatisticas/comissoes

// Comissões de dezembro/2024 (para fechamento de folha)
GET /api/Estatisticas/comissoes?dataInicio=2024-12-01&dataFim=2024-12-31

// Apenas consultores
GET /api/Estatisticas/comissoes?dataInicio=2024-12-01&dataFim=2024-12-31&tipo=consultor

// Apenas parceiros
GET /api/Estatisticas/comissoes?tipo=parceiro

// Apenas gestores (por filial)
GET /api/Estatisticas/comissoes?dataInicio=2024-12-01&dataFim=2024-12-31&tipo=gestor
```

---

## 📦 Estrutura da Resposta

```json
{
  "items": [
    {
      "id": 1,
      "nome": "ADRIELE LOBATO",
      "email": "adriele.morgado@arrighiadvogados.com.br",
      "documento": "123.456.789-00",
      "tipo": "Consultor",
      "filial": "Rio de Janeiro - RJ",
      "totalContratos": 3,
      "parcelasLiquidadas": 1,
      "valorLiquidado": 1250.00,
      "percentualComissao": "10%",
      "comissaoValor": 125.00
    },
    {
      "id": 2,
      "nome": "ALEX BORGES",
      "email": "adv.campi1@arrighiadvogados.com.br",
      "documento": "987.654.321-00",
      "tipo": "Parceiro",
      "filial": "Rio de Janeiro - RJ",
      "totalContratos": 2,
      "parcelasLiquidadas": 0,
      "valorLiquidado": 0.00,
      "percentualComissao": "Var.",
      "comissaoValor": 0.00
    },
    {
      "id": 1,
      "nome": "Rio de Janeiro - RJ",
      "email": "",
      "documento": "",
      "tipo": "Gestor",
      "filial": "Rio de Janeiro - RJ",
      "totalContratos": 50,
      "parcelasLiquidadas": 10,
      "valorLiquidado": 15000.00,
      "percentualComissao": "5%",
      "comissaoValor": 750.00
    }
  ],
  "total": 3,
  "filtros": {
    "dataInicio": "2024-12-01",
    "dataFim": "2024-12-31",
    "tipo": null
  },
  "resumo": {
    "totalContratos": 55,
    "totalParcelasLiquidadas": 11,
    "totalValorLiquidado": 16250.00,
    "totalComissoes": 875.00
  },
  "dataAtualizacao": "2024-12-17T15:30:00Z"
}
```

---

## 📋 Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `int` | ID do consultor/parceiro/filial |
| `nome` | `string` | Nome completo (para Gestor é o nome da filial) |
| `email` | `string` | Email empresarial (vazio para Gestor) |
| `documento` | `string` | CPF (vazio para Gestor) |
| `tipo` | `string` | `"Consultor"`, `"Parceiro"` ou `"Gestor"` |
| `filial` | `string` | Nome da filial |
| `totalContratos` | `int` | Total de contratos com situação "cliente" (sem filtro de período) |
| `parcelasLiquidadas` | `int` | Parcelas pagas **NO PERÍODO filtrado** |
| `valorLiquidado` | `decimal` | Valor pago **NO PERÍODO filtrado** |
| `percentualComissao` | `string` | `"10%"` consultor, `"5%"` gestor, ou variável para parceiro |
| `comissaoValor` | `decimal` | Valor da comissão calculada **NO PERÍODO** |

---

## 🧮 Cálculo da Comissão

### Consultor (10% fixo)
```
comissaoValor = valorLiquidado * 10%
```

### Parceiro (variável)
```
comissaoValor = Σ (valorPagoPorContrato * percentualComissaoDoContrato)
```
Usa o campo `Comissao` de cada contrato na tabela `Contratos`.

### Gestor (5% fixo)
```
comissaoValor = valorLiquidadoDaFilial * 5%
```
O valor liquidado é a **soma de todos os consultores daquela filial**.

---

## 🏢 Gestor (Filial)

O **Gestor** representa a filial e consolida os dados de todos os consultores vinculados a ela:

- **Nome**: Nome da filial (ex: "Rio de Janeiro - RJ")
- **Total Contratos**: Soma de contratos de todos os consultores da filial
- **Parcelas Liquidadas**: Soma de todas as parcelas pagas dos consultores da filial
- **Valor Liquidado**: Soma de todos os valores pagos dos consultores da filial
- **Comissão**: 5% sobre o valor liquidado total

⚠️ **Importante**: Os valores do Gestor são uma **consolidação** dos consultores da filial, não duplicam os valores.

---

## 🔄 O que o Frontend precisa fazer

### 1. Alterar a chamada da API

```javascript
const params = new URLSearchParams();

if (dataInicio) {
  params.append('dataInicio', dataInicio.toISOString().split('T')[0]);
}
if (dataFim) {
  params.append('dataFim', dataFim.toISOString().split('T')[0]);
}
if (tipoFiltro) {
  params.append('tipo', tipoFiltro); // 'consultor', 'parceiro' ou 'gestor'
}

const response = await api.get(`/api/Estatisticas/comissoes?${params}`);
const { items, resumo, filtros } = response.data;
```

### 2. Filtrar por tipo no frontend (se necessário)

```javascript
// Separar por tipo
const consultores = items.filter(i => i.tipo === 'Consultor');
const parceiros = items.filter(i => i.tipo === 'Parceiro');
const gestores = items.filter(i => i.tipo === 'Gestor');

// Ou usar o parâmetro tipo na API
const apenasConsultores = await api.get('/api/Estatisticas/comissoes?tipo=consultor');
```

### 3. Exibir na tela

```javascript
items.forEach(item => {
  // Ícone/badge por tipo
  const badge = item.tipo === 'Consultor' ? '👨‍💼' 
              : item.tipo === 'Parceiro' ? '🤝' 
              : '🏢'; // Gestor
  
  console.log(`${badge} ${item.nome} (${item.tipo})`);
  console.log(`  Filial: ${item.filial}`);
  console.log(`  Contratos: ${item.totalContratos}`);
  console.log(`  Parcelas Liq.: ${item.parcelasLiquidadas}`);
  console.log(`  Valor Liq.: R$ ${item.valorLiquidado.toFixed(2)}`);
  console.log(`  Comissão (${item.percentualComissao}): R$ ${item.comissaoValor.toFixed(2)}`);
});
```

---

## ⚠️ Importante

1. **Contratos**: Total mostra TODOS com situação "cliente", **sem filtro de período**

2. **Parcelas/Valor/Comissão**: Filtrados pelo período (data de pagamento)

3. **Sem filtro de período**: Mostra TODOS os pagamentos de todos os tempos

4. **Gestor não duplica valores**: O Gestor consolida os consultores da filial, use para visão gerencial por filial

5. **Dropdown "Todos os Tipos"**: Se manter, não passar o parâmetro `tipo`. Para filtrar, passar:
   - `tipo=consultor`
   - `tipo=parceiro`
   - `tipo=gestor`

---

## 🧪 Teste Rápido

```bash
# Todos
curl -X GET "https://api.arrighicrm.com/api/Estatisticas/comissoes" \
  -H "X-Usuario-Id: SEU_ID"

# Apenas gestores de dezembro/2024
curl -X GET "https://api.arrighicrm.com/api/Estatisticas/comissoes?dataInicio=2024-12-01&dataFim=2024-12-31&tipo=gestor" \
  -H "X-Usuario-Id: SEU_ID"
```

---

## 📞 Dúvidas?

Se tiver dúvidas sobre a implementação ou precisar de ajustes no endpoint, entre em contato.
