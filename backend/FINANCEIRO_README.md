# Módulo Financeiro - Sistema de Boletos

## Visão Geral

O módulo financeiro foi desenvolvido para integração com a API de Cobrança do Santander, permitindo:

- ✅ Geração automática de boletos a partir de contratos
- ✅ Integração completa com API Santander (Produção)
- ✅ Suporte a PIX integrado aos boletos
- ✅ Sistema de descontos progressivos
- ✅ Dashboard com estatísticas financeiras
- ✅ Controle de status dos boletos
- ✅ Sincronização automática com banco

## Funcionalidades

### 1. Geração de Boletos
- Criação automática baseada em contratos existentes
- Geração de NSU Code único por dia
- Nosso Número automático
- Dados do pagador extraídos automaticamente do cliente

### 2. Integração Santander
- **Ambiente**: Produção (`https://trust-open.api.santander.com.br`)
- **Registro**: POST para criação de boletos
- **Consulta**: GET para sincronização de status
- **Cancelamento**: PATCH para baixa de boletos

### 3. Recursos Avançados
- **PIX Integrado**: Suporte a chaves PIX (Email, CPF, CNPJ, Telefone)
- **Descontos**: Até 3 níveis de desconto com datas limite
- **Multa e Juros**: Configuração flexível de penalidades
- **Mensagens**: Até 3 mensagens personalizadas por boleto

## Configuração

### 1. Configurar API Santander

Adicione ao `appsettings.json`:

```json
{
  "SantanderAPI": {
    "BaseUrl": "https://trust-open.api.santander.com.br",
    "WorkspaceId": "SEU_WORKSPACE_ID",
    "CovenantCode": "SEU_CODIGO_CONVENIO", 
    "AccessToken": "SEU_ACCESS_TOKEN"
  }
}
```

### 2. Executar Migrations

```bash
dotnet ef database update
```

## Endpoints da API

### Boletos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/Boleto` | Listar todos os boletos |
| `GET` | `/api/Boleto/{id}` | Buscar boleto por ID |
| `GET` | `/api/Boleto/contrato/{contratoId}` | Boletos de um contrato |
| `POST` | `/api/Boleto` | Criar novo boleto |
| `PUT` | `/api/Boleto/{id}/sincronizar` | Sincronizar com Santander |
| `DELETE` | `/api/Boleto/{id}` | Cancelar boleto |
| `GET` | `/api/Boleto/dashboard` | Dashboard financeiro |

## Exemplos de Uso

### 1. Criar Boleto Simples

```json
{
  "contratoId": 1,
  "dueDate": "2024-02-15",
  "nominalValue": 1500.00
}
```

### 2. Boleto com PIX e Descontos

```json
{
  "contratoId": 1,
  "dueDate": "2024-02-15",
  "nominalValue": 1500.00,
  "finePercentage": 2.00,
  "interestPercentage": 1.00,
  "pixKeyType": "EMAIL",
  "pixKey": "financeiro@empresa.com.br",
  "discount": {
    "type": "VALOR_DATA_FIXA",
    "discountOne": {
      "value": 50.00,
      "limitDate": "2024-02-10"
    }
  },
  "messages": [
    "Pagamento referente ao contrato de serviços"
  ]
}
```

## Status dos Boletos

- **PENDENTE**: Criado localmente, aguardando registro na API
- **REGISTRADO**: Registrado com sucesso na API Santander
- **LIQUIDADO**: Boleto pago pelo cliente
- **VENCIDO**: Boleto venceu sem pagamento
- **CANCELADO**: Boleto cancelado/baixado
- **ERRO**: Erro no processamento

## Dashboard

O dashboard fornece:

- Total de boletos por status
- Valores totais registrados e liquidados
- Estatísticas do dia e mês atual
- Métricas de performance

## Modelo de Dados

### Tabela: Boletos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `Id` | int | ID único |
| `ContratoId` | int | Referência ao contrato |
| `NsuCode` | string | Código NSU único |
| `NsuDate` | DateTime | Data do NSU |
| `BankNumber` | string | Nosso número |
| `DueDate` | DateTime | Data de vencimento |
| `NominalValue` | decimal | Valor do boleto |
| `Status` | string | Status atual |
| `BarCode` | string | Código de barras |
| `DigitableLine` | string | Linha digitável |
| `QrCodePix` | string | QR Code PIX |

## Testes

Use o arquivo `Boletos.http` para testar todos os endpoints:

- Criação de boletos
- Sincronização
- Dashboard
- Cenários de erro
- Validações

## Logs

O sistema gera logs detalhados:

- Criação de boletos
- Chamadas para API Santander
- Erros de integração
- Sincronizações

## Segurança

- ✅ Validação de dados de entrada
- ✅ Tratamento de erros da API
- ✅ Logs de auditoria
- ✅ Controle de acesso por contrato

## Próximos Passos

1. Configurar credenciais do Santander
2. Testar em ambiente de homologação
3. Implementar webhook para status de pagamento
4. Adicionar relatórios financeiros
5. Integrar com sistema de notificações

## Suporte

Para dúvidas sobre a integração com Santander, consulte:
- Documentação oficial da API Santander
- Manual de integração Hub de Cobrança
- Suporte técnico Santander

---

**Desenvolvido para CRM Arrighi** 🚀
