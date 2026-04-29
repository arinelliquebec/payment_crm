/**
 * API Endpoints centralizados
 * Facilita manutenção e evita strings mágicas
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/Auth/login",
    LOGOUT: "/Auth/logout",
    REFRESH: "/Auth/refresh",
    ME: "/Auth/me",
  },

  // Usuários
  USUARIOS: {
    BASE: "/Usuario",
    BY_ID: (id: number) => `/Usuario/${id}`,
    CREATE: "/Usuario/create",
    PESSOAS_FISICAS: "/Usuario/pessoas-fisicas",
    PESSOAS_JURIDICAS: "/Usuario/pessoas-juridicas",
    OPTIONS_FILIAIS: "/Usuario/options/filiais",
  },

  // Clientes
  CLIENTES: {
    BASE: "/Cliente",
    BY_ID: (id: number) => `/Cliente/${id}`,
    HISTORICO: (id: number) => `/Cliente/${id}/historico`,
  },

  // Contratos
  CONTRATOS: {
    BASE: "/Contrato",
    BY_ID: (id: number) => `/Contrato/${id}`,
    BY_CLIENTE: (clienteId: number) => `/Contrato/cliente/${clienteId}`,
  },

  // Pessoa Física
  PESSOA_FISICA: {
    BASE: "/PessoaFisica",
    BY_ID: (id: number) => `/PessoaFisica/${id}`,
    BY_CPF: (cpf: string) => `/PessoaFisica/cpf/${cpf}`,
  },

  // Pessoa Jurídica
  PESSOA_JURIDICA: {
    BASE: "/PessoaJuridica",
    BY_ID: (id: number) => `/PessoaJuridica/${id}`,
    BY_CNPJ: (cnpj: string) => `/PessoaJuridica/cnpj/${cnpj}`,
  },

  // Consultores
  CONSULTORES: {
    BASE: "/Consultor",
    BY_ID: (id: number) => `/Consultor/${id}`,
    HISTORICO: (id: number) => `/Consultor/${id}/historico`,
  },

  // Filiais
  FILIAIS: {
    BASE: "/Filial",
    BY_ID: (id: number) => `/Filial/${id}`,
  },

  // Parceiros
  PARCEIROS: {
    BASE: "/Parceiro",
    BY_ID: (id: number) => `/Parceiro/${id}`,
  },

  // Boletos
  BOLETOS: {
    BASE: "/Boleto",
    BY_ID: (id: number) => `/Boleto/${id}`,
    BY_CONTRATO: (contratoId: number) => `/Boleto/contrato/${contratoId}`,
    DASHBOARD: "/Boleto/dashboard",
  },

  // Grupos de Acesso
  GRUPOS_ACESSO: {
    BASE: "/GrupoAcesso",
    BY_ID: (id: number) => `/GrupoAcesso/${id}`,
    PERMISSOES: (id: number) => `/GrupoAcesso/${id}/permissoes`,
  },

  // Permissões
  PERMISSOES: {
    BASE: "/Permissao",
    BY_ID: (id: number) => `/Permissao/${id}`,
    USER: (userId: number) => `/Permissao/usuario/${userId}`,
  },

  // Sessões Ativas
  SESSOES: {
    BASE: "/SessaoAtiva",
    REGISTRAR: "/SessaoAtiva/registrar",
    ATUALIZAR: (id: number) => `/SessaoAtiva/atualizar/${id}`,
    REMOVER: (id: number) => `/SessaoAtiva/remover/${id}`,
  },

  // Estatísticas
  ESTATISTICAS: {
    DASHBOARD: "/Estatisticas/dashboard",
    CLIENTES: "/Estatisticas/clientes",
    CONTRATOS: "/Estatisticas/contratos",
  },

  // Logs de Atividade
  LOGS: {
    BASE: "/LogAtividade",
    BY_USER: (userId: number) => `/LogAtividade/usuario/${userId}`,
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
