# Sistema de Grupos de Acesso - Implementação Completa

## Visão Geral

O sistema de grupos de acesso foi implementado para controlar o acesso a diferentes módulos e telas do sistema baseado no grupo do usuário. Cada grupo tem permissões específicas e restrições definidas.

## Grupos de Acesso Disponíveis

| ID | Nome | Descrição | Permissões |
|---|---|---|---|
| 1 | Usuario | Usuário sem grupo de acesso | Nenhuma permissão até ser alocado em um grupo |
| 2 | Administrador | Acesso total ao sistema | Todas as permissões |
| 3 | Consultores | Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato | PessoaFisica, PessoaJuridica (total), Cliente (filial + situações específicas) |
| 4 | Administrativo de Filial | Apenas visualização de consultores, clientes e contratos da sua filial | Consultor, Cliente, Contrato (apenas visualização, apenas filial) |
| 5 | Gestor de Filial | Edita, inclui e exclui em todo o sistema porém somente na sua filial | Todos os módulos exceto Usuario (apenas filial) |
| 6 | Cobrança e Financeiro | Acesso total para visualizar todo o sistema (aba usuários oculta) | Todos os módulos exceto Usuario |
| 7 | Faturamento | Acesso similar ao administrador exceto módulo de usuários | Todos os módulos exceto Usuario |

## Arquivos Implementados

### Backend

1. **`backend/Services/GroupAccessService.cs`**
   - Serviço principal para gerenciar grupos de acesso
   - Define permissões e restrições para cada grupo
   - Métodos para verificar acesso a módulos e telas

2. **`backend/Controllers/GroupAccessController.cs`**
   - Controller REST para expor funcionalidades de grupos de acesso
   - Endpoints para verificar permissões e obter informações do grupo

3. **`backend/Program.cs`**
   - Registro do serviço `IGroupAccessService`

### Frontend

1. **`frontend/src/types/groupAccess.ts`**
   - Tipos TypeScript para grupos de acesso
   - Constantes para grupos, módulos e telas
   - Mapeamentos entre módulos e telas

2. **`frontend/src/services/groupAccess.service.ts`**
   - Serviço frontend para interagir com a API de grupos
   - Cache de informações de grupo
   - Métodos para verificar permissões

3. **`frontend/src/hooks/useGroupAccess.ts`**
   - Hooks React para usar o sistema de grupos
   - Hooks para verificar acesso, obter informações, etc.

4. **`frontend/src/components/guards/GroupAccessGuard.tsx`**
   - Componentes de guard para proteger rotas e telas
   - Guards para módulos, telas e grupos válidos

5. **`frontend/src/services/navigation.service.ts`**
   - Atualizado para integrar com grupos de acesso
   - Filtra rotas baseadas no grupo do usuário

6. **`frontend/src/examples/GroupAccessExamples.tsx`**
   - Exemplos de uso do sistema de grupos de acesso

## Como Usar

### 1. Verificar Acesso a uma Tela

```tsx
import { GroupAccessGuard } from "@/components/guards";
import { TELAS } from "@/types/groupAccess";

function MinhaTela() {
  return (
    <GroupAccessGuard screenName={TELAS.USUARIOS}>
      <div>Conteúdo da tela de usuários</div>
    </GroupAccessGuard>
  );
}
```

### 2. Verificar Acesso a um Módulo

```tsx
import { ModuleAccessGuard } from "@/components/guards";
import { MODULOS } from "@/types/groupAccess";

function MeuModulo() {
  return (
    <ModuleAccessGuard moduleName={MODULOS.USUARIO}>
      <div>Conteúdo do módulo de usuários</div>
    </ModuleAccessGuard>
  );
}
```

### 3. Usar Hooks para Verificar Permissões

```tsx
import { useCanAccessScreen, useGroupCharacteristics } from "@/hooks/useGroupAccess";

function MeuComponente() {
  const { canAccess } = useCanAccessScreen("usuarios");
  const { characteristics } = useGroupCharacteristics();

  if (!canAccess) {
    return <div>Acesso negado</div>;
  }

  return (
    <div>
      <h1>Bem-vindo, {characteristics.groupName}</h1>
      {characteristics.isReadOnly && <p>Modo somente leitura</p>}
    </div>
  );
}
```

### 4. Verificar Características do Grupo

```tsx
import { useGroupCharacteristics } from "@/hooks/useGroupAccess";

function Dashboard() {
  const { characteristics } = useGroupCharacteristics();

  return (
    <div>
      {characteristics.isAdmin && <AdminPanel />}
      {characteristics.isConsultor && <ConsultorPanel />}
      {characteristics.shouldHideUsersTab && <p>Usuários ocultos</p>}
    </div>
  );
}
```

### 5. Proteger Navegação

```tsx
import { useAccessibleScreens } from "@/hooks/useGroupAccess";

function Navigation() {
  const { screens } = useAccessibleScreens();

  return (
    <nav>
      {screens.map(screen => (
        <Link key={screen} to={`/${screen}`}>
          {screen}
        </Link>
      ))}
    </nav>
  );
}
```

## Endpoints da API

### GET `/api/GroupAccess/user-info`
Obtém informações completas sobre o grupo de acesso do usuário.

**Resposta:**
```json
{
  "grupoId": 2,
  "grupoNome": "Administrador",
  "descricao": "Acesso total ao sistema",
  "modulosPermitidos": ["PessoaFisica", "PessoaJuridica", "Cliente", "..."],
  "modulosOcultos": [],
  "telasPermitidas": ["pessoas-fisicas", "pessoas-juridicas", "..."],
  "telasOcultas": [],
  "apenasFilial": false,
  "apenasLeitura": false,
  "ocultarAbaUsuarios": false
}
```

### GET `/api/GroupAccess/can-access-module/{modulo}`
Verifica se o usuário pode acessar um módulo específico.

**Resposta:** `true` ou `false`

### GET `/api/GroupAccess/can-access-screen/{screenName}`
Verifica se o usuário pode acessar uma tela específica.

**Resposta:** `true` ou `false`

### GET `/api/GroupAccess/accessible-modules`
Obtém lista de módulos acessíveis.

**Resposta:** `["PessoaFisica", "PessoaJuridica", ...]`

### GET `/api/GroupAccess/accessible-screens`
Obtém lista de telas acessíveis.

**Resposta:** `["pessoas-fisicas", "pessoas-juridicas", ...]`

### GET `/api/GroupAccess/is-module-hidden/{modulo}`
Verifica se um módulo está oculto para o usuário.

**Resposta:** `true` ou `false`

## Características dos Grupos

### Usuario (ID: 1)
- **Permissões:** Nenhuma
- **Restrições:** Todas as telas ocultas
- **Uso:** Usuários sem grupo alocado

### Administrador (ID: 2)
- **Permissões:** Todas
- **Restrições:** Nenhuma
- **Uso:** Acesso total ao sistema

### Consultores (ID: 3)
- **Permissões:** PessoaFisica, PessoaJuridica, Cliente
- **Restrições:** Apenas filial, situações específicas para clientes
- **Uso:** Consultores que trabalham com clientes

### Administrativo de Filial (ID: 4)
- **Permissões:** Consultor, Cliente, Contrato (somente leitura)
- **Restrições:** Apenas filial, somente leitura
- **Uso:** Funcionários administrativos da filial

### Gestor de Filial (ID: 5)
- **Permissões:** Todos exceto Usuario
- **Restrições:** Apenas filial
- **Uso:** Gestores que administram uma filial

### Cobrança e Financeiro (ID: 6)
- **Permissões:** Todos exceto Usuario
- **Restrições:** Somente leitura, usuários ocultos
- **Uso:** Equipe financeira

### Faturamento (ID: 7)
- **Permissões:** Todos exceto Usuario
- **Restrições:** Usuários ocultos
- **Uso:** Equipe de faturamento

## Cache e Performance

- **Cache de 5 minutos** para informações de grupo
- **Invalidação automática** quando necessário
- **Fallbacks seguros** em caso de erro
- **Verificações otimizadas** para melhor performance

## Segurança

- **Verificação dupla:** Permissões + Grupo de acesso
- **Fallback seguro:** Em caso de erro, nega acesso
- **Headers de autenticação:** X-Usuario-Id obrigatório
- **Validação no backend:** Todas as verificações são validadas no servidor

## Exemplos de Uso

Veja o arquivo `frontend/src/examples/GroupAccessExamples.tsx` para exemplos completos de como usar o sistema.

## Próximos Passos

1. **Integrar com rotas do Next.js** para proteção automática
2. **Adicionar middleware** para verificação automática de acesso
3. **Implementar logs** de acesso e tentativas de acesso negado
4. **Adicionar testes** para todos os cenários de grupo
5. **Criar interface** para gerenciar grupos de acesso

## Status

✅ **Implementado e Funcional**
- Sistema de grupos de acesso completo
- Guards e hooks para proteção
- Integração com navegação
- Cache e performance otimizados
- Documentação completa
