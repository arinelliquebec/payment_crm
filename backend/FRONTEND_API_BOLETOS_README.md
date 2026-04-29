# 📄 Guia de Integração Frontend - API de Boletos Santander

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Autenticação](#autenticação)
4. [Criando um Boleto](#criando-um-boleto)
5. [Listando Boletos](#listando-boletos)
6. [Consultando Boleto Específico](#consultando-boleto-específico)
7. [Cancelando/Baixando Boleto](#cancelando-boleto)
8. [Atualizando Status do Boleto](#atualizando-status-do-boleto)
9. [Exemplos de Código](#exemplos-de-código)
10. [Tratamento de Erros](#tratamento-de-erros)
11. [Campos Importantes](#campos-importantes)

---

## 🎯 Visão Geral

O backend já possui integração completa com a API do Santander para geração e gerenciamento de boletos. A implementação segue a **Opção 1 (Integração Direta)**, ou seja, o backend comunica-se diretamente com o Santander sem necessidade de serviços intermediários.

### ✅ Funcionalidades Disponíveis

- ✅ **Criar boleto** com registro automático no Santander
- ✅ **Listar boletos** (com filtros por permissão de usuário)
- ✅ **Consultar boleto específico**
- ✅ **Listar boletos por contrato**
- ✅ **Cancelar/baixar boleto** no Santander
- ✅ **Atualizar status** do boleto manualmente
- ✅ **Suporte a PIX** (QR Code gerado automaticamente)
- ✅ **Filtro por filial** (automático baseado em permissões)

---

## 🔗 Endpoints Disponíveis

### Base URL
```
https://seu-backend.com/api/Boleto
```

### Lista de Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/Boleto` | Lista todos os boletos (filtrado por permissões) |
| `GET` | `/api/Boleto/{id}` | Busca um boleto específico por ID |
| `GET` | `/api/Boleto/contrato/{contratoId}` | Lista boletos de um contrato específico |
| `POST` | `/api/Boleto` | Cria um novo boleto e registra no Santander |
| `PUT` | `/api/Boleto/{id}/cancelar` | Cancela/baixa um boleto no Santander |
| `PUT` | `/api/Boleto/{id}/status` | Atualiza o status de um boleto manualmente |

---

## 🔐 Autenticação

Todos os endpoints requerem autenticação via header `X-Usuario-Id`:

```javascript
headers: {
  'Content-Type': 'application/json',
  'X-Usuario-Id': '123' // ID do usuário logado
}
```

⚠️ **Importante:** O sistema aplica filtros automáticos baseados nas permissões do usuário:
- **Administrador**: Vê todos os boletos
- **Gestor de Filial**: Vê apenas boletos da sua filial
- **Consultores**: Vê apenas boletos dos seus contratos

---

## 📝 Criando um Boleto

### `POST /api/Boleto`

Cria um novo boleto e registra automaticamente no Santander.

#### Request Body

```typescript
interface CreateBoletoDTO {
  contratoId: number;           // ID do contrato (obrigatório)
  dataVencimento: string;       // Data de vencimento no formato "YYYY-MM-DD"
  valor: number;                // Valor do boleto em decimal (ex: 1500.50)
  descricao?: string;           // Descrição opcional do boleto
  juros?: number;               // % de juros ao dia (opcional)
  multa?: number;               // % de multa (opcional)
  desconto?: number;            // Valor do desconto (opcional)
  mensagens?: string[];         // Mensagens para o boleto (máximo 5)
}
```

#### Exemplo de Request

```javascript
const criarBoleto = async (dadosBoleto) => {
  const response = await fetch('https://seu-backend.com/api/Boleto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Usuario-Id': localStorage.getItem('usuarioId')
    },
    body: JSON.stringify({
      contratoId: 123,
      dataVencimento: '2025-11-30',
      valor: 1500.50,
      descricao: 'Prestação de serviços - Novembro/2025',
      juros: 0.033,  // 1% ao mês = 0.033% ao dia
      multa: 2.0,    // 2% de multa
      mensagens: [
        'Pagamento referente à prestação de serviços',
        'Pagamento via PIX disponível'
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.mensagem || 'Erro ao criar boleto');
  }

  return await response.json();
};
```

#### Response de Sucesso (201 Created)

```json
{
  "id": 456,
  "contratoId": 123,
  "nsuCode": "CTR123BOL1",
  "nsuDate": "2025-10-15",
  "dataVencimento": "2025-11-30T00:00:00",
  "valor": 1500.50,
  "status": "REGISTRADO",
  "linhaDigitavel": "03399.05960 79400.000000 00010.210101 1 95250000150050",
  "codigoBarras": "03399595200001500500596079400000000001021010101",
  "nossoNumero": "1021",
  "qrCodePix": "00020101021226900014br.gov.bcb.pix...",
  "qrCodeUrl": "https://pix.santander.com.br/qr/v2/cobv/...",
  "descricao": "Prestação de serviços - Novembro/2025",
  "dataCadastro": "2025-10-15T14:30:00",
  "contrato": {
    "id": 123,
    "cliente": {
      "id": 45,
      "nome": "João da Silva",
      "documento": "12345678901"
    }
  }
}
```

---

## 📋 Listando Boletos

### `GET /api/Boleto`

Lista todos os boletos do sistema (filtrado automaticamente por permissões do usuário).

#### Exemplo de Request

```javascript
const listarBoletos = async () => {
  const response = await fetch('https://seu-backend.com/api/Boleto', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Usuario-Id': localStorage.getItem('usuarioId')
    }
  });

  if (!response.ok) {
    throw new Error('Erro ao listar boletos');
  }

  return await response.json();
};
```

#### Response de Sucesso (200 OK)

```json
[
  {
    "id": 456,
    "contratoId": 123,
    "nsuCode": "CTR123BOL1",
    "dataVencimento": "2025-11-30T00:00:00",
    "valor": 1500.50,
    "status": "REGISTRADO",
    "linhaDigitavel": "03399.05960 79400.000000...",
    "nossoNumero": "1021",
    "qrCodePix": "00020101021226900014br.gov.bcb.pix...",
    "dataCadastro": "2025-10-15T14:30:00",
    "contrato": {
      "id": 123,
      "cliente": {
        "nome": "João da Silva"
      }
    }
  },
  {
    "id": 457,
    "contratoId": 124,
    "nsuCode": "CTR124BOL1",
    "dataVencimento": "2025-12-15T00:00:00",
    "valor": 2000.00,
    "status": "PAGO",
    "dataPagamento": "2025-12-10T10:15:00",
    "...": "..."
  }
]
```

---

## 🔍 Consultando Boleto Específico

### `GET /api/Boleto/{id}`

Busca detalhes de um boleto específico.

#### Exemplo de Request

```javascript
const buscarBoleto = async (boletoId) => {
  const response = await fetch(`https://seu-backend.com/api/Boleto/${boletoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Usuario-Id': localStorage.getItem('usuarioId')
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Boleto não encontrado');
    }
    throw new Error('Erro ao buscar boleto');
  }

  return await response.json();
};
```

---

## 📑 Listar Boletos por Contrato

### `GET /api/Boleto/contrato/{contratoId}`

Lista todos os boletos de um contrato específico.

#### Exemplo de Request

```javascript
const listarBoletosPorContrato = async (contratoId) => {
  const response = await fetch(
    `https://seu-backend.com/api/Boleto/contrato/${contratoId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': localStorage.getItem('usuarioId')
      }
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao listar boletos do contrato');
  }

  return await response.json();
};
```

---

## ❌ Cancelando Boleto

### `PUT /api/Boleto/{id}/cancelar`

Cancela/baixa um boleto no Santander.

#### Exemplo de Request

```javascript
const cancelarBoleto = async (boletoId) => {
  const response = await fetch(
    `https://seu-backend.com/api/Boleto/${boletoId}/cancelar`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': localStorage.getItem('usuarioId')
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.mensagem || 'Erro ao cancelar boleto');
  }

  return await response.json();
};
```

#### Response de Sucesso (200 OK)

```json
{
  "id": 456,
  "status": "CANCELADO",
  "dataCancelamento": "2025-10-15T15:45:00",
  "mensagem": "Boleto cancelado com sucesso no Santander"
}
```

---

## 🔄 Atualizando Status do Boleto

### `PUT /api/Boleto/{id}/status`

Atualiza o status de um boleto manualmente (sem comunicação com Santander).

#### Request Body

```typescript
interface AtualizarStatusDTO {
  novoStatus: 'REGISTRADO' | 'PAGO' | 'CANCELADO' | 'VENCIDO' | 'ERRO';
  observacoes?: string;
}
```

#### Exemplo de Request

```javascript
const atualizarStatusBoleto = async (boletoId, novoStatus) => {
  const response = await fetch(
    `https://seu-backend.com/api/Boleto/${boletoId}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Usuario-Id': localStorage.getItem('usuarioId')
      },
      body: JSON.stringify({
        novoStatus: novoStatus,
        observacoes: 'Atualizado manualmente pelo usuário'
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.mensagem || 'Erro ao atualizar status');
  }

  return await response.json();
};
```

---

## 💻 Exemplos de Código - React/TypeScript

### Componente Completo de Listagem de Boletos

```typescript
import React, { useState, useEffect } from 'react';

interface Boleto {
  id: number;
  contratoId: number;
  valor: number;
  dataVencimento: string;
  status: string;
  linhaDigitavel: string;
  nossoNumero: string;
  qrCodePix?: string;
  contrato: {
    cliente: {
      nome: string;
    };
  };
}

const ListaBoletos: React.FC = () => {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarBoletos();
  }, []);

  const carregarBoletos = async () => {
    try {
      setLoading(true);
      setErro(null);

      const response = await fetch('https://seu-backend.com/api/Boleto', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': localStorage.getItem('usuarioId') || ''
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar boletos');
      }

      const data = await response.json();
      setBoletos(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const copiarLinhaDigitavel = (linha: string) => {
    navigator.clipboard.writeText(linha);
    alert('Linha digitável copiada!');
  };

  if (loading) return <div>Carregando boletos...</div>;
  if (erro) return <div className="error">Erro: {erro}</div>;

  return (
    <div className="lista-boletos">
      <h2>Boletos</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Nosso Número</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {boletos.map((boleto) => (
            <tr key={boleto.id}>
              <td>{boleto.id}</td>
              <td>{boleto.contrato.cliente.nome}</td>
              <td>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(boleto.valor)}
              </td>
              <td>
                {new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
              </td>
              <td>
                <span className={`status ${boleto.status.toLowerCase()}`}>
                  {boleto.status}
                </span>
              </td>
              <td>{boleto.nossoNumero}</td>
              <td>
                <button onClick={() => copiarLinhaDigitavel(boleto.linhaDigitavel)}>
                  Copiar Linha
                </button>
                {boleto.qrCodePix && (
                  <button>Ver QR Code</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListaBoletos;
```

### Componente de Criação de Boleto

```typescript
import React, { useState } from 'react';

interface FormBoletoProps {
  contratoId: number;
  onSucesso?: (boleto: any) => void;
}

const FormCriarBoleto: React.FC<FormBoletoProps> = ({ contratoId, onSucesso }) => {
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setErro(null);

      const response = await fetch('https://seu-backend.com/api/Boleto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Usuario-Id': localStorage.getItem('usuarioId') || ''
        },
        body: JSON.stringify({
          contratoId: contratoId,
          dataVencimento: dataVencimento,
          valor: parseFloat(valor),
          descricao: descricao,
          juros: 0.033,
          multa: 2.0,
          mensagens: [
            'Pagamento referente à prestação de serviços',
            'Pagamento via PIX disponível'
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensagem || 'Erro ao criar boleto');
      }

      const boleto = await response.json();
      alert('Boleto criado com sucesso!');
      
      if (onSucesso) {
        onSucesso(boleto);
      }

      // Limpar formulário
      setValor('');
      setDataVencimento('');
      setDescricao('');

    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-boleto">
      <h3>Criar Novo Boleto</h3>

      {erro && <div className="error">{erro}</div>}

      <div className="form-group">
        <label>Valor:</label>
        <input
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          placeholder="1500.50"
        />
      </div>

      <div className="form-group">
        <label>Data de Vencimento:</label>
        <input
          type="date"
          value={dataVencimento}
          onChange={(e) => setDataVencimento(e.target.value)}
          required
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label>Descrição:</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição do boleto"
          rows={3}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Boleto'}
      </button>
    </form>
  );
};

export default FormCriarBoleto;
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Ação Recomendada |
|--------|-------------|------------------|
| `200` | Sucesso | Processar resposta normalmente |
| `201` | Criado | Boleto criado com sucesso |
| `400` | Bad Request | Verificar dados enviados |
| `401` | Não autorizado | Usuário não identificado |
| `403` | Proibido | Sem permissão para a operação |
| `404` | Não encontrado | Boleto/Contrato não existe |
| `500` | Erro do servidor | Tentar novamente ou contatar suporte |

### Exemplo de Tratamento de Erros

```typescript
const tratarErroAPI = (response: Response, erro: any) => {
  if (response.status === 400) {
    return 'Dados inválidos. Verifique os campos e tente novamente.';
  } else if (response.status === 401) {
    return 'Você precisa estar logado para realizar esta ação.';
  } else if (response.status === 403) {
    return 'Você não tem permissão para realizar esta ação.';
  } else if (response.status === 404) {
    return 'Boleto não encontrado.';
  } else if (response.status === 500) {
    return 'Erro no servidor. Tente novamente mais tarde.';
  } else {
    return erro.mensagem || 'Erro desconhecido.';
  }
};
```

---

## 📊 Campos Importantes

### Status do Boleto

| Status | Descrição | Cor Sugerida |
|--------|-----------|--------------|
| `REGISTRADO` | Boleto registrado no Santander | Azul |
| `PAGO` | Boleto pago | Verde |
| `CANCELADO` | Boleto cancelado | Cinza |
| `VENCIDO` | Boleto vencido e não pago | Vermelho |
| `ERRO` | Erro no registro | Vermelho |

### Dados do PIX

Se o boleto tiver PIX habilitado, você receberá:

```json
{
  "qrCodePix": "00020101021226900014br.gov.bcb.pix...",
  "qrCodeUrl": "https://pix.santander.com.br/qr/v2/cobv/..."
}
```

**Para exibir o QR Code:**

```html
<!-- Opção 1: Usar biblioteca de QR Code no frontend -->
<QRCodeGenerator value={boleto.qrCodePix} size={300} />

<!-- Opção 2: Usar URL direta -->
<img src={boleto.qrCodeUrl} alt="QR Code PIX" />

<!-- Opção 3: Gerar no backend (se implementado) -->
<img src={`/api/boleto/qrcode/${boleto.id}`} alt="QR Code PIX" />
```

---

## 🎨 Exemplo de UI Completa

```tsx
import React, { useState, useEffect } from 'react';
import './Boletos.css';

const PaginaBoletos: React.FC = () => {
  const [boletos, setBoletos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  const carregarBoletos = async () => {
    // ... implementação
  };

  return (
    <div className="pagina-boletos">
      <div className="header">
        <h1>Gestão de Boletos</h1>
        <button onClick={() => setMostrarForm(true)}>
          + Novo Boleto
        </button>
      </div>

      {mostrarForm && (
        <div className="modal">
          <FormCriarBoleto 
            contratoId={contratoSelecionado}
            onSucesso={() => {
              setMostrarForm(false);
              carregarBoletos();
            }}
          />
        </div>
      )}

      <ListaBoletos boletos={boletos} />
    </div>
  );
};
```

---

## 🚀 Checklist de Implementação

- [ ] Configurar header `X-Usuario-Id` em todas as requisições
- [ ] Implementar listagem de boletos
- [ ] Implementar formulário de criação
- [ ] Adicionar funcionalidade de copiar linha digitável
- [ ] Implementar exibição de QR Code PIX (se aplicável)
- [ ] Adicionar tratamento de erros
- [ ] Implementar feedback visual para status dos boletos
- [ ] Adicionar confirmação antes de cancelar boleto
- [ ] Testar com diferentes permissões de usuário
- [ ] Validar formato de data antes de enviar
- [ ] Formatar valores monetários corretamente

---

## 📞 Suporte

Se tiver dúvidas ou encontrar problemas:

1. Verifique os logs do backend (console do servidor)
2. Confirme que o header `X-Usuario-Id` está sendo enviado
3. Verifique se as credenciais do Santander estão configuradas
4. Consulte a documentação da API do Santander

---

## ⚠️ Observações Importantes

1. **Ambiente de Teste**: Use ambiente `TESTE` durante desenvolvimento
2. **Validação de Dados**: Sempre valide os dados antes de enviar
3. **Segurança**: Nunca exponha credenciais do Santander no frontend
4. **Permissões**: Respeite os filtros automáticos do backend
5. **QR Code PIX**: Verifique se a chave PIX está configurada no Santander

---

**Última atualização:** 15/10/2025  
**Versão da API:** 1.0.0
