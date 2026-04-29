# Sistema de Previsão de Receita (Forecast)

## Visão Geral

Sistema de previsão de receita que analisa contratos, boletos e histórico de pagamentos para projetar receitas futuras e auxiliar no planejamento financeiro.

## Endpoints da API

### GET /api/Forecast/resumo
Retorna resumo geral do forecast.

**Resposta:**
```json
{
  "receitaEsperadaMesAtual": 125000.00,
  "receitaEsperadaProximoMes": 98000.00,
  "receitaEsperadaTrimestre": 350000.00,
  "receitaPipelineEstimada": 85000.00,
  "mediaReceitaMensal": 110000.00,
  "taxaConversaoHistorica": 45.5,
  "totalBoletosAVencer": 42,
  "totalContratosEmNegociacao": 15,
  "dataAnalise": "2025-11-27T10:30:00Z"
}
```

### GET /api/Forecast/mensal?meses=12
Retorna projeção mensal para os próximos N meses.

**Parâmetros:**
- `meses` (opcional): Número de meses para projetar (padrão: 12)

**Resposta:**
```json
[
  {
    "mes": 11,
    "ano": 2025,
    "nomeMes": "novembro",
    "receitaConfirmada": 125000.00,
    "receitaProjetada": 125000.00,
    "quantidadeBoletos": 35,
    "tendencia": 12.5,
    "confiabilidade": "Alta"
  }
]
```

### GET /api/Forecast/pipeline
Retorna análise do pipeline de vendas.

**Resposta:**
```json
{
  "etapas": [
    {
      "etapa": "Lead",
      "quantidade": 50,
      "valorTotal": 500000.00,
      "valorPonderado": 50000.00,
      "probabilidade": 10,
      "cor": "#94a3b8"
    },
    {
      "etapa": "Prospecto",
      "quantidade": 30,
      "valorTotal": 300000.00,
      "valorPonderado": 90000.00,
      "probabilidade": 30,
      "cor": "#f59e0b"
    }
  ],
  "valorTotalPipeline": 1200000.00,
  "valorPonderadoTotal": 450000.00,
  "totalContratos": 150
}
```

### GET /api/Forecast/boletos-a-vencer?dias=90
Retorna lista de boletos a vencer nos próximos N dias.

**Parâmetros:**
- `dias` (opcional): Número de dias para buscar (padrão: 90)

## Algoritmo de Cálculo

### Receita Esperada
- **Mês Atual**: Soma dos boletos com status REGISTRADO/ATIVO/PENDENTE com vencimento no mês atual
- **Próximo Mês**: Soma dos boletos com vencimento no próximo mês
- **Trimestre**: Soma dos boletos com vencimento nos próximos 3 meses

### Pipeline Estimado
Valor ponderado baseado na probabilidade de conversão de cada etapa:
- Lead: 10%
- Prospecto: 30%
- Contrato Enviado: 70%
- Contrato Assinado: 100%
- Retornar: 20%

### Projeção Mensal
- **Receita Confirmada**: Boletos já registrados para o mês
- **Receita Projetada**: Baseada em histórico quando não há boletos confirmados
- **Tendência**: Comparação com mesmo mês do ano anterior
- **Confiabilidade**: Alta (boletos confirmados), Média (próximos 3 meses), Baixa (além de 3 meses)

## Integração no Frontend

### Dashboard
- Card "Previsão de Receita" mostra receita esperada do mês atual
- Clique no card abre modal com análise completa

### Modal de Forecast
- **Aba Resumo**: Cards com métricas principais e lista de boletos próximos
- **Aba Projeção Mensal**: Gráfico de barras e tabela detalhada
- **Aba Pipeline**: Funil de vendas com valores ponderados

## Arquivos Principais

### Backend
- `Services/ForecastService.cs` - Serviço de cálculo de forecast
- `Controllers/ForecastController.cs` - Endpoints da API

### Frontend
- `components/ForecastModal.tsx` - Modal de análise
- `hooks/useForecast.ts` - Hooks para dados de forecast

## Métricas Calculadas

| Métrica | Descrição |
|---------|-----------|
| Receita Esperada | Soma de boletos a vencer |
| Pipeline Estimado | Valor ponderado de contratos em negociação |
| Média Mensal | Média de receita dos últimos 3 meses |
| Taxa de Conversão | % de contratos fechados vs total |
| Tendência | Variação vs mesmo período ano anterior |
