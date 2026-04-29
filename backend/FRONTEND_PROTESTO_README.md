# 📋 Campos de Protesto - Guia de Integração Frontend

## Visão Geral

A funcionalidade de **protesto** permite configurar o envio automático do boleto para protesto em cartório após um determinado número de dias do vencimento sem pagamento.

> ⚠️ **IMPORTANTE:** Os campos de protesto estão disponíveis **APENAS na geração manual de boletos**. A geração em lote **NÃO utiliza protesto** e continua funcionando normalmente sem essa configuração.

---

## 🆕 Novos Campos Disponíveis

### Na criação de boleto (`POST /api/Boleto`)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `protestType` | `string` | Não | Tipo de contagem para protesto |
| `protestQuantityDays` | `number` | Não | Quantidade de dias após vencimento para protestar |

---

## 📝 Valores Aceitos para `protestType`

| Valor | Descrição |
|-------|-----------|
| `DIAS_CORRIDOS` | Conta dias corridos (inclui fins de semana e feriados) |
| `DIAS_UTEIS` | Conta apenas dias úteis (exclui fins de semana e feriados) |
| `SEM_PROTESTO` | Não enviar para protesto |
| `NAO_PROTESTAR` | Não enviar para protesto (alternativa) |
| `null` / não informado | Usa configuração padrão (sem protesto) |

---

## 📊 Valores Aceitos para `protestQuantityDays`

- **Mínimo:** 1 dia
- **Máximo:** 99 dias
- **Padrão:** 3 dias (quando `protestType` é informado mas `protestQuantityDays` não)
- **Recomendado:** 3 a 5 dias úteis

---

## 💻 Exemplo de Request

### Boleto COM protesto (3 dias úteis)

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-15",
  "nominalValue": 1500.00,
  "protestType": "DIAS_UTEIS",
  "protestQuantityDays": 3,
  "finePercentage": 2.00,
  "interestPercentage": 1.00
}
```

### Boleto SEM protesto

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-15",
  "nominalValue": 1500.00,
  "protestType": "SEM_PROTESTO",
  "finePercentage": 2.00,
  "interestPercentage": 1.00
}
```

### Boleto sem informar protesto (comportamento padrão)

```json
{
  "contratoId": 123,
  "dueDate": "2026-02-15",
  "nominalValue": 1500.00,
  "finePercentage": 2.00,
  "interestPercentage": 1.00
}
```

---

## 🎨 Sugestão de Interface

### Formulário de Criação de Boleto

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Configurações de Protesto                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☐ Habilitar protesto automático                           │
│                                                             │
│  Tipo de contagem:                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ Dias Úteis                     ▼    │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Dias para protestar após vencimento:                       │
│  ┌─────────────────────────────────────┐                   │
│  │ 3                                   │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ⚠️ O boleto será enviado para protesto em cartório        │
│     automaticamente após 3 dias úteis do vencimento.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Select de Tipo de Protesto

```tsx
<select name="protestType">
  <option value="">Sem protesto</option>
  <option value="DIAS_UTEIS">Dias Úteis</option>
  <option value="DIAS_CORRIDOS">Dias Corridos</option>
</select>
```

### Input de Dias para Protesto

```tsx
<input 
  type="number" 
  name="protestQuantityDays"
  min="1" 
  max="99"
  placeholder="3"
  disabled={!protestType || protestType === 'SEM_PROTESTO'}
/>
```

---

## ⚠️ Validações Importantes

### No Frontend

1. **Se `protestType` for informado:**
   - Deve ser um dos valores válidos
   - `protestQuantityDays` deve estar entre 1 e 99

2. **Se `protestType` for `SEM_PROTESTO` ou `NAO_PROTESTAR`:**
   - `protestQuantityDays` é ignorado

3. **Se `protestQuantityDays` for informado sem `protestType`:**
   - O campo será ignorado (protesto não será configurado)

### Mensagens de Validação Sugeridas

```javascript
const validarProtesto = (protestType, protestQuantityDays) => {
  if (protestType && !['DIAS_CORRIDOS', 'DIAS_UTEIS', 'SEM_PROTESTO', 'NAO_PROTESTAR'].includes(protestType)) {
    return 'Tipo de protesto inválido';
  }
  
  if (protestQuantityDays && (protestQuantityDays < 1 || protestQuantityDays > 99)) {
    return 'Dias para protesto deve estar entre 1 e 99';
  }
  
  return null; // válido
};
```

---

## 📡 Exemplo de Integração React

```tsx
interface CreateBoletoDTO {
  contratoId: number;
  dueDate: string;
  nominalValue: number;
  // ... outros campos existentes
  
  // Novos campos de protesto
  protestType?: 'DIAS_CORRIDOS' | 'DIAS_UTEIS' | 'SEM_PROTESTO' | 'NAO_PROTESTAR';
  protestQuantityDays?: number;
}

const CriarBoleto: React.FC = () => {
  const [habilitarProtesto, setHabilitarProtesto] = useState(false);
  const [protestType, setProtestType] = useState<string>('DIAS_UTEIS');
  const [protestQuantityDays, setProtestQuantityDays] = useState<number>(3);

  const handleSubmit = async (data: CreateBoletoDTO) => {
    const payload: CreateBoletoDTO = {
      ...data,
      // Adicionar campos de protesto apenas se habilitado
      ...(habilitarProtesto && {
        protestType,
        protestQuantityDays
      })
    };

    const response = await fetch('/api/Boleto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // ... tratamento da resposta
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... outros campos */}
      
      <div className="protest-config">
        <label>
          <input
            type="checkbox"
            checked={habilitarProtesto}
            onChange={(e) => setHabilitarProtesto(e.target.checked)}
          />
          Habilitar protesto automático
        </label>

        {habilitarProtesto && (
          <>
            <select
              value={protestType}
              onChange={(e) => setProtestType(e.target.value)}
            >
              <option value="DIAS_UTEIS">Dias Úteis</option>
              <option value="DIAS_CORRIDOS">Dias Corridos</option>
            </select>

            <input
              type="number"
              min={1}
              max={99}
              value={protestQuantityDays}
              onChange={(e) => setProtestQuantityDays(Number(e.target.value))}
            />
          </>
        )}
      </div>
    </form>
  );
};
```

---

## 📋 Checklist de Implementação

- [ ] Adicionar campo `protestType` (select)
- [ ] Adicionar campo `protestQuantityDays` (input number)
- [ ] Adicionar checkbox para habilitar/desabilitar protesto
- [ ] Implementar validações no frontend
- [ ] Mostrar mensagem informativa sobre protesto
- [ ] Testar criação de boleto com protesto
- [ ] Testar criação de boleto sem protesto

---

## 🔗 Endpoints Relacionados

| Método | Endpoint | Descrição | Protesto |
|--------|----------|-----------|----------|
| `POST` | `/api/Boleto` | Criar boleto manual | ✅ Suporta |
| `POST` | `/api/Boleto/gerar-lote` | Geração em lote | ❌ Não suporta |
| `GET` | `/api/Boleto/{id}` | Consultar boleto | Retorna campos |

---

## ⚠️ Observação Importante: Geração em Lote

A **geração em lote** de boletos (`POST /api/Boleto/gerar-lote`) **NÃO utiliza** os campos de protesto. 

Isso significa que:
- Boletos gerados em lote **nunca terão protesto configurado**
- Os campos `protestType` e `protestQuantityDays` são ignorados na geração em lote
- Apenas boletos criados **manualmente** pelo endpoint `POST /api/Boleto` podem ter protesto

### Por quê?

A geração em lote é um processo automatizado que gera boletos para múltiplos contratos de uma vez. A configuração de protesto é uma decisão que deve ser tomada caso a caso, por isso está disponível apenas na geração manual.

---

## 📞 Suporte

Em caso de dúvidas sobre a implementação, consulte a equipe de backend.

**Última atualização:** Janeiro/2026

