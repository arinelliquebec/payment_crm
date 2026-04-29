# Geração Manual de Boletos - Renegociação, Antecipação e Avulso

## Visão Geral

A partir desta atualização, ao gerar um boleto **MANUAL**, o usuário precisa selecionar o **tipo** do boleto:

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **RENEGOCIACAO** | Renegocia parcelas em atraso (BAIXADO_NAO_PAGO) | Cliente está com parcelas vencidas e quer negociar |
| **ANTECIPACAO** | Antecipa parcelas futuras | Cliente quer pagar parcelas antes do vencimento |
| **AVULSO** | Não afeta parcelas do contrato | Acordos especiais, pagamentos de outros contratos |

## Fluxo de Interface

### 1. Seleção do Tipo de Boleto

Quando o usuário clicar em "Gerar Boleto Manual", exibir um seletor com 3 opções:

```tsx
<Select value={tipoBoleto} onChange={setTipoBoleto}>
  <Option value="RENEGOCIACAO">🔄 Renegociação (parcelas em atraso)</Option>
  <Option value="ANTECIPACAO">⏩ Antecipação (parcelas futuras)</Option>
  <Option value="AVULSO">📄 Avulso (acordo especial)</Option>
</Select>
```

### 2. Seleção de Parcelas (Renegociação/Antecipação)

Se o tipo selecionado for **RENEGOCIACAO** ou **ANTECIPACAO**, exibir uma lista de parcelas para seleção:

```tsx
// Buscar parcelas disponíveis
const { data: parcelas } = useQuery(['parcelas-disponiveis', contratoId], 
  () => api.get(`/api/Boleto/contrato/${contratoId}/parcelas-disponiveis`)
);

// Se RENEGOCIAÇÃO: mostrar parcelas em atraso
{tipoBoleto === 'RENEGOCIACAO' && (
  <ParcelasCheckboxList
    parcelas={parcelas.parcelasRenegociacao}
    selected={parcelasSelecionadas}
    onChange={setParcelasSelecionadas}
    title="Selecione as parcelas para renegociar"
  />
)}

// Se ANTECIPAÇÃO: mostrar parcelas futuras
{tipoBoleto === 'ANTECIPACAO' && (
  <ParcelasCheckboxList
    parcelas={parcelas.parcelasAntecipacao}
    selected={parcelasSelecionadas}
    onChange={setParcelasSelecionadas}
    title="Selecione as parcelas para antecipar"
  />
)}
```

### 3. Valor Editável

O valor deve ser **editável** (especialmente para renegociações com desconto):

```tsx
// Calcular valor sugerido baseado nas parcelas selecionadas
const valorSugerido = parcelasSelecionadas.reduce(
  (sum, p) => sum + p.valorOriginal, 0
);

<Input
  type="number"
  label="Valor do Boleto"
  value={valorBoleto}
  onChange={setValorBoleto}
  helperText={`Valor sugerido: R$ ${valorSugerido.toFixed(2)}`}
/>
```

## Endpoints da API

### GET `/api/Boleto/contrato/{contratoId}/parcelas-disponiveis`

Retorna as parcelas disponíveis para renegociação e antecipação.

**Resposta:**

```json
{
  "parcelasRenegociacao": [
    {
      "boletoId": 123,
      "numeroParcela": 5,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2025-10-15",
      "status": "BAIXADO_NAO_PAGO",
      "descricao": "Parcela 5 - Vencida em 15/10/2025 - R$ 450,00"
    },
    {
      "boletoId": 124,
      "numeroParcela": 6,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2025-11-15",
      "status": "BAIXADO_NAO_PAGO",
      "descricao": "Parcela 6 - Vencida em 15/11/2025 - R$ 450,00"
    }
  ],
  "parcelasAntecipacao": [
    {
      "boletoId": null,
      "numeroParcela": 8,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2026-02-15",
      "status": "FUTURA",
      "descricao": "Parcela 8/24 - Vence em 15/02/2026 - R$ 450,00"
    },
    {
      "boletoId": null,
      "numeroParcela": 9,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2026-03-15",
      "status": "FUTURA",
      "descricao": "Parcela 9/24 - Vence em 15/03/2026 - R$ 450,00"
    }
  ],
  "valorParcela": 450.00,
  "totalParcelas": 24,
  "parcelaAtual": 7,
  "parcelasEmAtraso": 2
}
```

### POST `/api/Boleto`

Criar boleto manual com tipo e parcelas selecionadas.

**Request Body:**

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-10",
  "nominalValue": 850.00,
  "tipoBoletoManual": "RENEGOCIACAO",
  "parcelasSelecionadas": [
    {
      "boletoId": 123,
      "numeroParcela": 5,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2025-10-15"
    },
    {
      "boletoId": 124,
      "numeroParcela": 6,
      "valorOriginal": 450.00,
      "vencimentoOriginal": "2025-11-15"
    }
  ]
}
```

**Valores para `tipoBoletoManual`:**
- `0` ou `"AVULSO"` - Boleto avulso
- `1` ou `"RENEGOCIACAO"` - Renegociação
- `2` ou `"ANTECIPACAO"` - Antecipação

## Exemplos de Cenários

### Cenário 1: Renegociação de 1 Parcela

Cliente tem parcela 5 vencida e quer renegociar com desconto de 10%.

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-10",
  "nominalValue": 405.00,  // R$ 450 - 10% desconto
  "tipoBoletoManual": "RENEGOCIACAO",
  "parcelasSelecionadas": [
    {
      "boletoId": 123,
      "numeroParcela": 5,
      "valorOriginal": 450.00
    }
  ]
}
```

**Resultado:** Novo boleto assume parcela 5. Boleto original #123 é marcado como avulso.

### Cenário 2: Renegociação de 3 Parcelas

Cliente tem parcelas 5, 6 e 7 vencidas e quer pagar todas de uma vez.

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-10",
  "nominalValue": 1350.00,  // 3 x R$ 450
  "tipoBoletoManual": "RENEGOCIACAO",
  "parcelasSelecionadas": [
    { "boletoId": 123, "numeroParcela": 5, "valorOriginal": 450.00 },
    { "boletoId": 124, "numeroParcela": 6, "valorOriginal": 450.00 },
    { "boletoId": 125, "numeroParcela": 7, "valorOriginal": 450.00 }
  ]
}
```

**Resultado:** Novo boleto criado como avulso (NumeroParcela=NULL), com `parcelasCobertas=[5,6,7]`. Boletos originais são marcados como avulsos. Quando pago, o sistema marca as parcelas 5,6,7 como quitadas.

### Cenário 3: Antecipação de 2 Parcelas

Cliente quer antecipar as parcelas 10 e 11.

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-10",
  "nominalValue": 900.00,  // 2 x R$ 450
  "tipoBoletoManual": "ANTECIPACAO",
  "parcelasSelecionadas": [
    { "numeroParcela": 10, "valorOriginal": 450.00, "vencimentoOriginal": "2026-04-15" },
    { "numeroParcela": 11, "valorOriginal": 450.00, "vencimentoOriginal": "2026-05-15" }
  ]
}
```

**Resultado:** Novo boleto com `parcelasCobertas=[10,11]`. Sistema não vai gerar boletos automáticos para essas parcelas.

### Cenário 4: Boleto Avulso

Cliente fez acordo envolvendo outro contrato e vai pagar através deste.

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-10",
  "nominalValue": 2000.00,
  "tipoBoletoManual": "AVULSO"
  // Não precisa informar parcelasSelecionadas
}
```

**Resultado:** Boleto criado como avulso, não afeta nenhuma parcela do contrato.

## Comportamento do Sistema

### Ao Criar Boleto

| Tipo | NumeroParcela | ParcelasCobertas | Efeito nos Boletos Originais |
|------|---------------|------------------|------------------------------|
| RENEGOCIACAO (1 parcela) | Número da parcela | `[N]` | Boleto original vira avulso |
| RENEGOCIACAO (múltiplas) | NULL | `[N1, N2, ...]` | Boletos originais viram avulsos |
| ANTECIPACAO (1 parcela) | Número da parcela | `[N]` | N/A |
| ANTECIPACAO (múltiplas) | NULL | `[N1, N2, ...]` | N/A |
| AVULSO | NULL | NULL | N/A |

### Ao Pagar Boleto (Renegociação Múltiplas)

Quando um boleto de renegociação com múltiplas parcelas é pago:
1. Sistema lê o campo `ParcelasCobertas`
2. Marca os boletos originais como `FoiPago = true`
3. Verifica quitação do contrato

## Componente de Seleção de Parcelas (Exemplo React)

```tsx
interface ParcelaDisponivelDTO {
  boletoId?: number;
  numeroParcela: number;
  valorOriginal: number;
  vencimentoOriginal: string;
  status: string;
  descricao: string;
}

interface ParcelasCheckboxListProps {
  parcelas: ParcelaDisponivelDTO[];
  selected: ParcelaDisponivelDTO[];
  onChange: (selected: ParcelaDisponivelDTO[]) => void;
  title: string;
}

const ParcelasCheckboxList: React.FC<ParcelasCheckboxListProps> = ({
  parcelas, selected, onChange, title
}) => {
  const handleToggle = (parcela: ParcelaDisponivelDTO) => {
    const isSelected = selected.some(p => p.numeroParcela === parcela.numeroParcela);
    if (isSelected) {
      onChange(selected.filter(p => p.numeroParcela !== parcela.numeroParcela));
    } else {
      onChange([...selected, parcela]);
    }
  };

  const valorTotal = selected.reduce((sum, p) => sum + p.valorOriginal, 0);

  return (
    <div className="parcelas-selection">
      <h4>{title}</h4>
      
      {parcelas.length === 0 ? (
        <p className="text-muted">Nenhuma parcela disponível</p>
      ) : (
        <div className="parcelas-list">
          {parcelas.map(parcela => (
            <label key={parcela.numeroParcela} className="parcela-item">
              <input
                type="checkbox"
                checked={selected.some(p => p.numeroParcela === parcela.numeroParcela)}
                onChange={() => handleToggle(parcela)}
              />
              <span className="parcela-info">
                <strong>Parcela {parcela.numeroParcela}</strong>
                <span className="vencimento">
                  {new Date(parcela.vencimentoOriginal).toLocaleDateString('pt-BR')}
                </span>
                <span className="valor">R$ {parcela.valorOriginal.toFixed(2)}</span>
                <span className={`status ${parcela.status.toLowerCase()}`}>
                  {parcela.status}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
      
      {selected.length > 0 && (
        <div className="total-selecionado">
          <strong>
            {selected.length} parcela(s) selecionada(s) - 
            Total: R$ {valorTotal.toFixed(2)}
          </strong>
        </div>
      )}
    </div>
  );
};
```

## Validações

O backend valida:

1. **RENEGOCIACAO/ANTECIPACAO sem parcelas**: Retorna erro 400
2. **Boleto inválido para renegociação**: Se o boletoId informado não existe ou não está BAIXADO_NAO_PAGO
3. **Duplicata de parcela**: Não permite criar boleto para parcela já coberta (exceto renegociação/avulso)

## Migration SQL

Execute o script `migration_boleto_manual_tipo.sql` para adicionar as novas colunas:

- `TipoBoletoManual` - NVARCHAR(20)
- `ParcelasCobertas` - NVARCHAR(500) - JSON array
- `BoletosOriginaisRenegociados` - NVARCHAR(500) - JSON array

## Notas Importantes

1. **Valor editável**: O valor do boleto é SEMPRE editável, permitindo descontos ou ajustes
2. **Compatibilidade**: Se `tipoBoletoManual` não for informado, o sistema usa o comportamento legado (detecção automática)
3. **Geração em lote**: A geração em lote continua funcionando normalmente, ignorando parcelas já cobertas por boletos de antecipação

