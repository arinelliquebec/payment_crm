# 🚀 Guia de Integração Frontend - Sistema de Grupos de Acesso e Filiais

## 📋 Visão Geral

Este guia fornece todas as informações necessárias para o frontend integrar com o sistema inteligente de grupos de acesso e filiais implementado no backend.

## 🎯 Funcionalidades Disponíveis

### ✅ **Sistema de Grupos de Acesso**
- 7 grupos com permissões específicas
- Validação automática de permissões
- Controle granular por módulo e ação

### ✅ **Sistema Inteligente de Filiais**
- Detecção automática de consultores/parceiros
- Validação por grupo de acesso
- Sugestões inteligentes
- Suporte a "Sem Filial" para visão geral

## 🔗 Endpoints Disponíveis

### **1. Autenticação e Usuários**

#### **Login**
```http
POST /api/Usuario/login
Content-Type: application/json

{
  "login": "12345678901",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "usuario": {
    "id": 1,
    "login": "joao.silva1234",
    "email": "joao@empresa.com",
    "grupoAcesso": "Consultores",
    "tipoPessoa": "Fisica",
    "nome": "João Silva",
    "ativo": true,
    "ultimoAcesso": "2024-01-15T10:30:00"
  }
}
```

#### **Cadastro de Usuário**
```http
POST /api/Usuario/cadastro
Content-Type: application/json

{
  "cpf": "12345678901",
  "senha": "senha123"
}
```

### **2. Informações de Pessoas**

#### **Obter Informações de Pessoa Física**
```http
GET /api/Usuario/pessoa-fisica/{id}/info
```

**Resposta:**
```json
{
  "pessoaFisica": {
    "id": 1,
    "nome": "João Silva",
    "cpf": "12345678901",
    "emailEmpresarial": "joao@empresa.com",
    "emailPessoal": "joao.pessoal@gmail.com"
  },
  "filialInfo": {
    "filialId": 2,
    "filialNome": "Filial São Paulo",
    "consultorId": 5,
    "parceiroId": null,
    "isConsultor": true,
    "isParceiro": false,
    "oab": "123456"
  }
}
```

#### **Listar Pessoas Físicas para Usuário**
```http
GET /api/Usuario/pessoas-fisicas
```

#### **Listar Pessoas Jurídicas para Usuário**
```http
GET /api/Usuario/pessoas-juridicas
```

### **3. Sistema Inteligente de Grupos e Filiais**

#### **Obter Filiais Disponíveis para Grupo**
```http
GET /api/Usuario/grupo/{grupoId}/filiais
```

**Resposta:**
```json
[
  {
    "id": 0,
    "nome": "Sem Filial (Visão Geral)",
    "isSuggested": true,
    "reason": "Recomendado para visão geral do sistema"
  },
  {
    "id": 1,
    "nome": "Filial São Paulo",
    "isSuggested": false,
    "reason": null
  },
  {
    "id": 2,
    "nome": "Filial Rio de Janeiro",
    "isSuggested": false,
    "reason": null
  }
]
```

#### **Validar Combinação Grupo-Filial**
```http
POST /api/Usuario/validate-grupo-filial
Content-Type: application/json

{
  "grupoAcessoId": 1,
  "filialId": 2,
  "pessoaFisicaId": 5,
  "pessoaJuridicaId": null
}
```

**Resposta:**
```json
{
  "isValid": true,
  "errorMessage": null,
  "warningMessage": "Este consultor está vinculado à filial 'Filial São Paulo'. Considere usar essa filial.",
  "filialRequired": true,
  "canBeNull": false,
  "suggestedFilial": {
    "filialId": 1,
    "filialNome": "Filial São Paulo",
    "consultorId": 3,
    "parceiroId": null,
    "isConsultor": true,
    "isParceiro": false,
    "oab": "123456"
  }
}
```

### **4. Criação de Usuário**

#### **Criar Usuário com Validação Inteligente**
```http
POST /api/Usuario
Content-Type: application/json

{
  "login": "joao.silva1234",
  "email": "joao@empresa.com",
  "senha": "senha123",
  "grupoAcessoId": 3,
  "tipoPessoa": "Fisica",
  "pessoaFisicaId": 1,
  "pessoaJuridicaId": null,
  "filialId": 2,
  "consultorId": 5,
  "ativo": true
}
```

### **5. Informações Auxiliares**

#### **Listar Filiais**
```http
GET /api/Info/filiais
```

#### **Listar Consultores**
```http
GET /api/Info/consultores
```

#### **Listar Parceiros**
```http
GET /api/Info/parceiros
```

#### **Listar Grupos de Acesso**
```http
GET /api/Info/grupos-acesso
```

## 🎨 Implementação no Frontend

### **1. Tela de Criação de Usuário**

```typescript
import React, { useState, useEffect } from 'react';

interface UsuarioFormData {
  pessoaFisicaId: number | null;
  grupoAcessoId: number | null;
  filialId: number | null;
  login: string;
  email: string;
  senha: string;
}

const CriarUsuario: React.FC = () => {
  const [formData, setFormData] = useState<UsuarioFormData>({
    pessoaFisicaId: null,
    grupoAcessoId: null,
    filialId: null,
    login: '',
    email: '',
    senha: ''
  });

  const [pessoasFisicas, setPessoasFisicas] = useState([]);
  const [gruposAcesso, setGruposAcesso] = useState([]);
  const [filiaisDisponiveis, setFiliaisDisponiveis] = useState([]);
  const [pessoaInfo, setPessoaInfo] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      const [pessoasRes, gruposRes] = await Promise.all([
        fetch('/api/Usuario/pessoas-fisicas'),
        fetch('/api/Info/grupos-acesso')
      ]);

      const pessoas = await pessoasRes.json();
      const grupos = await gruposRes.json();

      setPessoasFisicas(pessoas);
      setGruposAcesso(grupos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Quando pessoa física é selecionada
  const handlePessoaFisicaSelect = async (pessoaId: number) => {
    try {
      const response = await fetch(`/api/Usuario/pessoa-fisica/${pessoaId}/info`);
      const data = await response.json();

      if (response.ok) {
        setPessoaInfo(data);
        setFormData(prev => ({
          ...prev,
          pessoaFisicaId: pessoaId,
          email: data.pessoaFisica.emailEmpresarial
        }));

        // Se há sugestão de filial, aplicar automaticamente
        if (data.filialInfo) {
          setFormData(prev => ({
            ...prev,
            filialId: data.filialInfo.filialId,
            consultorId: data.filialInfo.consultorId
          }));
        }
      } else {
        alert(data.message || 'Erro ao obter informações da pessoa');
      }
    } catch (error) {
      console.error('Erro ao obter informações da pessoa:', error);
    }
  };

  // Quando grupo de acesso é selecionado
  const handleGrupoSelect = async (grupoId: number) => {
    try {
      const response = await fetch(`/api/Usuario/grupo/${grupoId}/filiais`);
      const filiais = await response.json();

      setFiliaisDisponiveis(filiais);

      // Se há sugestão, selecionar automaticamente
      const sugestao = filiais.find(f => f.isSuggested);
      if (sugestao) {
        setFormData(prev => ({ ...prev, filialId: sugestao.id }));
      }

      // Validar combinação atual
      if (formData.pessoaFisicaId) {
        await validarCombinacao(grupoId, formData.filialId, formData.pessoaFisicaId);
      }
    } catch (error) {
      console.error('Erro ao obter filiais:', error);
    }
  };

  // Quando filial é selecionada
  const handleFilialSelect = async (filialId: number | null) => {
    setFormData(prev => ({ ...prev, filialId }));

    if (formData.grupoAcessoId && formData.pessoaFisicaId) {
      await validarCombinacao(formData.grupoAcessoId, filialId, formData.pessoaFisicaId);
    }
  };

  // Validar combinação grupo-filial
  const validarCombinacao = async (grupoId: number, filialId: number | null, pessoaId: number) => {
    try {
      const response = await fetch('/api/Usuario/validate-grupo-filial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoAcessoId: grupoId,
          filialId: filialId,
          pessoaFisicaId: pessoaId,
          pessoaJuridicaId: null
        })
      });

      const result = await response.json();
      setValidation(result);
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  // Criar usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/Usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Usuário criado com sucesso!');
        // Limpar formulário ou redirecionar
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao criar usuário');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="criar-usuario">
      <h2>Criar Usuário</h2>

      <form onSubmit={handleSubmit}>
        {/* Seleção de Pessoa Física */}
        <div className="form-group">
          <label>Pessoa Física *</label>
          <select
            value={formData.pessoaFisicaId || ''}
            onChange={(e) => handlePessoaFisicaSelect(Number(e.target.value))}
            required
          >
            <option value="">Selecione uma pessoa física</option>
            {pessoasFisicas.map(pessoa => (
              <option key={pessoa.id} value={pessoa.id}>
                {pessoa.nome} - {pessoa.cpf}
              </option>
            ))}
          </select>
        </div>

        {/* Informações da Pessoa */}
        {pessoaInfo && (
          <div className="pessoa-info">
            <h4>Informações da Pessoa</h4>
            <p><strong>Nome:</strong> {pessoaInfo.pessoaFisica.nome}</p>
            <p><strong>CPF:</strong> {pessoaInfo.pessoaFisica.cpf}</p>
            <p><strong>Email:</strong> {pessoaInfo.pessoaFisica.emailEmpresarial}</p>

            {pessoaInfo.filialInfo && (
              <div className="filial-info">
                <h5>Informações de Filial</h5>
                <p><strong>Filial:</strong> {pessoaInfo.filialInfo.filialNome}</p>
                {pessoaInfo.filialInfo.isConsultor && (
                  <p><strong>Consultor:</strong> Sim (OAB: {pessoaInfo.filialInfo.oab})</p>
                )}
                {pessoaInfo.filialInfo.isParceiro && (
                  <p><strong>Parceiro:</strong> Sim</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Seleção de Grupo de Acesso */}
        <div className="form-group">
          <label>Grupo de Acesso *</label>
          <select
            value={formData.grupoAcessoId || ''}
            onChange={(e) => handleGrupoSelect(Number(e.target.value))}
            required
          >
            <option value="">Selecione um grupo de acesso</option>
            {gruposAcesso.map(grupo => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Filial */}
        <div className="form-group">
          <label>Filial</label>
          <select
            value={formData.filialId || ''}
            onChange={(e) => handleFilialSelect(Number(e.target.value) || null)}
          >
            <option value="">Selecione uma filial</option>
            {filiaisDisponiveis.map(filial => (
              <option
                key={filial.id}
                value={filial.id}
                style={{
                  backgroundColor: filial.isSuggested ? '#e6f7ff' : 'white',
                  fontWeight: filial.isSuggested ? 'bold' : 'normal'
                }}
              >
                {filial.nome}
                {filial.reason && (
                  <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {' '}({filial.reason})
                  </span>
                )}
              </option>
            ))}
          </select>
        </div>

        {/* Mensagens de Validação */}
        {validation && (
          <div className="validation-messages">
            {validation.errorMessage && (
              <div className="alert error">
                ❌ {validation.errorMessage}
              </div>
            )}
            {validation.warningMessage && (
              <div className="alert warning">
                ⚠️ {validation.warningMessage}
              </div>
            )}
            {validation.suggestedFilial && (
              <div className="alert info">
                💡 Sugestão: Usar filial "{validation.suggestedFilial.filialNome}"
              </div>
            )}
          </div>
        )}

        {/* Campos do Usuário */}
        <div className="form-group">
          <label>Login *</label>
          <input
            type="text"
            value={formData.login}
            onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Senha *</label>
          <input
            type="password"
            value={formData.senha}
            onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
            required
            minLength={6}
          />
        </div>

        <button type="submit" disabled={loading || (validation && !validation.isValid)}>
          {loading ? 'Criando...' : 'Criar Usuário'}
        </button>
      </form>
    </div>
  );
};

export default CriarUsuario;
```

### **2. Componente de Validação**

```typescript
interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  warningMessage?: string;
  filialRequired: boolean;
  canBeNull: boolean;
  suggestedFilial?: {
    filialId: number;
    filialNome: string;
    consultorId?: number;
    parceiroId?: number;
    isConsultor: boolean;
    isParceiro: boolean;
    oab?: string;
  };
}

const ValidationMessages: React.FC<{ validation: ValidationResult }> = ({ validation }) => {
  if (!validation) return null;

  return (
    <div className="validation-messages">
      {validation.errorMessage && (
        <div className="alert alert-error">
          <strong>❌ Erro:</strong> {validation.errorMessage}
        </div>
      )}

      {validation.warningMessage && (
        <div className="alert alert-warning">
          <strong>⚠️ Aviso:</strong> {validation.warningMessage}
        </div>
      )}

      {validation.suggestedFilial && (
        <div className="alert alert-info">
          <strong>💡 Sugestão:</strong> Este usuário está vinculado à filial "{validation.suggestedFilial.filialNome}".
          {validation.suggestedFilial.isConsultor && ` (Consultor - OAB: ${validation.suggestedFilial.oab})`}
          {validation.suggestedFilial.isParceiro && ' (Parceiro)'}
        </div>
      )}
    </div>
  );
};
```

### **3. Hook Personalizado para Validação**

```typescript
import { useState, useCallback } from 'react';

export const useValidation = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validateGrupoFilial = useCallback(async (
    grupoAcessoId: number,
    filialId: number | null,
    pessoaFisicaId: number | null,
    pessoaJuridicaId: number | null = null
  ) => {
    setLoading(true);
    try {
      const response = await fetch('/api/Usuario/validate-grupo-filial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoAcessoId,
          filialId,
          pessoaFisicaId,
          pessoaJuridicaId
        })
      });

      const result = await response.json();
      setValidation(result);
      return result;
    } catch (error) {
      console.error('Erro na validação:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    validation,
    loading,
    validateGrupoFilial,
    clearValidation: () => setValidation(null)
  };
};
```

## 🎨 Estilos CSS

```css
/* Estilos para o formulário */
.criar-usuario {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* Informações da pessoa */
.pessoa-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filial-info {
  background: #e3f2fd;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

/* Mensagens de validação */
.validation-messages {
  margin-bottom: 20px;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 10px;
  border-left: 4px solid;
}

.alert-error {
  background: #ffebee;
  border-left-color: #f44336;
  color: #c62828;
}

.alert-warning {
  background: #fff3e0;
  border-left-color: #ff9800;
  color: #e65100;
}

.alert-info {
  background: #e3f2fd;
  border-left-color: #2196f3;
  color: #1565c0;
}

/* Botão */
button {
  background: #2196f3;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #1976d2;
}
```

## 📊 Regras por Grupo de Acesso

### **Administrador**
- ✅ **Filial**: Opcional (recomendado sem filial)
- ✅ **Permissões**: Acesso total ao sistema
- 💡 **Uso**: Visão geral do sistema

### **Faturamento**
- ✅ **Filial**: Opcional (recomendado sem filial)
- ✅ **Permissões**: Quase administrador (exceto edição de usuários)
- 💡 **Uso**: Visão geral para faturamento

### **Cobrança/Financeiro**
- ✅ **Filial**: Opcional (recomendado sem filial)
- ✅ **Permissões**: Visualização de tudo (read-only)
- 💡 **Uso**: Visão geral para cobrança

### **Gestor de Filial**
- ❌ **Filial**: Obrigatória
- ✅ **Permissões**: Total para sua filial
- 💡 **Uso**: Gestão específica da filial

### **Administrativo de Filial**
- ❌ **Filial**: Obrigatória
- ✅ **Permissões**: Visualização da sua filial (read-only)
- 💡 **Uso**: Apoio administrativo da filial

### **Consultores**
- ❌ **Filial**: Obrigatória
- ✅ **Permissões**: Clientes próprios + importados + sem interesse
- 💡 **Uso**: Trabalho específico da filial

### **Usuário**
- ✅ **Filial**: Opcional
- ✅ **Permissões**: Nenhuma (até alocação)
- 💡 **Uso**: Flexibilidade total

## 🔧 Configurações de CORS

O backend está configurado para aceitar requisições dos seguintes domínios:

```csharp
// Program.cs
builder.WithOrigins(
    "https://arrighi-front-v1-copy.vercel.app",
    "https://arrighi-front-v1-copy.vercel.app/",
    "https://arrighicrm-front-v1.vercel.app",
    "https://arrighicrm-front-v1.vercel.app/",
    "https://arrighicrm.com",
    "https://www.arrighicrm.com",
    "https://arrighi-bk-bzfmgxavaxbyh5ej.brazilsouth-01.azurewebsites.net",
    "http://localhost:3000",
    "http://localhost:3001"
)
```

## 🚨 Tratamento de Erros

### **Códigos de Status HTTP**
- `200`: Sucesso
- `400`: Erro de validação (dados inválidos)
- `401`: Não autorizado
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### **Estrutura de Erro**
```json
{
  "message": "Descrição do erro",
  "errors": {
    "campo": ["Erro específico do campo"]
  }
}
```

## 📱 Exemplos de Uso

### **1. Fluxo Completo de Criação**

```typescript
// 1. Selecionar pessoa física
const pessoaInfo = await fetch(`/api/Usuario/pessoa-fisica/${pessoaId}/info`);

// 2. Selecionar grupo de acesso
const filiais = await fetch(`/api/Usuario/grupo/${grupoId}/filiais`);

// 3. Validar combinação
const validation = await fetch('/api/Usuario/validate-grupo-filial', {
  method: 'POST',
  body: JSON.stringify({ grupoAcessoId, filialId, pessoaFisicaId })
});

// 4. Criar usuário
const usuario = await fetch('/api/Usuario', {
  method: 'POST',
  body: JSON.stringify(usuarioData)
});
```

### **2. Validação em Tempo Real**

```typescript
// Validar quando grupo ou filial mudar
useEffect(() => {
  if (grupoId && filialId && pessoaId) {
    validateGrupoFilial(grupoId, filialId, pessoaId);
  }
}, [grupoId, filialId, pessoaId]);
```

## 🎯 Próximos Passos

1. **Implementar componentes React** usando os exemplos fornecidos
2. **Configurar roteamento** para as telas de usuário
3. **Implementar validação em tempo real** nos formulários
4. **Adicionar testes** para os componentes
5. **Configurar tratamento de erros** global

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar logs do backend
- Testar endpoints com Postman/Insomnia
- Consultar documentação dos grupos de acesso
- Verificar configurações de CORS

---

**Sistema pronto para integração!** 🚀

Todos os endpoints estão funcionais e testados. O frontend pode começar a implementação imediatamente usando os exemplos fornecidos.
