import {
  UsuarioPermissoes,
  VerificacaoPermissao,
  GrupoAcesso,
  Permissao,
  CachePermissoes,
  ModuloType,
  AcaoType,
  RotaPermissao,
  FiltroFilial,
} from "@/types/permissions";
import { apiClient } from "@/lib/api";

class PermissionService {
  private cache: CachePermissoes | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly CACHE_KEY = "crm_permissions_cache";

  constructor() {
    // Only load from storage if running in browser (prevents SSR errors)
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  /**
   * Carrega as permissões do usuário logado
   */
  async getUserPermissions(): Promise<UsuarioPermissoes> {
    // Verificar se há usuário autenticado primeiro
    const isAuthenticated =
      typeof window !== "undefined"
        ? localStorage.getItem("isAuthenticated") === "true"
        : false;

    if (!isAuthenticated) {
      console.warn("Usuário não autenticado, retornando permissões vazias");
      return this.getEmptyPermissions();
    }

    // Verificar cache primeiro
    if (this.isCacheValid()) {
      return this.cache!.permissoes;
    }

    try {
      const response = await apiClient.get<UsuarioPermissoes>(
        "/Permission/user-status"
      );

      if (response.error) {
        // Verificar se é um erro relacionado a permissões/sessão
        const errorMessage = response.error.toLowerCase();
        const isPermissionError = [
          "sessões ativas",
          "sessao",
          "permissão",
          "permissao",
          "autorização",
          "autorizacao",
          "acesso negado",
          "unauthorized",
          "forbidden",
          "usuário não identificado",
          "usuario nao identificado",
          "user not found",
          "erro ao contar sessões",
          "erro ao buscar sessões",
          "erro ao contar sessoes",
          "erro ao buscar sessoes",
        ].some((keyword) => errorMessage.includes(keyword));

        if (isPermissionError) {
          console.warn(
            "Erro de permissão/sessão detectado, retornando permissões vazias:",
            response.error
          );
          return this.getEmptyPermissions();
        }

        throw new Error(`Erro ao obter permissões: ${response.error}`);
      }

      if (!response.data) {
        throw new Error("Resposta vazia do servidor");
      }

      const permissoes: UsuarioPermissoes = response.data;

      // Salvar no cache
      this.saveToCache(permissoes);

      return permissoes;
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);

      // Em caso de erro, retornar permissões vazias para evitar quebrar a aplicação
      return this.getEmptyPermissions();
    }
  }

  /**
   * Retorna permissões vazias para usuário não autenticado
   */
  private getEmptyPermissions(): UsuarioPermissoes {
    return {
      usuarioId: 0,
      nome: "Usuário não autenticado",
      login: "guest",
      grupo: "Usuario",
      filial: undefined,
      semPermissao: true,
      mensagem: "Usuário não autenticado ou sessão expirada",
      permissoes: [],
    };
  }

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  async hasPermission(modulo: ModuloType, acao: AcaoType): Promise<boolean> {
    try {
      const permissoes = await this.getUserPermissions();

      if (permissoes.semPermissao) {
        return false;
      }

      const permissaoCompleta = `${modulo}_${acao}`;
      return permissoes.permissoes.includes(permissaoCompleta);
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return false;
    }
  }

  /**
   * Verifica permissão específica com detalhes
   */
  async checkPermission(
    modulo: ModuloType,
    acao: AcaoType
  ): Promise<VerificacaoPermissao> {
    try {
      const response = await apiClient.get<boolean>(
        `/Permission/check-permission/${modulo}/${acao}`
      );

      if (response.error) {
        return { hasPermission: false };
      }

      return { hasPermission: response.data || false };
    } catch (error) {
      console.error("Erro ao verificar permissão detalhada:", error);
      return { hasPermission: false };
    }
  }

  /**
   * Verifica se pode acessar um registro específico
   */
  async canAccessRecord(
    modulo: ModuloType,
    recordId: number
  ): Promise<boolean> {
    try {
      const response = await apiClient.get<boolean>(
        `/Permission/can-access/${modulo}/${recordId}`
      );

      if (response.error) {
        return false;
      }

      return response.data || false;
    } catch (error) {
      console.error("Erro ao verificar acesso ao registro:", error);
      return false;
    }
  }

  /**
   * Métodos de conveniência para ações específicas
   */
  async canView(modulo: ModuloType): Promise<boolean> {
    return this.hasPermission(modulo, "Visualizar");
  }

  async canCreate(modulo: ModuloType): Promise<boolean> {
    return this.hasPermission(modulo, "Incluir");
  }

  async canEdit(modulo: ModuloType): Promise<boolean> {
    return this.hasPermission(modulo, "Editar");
  }

  async canDelete(modulo: ModuloType): Promise<boolean> {
    return this.hasPermission(modulo, "Excluir");
  }

  /**
   * Verifica se é apenas leitura para um módulo
   */
  async isReadOnly(modulo: ModuloType): Promise<boolean> {
    const permissoes = await this.getUserPermissions();

    if (permissoes.semPermissao) {
      return true;
    }

    // Se tem permissão de editar, não é apenas leitura
    const podeEditar = await this.canEdit(modulo);
    return !podeEditar;
  }

  /**
   * Verifica se tem restrição de filial
   */
  async isFilialOnly(modulo: ModuloType): Promise<boolean> {
    const permissoes = await this.getUserPermissions();

    if (permissoes.semPermissao) {
      return false;
    }

    // Verificar se o grupo tem restrição de filial
    const gruposComRestricao = [
      "Gestor de Filial",
      "Administrativo de Filial",
      "Consultores",
    ];
    return gruposComRestricao.includes(permissoes.grupo);
  }

  /**
   * Obtém a filial do usuário atual
   */
  async getCurrentUserFilial(): Promise<FiltroFilial | null> {
    const permissoes = await this.getUserPermissions();

    if (!permissoes.filial) {
      return null;
    }

    // Aqui você pode implementar lógica para obter o ID da filial
    // Por enquanto, retornamos apenas o nome
    return {
      filialId: 0, // Implementar lógica para obter ID real
      nome: permissoes.filial,
    };
  }

  /**
   * Obtém grupos de acesso disponíveis
   */
  async getGruposAcesso(): Promise<GrupoAcesso[]> {
    try {
      const response = await apiClient.get<GrupoAcesso[]>("/Permission/grupos");

      if (response.error) {
        throw new Error(`Erro ao obter grupos: ${response.error}`);
      }

      return response.data || [];
    } catch (error) {
      console.error("Erro ao carregar grupos de acesso:", error);
      return [];
    }
  }

  /**
   * Obtém todas as permissões disponíveis
   */
  async getPermissoes(): Promise<Permissao[]> {
    try {
      const response = await apiClient.get<any[]>("/Permission/permissoes");

      if (response.error) {
        throw new Error(`Erro ao obter permissões: ${response.error}`);
      }

      const result = response.data || [];
      // Transformar a estrutura retornada em array de permissões
      const permissoes: Permissao[] = [];
      result.forEach((modulo: any) => {
        modulo.acoes.forEach((acao: any) => {
          permissoes.push({
            id: acao.id,
            nome: acao.nome,
            descricao: acao.descricao,
            modulo: modulo.modulo,
            acao: acao.acao,
            ativo: true,
            dataCadastro: new Date().toISOString(),
          });
        });
      });

      return permissoes;
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
      return [];
    }
  }

  /**
   * Obtém rotas disponíveis baseadas nas permissões
   */
  async getAvailableRoutes(): Promise<RotaPermissao[]> {
    const permissoes = await this.getUserPermissions();

    if (permissoes.semPermissao) {
      return [];
    }

    const rotas: RotaPermissao[] = [
      {
        path: "/pessoas-fisicas",
        modulo: "PessoaFisica",
        acao: "Visualizar",
        label: "Pessoas Físicas",
        icon: "User",
      },
      {
        path: "/pessoas-juridicas",
        modulo: "PessoaJuridica",
        acao: "Visualizar",
        label: "Pessoas Jurídicas",
        icon: "Building",
      },
      {
        path: "/clientes",
        modulo: "Cliente",
        acao: "Visualizar",
        label: "Clientes",
        icon: "Users",
      },
      {
        path: "/contratos",
        modulo: "Contrato",
        acao: "Visualizar",
        label: "Contratos",
        icon: "FileText",
      },
      {
        path: "/consultores",
        modulo: "Consultor",
        acao: "Visualizar",
        label: "Consultores",
        icon: "UserCheck",
      },
      {
        path: "/usuarios",
        modulo: "Usuario",
        acao: "Visualizar",
        label: "Usuários",
        icon: "UserCog",
      },
      {
        path: "/filiais",
        modulo: "Filial",
        acao: "Visualizar",
        label: "Filiais",
        icon: "Building2",
      },
      {
        path: "/parceiros",
        modulo: "Parceiro",
        acao: "Visualizar",
        label: "Parceiros",
        icon: "Handshake",
      },
      {
        path: "/boletos",
        modulo: "Boleto",
        acao: "Visualizar",
        label: "Boletos",
        icon: "Receipt",
      },
      {
        path: "/grupos-acesso",
        modulo: "GrupoAcesso",
        acao: "Visualizar",
        label: "Grupos de Acesso",
        icon: "Shield",
      },
    ];

    return rotas.filter((rota) =>
      permissoes.permissoes.includes(`${rota.modulo}_${rota.acao}`)
    );
  }

  /**
   * Invalida o cache de permissões
   */
  invalidateCache(): void {
    this.cache = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  /**
   * Verifica se o cache é válido
   */
  private isCacheValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const now = Date.now();
    return now < this.cache.expiraEm;
  }

  /**
   * Salva as permissões no cache
   */
  private saveToCache(permissoes: UsuarioPermissoes): void {
    const now = Date.now();
    this.cache = {
      usuarioId: permissoes.usuarioId,
      permissoes,
      timestamp: now,
      expiraEm: now + this.CACHE_DURATION,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      } catch (error) {
        console.warn("Erro ao salvar cache no localStorage:", error);
      }
    }
  }

  /**
   * Carrega o cache do localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);

        // Verificar se o cache ainda é válido
        if (!this.isCacheValid()) {
          this.cache = null;
          localStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn("Erro ao carregar cache do localStorage:", error);
      this.cache = null;
    }
  }
}

// Instância singleton
export const permissionService = new PermissionService();
export default permissionService;
