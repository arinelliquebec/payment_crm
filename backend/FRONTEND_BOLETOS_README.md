# 🧾 Módulo de Boletos - Guia para Frontend

## 📋 Visão Geral

O módulo de boletos está implementado no backend com integração completa à API do Santander. Este guia contém todas as informações necessárias para implementar as interfaces no frontend.

## 🔗 Endpoints da API

### Base URL
```
https://localhost:7001/api/Boleto
```

---

## 📊 1. Dashboard Financeiro

### **GET** `/api/Boleto/dashboard`

**Resposta:**
```json
{
  "totalBoletos": 150,
  "boletosPendentes": 25,
  "boletosRegistrados": 80,
  "boletosLiquidados": 35,
  "boletosVencidos": 8,
  "boletosCancelados": 2,
  "valorTotalRegistrado": 45000.00,
  "valorTotalLiquidado": 18500.00,
  "boletosHoje": 5,
  "boletosEsteMes": 42
}
```

**Interface Sugerida:**
- Cards com estatísticas principais
- Gráficos de status dos boletos (pizza/donut)
- Indicadores de valores totais
- Métricas de performance do mês

---

## 📋 2. Listagem de Boletos

### **GET** `/api/Boleto`

**Resposta:**
```json
[
  {
    "id": 1,
    "contratoId": 5,
    "nsuCode": "123456",
    "nsuDate": "2024-01-15T00:00:00",
    "dueDate": "2024-02-15T00:00:00",
    "nominalValue": 1500.00,
    "status": "REGISTRADO",
    "payerName": "João Silva Santos",
    "payerDocumentNumber": "12345678901",
    "barCode": "34191234567890123456789012345678901234567890",
    "digitableLine": "34191.23456 78901.234567 89012.345678 9 12345678901234567890",
    "qrCodePix": "00020126580014...",
    "contrato": {
      "id": 5,
      "numeroContrato": "CONT-5",
      "clienteNome": "João Silva Santos",
      "clienteDocumento": "12345678901",
      "valorContrato": 5000.00
    },
    "dataCadastro": "2024-01-15T10:30:00",
    "dataAtualizacao": "2024-01-15T14:20:00"
  }
]
```

**Interface Sugerida:**
- Tabela com filtros por status, data, cliente
- Colunas: ID, Cliente, Valor, Vencimento, Status, Ações
- Paginação
- Botões de ação: Ver detalhes, Sincronizar, Cancelar

---

## 📄 3. Detalhes do Boleto

### **GET** `/api/Boleto/{id}`

**Resposta:** Mesmo formato da listagem, mas objeto único

**Interface Sugerida:**
- Modal ou página com todas as informações
- Seções: Dados do Boleto, Dados do Pagador, Dados do Contrato
- Botões para copiar código de barras e linha digitável
- QR Code PIX (se disponível)
- Histórico de status

---

## ➕ 4. Criar Novo Boleto

### **POST** `/api/Boleto`

**Payload Mínimo:**
```json
{
  "contratoId": 1,
  "dueDate": "2024-02-15",
  "nominalValue": 1500.00
}
```

**Payload Completo:**
```json
{
  "contratoId": 1,
  "dueDate": "2024-02-15",
  "nominalValue": 1500.00,
  "clientNumber": "CONT-1", // Opcional - se não informado, usa CONT-{contratoId}
  "finePercentage": 2.00,
  "fineQuantityDays": 1,
  "interestPercentage": 1.00,
  "deductionValue": 0.00,
  "writeOffQuantityDays": 30,
  "messages": [
    "Pagamento referente ao contrato de serviços",
    "Em caso de dúvidas, entre em contato"
  ],
  "pixKeyType": "EMAIL",
  "pixKey": "financeiro@arrighi.com.br",
  "discount": {
    "type": "VALOR_DATA_FIXA",
    "discountOne": {
      "value": 50.00,
      "limitDate": "2024-02-10"
    },
    "discountTwo": {
      "value": 25.00,
      "limitDate": "2024-02-13"
    }
  }
}
```

**Interface Sugerida:**
- Formulário em etapas/abas:
  1. **Dados Básicos**: Contrato, Valor, Vencimento
  2. **Configurações**: Multa, Juros, Abatimento
  3. **PIX** (opcional): Tipo de chave, Chave
  4. **Descontos** (opcional): Até 3 descontos progressivos
  5. **Mensagens** (opcional): Até 3 mensagens personalizadas

---

## 🔄 5. Sincronizar Boleto

### **PUT** `/api/Boleto/{id}/sincronizar`

**Uso:** Atualiza status do boleto consultando a API Santander

**Interface Sugerida:**
- Botão "Sincronizar" na listagem e detalhes
- Loading durante sincronização
- Toast/notificação com resultado

---

## ❌ 6. Cancelar Boleto

### **DELETE** `/api/Boleto/{id}`

**Uso:** Cancela boleto (apenas se não liquidado)

**Interface Sugerida:**
- Botão "Cancelar" com confirmação
- Desabilitado para boletos liquidados
- Modal de confirmação com aviso

---

## 📊 7. Boletos por Contrato

### **GET** `/api/Boleto/contrato/{contratoId}`

**Uso:** Lista boletos de um contrato específico

**Interface Sugerida:**
- Aba "Boletos" na tela de detalhes do contrato
- Botão "Gerar Novo Boleto" nesta tela

---

## 🎨 Status e Cores Sugeridas

```javascript
const statusColors = {
  'PENDENTE': '#FFA500',    // Laranja
  'REGISTRADO': '#0066CC',  // Azul
  'LIQUIDADO': '#28A745',   // Verde
  'VENCIDO': '#DC3545',     // Vermelho
  'CANCELADO': '#6C757D',   // Cinza
  'ERRO': '#E83E8C'         // Rosa/Magenta
}

const statusLabels = {
  'PENDENTE': 'Aguardando Registro',
  'REGISTRADO': 'Registrado',
  'LIQUIDADO': 'Pago',
  'VENCIDO': 'Vencido',
  'CANCELADO': 'Cancelado',
  'ERRO': 'Erro no Processamento'
}
```

---

## 🔧 Validações do Frontend

### Campos Obrigatórios:
- `contratoId` - Deve existir
- `dueDate` - Não pode ser no passado
- `nominalValue` - Maior que 0

### Validações Opcionais:
- `finePercentage`: 0-99.99%
- `interestPercentage`: 0-99.99%
- `fineQuantityDays`: 1-99 dias
- `writeOffQuantityDays`: 1-99 dias
- `messages`: Máximo 3 mensagens, 100 chars cada
- `pixKey`: Validar formato conforme tipo

### Tipos de Chave PIX:
- `EMAIL`: Validar formato email
- `CPF`: Validar CPF (11 dígitos)
- `CNPJ`: Validar CNPJ (14 dígitos)  
- `TELEFONE`: Formato +5511999999999
- `CHAVE_ALEATORIA`: Qualquer string

---

## 📱 Fluxo de Telas Sugerido

### 1. **Dashboard Principal**
- Cards com estatísticas
- Gráficos de status
- Botão "Ver Todos os Boletos"
- Botão "Gerar Novo Boleto"

### 2. **Listagem de Boletos**
- Filtros: Status, Data, Cliente, Valor
- Tabela paginada
- Ações: Ver, Sincronizar, Cancelar
- Botão "Novo Boleto"

### 3. **Detalhes do Boleto**
- Informações completas
- Código de barras copiável
- QR Code PIX (se houver)
- Botões de ação

### 4. **Formulário Novo Boleto**
- Wizard/Stepper com etapas
- Validação em tempo real
- Preview antes de criar
- Feedback de sucesso/erro

### 5. **Integração com Contratos**
- Aba "Boletos" na tela do contrato
- Botão "Gerar Boleto" direto do contrato
- Histórico de boletos do contrato

---

## 🚀 Funcionalidades Avançadas

### Exportação
- Botão para exportar PDF do boleto
- Exportar relatório de boletos (Excel/PDF)

### Notificações
- Toast para ações (criar, sincronizar, cancelar)
- Badges para novos boletos
- Alertas para boletos vencendo

### Filtros Avançados
- Por período de vencimento
- Por faixa de valor
- Por status múltiplos
- Por cliente/contrato

### Busca
- Por número do boleto (NSU)
- Por nome do cliente
- Por número do contrato
- Por código de barras

---

## 🎯 Componentes Reutilizáveis Sugeridos

### `<BoletoCard>`
- Card resumido para dashboard
- Props: boleto, onAction

### `<BoletoTable>`  
- Tabela com filtros e paginação
- Props: boletos, filters, onFilter

### `<BoletoForm>`
- Formulário completo de criação
- Props: contrato, onSubmit, onCancel

### `<BoletoDetails>`
- Modal/página de detalhes
- Props: boletoId, onClose

### `<StatusBadge>`
- Badge colorido por status
- Props: status

### `<BoletoActions>`
- Botões de ação (sincronizar, cancelar)
- Props: boleto, onAction

---

## 📚 Bibliotecas Recomendadas

- **QR Code**: `qrcode` ou `react-qr-code`
- **Datas**: `date-fns` ou `dayjs`
- **Formatação**: `react-number-format`
- **Validação**: `yup` ou `zod`
- **Formulários**: `react-hook-form`
- **Gráficos**: `recharts` ou `chart.js`

---

## 🔍 Exemplo de Uso Completo

```javascript
// Hook personalizado para boletos
const useBoletos = () => {
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBoletos = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/api/Boleto', { params: filters });
      setBoletos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar boletos');
    } finally {
      setLoading(false);
    }
  };

  const createBoleto = async (data) => {
    try {
      const response = await api.post('/api/Boleto', data);
      toast.success('Boleto criado com sucesso!');
      fetchBoletos(); // Recarregar lista
      return response.data;
    } catch (error) {
      toast.error('Erro ao criar boleto');
      throw error;
    }
  };

  const syncBoleto = async (id) => {
    try {
      await api.put(`/api/Boleto/${id}/sincronizar`);
      toast.success('Boleto sincronizado!');
      fetchBoletos(); // Recarregar lista
    } catch (error) {
      toast.error('Erro ao sincronizar boleto');
    }
  };

  return { boletos, loading, fetchBoletos, createBoleto, syncBoleto };
};
```

---

## 🎉 Resultado Final

Com esta implementação, o frontend terá:
- ✅ Dashboard financeiro completo
- ✅ Gestão completa de boletos
- ✅ Integração com contratos
- ✅ Interface intuitiva e responsiva
- ✅ Validações robustas
- ✅ Feedback visual adequado
- ✅ Componentes reutilizáveis

**O módulo financeiro estará completamente funcional para os usuários!** 🚀

---

*Desenvolvido para CRM Arrighi - Módulo Financeiro v1.0*
