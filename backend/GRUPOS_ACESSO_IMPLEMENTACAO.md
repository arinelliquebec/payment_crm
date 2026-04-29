# Sistema de Grupos de Acesso - Implementação Completa

## Visão Geral

O sistema de grupos de acesso foi implementado com 7 grupos principais, cada um com permissões específicas conforme solicitado:

## Grupos Implementados

### 1. Usuario
- **Descrição**: Usuário sem grupo de acesso - não tem permissões até ser alocado em um grupo
- **Permissões**: Nenhuma
- **Comportamento**: Ao fazer login, recebe mensagem "Sem grupo de acesso não terá permissão. Contate um administrador."

### 2. Administrador
- **Descrição**: Acesso total ao sistema
- **Permissões**: Todas as permissões em todos os módulos
- **Restrições**: Nenhuma

### 3. Consultores
- **Descrição**: Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato
- **Permissões**:
  - PessoaFisica: Total (Visualizar, Incluir, Editar, Excluir)
  - PessoaJuridica: Total (Visualizar, Incluir, Editar, Excluir)
  - Cliente: Apenas da mesma filial, sem contrato ou com situações "Sem interesse" e "Não encontrado"

### 4. Administrativo de Filial
- **Descrição**: Apenas visualização de consultores, clientes e contratos da sua filial
- **Permissões**:
  - Consultor: Apenas visualização da mesma filial
  - Cliente: Apenas visualização da mesma filial
  - Contrato: Apenas visualização da mesma filial
- **Restrições**: Apenas leitura (não pode incluir, editar ou excluir)

### 5. Gestor de Filial
- **Descrição**: Edita, inclui e exclui em todo o sistema porém somente na sua filial
- **Permissões**: Todas as ações em todos os módulos, mas apenas na sua filial
- **Restrições**: Apenas registros da mesma filial

### 6. Cobrança e Financeiro
- **Descrição**: Acesso total para visualizar todo o sistema (aba usuários oculta)
- **Permissões**: Todas as permissões exceto módulo Usuario
- **Restrições**: Não pode acessar módulo de usuários

### 7. Faturamento
- **Descrição**: Acesso similar ao administrador exceto módulo de usuários
- **Permissões**: Todas as permissões exceto módulo Usuario
- **Restrições**: Não pode acessar módulo de usuários

## Arquivos Criados/Modificados

### 1. Scripts SQL
- `create_grupos_acesso_completos.sql`: Script completo para criar grupos e permissões

### 2. Serviços
- `Services/PermissionService.cs`: Serviço principal para verificação de permissões
- `Program.cs`: Registro do serviço de permissões

### 3. Atributos de Autorização
- `Attributes/AuthorizePermissionSimpleAttribute.cs`: Atributo para verificar permissões específicas
- `Attributes/AuthorizeGroupAttribute.cs`: Atributo para verificar grupos específicos

### 4. Controllers
- `Controllers/PermissionController.cs`: Controller para gerenciar permissões
- `Controllers/ClienteControllerWithPermissions.cs`: Exemplo de implementação com permissões

### 5. Migration
- Migration criada: `CreateGruposAcessoAndPermissions`

## Como Usar

### 1. Aplicar as Permissões

```csharp
[HttpGet]
[AuthorizePermissionSimple("Cliente", "Visualizar")]
public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
{
    // Implementação com verificação de permissões
}
```

### 2. Verificar Grupo Específico

```csharp
[HttpGet]
[AuthorizeGroup("Administrador", "Faturamento")]
public async Task<ActionResult> GetDadosSensiveis()
{
    // Apenas administradores e faturamento podem acessar
}
```

### 3. Verificar Permissões Programaticamente

```csharp
public async Task<ActionResult> MinhaAcao()
{
    var userId = GetCurrentUserId();
    var hasPermission = await _permissionService.HasPermissionAsync(userId, "Cliente", "Editar");
    
    if (!hasPermission)
        return Forbid();
    
    // Continuar com a ação
}
```

### 4. Verificar Acesso a Registro Específico

```csharp
public async Task<ActionResult> EditarCliente(int id)
{
    var userId = GetCurrentUserId();
    var canAccess = await _permissionService.CanAccessRecordAsync(userId, "Cliente", id);
    
    if (!canAccess)
        return Forbid("Usuário não tem permissão para acessar este cliente");
    
    // Continuar com a edição
}
```

## Endpoints de Verificação

### 1. Status do Usuário
```
GET /api/permission/user-status
```
Retorna informações sobre o usuário logado, seu grupo e permissões.

### 2. Verificar Permissão
```
GET /api/permission/check-permission/{modulo}/{acao}
```
Verifica se o usuário tem uma permissão específica.

### 3. Verificar Acesso a Registro
```
GET /api/permission/can-access/{modulo}/{recordId}
```
Verifica se o usuário pode acessar um registro específico.

### 4. Listar Grupos (Apenas Admin/Faturamento)
```
GET /api/permission/grupos
```
Lista todos os grupos e suas permissões.

### 5. Listar Permissões (Apenas Admin/Faturamento)
```
GET /api/permission/permissoes
```
Lista todas as permissões disponíveis no sistema.

## Regras de Negócio Implementadas

### Consultores
- Podem ver clientes sem contrato
- Podem ver clientes com situações "Sem interesse" e "Não encontrado"
- Acesso restrito à mesma filial

### Administrativo de Filial
- Apenas visualização
- Restrito à mesma filial
- Não pode incluir, editar ou excluir

### Gestor de Filial
- Acesso total mas restrito à mesma filial
- Pode incluir, editar e excluir

### Cobrança e Financeiro / Faturamento
- Acesso total exceto módulo de usuários
- Podem ver todos os dados do sistema

## Próximos Passos

1. **Executar o Script SQL**: Execute `create_grupos_acesso_completos.sql` no banco de dados
2. **Aplicar Migration**: Execute `dotnet ef database update`
3. **Atualizar Controllers**: Aplicar os atributos de autorização nos controllers existentes
4. **Testar Permissões**: Usar os endpoints de verificação para testar o sistema
5. **Configurar Frontend**: Implementar verificação de permissões no frontend

## Observações Importantes

- O sistema verifica permissões tanto por módulo/ação quanto por registro específico
- As regras de filial são aplicadas automaticamente baseadas no grupo do usuário
- Usuários sem grupo recebem mensagem específica ao fazer login
- O sistema é extensível - novos grupos e permissões podem ser adicionados facilmente
