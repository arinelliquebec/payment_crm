# 🎨 Guia Frontend - Consulta de Status de Boletos

## 📋 Visão Geral para Desenvolvedores Frontend

Este guia mostra como integrar as novas APIs de consulta de status de boletos no frontend.

---

## 🚀 Quick Start

### Cenário 1: Mostrar Status de um Boleto na Listagem

```typescript
// services/boletoService.ts
export async function consultarStatusBoleto(boletoId: number): Promise<BoletoStatus> {
  const response = await fetch(`${API_BASE_URL}/api/Boleto/${boletoId}/status`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'X-Usuario-Id': getUserId(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao consultar status do boleto');
  }

  return await response.json();
}

// Uso no componente
const status = await consultarStatusBoleto(123);
console.log(status.status); // "ATIVO", "LIQUIDADO", "BAIXADO", etc.
console.log(status.statusDescription); // "Boleto em aberto (vencido ou a vencer)"
```

### Cenário 2: Verificar se Boleto Foi Pago

```typescript
// components/BoletoCard.tsx
import { consultarStatusBoleto } from '@/services/boletoService';

function BoletoCard({ boleto }) {
  const [status, setStatus] = useState<BoletoStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const verificarPagamento = async () => {
    setLoading(true);
    try {
      const statusAtual = await consultarStatusBoleto(boleto.id);
      setStatus(statusAtual);
      
      const statusPagos = ['LIQUIDADO', 'LIQUIDADO PARCIALMENTE', 'BAIXADO'];
      if (statusPagos.includes(statusAtual.status)) {
        toast.success('Boleto pago!');
      }
    } catch (error) {
      toast.error('Erro ao verificar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="boleto-card">
      <h3>Boleto #{boleto.id}</h3>
      <p>Valor: R$ {boleto.valor}</p>
      
      {status && (
        <div className={`status ${status.status.toLowerCase()}`}>
          <span className="status-badge">{status.status}</span>
          <p>{status.statusDescription}</p>
          
          {status.status === 'LIQUIDADO' && (
            <p>Pago em: {formatDate(status.settlementDate)}</p>
          )}
        </div>
      )}
      
      <button onClick={verificarPagamento} disabled={loading}>
        {loading ? 'Verificando...' : 'Verificar Pagamento'}
      </button>
    </div>
  );
}
```

---

## 📊 Componente: Badge de Status

```tsx
// components/StatusBadge.tsx
interface StatusBadgeProps {
  status: string;
  statusDescription?: string;
}

export function StatusBadge({ status, statusDescription }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIQUIDADO':
        return 'bg-green-100 text-green-800';
      case 'BAIXADO':
        return 'bg-blue-100 text-blue-800';
      case 'ATIVO':
        return 'bg-yellow-100 text-yellow-800';
      case 'LIQUIDADO PARCIALMENTE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIQUIDADO':
        return '✅';
      case 'BAIXADO':
        return '💰';
      case 'ATIVO':
        return '⏳';
      case 'LIQUIDADO PARCIALMENTE':
        return '⚡';
      default:
        return '📄';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span 
        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
        title={statusDescription}
      >
        {getStatusIcon(status)} {status}
      </span>
      
      {statusDescription && (
        <span className="text-xs text-gray-500">
          {statusDescription}
        </span>
      )}
    </div>
  );
}

// Uso
<StatusBadge status={boleto.status} statusDescription={boleto.statusDescription} />
```

---

## 🔄 Hook React: useStatusBoleto

```typescript
// hooks/useStatusBoleto.ts
import { useState, useEffect } from 'react';

interface BoletoStatus {
  status: string;
  statusDescription: string;
  settlementDate?: string;
  paidValue?: number;
  nominalValue?: number;
  // ... outros campos
}

export function useStatusBoleto(boletoId: number, autoRefresh = false) {
  const [status, setStatus] = useState<BoletoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/Boleto/${boletoId}/status`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'X-Usuario-Id': getUserId(),
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh a cada 30 segundos se habilitado
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [boletoId, autoRefresh]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isPago: status?.status && ['LIQUIDADO', 'BAIXADO', 'LIQUIDADO PARCIALMENTE'].includes(status.status)
  };
}

// Uso no componente
function BoletoDetails({ boletoId }) {
  const { status, loading, error, refetch, isPago } = useStatusBoleto(boletoId, true);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  if (!status) return null;

  return (
    <div>
      <StatusBadge status={status.status} statusDescription={status.statusDescription} />
      
      {isPago && (
        <div className="success-box">
          ✅ Boleto pago!
          <p>Valor pago: R$ {status.paidValue?.toFixed(2)}</p>
          <p>Data: {formatDate(status.settlementDate)}</p>
        </div>
      )}
      
      <button onClick={refetch}>Atualizar Status</button>
    </div>
  );
}
```

---

## 📱 Componente Completo: Modal de Detalhes

```tsx
// components/BoletoStatusModal.tsx
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface BoletoStatusModalProps {
  boletoId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BoletoStatusModal({ boletoId, isOpen, onClose }: BoletoStatusModalProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState('default');

  const consultarStatus = async (tipo: string) => {
    setLoading(true);
    try {
      // Primeiro, buscar os dados do boleto
      const boletoResponse = await fetch(`${API_BASE_URL}/api/Boleto/${boletoId}`);
      const boleto = await boletoResponse.json();
      
      // Montar billId no formato: beneficiaryCode.bankNumber
      const billId = `${boleto.covenantCode}.${boleto.bankNumber}`;
      
      // Consultar status por tipo
      const response = await fetch(
        `${API_BASE_URL}/api/Boleto/status/por-tipo/${billId}?tipoConsulta=${tipo}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'X-Usuario-Id': getUserId(),
          }
        }
      );
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Erro ao consultar status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      consultarStatus(tipoConsulta);
    }
  }, [isOpen, boletoId, tipoConsulta]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="max-w-3xl w-full bg-white rounded-lg shadow-xl">
          <Dialog.Title className="text-lg font-bold p-4 border-b">
            Detalhes do Boleto #{boletoId}
          </Dialog.Title>

          {/* Tabs para diferentes tipos de consulta */}
          <div className="flex gap-2 p-4 border-b">
            {['default', 'duplicate', 'bankslip', 'settlement', 'registry'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoConsulta(tipo)}
                className={`px-3 py-1 rounded ${
                  tipoConsulta === tipo 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : status ? (
              <div className="space-y-4">
                {/* Status Atual */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Status Atual</h3>
                  <StatusBadge 
                    status={status.status} 
                    statusDescription={status.statusDescription} 
                  />
                </div>

                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard label="Valor Nominal" value={`R$ ${status.nominalValue?.toFixed(2)}`} />
                  <InfoCard label="Data de Vencimento" value={formatDate(status.dueDate)} />
                  <InfoCard label="Data de Emissão" value={formatDate(status.issueDate)} />
                  <InfoCard label="Nosso Número" value={status.bankNumber} />
                </div>

                {/* Informações de Pagamento (se pago) */}
                {status.paidValue && (
                  <div className="bg-green-50 p-4 rounded">
                    <h3 className="font-semibold mb-2 text-green-800">
                      ✅ Informações de Pagamento
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoCard label="Valor Pago" value={`R$ ${status.paidValue?.toFixed(2)}`} />
                      <InfoCard label="Data de Liquidação" value={formatDate(status.settlementDate)} />
                      {status.discountValue && (
                        <InfoCard label="Desconto" value={`R$ ${status.discountValue?.toFixed(2)}`} />
                      )}
                      {status.fineValue && (
                        <InfoCard label="Multa" value={`R$ ${status.fineValue?.toFixed(2)}`} />
                      )}
                    </div>
                  </div>
                )}

                {/* Liquidações (settlement) */}
                {status.settlements && status.settlements.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-semibold mb-2 text-blue-800">
                      📊 Histórico de Liquidações
                    </h3>
                    {status.settlements.map((settlement, index) => (
                      <div key={index} className="bg-white p-3 rounded mb-2">
                        <p><strong>Tipo:</strong> {settlement.settlementType}</p>
                        <p><strong>Data:</strong> {formatDate(settlement.settlementDate)}</p>
                        <p><strong>Valor:</strong> R$ {settlement.settlementValue?.toFixed(2)}</p>
                        <p><strong>Origem:</strong> {settlement.settlementOrigin}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Informações de Cartório (registry) */}
                {status.registryInfo && (
                  <div className="bg-red-50 p-4 rounded">
                    <h3 className="font-semibold mb-2 text-red-800">
                      ⚠️ Informações de Cartório
                    </h3>
                    <div className="bg-white p-3 rounded">
                      <p><strong>Data de Registro:</strong> {formatDate(status.registryInfo.registryDate)}</p>
                      <p><strong>Número:</strong> {status.registryInfo.registryNumber}</p>
                      <p><strong>Cartório:</strong> {status.registryInfo.notaryOffice}</p>
                      <p><strong>Custo:</strong> R$ {status.registryInfo.registryCost?.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Dados do Pagador */}
                {status.payer && (
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">Dados do Pagador</h3>
                    <p><strong>Nome:</strong> {status.payer.name}</p>
                    <p><strong>Documento:</strong> {status.payer.documentNumber}</p>
                    <p><strong>Endereço:</strong> {status.payer.address}, {status.payer.neighborhood}</p>
                    <p><strong>Cidade:</strong> {status.payer.city}/{status.payer.state}</p>
                  </div>
                )}

                {/* PIX */}
                {status.qrCodePix && (
                  <div className="bg-purple-50 p-4 rounded">
                    <h3 className="font-semibold mb-2 text-purple-800">💳 PIX</h3>
                    <button 
                      onClick={() => copiarPixCopiaECola(status.qrCodePix)}
                      className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Copiar Código PIX
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhum dado disponível
              </p>
            )}
          </div>

          <div className="p-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Componente auxiliar
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function copiarPixCopiaECola(pixCode: string) {
  navigator.clipboard.writeText(pixCode);
  toast.success('Código PIX copiado!');
}
```

---

## 🔔 Notificações de Mudança de Status

```typescript
// services/statusMonitor.ts

class BoletoStatusMonitor {
  private intervals: Map<number, NodeJS.Timeout> = new Map();
  private callbacks: Map<number, (status: any) => void> = new Map();

  /**
   * Monitora mudanças de status de um boleto
   * @param boletoId - ID do boleto
   * @param callback - Função chamada quando status mudar
   * @param intervalSeconds - Intervalo de verificação em segundos (padrão: 30)
   */
  monitorar(boletoId: number, callback: (status: any) => void, intervalSeconds = 30) {
    let ultimoStatus: string | null = null;

    const verificar = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Boleto/${boletoId}/status`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'X-Usuario-Id': getUserId(),
          }
        });

        if (response.ok) {
          const status = await response.json();
          
          // Se o status mudou, chamar callback
          if (ultimoStatus && ultimoStatus !== status.status) {
            callback(status);
            
            // Mostrar notificação
            if (status.status === 'LIQUIDADO' || status.status === 'BAIXADO') {
              mostrarNotificacao('Boleto Pago!', `Boleto #${boletoId} foi pago.`);
            }
          }
          
          ultimoStatus = status.status;
        }
      } catch (error) {
        console.error('Erro ao monitorar status:', error);
      }
    };

    // Verificar imediatamente
    verificar();

    // Agendar verificações periódicas
    const interval = setInterval(verificar, intervalSeconds * 1000);
    this.intervals.set(boletoId, interval);
    this.callbacks.set(boletoId, callback);
  }

  /**
   * Para de monitorar um boleto
   */
  pararMonitoramento(boletoId: number) {
    const interval = this.intervals.get(boletoId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(boletoId);
      this.callbacks.delete(boletoId);
    }
  }

  /**
   * Para todos os monitoramentos
   */
  pararTodos() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.callbacks.clear();
  }
}

export const statusMonitor = new BoletoStatusMonitor();

// Uso
import { statusMonitor } from '@/services/statusMonitor';

function BoletoPage({ boletoId }) {
  useEffect(() => {
    // Começar a monitorar
    statusMonitor.monitorar(boletoId, (novoStatus) => {
      console.log('Status mudou!', novoStatus);
      // Atualizar estado, mostrar toast, etc.
    }, 30); // Verifica a cada 30 segundos

    // Parar ao desmontar componente
    return () => {
      statusMonitor.pararMonitoramento(boletoId);
    };
  }, [boletoId]);

  // ...
}
```

---

## 📱 Notificações Push

```typescript
// services/notificationService.ts

function mostrarNotificacao(titulo: string, mensagem: string) {
  // Verificar se o navegador suporta notificações
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return;
  }

  // Solicitar permissão se necessário
  if (Notification.permission === 'granted') {
    new Notification(titulo, {
      body: mensagem,
      icon: '/logo.png',
      badge: '/badge.png'
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(titulo, {
          body: mensagem,
          icon: '/logo.png'
        });
      }
    });
  }
}
```

---

## 🎯 Casos de Uso Práticos

### 1. Dashboard Financeiro

```tsx
function DashboardFinanceiro() {
  const [boletosAtivos, setBoletosAtivos] = useState([]);
  const [boletosLiquidados, setBoletosLiquidados] = useState([]);

  useEffect(() => {
    // Buscar todos os boletos
    fetch(`${API_BASE_URL}/api/Boleto`)
      .then(res => res.json())
      .then(boletos => {
        // Para cada boleto, consultar status
        Promise.all(
          boletos.map(b => 
            fetch(`${API_BASE_URL}/api/Boleto/${b.id}/status`)
              .then(res => res.json())
              .then(status => ({ ...b, statusDetalhado: status }))
          )
        ).then(boletosComStatus => {
          setBoletosAtivos(boletosComStatus.filter(b => b.statusDetalhado.status === 'ATIVO'));
          setBoletosLiquidados(boletosComStatus.filter(b => 
            ['LIQUIDADO', 'BAIXADO'].includes(b.statusDetalhado.status)
          ));
        });
      });
  }, []);

  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>Boletos Ativos</h3>
        <p className="text-3xl">{boletosAtivos.length}</p>
        <p className="text-gray-500">
          Total: R$ {boletosAtivos.reduce((acc, b) => acc + b.nominalValue, 0).toFixed(2)}
        </p>
      </div>

      <div className="stat-card">
        <h3>Boletos Liquidados</h3>
        <p className="text-3xl">{boletosLiquidados.length}</p>
        <p className="text-gray-500">
          Total: R$ {boletosLiquidados.reduce((acc, b) => acc + (b.statusDetalhado.paidValue || 0), 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
```

### 2. Botão "Verificar Pagamento" na Listagem

```tsx
function TabelaBoletos({ boletos }) {
  const [statusMap, setStatusMap] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const verificarStatus = async (boletoId: number) => {
    setLoading(prev => ({ ...prev, [boletoId]: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/Boleto/${boletoId}/status`);
      const status = await response.json();
      
      setStatusMap(prev => ({ ...prev, [boletoId]: status }));
      
      if (['LIQUIDADO', 'BAIXADO'].includes(status.status)) {
        toast.success(`Boleto #${boletoId} foi pago!`);
      }
    } catch (error) {
      toast.error('Erro ao verificar status');
    } finally {
      setLoading(prev => ({ ...prev, [boletoId]: false }));
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Valor</th>
          <th>Vencimento</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {boletos.map(boleto => (
          <tr key={boleto.id}>
            <td>{boleto.id}</td>
            <td>{boleto.clienteNome}</td>
            <td>R$ {boleto.nominalValue?.toFixed(2)}</td>
            <td>{formatDate(boleto.dueDate)}</td>
            <td>
              {statusMap[boleto.id] ? (
                <StatusBadge 
                  status={statusMap[boleto.id].status} 
                  statusDescription={statusMap[boleto.id].statusDescription}
                />
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </td>
            <td>
              <button
                onClick={() => verificarStatus(boleto.id)}
                disabled={loading[boleto.id]}
                className="btn-sm btn-primary"
              >
                {loading[boleto.id] ? 'Verificando...' : '🔄 Verificar'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 💡 Dicas e Boas Práticas

### 1. Cache de Status
```typescript
// Evitar consultas desnecessárias
const statusCache = new Map<number, { status: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

async function consultarStatusComCache(boletoId: number) {
  const cached = statusCache.get(boletoId);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.status;
  }
  
  const status = await consultarStatusBoleto(boletoId);
  statusCache.set(boletoId, { status, timestamp: Date.now() });
  
  return status;
}
```

### 2. Debounce para Verificações
```typescript
import { debounce } from 'lodash';

const verificarStatusDebounced = debounce(async (boletoId: number) => {
  const status = await consultarStatusBoleto(boletoId);
  // Atualizar estado
}, 1000);
```

### 3. Loading States
```typescript
// Sempre mostrar feedback visual
{loading && <Spinner />}
{error && <ErrorMessage message={error} />}
{!loading && !error && status && <StatusDisplay status={status} />}
```

---

## 📚 Tipos TypeScript

```typescript
// types/boleto.ts

export interface BoletoStatus {
  beneficiaryCode?: string;
  bankNumber?: string;
  clientNumber?: string;
  nsuCode?: string;
  nsuDate?: string;
  status?: string;
  statusDescription?: string;
  dueDate?: string;
  issueDate?: string;
  entryDate?: string;
  settlementDate?: string;
  nominalValue?: number;
  paidValue?: number;
  discountValue?: number;
  fineValue?: number;
  interestValue?: number;
  payer?: PayerInfo;
  qrCodePix?: string;
  qrCodeUrl?: string;
  barCode?: string;
  digitableLine?: string;
  documentKind?: string;
  messages?: string[];
  settlements?: SettlementInfo[];
  registryInfo?: RegistryInfo;
  consultaRealizadaEm?: string;
  tipoConsulta?: string;
}

export interface PayerInfo {
  name?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface SettlementInfo {
  settlementType?: string;
  settlementDate?: string;
  settlementValue?: number;
  settlementOrigin?: string;
  bankCode?: string;
  bankBranch?: string;
}

export interface RegistryInfo {
  registryDate?: string;
  registryNumber?: string;
  notaryOffice?: string;
  registryCost?: number;
}
```

---

## ✅ Checklist de Implementação Frontend

- [ ] Criar service para consultar status
- [ ] Criar componente `StatusBadge`
- [ ] Criar hook `useStatusBoleto`
- [ ] Adicionar botão "Verificar Pagamento" na listagem
- [ ] Implementar modal de detalhes
- [ ] Adicionar notificações quando boleto for pago
- [ ] Implementar cache de status
- [ ] Adicionar loading states
- [ ] Tratar erros adequadamente
- [ ] Testar com boletos reais
- [ ] Documentar para outros desenvolvedores

---

**Pronto para usar! 🚀**

Para dúvidas, consulte:
- `BOLETO_STATUS_API_README.md` - Documentação completa da API
- `IMPLEMENTACAO_STATUS_BOLETOS_RESUMO.md` - Detalhes da implementação backend

