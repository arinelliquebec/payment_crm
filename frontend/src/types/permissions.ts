// Tipos para o sistema de permissões do CRM Arrighi

export interface Permissao {
  id: number;
  nome: string;
  descricao?: string;
  modulo: string;
  acao: string;
  ativo: boolean;
  dataCadastro: string;
}

export interface PermissaoGrupo {
  id: number;
  grupoAcessoId: number;
  permissaoId: number;
  apenasProprios: boolean;
  apenasFilial: boolean;
  apenasLeitura: boolean;
  incluirSituacoesEspecificas: boolean;
  situacoesEspecificas?: string;
  dataCadastro: string;
  permissao: Permissao;
}

export interface GrupoAcesso {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao?: string;
  permissoes: PermissaoGrupo[];
}

export interface UsuarioPermissoes {
  usuarioId: number;
  nome: string;
  login: string;
  grupo: string;
  filial?: string;
  semPermissao: boolean;
  mensagem?: string;
  permissoes: string[];
}

export interface PermissaoDetalhada {
  modulo: string;
  acao: string;
  apenasProprios: boolean;
  apenasFilial: boolean;
  apenasLeitura: boolean;
  incluirSituacoesEspecificas: boolean;
  situacoesEspecificas?: string[];
}

export interface VerificacaoPermissao {
  hasPermission: boolean;
  permission?: PermissaoDetalhada;
}

// Tipos para navegação
export interface RotaPermissao {
  path: string;
  modulo: string;
  acao: string;
  label: string;
  icon?: string;
  children?: RotaPermissao[];
}

// Tipos para cache de permissões
export interface CachePermissoes {
  usuarioId: number;
  permissoes: UsuarioPermissoes;
  timestamp: number;
  expiraEm: number;
}

// Constantes para módulos e ações
export const MODULOS = {
  PESSOA_FISICA: "PessoaFisica",
  PESSOA_JURIDICA: "PessoaJuridica",
  CLIENTE: "Cliente",
  CONTRATO: "Contrato",
  CONSULTOR: "Consultor",
  USUARIO: "Usuario",
  FILIAL: "Filial",
  PARCEIRO: "Parceiro",
  BOLETO: "Boleto",
  GRUPO_ACESSO: "GrupoAcesso",
} as const;

export const ACÕES = {
  VISUALIZAR: "Visualizar",
  INCLUIR: "Incluir",
  EDITAR: "Editar",
  EXCLUIR: "Excluir",
} as const;

export const GRUPOS_ACESSO = {
  USUARIO: "Usuario",
  ADMINISTRADOR: "Administrador",
  CONSULTORES: "Consultores",
  ADMINISTRATIVO_FILIAL: "Administrativo de Filial",
  GESTOR_FILIAL: "Gestor de Filial",
  COBRANCA_FINANCEIRO: "Cobrança e Financeiro",
  FATURAMENTO: "Faturamento",
} as const;

// Tipos para filtros por filial
export interface FiltroFilial {
  filialId: number;
  nome: string;
}

// Tipos para situações específicas
export interface SituacaoEspecifica {
  codigo: string;
  descricao: string;
}

export type ModuloType = (typeof MODULOS)[keyof typeof MODULOS];
export type AcaoType = (typeof ACÕES)[keyof typeof ACÕES];
export type GrupoAcessoType =
  (typeof GRUPOS_ACESSO)[keyof typeof GRUPOS_ACESSO];
