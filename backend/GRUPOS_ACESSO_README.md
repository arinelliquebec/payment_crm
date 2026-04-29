# Sistema de Grupos de Acesso - CRM Arrighi

## Visão Geral

O sistema de grupos de acesso foi implementado para controlar as permissões dos usuários de forma granular, seguindo as regras de negócio específicas definidas para cada grupo.

## Grupos de Acesso Implementados

### 1. **Administrador**
- **Descrição**: Acesso total ao sistema
- **Permissões**: Todas as operações (Visualizar, Incluir, Editar, Excluir) em todos os módulos
- **Restrições**: Nenhuma

### 2. **Usuário**
- **Descrição**: Usuário sem acesso até ser alocado em um grupo de acesso
- **Permissões**: Nenhuma
- **Restrições**: Não pode acessar nenhuma funcionalidade até ser movido para outro grupo

### 3. **Consultores**
- **Descrição**: Acesso a pessoa física e jurídica, clientes próprios e com situações específicas
- **Permissões**:
  - Pessoa Física: Visualizar, Incluir, Editar
  - Pessoa Jurídica: Visualizar, Incluir, Editar
  - Cliente: Visualizar, Incluir, Editar (apenas próprios)
  - Contrato: Visualizar, Incluir, Editar (apenas próprios)
- **Regras Especiais**:
  - Pode ver clientes que cadastrou
  - Pode ver clientes importados
  - Pode ver clientes com contratos nas situações "Sem interesse" e "Não encontrado" (mesmo cadastrados por outros)

### 4. **Administrativo de Filial**
- **Descrição**: Visualização de dados da filial (somente leitura)
- **Permissões**: Apenas Visualizar em todos os módulos
- **Restrições**:
  - Apenas dados da sua filial
  - Não pode incluir, editar ou excluir

### 5. **Gestor de Filial**
- **Descrição**: Acesso total aos dados da filial
- **Permissões**: Todas as operações em todos os módulos
- **Restrições**: Apenas dados da sua filial

### 6. **Cobrança/Financeiro**
- **Descrição**: Visualização de todas as filiais (somente leitura)
- **Permissões**: Apenas Visualizar em todos os módulos
- **Restrições**:
  - Pode ver dados de todas as filiais
  - Não pode incluir, editar ou excluir

### 7. **Faturamento**
- **Descrição**: Quase administrador, exceto edição de usuários
- **Permissões**: Todas as operações em todos os módulos
- **Restrições**: Não pode editar usuários (apenas visualizar)

## Estrutura do Banco de Dados

### Tabelas Criadas

1. **GruposAcesso**: Armazena os grupos de acesso
2. **Permissoes**: Armazena as permissões disponíveis no sistema
3. **PermissoesGrupos**: Tabela de relacionamento entre grupos e permissões com regras específicas

### Campos Adicionados ao Usuario

- `GrupoAcessoId`: Referência ao grupo de acesso
- `FilialId`: Filial do usuário (para controle por filial)
- `ConsultorId`: Consultor associado (se o usuário for um consultor)

## Serviços Implementados

### IAuthorizationService / AuthorizationService

Serviço principal que implementa todas as regras de autorização:

- `HasPermissionAsync()`: Verifica se o usuário tem uma permissão específica
- `CanAccessAsync()`: Verifica acesso com regras específicas por grupo
- `CanViewClienteAsync()`: Verifica se pode visualizar um cliente específico
- `CanEditClienteAsync()`: Verifica se pode editar um cliente específico
- `FilterClientesByUserAsync()`: Filtra clientes baseado nas permissões do usuário
- E métodos similares para Contrato, Consultor, Parceiro, Usuário, PessoaFisica, PessoaJuridica

### ISeedDataService / SeedDataService

Serviço para popular os dados iniciais:

- `SeedGruposAcessoAsync()`: Cria os grupos de acesso
- `SeedPermissoesAsync()`: Cria as permissões do sistema
- `SeedPermissoesGruposAsync()`: Associa permissões aos grupos com regras específicas

## Controllers Criados

### GrupoAcessoController
- `GET /api/GrupoAcesso`: Lista todos os grupos
- `GET /api/GrupoAcesso/{id}`: Busca grupo específico
- `POST /api/GrupoAcesso`: Cria novo grupo
- `PUT /api/GrupoAcesso/{id}`: Atualiza grupo
- `DELETE /api/GrupoAcesso/{id}`: Remove grupo (soft delete)
- `POST /api/GrupoAcesso/{id}/permissoes`: Adiciona permissão ao grupo
- `DELETE /api/GrupoAcesso/{id}/permissoes/{permissaoId}`: Remove permissão do grupo

### PermissaoController
- `GET /api/Permissao`: Lista todas as permissões
- `GET /api/Permissao/por-modulo`: Lista permissões agrupadas por módulo
- `GET /api/Permissao/{id}`: Busca permissão específica
- `POST /api/Permissao`: Cria nova permissão
- `PUT /api/Permissao/{id}`: Atualiza permissão
- `DELETE /api/Permissao/{id}`: Remove permissão (soft delete)

### PermissaoGrupoController
- `GET /api/PermissaoGrupo/grupo/{grupoId}`: Lista permissões de um grupo
- `GET /api/PermissaoGrupo/permissao/{permissaoId}`: Lista grupos de uma permissão
- `POST /api/PermissaoGrupo`: Cria associação grupo-permissão
- `PUT /api/PermissaoGrupo/{id}`: Atualiza associação
- `DELETE /api/PermissaoGrupo/{id}`: Remove associação

## Como Usar

### 1. Executar Migração
```bash
dotnet ef database update --project CadastroPessoas.csproj
```

### 2. Dados Iniciais
Os dados iniciais são criados automaticamente quando a aplicação inicia, através do `SeedDataService`.

### 3. Integração com Controllers Existentes
Para integrar o sistema de autorização nos controllers existentes, adicione as verificações:

```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
{
    var usuarioId = GetCurrentUserId(); // Implementar método para obter ID do usuário logado
    
    if (!await _authorizationService.HasPermissionAsync(usuarioId, "Cliente", "Visualizar"))
        return Forbid();
    
    var clientes = _context.Clientes.AsQueryable();
    var clientesFiltrados = await _authorizationService.FilterClientesByUserAsync(usuarioId, clientes);
    
    return await clientesFiltrados.ToListAsync();
}
```

### 4. Verificações Específicas
Para operações específicas, use os métodos dedicados:

```csharp
[HttpPut("{id}")]
public async Task<IActionResult> PutCliente(int id, Cliente cliente)
{
    var usuarioId = GetCurrentUserId();
    
    if (!await _authorizationService.CanEditClienteAsync(usuarioId, id))
        return Forbid();
    
    // ... resto da lógica
}
```

## Regras de Negócio Implementadas

### Consultores
- Podem ver clientes que cadastraram
- Podem ver clientes importados
- Podem ver clientes com contratos "Sem interesse" ou "Não encontrado"
- Só podem editar clientes que cadastraram

### Gestor de Filial
- Acesso total aos dados da sua filial
- Não pode ver dados de outras filiais

### Administrativo de Filial
- Apenas visualização dos dados da sua filial
- Não pode incluir, editar ou excluir

### Cobrança/Financeiro
- Pode visualizar dados de todas as filiais
- Não pode incluir, editar ou excluir

### Faturamento
- Acesso total exceto edição de usuários
- Pode ver usuários mas não pode editá-los

## Próximos Passos

1. **Implementar Sistema de Autenticação**: Criar sistema de login e JWT tokens
2. **Integrar com Controllers**: Adicionar verificações de permissão em todos os controllers
3. **Interface de Administração**: Criar telas para gerenciar grupos e permissões
4. **Auditoria**: Implementar log de ações dos usuários
5. **Testes**: Criar testes unitários para o sistema de autorização

## Observações Importantes

- O sistema está preparado para ser integrado com um sistema de autenticação
- As verificações de permissão estão comentadas nos controllers (TODO)
- O seed data é executado automaticamente na inicialização da aplicação
- Todas as regras de negócio estão implementadas no `AuthorizationService`
- O sistema suporta soft delete para grupos e permissões
