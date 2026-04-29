# Guia de Integração Frontend - Sistema de Grupos de Acesso

## 📋 Visão Geral

Este documento contém todas as informações necessárias para o frontend integrar com o sistema de grupos de acesso implementado no backend. O sistema está pronto e funcional, com todos os endpoints disponíveis.

## 🚀 Status do Backend

✅ **Sistema Completo e Funcional**
- ✅ Migração executada com sucesso
- ✅ Dados iniciais populados automaticamente
- ✅ Todos os endpoints disponíveis
- ✅ Sistema de autorização implementado
- ✅ Controllers criados e funcionais

## 🔗 Endpoints Disponíveis

### 1. **Autenticação e Informações do Usuário**

#### Login
```http
POST /api/Auth/login
Content-Type: application/json

{
  "login": "12345678901", // CPF, CNPJ ou Login
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "usuarioId": 1,
  "login": "12345678901",
  "email": "usuario@email.com",
  "nome": "João Silva",
  "grupoAcesso": "Consultores",
  "grupoAcessoId": 3,
  "filialId": 1,
  "filialNome": "Filial São Paulo",
  "consultorId": 5,
  "tipoPessoa": "Fisica",
  "ativo": true,
  "ultimoAcesso": "2024-01-15T10:30:00"
}
```

#### Obter Permissões do Usuário
```http
GET /api/Auth/usuario/{id}/permissoes
```

**Resposta:**
```json
{
  "usuarioId": 1,
  "login": "12345678901",
  "nome": "João Silva",
  "grupoAcesso": "Consultores",
  "filialId": 1,
  "filialNome": "Filial São Paulo",
  "consultorId": 5,
  "permissoes": [
    {
      "id": 1,
      "nome": "Visualizar Pessoa Física",
      "modulo": "PessoaFisica",
      "acao": "Visualizar",
      "apenasProprios": false,
      "apenasFilial": false,
      "apenasLeitura": false,
      "incluirSituacoesEspecificas": false,
      "situacoesEspecificas": null
    }
  ]
}
```

#### Obter Menu do Usuário
```http
GET /api/Auth/usuario/{id}/menu
```

**Resposta:**
```json
{
  "usuarioId": 1,
  "nome": "João Silva",
  "grupoAcesso": "Consultores",
  "filialNome": "Filial São Paulo",
  "menu": [
    {
      "nome": "Dashboard",
      "rota": "/dashboard",
      "icone": "dashboard"
    },
    {
      "nome": "Pessoas Físicas",
      "rota": "/pessoas-fisicas",
      "icone": "person"
    }
  ]
}
```

### 2. **Gerenciamento de Grupos de Acesso**

#### Listar Grupos
```http
GET /api/GrupoAcesso
```

#### Criar Grupo
```http
POST /api/GrupoAcesso
Content-Type: application/json

{
  "nome": "Novo Grupo",
  "descricao": "Descrição do grupo"
}
```

#### Atualizar Grupo
```http
PUT /api/GrupoAcesso/{id}
Content-Type: application/json

{
  "id": 1,
  "nome": "Grupo Atualizado",
  "descricao": "Nova descrição"
}
```

#### Adicionar Permissão ao Grupo
```http
POST /api/GrupoAcesso/{id}/permissoes
Content-Type: application/json

{
  "permissaoId": 1,
  "apenasProprios": false,
  "apenasFilial": true,
  "apenasLeitura": false,
  "incluirSituacoesEspecificas": false,
  "situacoesEspecificas": null
}
```

### 3. **Informações Auxiliares**

#### Listar Filiais
```http
GET /api/Info/filiais
```

#### Listar Consultores
```http
GET /api/Info/consultores
```

#### Listar Consultores por Filial
```http
GET /api/Info/consultores/filial/{filialId}
```

#### Listar Grupos de Acesso (Simplificado)
```http
GET /api/Info/grupos-acesso
```

#### Listar Permissões por Módulo
```http
GET /api/Info/permissoes
```

#### Listar Situações de Contrato
```http
GET /api/Info/situacoes-contrato
```

#### Listar Tipos de Pessoa
```http
GET /api/Info/tipos-pessoa
```

## 🎯 Grupos de Acesso Implementados

### 1. **Administrador**
- **Acesso**: Total ao sistema
- **Menu**: Todos os itens disponíveis
- **Restrições**: Nenhuma

### 2. **Faturamento**
- **Acesso**: Quase total (exceto edição de usuários)
- **Menu**: Todos os itens exceto "Grupos de Acesso"
- **Restrições**: Não pode editar usuários

### 3. **Cobrança/Financeiro**
- **Acesso**: Apenas visualização de todas as filiais
- **Menu**: Todos os itens (somente leitura)
- **Restrições**: Não pode incluir, editar ou excluir

### 4. **Gestor de Filial**
- **Acesso**: Total aos dados da sua filial
- **Menu**: Todos os itens exceto "Usuários" e "Grupos de Acesso"
- **Restrições**: Apenas dados da sua filial

### 5. **Administrativo de Filial**
- **Acesso**: Visualização dos dados da sua filial
- **Menu**: Todos os itens (somente leitura)
- **Restrições**: Apenas dados da sua filial, somente leitura

### 6. **Consultores**
- **Acesso**: Pessoa física/jurídica, clientes próprios e situações específicas
- **Menu**: Dashboard, Pessoas, Clientes, Contratos, Boletos
- **Restrições**: 
  - Só pode ver clientes que cadastrou
  - Só pode ver clientes importados
  - Só pode ver clientes com contratos "Sem interesse" ou "Não encontrado"

### 7. **Usuário**
- **Acesso**: Nenhum até ser alocado
- **Menu**: Apenas "Aguardando Alocação"
- **Restrições**: Não pode acessar nenhuma funcionalidade

## 🔧 Implementação no Frontend

### 1. **Sistema de Autenticação**

```typescript
// Exemplo de serviço de autenticação
class AuthService {
  async login(login: string, senha: string) {
    const response = await fetch('/api/Auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, senha })
    });
    
    if (response.ok) {
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
    throw new Error('Login falhou');
  }

  async getUserPermissions(userId: number) {
    const response = await fetch(`/api/Auth/usuario/${userId}/permissoes`);
    return response.json();
  }

  async getUserMenu(userId: number) {
    const response = await fetch(`/api/Auth/usuario/${userId}/menu`);
    return response.json();
  }
}
```

### 2. **Sistema de Menu Dinâmico**

```typescript
// Exemplo de componente de menu
const MenuComponent = () => {
  const [menu, setMenu] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.usuarioId) {
      authService.getUserMenu(user.usuarioId)
        .then(menuData => setMenu(menuData.menu));
    }
  }, [user.usuarioId]);

  return (
    <nav>
      {menu.map(item => (
        <NavLink key={item.rota} to={item.rota}>
          <Icon name={item.icone} />
          {item.nome}
        </NavLink>
      ))}
    </nav>
  );
};
```

### 3. **Controle de Acesso por Rota**

```typescript
// Exemplo de componente de rota protegida
const ProtectedRoute = ({ children, requiredPermission }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.grupoAcesso === 'Usuário') {
    return <Navigate to="/aguardando" />;
  }

  // Verificar permissão específica se necessário
  if (requiredPermission) {
    // Implementar verificação de permissão
  }

  return children;
};
```

### 4. **Filtros por Grupo de Acesso**

```typescript
// Exemplo de filtro de dados baseado no grupo
const useFilteredData = (endpoint: string) => {
  const [data, setData] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        // Aplicar filtros baseados no grupo do usuário
        const filteredData = filterDataByUserGroup(data, user);
        setData(filteredData);
      });
  }, [endpoint, user.grupoAcesso]);

  return data;
};
```

## 📱 Telas Necessárias

### 1. **Tela de Login**
- Campo de login (CPF, CNPJ ou Login)
- Campo de senha
- Botão de login
- Tratamento de erros

### 2. **Dashboard Principal**
- Informações do usuário logado
- Menu dinâmico baseado no grupo
- Cards com informações relevantes

### 3. **Tela de Aguardando Alocação**
- Para usuários do grupo "Usuário"
- Mensagem explicativa
- Informações de contato

### 4. **Gerenciamento de Usuários** (Admin/Faturamento)
- Lista de usuários
- Formulário de criação/edição
- Seleção de grupo de acesso
- Seleção de filial
- Seleção de consultor (se aplicável)

### 5. **Gerenciamento de Grupos** (Admin)
- Lista de grupos
- Formulário de criação/edição
- Gerenciamento de permissões
- Visualização de usuários por grupo

## 🔒 Regras de Negócio para Implementar

### 1. **Consultores**
- Só podem ver clientes que cadastraram
- Podem ver clientes importados
- Podem ver clientes com contratos "Sem interesse" ou "Não encontrado"
- Só podem editar clientes que cadastraram

### 2. **Gestor de Filial**
- Só podem ver dados da sua filial
- Podem gerenciar consultores da sua filial
- Podem gerenciar parceiros da sua filial

### 3. **Administrativo de Filial**
- Só podem visualizar dados da sua filial
- Não podem incluir, editar ou excluir

### 4. **Cobrança/Financeiro**
- Podem visualizar dados de todas as filiais
- Não podem incluir, editar ou excluir

### 5. **Faturamento**
- Podem ver e editar tudo exceto usuários
- Podem visualizar usuários mas não editar

## 🚨 Pontos de Atenção

### 1. **Segurança**
- Sempre validar permissões no frontend
- O backend já implementa todas as validações
- Usar HTTPS em produção

### 2. **Performance**
- Cachear informações do usuário
- Cachear menu e permissões
- Implementar loading states

### 3. **UX/UI**
- Mostrar mensagens claras para usuários sem acesso
- Implementar breadcrumbs
- Usar ícones consistentes

### 4. **Responsividade**
- Menu deve funcionar em mobile
- Formulários devem ser responsivos
- Tabelas devem ser scrolláveis

## 📞 Suporte

Se houver dúvidas sobre a implementação:

1. **Verificar endpoints**: Use o Swagger em `/swagger` (se disponível)
2. **Testar APIs**: Use Postman ou similar
3. **Logs**: Verificar console do navegador e logs do backend
4. **Documentação**: Consultar `GRUPOS_ACESSO_README.md` para detalhes técnicos

## ✅ Checklist de Implementação

- [ ] Sistema de login implementado
- [ ] Menu dinâmico funcionando
- [ ] Controle de acesso por rota
- [ ] Filtros de dados por grupo
- [ ] Tela de gerenciamento de usuários
- [ ] Tela de gerenciamento de grupos (se Admin)
- [ ] Tratamento de erros
- [ ] Loading states
- [ ] Responsividade
- [ ] Testes de integração

## 🎉 Conclusão

O backend está 100% funcional e pronto para integração. Todos os endpoints estão disponíveis e testados. O sistema de grupos de acesso implementa exatamente as regras de negócio especificadas.

**Próximos passos:**
1. Implementar autenticação no frontend
2. Criar menu dinâmico
3. Implementar controle de acesso
4. Criar telas de gerenciamento
5. Testar integração completa

Boa sorte com a implementação! 🚀
