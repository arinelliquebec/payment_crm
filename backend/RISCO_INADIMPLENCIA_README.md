# Sistema de Análise de Risco de Inadimplência

## Visão Geral

Sistema de previsão de risco de inadimplência baseado em algoritmo de scoring que analisa o histórico de pagamentos dos clientes para identificar potenciais inadimplentes.

## Endpoints da API

### GET /api/AnaliseRisco/resumo
Retorna um resumo geral do risco de inadimplência da carteira.

**Resposta:**
```json
{
  "totalClientesAnalisados": 150,
  "clientesAltoRisco": 12,
  "clientesMedioRisco": 35,
  "clientesBaixoRisco": 103,
  "valorTotalEmRisco": 125000.00,
  "top5ClientesRisco": [...],
  "dataAnalise": "2025-11-27T10:30:00Z"
}
```

### GET /api/AnaliseRisco/clientes
Retorna lista completa de clientes ordenados por risco (maior primeiro).

### GET /api/AnaliseRisco/cliente/{clienteId}
Retorna análise detalhada de risco de um cliente específico, incluindo recomendações e histórico de boletos.

## Algoritmo de Scoring

O score de risco varia de 0 a 100 (quanto maior, maior o risco).

### Fatores Analisados:

1. **Taxa de Inadimplência Histórica (25 pontos)**
   - > 50% boletos atrasados: +25 pontos
   - > 30% boletos atrasados: +15 pontos
   - > 10% boletos atrasados: +8 pontos

2. **Dias de Atraso Atual (25 pontos)**
   - > 90 dias: +25 pontos (crítico)
   - > 60 dias: +20 pontos (grave)
   - > 30 dias: +15 pontos (moderado)
   - > 15 dias: +10 pontos (leve)
   - > 0 dias: +5 pontos (pequeno)

3. **Valor em Atraso (20 pontos)**
   - > R$ 50.000: +20 pontos
   - > R$ 20.000: +15 pontos
   - > R$ 5.000: +10 pontos
   - > R$ 0: +5 pontos

4. **Tempo desde Último Pagamento (15 pontos)**
   - > 180 dias: +15 pontos
   - > 90 dias: +10 pontos
   - > 60 dias: +5 pontos
   - Nenhum pagamento: +15 pontos

5. **Quantidade de Boletos em Atraso (15 pontos)**
   - >= 5 boletos: +15 pontos
   - >= 3 boletos: +10 pontos
   - >= 1 boleto: +5 pontos

### Classificação de Risco:

| Score | Nível | Cor |
|-------|-------|-----|
| >= 60 | Alto | 🔴 Vermelho |
| >= 30 | Médio | 🟡 Amarelo |
| < 30 | Baixo | 🟢 Verde |

## Integração no Frontend

### Dashboard
- Card "Risco Inadimplência" mostra quantidade de clientes em alto risco
- Clique no card abre modal com análise completa

### Modal de Análise
- Resumo com cards de risco (Alto, Médio, Baixo, Valor em Risco)
- Filtros por nível de risco
- Busca por nome ou documento
- Lista de clientes com score, valor em atraso e fatores de risco
- Detalhes expandíveis com histórico de boletos

## Arquivos Principais

### Backend
- `Services/InadimplenciaAnalysisService.cs` - Serviço de análise
- `Controllers/AnaliseRiscoController.cs` - Endpoints da API

### Frontend
- `components/RiscoInadimplenciaModal.tsx` - Modal de análise
- `hooks/useRiscoInadimplencia.ts` - Hook para dados de risco

## Recomendações Automáticas

O sistema gera recomendações baseadas no nível de risco:

**Alto Risco:**
- ⚠️ Entrar em contato urgente com o cliente
- 📞 Agendar reunião para renegociação
- ⚖️ Avaliar medidas jurídicas (se > 90 dias)

**Médio Risco:**
- 📧 Enviar lembrete de pagamento
- 📅 Agendar contato preventivo

**Baixo Risco:**
- ✅ Cliente em dia - manter acompanhamento regular
