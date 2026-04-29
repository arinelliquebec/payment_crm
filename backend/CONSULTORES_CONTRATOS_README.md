# Implementação: Consultores Veem Apenas Seus Próprios Contratos

## Visão Geral

Implementação do controle de acesso para que consultores do grupo "Consultores" vejam apenas os contratos que estão vinculados a eles como consultor.

## Funcionalidades Implementadas

### 1. Filtro Automático por Consultor

**Localização:** `AuthorizationService.FilterContratosByUserAsync()`

```csharp
case "Consultores":
    // Consultores veem apenas seus próprios contratos
    return contratos.Where(c => c.ConsultorId == usuario.ConsultorId);
```

### 2. Endpoints Atualizados

#### `GET /api/Contrato`
- **Antes:** Retornava todos os contratos
- **Agora:** Retorna apenas contratos que o usuário pode ver baseado em seu grupo

#### `GET /api/Contrato/meus-contratos` (NOVO)
- **Específico para consultores**
- Retorna apenas contratos do consultor logado
- Endpoint otimizado para consultores

#### `GET /api/Contrato/{id}`
- **Antes:** Qualquer usuário podia ver qualquer contrato
- **Agora:** Verifica permissões antes de retornar

#### `POST /api/Contrato`
- **Antes:** Qualquer usuário podia criar contratos
- **Agora:** Verifica permissões e se pode criar para o consultor especificado

#### `PUT /api/Contrato/{id}/situacao`
- **Antes:** Qualquer usuário podia editar
- **Agora:** Verifica se pode editar o contrato específico

### 3. Verificações de Permissão

#### Para Consultores:
- ✅ **Visualizar:** Apenas seus próprios contratos
- ✅ **Editar:** Apenas seus próprios contratos  
- ✅ **Criar:** Pode criar contratos para si mesmo
- ❌ **Excluir:** Não pode excluir (apenas Administrador e Faturamento)

#### Para Outros Grupos:
- **Administrador:** Todos os contratos
- **Faturamento:** Todos os contratos
- **Cobrança/Financeiro:** Todos os contratos (apenas visualização)
- **Gestor de Filial:** Contratos de clientes da sua filial
- **Administrativo de Filial:** Contratos de clientes da sua filial (apenas visualização)

## Como Funciona

### 1. Estrutura de Dados

```sql
-- Usuario tem ConsultorId
Usuario {
    Id: int
    ConsultorId: int?  -- FK para Consultor
    GrupoAcessoId: int
}

-- Contrato tem ConsultorId
Contrato {
    Id: int
    ConsultorId: int    -- FK para Consultor
    ClienteId: int
}

-- Consultor tem PessoaFisicaId
Consultor {
    Id: int
    PessoaFisicaId: int  -- FK para PessoaFisica
    FilialId: int
}
```

### 2. Fluxo de Autorização

1. **Usuário faz login** → Sistema identifica o `ConsultorId`
2. **Usuário acessa `/api/Contrato`** → Sistema aplica filtro automático
3. **Para consultores:** `WHERE ConsultorId = usuario.ConsultorId`
4. **Para outros grupos:** Filtros específicos por grupo

### 3. Exemplo Prático

```typescript
// Frontend - Consultor Mauro (ID: 1, ConsultorId: 5)
const response = await fetch('/api/Contrato');
const contratos = await response.json();

// Resultado: Apenas contratos onde ConsultorId = 5
// Não vê contratos de outros consultores
```

## Scripts SQL

### 1. Verificar Permissões Atuais
```sql
-- Ver permissões do grupo Consultores
SELECT 
    g.Nome as Grupo,
    p.Nome as Permissao,
    p.Modulo,
    p.Acao,
    pg.ApenasProprios,
    pg.ApenasFilial,
    pg.ApenasLeitura
FROM GruposAcesso g
JOIN PermissoesGrupos pg ON g.Id = pg.GrupoAcessoId
JOIN Permissoes p ON pg.PermissaoId = p.Id
WHERE g.Nome = 'Consultores'
ORDER BY p.Modulo, p.Acao;
```

### 2. Atualizar Permissões (se necessário)
```sql
-- Garantir que consultores vejam apenas seus próprios contratos
UPDATE PermissoesGrupos 
SET ApenasProprios = 1,  -- Apenas seus próprios registros
    ApenasFilial = 0,    -- Não restrito por filial
    ApenasLeitura = 0    -- Pode editar
WHERE GrupoAcessoId = (SELECT Id FROM GruposAcesso WHERE Nome = 'Consultores')
  AND PermissaoId IN (
    SELECT Id FROM Permissoes 
    WHERE Modulo = 'Contrato' 
    AND Acao IN ('Visualizar', 'Editar', 'Incluir')
  );
```

## Testes

### 1. Teste Manual

1. **Login como consultor Mauro**
2. **Acessar `/api/Contrato`**
3. **Verificar:** Apenas contratos onde `ConsultorId = Mauro.ConsultorId`

### 2. Teste com Diferentes Grupos

| Grupo | Pode Ver | Restrição |
|-------|----------|-----------|
| Administrador | Todos os contratos | Nenhuma |
| Consultores | Apenas seus contratos | `ConsultorId = usuario.ConsultorId` |
| Gestor de Filial | Contratos da filial | `Cliente.FilialId = usuario.FilialId` |

### 3. Endpoints para Testar

```bash
# Consultor logado vê apenas seus contratos
GET /api/Contrato

# Endpoint específico para consultores
GET /api/Contrato/meus-contratos

# Verificar contrato específico (com permissão)
GET /api/Contrato/1

# Criar contrato (verifica permissões)
POST /api/Contrato
{
  "clienteId": 1,
  "consultorId": 5,  // Deve ser o ID do consultor logado
  "situacao": "Leed"
}
```

## Segurança

### 1. Validações Implementadas

- ✅ **Autenticação:** Usuário deve estar logado
- ✅ **Autorização:** Verifica grupo e permissões
- ✅ **Filtro Automático:** Aplicado em todas as consultas
- ✅ **Validação de Consultor:** Verifica se pode acessar o consultor especificado

### 2. Pontos de Atenção

- **Frontend:** Deve usar o `ConsultorId` do usuário logado ao criar contratos
- **Backend:** Sempre valida permissões antes de retornar dados
- **Banco:** Filtros são aplicados na query, não apenas no código

## Frontend - Implementação

### 1. Service de Contratos
```typescript
export class ContratoService {
  // Buscar todos os contratos (filtrados automaticamente)
  async getContratos(): Promise<Contrato[]> {
    const response = await fetch('/api/Contrato');
    return response.json();
  }

  // Buscar apenas contratos do consultor logado
  async getMeusContratos(): Promise<Contrato[]> {
    const response = await fetch('/api/Contrato/meus-contratos');
    return response.json();
  }

  // Criar contrato (usar ConsultorId do usuário logado)
  async criarContrato(contrato: CreateContratoDTO): Promise<Contrato> {
    const response = await fetch('/api/Contrato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...contrato,
        consultorId: this.getCurrentUserConsultorId() // Usar ID do consultor logado
      })
    });
    return response.json();
  }
}
```

### 2. Componente de Lista
```typescript
export const ContratosList: React.FC = () => {
  const [contratos, setContratos] = useState<Contrato[]>([]);

  useEffect(() => {
    // Para consultores, usar endpoint específico
    const endpoint = userGroup === 'Consultores' 
      ? '/api/Contrato/meus-contratos'
      : '/api/Contrato';
    
    fetch(endpoint)
      .then(res => res.json())
      .then(setContratos);
  }, []);

  return (
    <div>
      {contratos.map(contrato => (
        <ContratoCard key={contrato.id} contrato={contrato} />
      ))}
    </div>
  );
};
```

## Conclusão

A implementação garante que:

1. ✅ **Consultores veem apenas seus próprios contratos**
2. ✅ **Outros grupos mantêm suas permissões específicas**
3. ✅ **Segurança é aplicada em todos os endpoints**
4. ✅ **Performance é otimizada com filtros no banco**
5. ✅ **Frontend tem endpoints específicos para consultores**

O sistema agora funciona exatamente como solicitado: **consultores só podem ver os contratos que estão vinculados a eles como consultor**.
