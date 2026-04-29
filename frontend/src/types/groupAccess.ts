/**
 * Tipos para o sistema de grupos de acesso
 */

export interface GroupAccessInfo {
  grupoId: number;
  grupoNome: string;
  descricao: string;
  modulosPermitidos: string[];
  modulosOcultos: string[];
  telasPermitidas: string[];
  telasOcultas: string[];
  apenasFilial: boolean;
  apenasLeitura: boolean;
  ocultarAbaUsuarios: boolean;
}

export interface GroupAccessService {
  canAccessModule(modulo: string): Promise<boolean>;
  canAccessScreen(screenName: string): Promise<boolean>;
  getAccessibleModules(): Promise<string[]>;
  getAccessibleScreens(): Promise<string[]>;
  isModuleHidden(modulo: string): Promise<boolean>;
  getGroupAccessInfo(): Promise<GroupAccessInfo>;
}

/**
 * Constantes para grupos de acesso
 */
export const GRUPOS_ACESSO = {
  USUARIO: {
    id: 1,
    nome: "Usuario",
    descricao: "Usuário sem grupo de acesso",
  },
  ADMINISTRADOR: {
    id: 2,
    nome: "Administrador",
    descricao: "Acesso total ao sistema",
  },
  CONSULTORES: {
    id: 3,
    nome: "Consultores",
    descricao:
      "Acesso a pessoa física/jurídica total, clientes da mesma filial e sem contrato",
  },
  ADMINISTRATIVO_FILIAL: {
    id: 4,
    nome: "Administrativo de Filial",
    descricao:
      "Apenas visualização de consultores, clientes e contratos da sua filial",
  },
  GESTOR_FILIAL: {
    id: 5,
    nome: "Gestor de Filial",
    descricao:
      "Edita, inclui e exclui em todo o sistema porém somente na sua filial",
  },
  COBRANCA_FINANCEIRO: {
    id: 6,
    nome: "Cobrança e Financeiro",
    descricao:
      "Acesso total para visualizar todo o sistema (aba usuários oculta)",
  },
  FATURAMENTO: {
    id: 7,
    nome: "Faturamento",
    descricao: "Acesso similar ao administrador exceto módulo de usuários",
  },
} as const;

/**
 * Constantes para módulos do sistema
 */
export const MODULOS = {
  PESSOA_FISICA: "PessoaFisica",
  PESSOA_JURIDICA: "PessoaJuridica",
  CLIENTE: "Cliente",
  CONTRATO: "Contrato",
  CONSULTOR: "Consultor",
  PARCEIRO: "Parceiro",
  BOLETO: "Boleto",
  USUARIO: "Usuario",
  FILIAL: "Filial",
  GRUPO_ACESSO: "GrupoAcesso",
  PERMISSAO: "Permissao",
} as const;

/**
 * Constantes para telas do sistema
 */
export const TELAS = {
  PESSOAS_FISICAS: "pessoas-fisicas",
  PESSOAS_JURIDICAS: "pessoas-juridicas",
  CLIENTES: "clientes",
  CONTRATOS: "contratos",
  CONSULTORES: "consultores",
  PARCEIROS: "parceiros",
  BOLETOS: "boletos",
  USUARIOS: "usuarios",
  FILIAIS: "filiais",
  GRUPOS_ACESSO: "grupos-acesso",
  PERMISSOES: "permissoes",
} as const;

/**
 * Mapeamento de módulos para telas
 */
export const MODULO_PARA_TELA: Record<string, string> = {
  [MODULOS.PESSOA_FISICA]: TELAS.PESSOAS_FISICAS,
  [MODULOS.PESSOA_JURIDICA]: TELAS.PESSOAS_JURIDICAS,
  [MODULOS.CLIENTE]: TELAS.CLIENTES,
  [MODULOS.CONTRATO]: TELAS.CONTRATOS,
  [MODULOS.CONSULTOR]: TELAS.CONSULTORES,
  [MODULOS.PARCEIRO]: TELAS.PARCEIROS,
  [MODULOS.BOLETO]: TELAS.BOLETOS,
  [MODULOS.USUARIO]: TELAS.USUARIOS,
  [MODULOS.FILIAL]: TELAS.FILIAIS,
  [MODULOS.GRUPO_ACESSO]: TELAS.GRUPOS_ACESSO,
  [MODULOS.PERMISSAO]: TELAS.PERMISSOES,
};

/**
 * Mapeamento de telas para módulos
 */
export const TELA_PARA_MODULO: Record<string, string> = {
  [TELAS.PESSOAS_FISICAS]: MODULOS.PESSOA_FISICA,
  [TELAS.PESSOAS_JURIDICAS]: MODULOS.PESSOA_JURIDICA,
  [TELAS.CLIENTES]: MODULOS.CLIENTE,
  [TELAS.CONTRATOS]: MODULOS.CONTRATO,
  [TELAS.CONSULTORES]: MODULOS.CONSULTOR,
  [TELAS.PARCEIROS]: MODULOS.PARCEIRO,
  [TELAS.BOLETOS]: MODULOS.BOLETO,
  [TELAS.USUARIOS]: MODULOS.USUARIO,
  [TELAS.FILIAIS]: MODULOS.FILIAL,
  [TELAS.GRUPOS_ACESSO]: MODULOS.GRUPO_ACESSO,
  [TELAS.PERMISSOES]: MODULOS.PERMISSAO,
};
