# Sistema de Grupos de Acesso - Guia para Frontend

## Visão Geral

O sistema CRM Arrighi implementa um controle de acesso baseado em grupos e permissões. Cada usuário pertence a um grupo que define suas permissões no sistema.

## Estrutura do Sistema

### 1. Grupos de Acesso Disponíveis

| ID | Nome | Descrição | Permissões |
|---|---|---|---|
| 1 | Usuario | Usuário sem grupo de acesso | Nenhuma permissão até ser alocado em um grupo |
| 2 | Administrador | Acesso total ao sistema | Todas as permissões |
| 3 | Consultores | Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato | PessoaFisica, PessoaJuridica (total), Cliente (filial + situações específicas) |
| 4 | Administrativo de Filial | Apenas visualização de consultores, clientes e contratos da sua filial | Consultor, Cliente, Contrato (apenas visualização, apenas filial) |
| 5 | Gestor de Filial | Edita, inclui e exclui em todo o sistema porém somente na sua filial | Todos os módulos exceto Usuario (apenas filial) |
| 6 | Cobrança e Financeiro | Acesso total para visualizar todo o sistema (aba usuários oculta) | Todos os módulos exceto Usuario |
| 7 | Faturamento | Acesso similar ao administrador exceto módulo de usuários | Todos os módulos exceto Usuario |

### 2. Módulos do Sistema

- **PessoaFisica**: Gerenciamento de pessoas físicas
- **PessoaJuridica**: Gerenciamento de pessoas jurídicas
- **Cliente**: Gerenciamento de clientes
- **Contrato**: Gerenciamento de contratos
- **Consultor**: Gerenciamento de consultores
- **Usuario**: Gerenciamento de usuários
- **Filial**: Gerenciamento de filiais
- **Parceiro**: Gerenciamento de parceiros
- **Boleto**: Gerenciamento de boletos
- **GrupoAcesso**: Gerenciamento de grupos de acesso

### 3. Ações Disponíveis

- **Visualizar**: Apenas visualização dos dados
- **Incluir**: Criar novos registros
- **Editar**: Modificar registros existentes
- **Excluir**: Remover registros

## API Endpoints

### Autenticação e Permissões

#### 1. Verificar Permissões do Usuário
```
GET /api/Permission/GetUserPermissions
```
**Resposta:**
```json
{
  "userId": 1,
  "grupoAcesso": {
    "id": 2,
    "nome": "Administrador",
    "descricao": "Acesso total ao sistema"
  },
  "permissoes": [
    {
      "id": 1,
      "nome": "PessoaFisica_Visualizar",
      "descricao": "Visualizar pessoas físicas",
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

#### 2. Verificar Permissão Específica
```
GET /api/Permission/CheckPermission?modulo=PessoaFisica&acao=Visualizar
```
**Resposta:**
```json
{
  "hasPermission": true,
  "permission": {
    "modulo": "PessoaFisica",
    "acao": "Visualizar",
    "apenasProprios": false,
    "apenasFilial": false,
    "apenasLeitura": false
  }
}
```

#### 3. Obter Grupos de Acesso
```
GET /api/GrupoAcesso
```
**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "Usuario",
    "descricao": "Usuário sem grupo de acesso",
    "ativo": true,
    "dataCadastro": "2024-01-01T00:00:00"
  }
]
```

## Implementação no Frontend

### 1. Service de Permissões

```typescript
// permission.service.ts
export class PermissionService {
  private userPermissions: any = null;

  async getUserPermissions(): Promise<any> {
    if (!this.userPermissions) {
      const response = await fetch('/api/Permission/GetUserPermissions');
      this.userPermissions = await response.json();
    }
    return this.userPermissions;
  }

  async hasPermission(modulo: string, acao: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.permissoes.some((p: any) => 
      p.modulo === modulo && p.acao === acao
    );
  }

  async canEdit(modulo: string): Promise<boolean> {
    return this.hasPermission(modulo, 'Editar');
  }

  async canDelete(modulo: string): Promise<boolean> {
    return this.hasPermission(modulo, 'Excluir');
  }

  async canCreate(modulo: string): Promise<boolean> {
    return this.hasPermission(modulo, 'Incluir');
  }

  async canView(modulo: string): Promise<boolean> {
    return this.hasPermission(modulo, 'Visualizar');
  }

  async isReadOnly(modulo: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    const permission = permissions.permissoes.find((p: any) => 
      p.modulo === modulo && p.acao === 'Visualizar'
    );
    return permission?.apenasLeitura || false;
  }

  async isFilialOnly(modulo: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    const permission = permissions.permissoes.find((p: any) => 
      p.modulo === modulo && p.acao === 'Visualizar'
    );
    return permission?.apenasFilial || false;
  }
}
```

### 2. Directives/Components de Controle de Acesso

#### Angular
```typescript
// permission.directive.ts
@Directive({
  selector: '[appPermission]'
})
export class PermissionDirective implements OnInit {
  @Input() appPermission: string = '';
  @Input() appAction: string = 'Visualizar';

  constructor(
    private elementRef: ElementRef,
    private permissionService: PermissionService
  ) {}

  async ngOnInit() {
    const hasPermission = await this.permissionService.hasPermission(
      this.appPermission, 
      this.appAction
    );
    
    if (!hasPermission) {
      this.elementRef.nativeElement.style.display = 'none';
    }
  }
}
```

#### React
```tsx
// PermissionWrapper.tsx
interface PermissionWrapperProps {
  modulo: string;
  acao: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  modulo,
  acao,
  children,
  fallback = null
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    permissionService.hasPermission(modulo, acao).then(setHasPermission);
  }, [modulo, acao]);

  if (hasPermission === null) return <div>Carregando...</div>;
  if (!hasPermission) return <>{fallback}</>;
  return <>{children}</>;
};
```

### 3. Exemplos de Uso

#### Botões Condicionais
```html
<!-- Angular -->
<button 
  *appPermission="'PessoaFisica'; action: 'Incluir'"
  (click)="createPessoaFisica()">
  Nova Pessoa Física
</button>

<button 
  *appPermission="'PessoaFisica'; action: 'Editar'"
  (click)="editPessoaFisica()">
  Editar
</button>

<button 
  *appPermission="'PessoaFisica'; action: 'Excluir'"
  (click)="deletePessoaFisica()">
  Excluir
</button>
```

```tsx
{/* React */}
<PermissionWrapper modulo="PessoaFisica" acao="Incluir">
  <button onClick={createPessoaFisica}>
    Nova Pessoa Física
  </button>
</PermissionWrapper>

<PermissionWrapper modulo="PessoaFisica" acao="Editar">
  <button onClick={editPessoaFisica}>
    Editar
  </button>
</PermissionWrapper>
```

#### Navegação Condicional
```typescript
// navigation.service.ts
export class NavigationService {
  async getAvailableRoutes(): Promise<any[]> {
    const permissions = await this.permissionService.getUserPermissions();
    const routes = [
      { path: '/pessoas-fisicas', modulo: 'PessoaFisica', acao: 'Visualizar' },
      { path: '/pessoas-juridicas', modulo: 'PessoaJuridica', acao: 'Visualizar' },
      { path: '/clientes', modulo: 'Cliente', acao: 'Visualizar' },
      { path: '/contratos', modulo: 'Contrato', acao: 'Visualizar' },
      { path: '/consultores', modulo: 'Consultor', acao: 'Visualizar' },
      { path: '/usuarios', modulo: 'Usuario', acao: 'Visualizar' },
      { path: '/filiais', modulo: 'Filial', acao: 'Visualizar' },
      { path: '/parceiros', modulo: 'Parceiro', acao: 'Visualizar' },
      { path: '/boletos', modulo: 'Boleto', acao: 'Visualizar' },
      { path: '/grupos-acesso', modulo: 'GrupoAcesso', acao: 'Visualizar' }
    ];

    return routes.filter(route => 
      permissions.permissoes.some((p: any) => 
        p.modulo === route.modulo && p.acao === route.acao
      )
    );
  }
}
```

### 4. Filtros por Filial

Para usuários com restrição de filial (`apenasFilial: true`):

```typescript
// filial.service.ts
export class FilialService {
  async getCurrentUserFilial(): Promise<number> {
    // Implementar lógica para obter a filial do usuário logado
    const response = await fetch('/api/Usuario/GetCurrentUser');
    const user = await response.json();
    return user.filialId;
  }

  async filterByFilial<T>(items: T[], filialId: number): Promise<T[]> {
    // Filtrar itens pela filial do usuário
    return items.filter((item: any) => item.filialId === filialId);
  }
}
```

### 5. Situações Específicas

Para o grupo "Consultores" que tem restrições de situações específicas:

```typescript
// contrato.service.ts
export class ContratoService {
  async getContratosForConsultor(): Promise<any[]> {
    const response = await fetch('/api/Contrato/GetForConsultor');
    return response.json();
  }

  // Filtrar contratos com situações específicas
  filterContratosBySituacao(contratos: any[], situacoesPermitidas: string[]): any[] {
    return contratos.filter(contrato => 
      situacoesPermitidas.includes(contrato.situacao)
    );
  }
}
```

## Considerações Importantes

### 1. Cache de Permissões
- Cache as permissões do usuário após o login
- Invalide o cache quando o usuário for reatribuído a outro grupo
- Considere usar localStorage ou sessionStorage

### 2. Segurança
- **NUNCA** confie apenas nas verificações do frontend
- O backend sempre deve validar as permissões
- Use as verificações do frontend apenas para UX (mostrar/ocultar elementos)

### 3. Performance
- Carregue as permissões uma vez após o login
- Use lazy loading para módulos que o usuário não tem acesso
- Implemente loading states durante verificações de permissão

### 4. Tratamento de Erros
```typescript
// error-handler.service.ts
export class ErrorHandlerService {
  handlePermissionError(error: any) {
    if (error.status === 403) {
      // Usuário não tem permissão
      this.router.navigate(['/unauthorized']);
    }
  }
}
```

## Exemplo de Implementação Completa

```typescript
// app.component.ts
export class AppComponent implements OnInit {
  userPermissions: any = null;
  availableRoutes: any[] = [];

  constructor(
    private permissionService: PermissionService,
    private navigationService: NavigationService
  ) {}

  async ngOnInit() {
    try {
      this.userPermissions = await this.permissionService.getUserPermissions();
      this.availableRoutes = await this.navigationService.getAvailableRoutes();
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  }

  async canAccess(route: string): Promise<boolean> {
    const routeConfig = this.availableRoutes.find(r => r.path === route);
    if (!routeConfig) return false;
    
    return this.permissionService.hasPermission(
      routeConfig.modulo, 
      routeConfig.acao
    );
  }
}
```

## Testes

### 1. Testes de Permissão
```typescript
// permission.service.spec.ts
describe('PermissionService', () => {
  it('should return true for admin user', async () => {
    const service = new PermissionService();
    const hasPermission = await service.hasPermission('PessoaFisica', 'Visualizar');
    expect(hasPermission).toBe(true);
  });

  it('should return false for user without permission', async () => {
    const service = new PermissionService();
    const hasPermission = await service.hasPermission('Usuario', 'Visualizar');
    expect(hasPermission).toBe(false);
  });
});
```

Este README fornece todas as informações necessárias para implementar o sistema de permissões no frontend. Adapte os exemplos conforme a tecnologia que estiver usando (Angular, React, Vue, etc.).
