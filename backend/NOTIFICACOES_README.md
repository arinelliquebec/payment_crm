# Sistema de Notificações - Implementação Completa

## 📋 Resumo

Sistema de notificações em tempo real para eventos importantes do CRM, com foco inicial em **notificações de boletos pagos**.

## 🎯 Funcionalidades

### Backend

1. **Modelo de Notificação** (`Models/Notificacao.cs`)
   - Tipo, título, mensagem
   - Relacionamentos: Usuário, Boleto, Contrato, Cliente
   - Status de leitura (lida/não lida)
   - Prioridade (Baixa, Normal, Alta, Urgente)
   - Link para redirecionamento

2. **Serviço de Notificações** (`Services/NotificacaoService.cs`)
   - `CriarNotificacaoAsync()` - Cria notificação genérica
   - `NotificarBoletoPagoAsync()` - Notifica quando boleto é pago
   - `NotificarBoletoVencidoAsync()` - Notifica quando boleto vence
   - `NotificarAdministradoresAsync()` - Envia para todos os admins
   - `GetNotificacoesUsuarioAsync()` - Busca notificações do usuário
   - `MarcarComoLidaAsync()` - Marca notificação como lida
   - `MarcarTodasComoLidasAsync()` - Marca todas como lidas

3. **Controller** (`Controllers/NotificacaoController.cs`)
   - `GET /api/Notificacao` - Lista notificações do usuário
   - `GET /api/Notificacao/count` - Conta não lidas
   - `PUT /api/Notificacao/{id}/marcar-lida` - Marca como lida
   - `PUT /api/Notificacao/marcar-todas-lidas` - Marca todas

4. **Integração com BoletoController**
   - Detecta mudança de status para LIQUIDADO ou BAIXADO (pago)
   - Envia notificação automaticamente quando boleto é pago
   - Notifica administradores e consultor responsável

### Frontend

1. **Hook** (`hooks/useNotificacoes.ts`)
   - Gerencia estado das notificações
   - Auto-refresh a cada 30 segundos
   - Funções para marcar como lida

## 🗄️ Banco de Dados

### Tabela: Notificacoes

```sql
CREATE TABLE Notificacoes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Tipo NVARCHAR(50) NOT NULL,
    Titulo NVARCHAR(200) NOT NULL,
    Mensagem NVARCHAR(MAX) NOT NULL,
    UsuarioId INT NULL,
    BoletoId INT NULL,
    ContratoId INT NULL,
    ClienteId INT NULL,
    Lida BIT NOT NULL DEFAULT 0,
    DataLeitura DATETIME2 NULL,
    DataCriacao DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    DadosAdicionais NVARCHAR(MAX) NULL,
    Prioridade NVARCHAR(20) NOT NULL DEFAULT 'Normal',
    Link NVARCHAR(500) NULL,

    -- Foreign Keys
    CONSTRAINT FK_Notificacoes_Usuarios FOREIGN KEY (UsuarioId)
        REFERENCES Usuarios(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Notificacoes_Boletos FOREIGN KEY (BoletoId)
        REFERENCES Boletos(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Notificacoes_Contratos FOREIGN KEY (ContratoId)
        REFERENCES Contratos(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Notificacoes_Clientes FOREIGN KEY (ClienteId)
        REFERENCES Clientes(Id) ON DELETE NO ACTION
);
```

### Índices para Performance

```sql
CREATE INDEX IX_Notificacoes_UsuarioId ON Notificacoes(UsuarioId);
CREATE INDEX IX_Notificacoes_DataCriacao ON Notificacoes(DataCriacao DESC);
CREATE INDEX IX_Notificacoes_Lida ON Notificacoes(Lida);
CREATE INDEX IX_Notificacoes_UsuarioId_Lida_DataCriacao
    ON Notificacoes(UsuarioId, Lida, DataCriacao DESC);
```

## 🚀 Como Aplicar a Migration

### Opção 1: Entity Framework (Recomendado)

```bash
cd backend
dotnet ef database update --context CrmArrighiContext
```

### Opção 2: SQL Manual

Se houver problemas com migrations pendentes, execute o script SQL diretamente:

```bash
# No SQL Server Management Studio ou Azure Data Studio
# Execute o arquivo: backend/migration_notificacoes.sql
```

## 📝 Tipos de Notificações

### Implementados

- **BoletoPago** - Quando um boleto é liquidado
  - Prioridade: Alta
  - Destinatários: Administradores + Consultor responsável
  - Mensagem: "Boleto de {cliente} no valor de R$ {valor} foi pago."

- **BoletoVencido** - Quando um boleto vence
  - Prioridade: Alta (ou Urgente se > 30 dias)
  - Destinatários: Administradores + Consultor responsável
  - Mensagem: "Boleto de {cliente} está vencido há {dias} dia(s)."

### Futuros (Sugestões)

- **ContratoAssinado** - Quando contrato é assinado
- **ClienteNovo** - Quando novo cliente é cadastrado
- **BoletoRegistrado** - Quando boleto é registrado com sucesso
- **BoletoErro** - Quando há erro no registro de boleto
- **PagamentoRecebido** - Confirmação de pagamento
- **MetaMensal** - Quando meta mensal é atingida

## 🔧 Configuração

### Program.cs

```csharp
// Registrar serviço de notificações
builder.Services.AddScoped<INotificacaoService, NotificacaoService>();
```

### BoletoController.cs

```csharp
// Injetar serviço no construtor
private readonly INotificacaoService _notificacaoService;

public BoletoController(..., INotificacaoService notificacaoService)
{
    _notificacaoService = notificacaoService;
}

// Chamar quando boleto é pago
await _notificacaoService.NotificarBoletoPagoAsync(boleto);
```

## 🎨 Interface do Usuário (Próximos Passos)

### Componentes a Criar

1. **NotificationBell** - Ícone de sino com badge de contagem
2. **NotificationDropdown** - Lista de notificações recentes
3. **NotificationCenter** - Página completa de notificações
4. **NotificationToast** - Toast/Snackbar para novas notificações

### Integração no Layout

```tsx
// No header/navbar
<NotificationBell
  count={countNaoLidas}
  notifications={notificacoes}
  onMarkAsRead={marcarComoLida}
  onMarkAllAsRead={marcarTodasComoLidas}
/>
```

## 📊 Fluxo de Notificação de Boleto Pago

```
1. Sincronização de Boleto (BoletoController)
   ↓
2. Detecta mudança de status para LIQUIDADO/BAIXADO
   ↓
3. Chama NotificacaoService.NotificarBoletoPagoAsync()
   ↓
4. Busca informações do boleto, contrato, cliente, consultor
   ↓
5. Cria notificações para:
   - Todos os administradores
   - Consultor responsável (se houver)
   ↓
6. Salva no banco de dados
   ↓
7. Frontend busca notificações a cada 30s
   ↓
8. Exibe badge/toast para usuário
```

## 🔍 Queries Úteis

### Buscar notificações não lidas de um usuário

```sql
SELECT * FROM Notificacoes
WHERE (UsuarioId = @usuarioId OR UsuarioId IS NULL)
  AND Lida = 0
ORDER BY DataCriacao DESC;
```

### Contar notificações não lidas

```sql
SELECT COUNT(*) FROM Notificacoes
WHERE (UsuarioId = @usuarioId OR UsuarioId IS NULL)
  AND Lida = 0;
```

### Buscar notificações de boletos pagos hoje

```sql
SELECT * FROM Notificacoes
WHERE Tipo = 'BoletoPago'
  AND CAST(DataCriacao AS DATE) = CAST(GETUTCDATE() AS DATE)
ORDER BY DataCriacao DESC;
```

## ✅ Status da Implementação

- [x] Modelo de dados (Notificacao.cs)
- [x] Serviço de notificações (NotificacaoService.cs)
- [x] Controller de API (NotificacaoController.cs)
- [x] Migration do Entity Framework
- [x] Script SQL manual
- [x] Integração com BoletoController
- [x] Hook React (useNotificacoes.ts)
- [x] Registro no Program.cs
- [ ] Componente NotificationBell (UI)
- [ ] Componente NotificationDropdown (UI)
- [ ] Componente NotificationToast (UI)
- [ ] Página NotificationCenter (UI)
- [ ] Testes unitários
- [ ] Documentação de API

## 🎯 Próximos Passos

1. **Aplicar a migration** ao banco de dados
2. **Criar componentes de UI** para exibir notificações
3. **Adicionar WebSocket/SignalR** para notificações em tempo real (opcional)
4. **Implementar notificações push** no navegador (opcional)
5. **Adicionar mais tipos de notificações** (contratos, clientes, etc.)
6. **Criar painel de configurações** para usuário escolher quais notificações receber

## 📚 Referências

- Entity Framework Core Migrations: https://learn.microsoft.com/ef/core/managing-schemas/migrations/
- ASP.NET Core Dependency Injection: https://learn.microsoft.com/aspnet/core/fundamentals/dependency-injection
- React Hooks: https://react.dev/reference/react
