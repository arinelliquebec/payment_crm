// src/types/api.ts - Adicionar os tipos de Usuario

export interface Endereco {
  id: number;
  cidade: string;
  bairro: string;
  logradouro: string;
  cep: string;
  numero: string;
  complemento?: string;
  estado: string;
}

export interface CreateEnderecoDTO {
  cidade: string;
  bairro: string;
  logradouro: string;
  cep: string;
  numero: string;
  complemento?: string;
  estado: string;
}

export interface PessoaFisica {
  id: number;
  nome: string;
  emailEmpresarial: string;
  emailPessoal?: string;
  codinome?: string;
  sexo: string;
  dataNascimento: string;
  estadoCivil: string;
  cpf: string;
  rg?: string;
  cnh?: string;
  telefone1: string;
  telefone2?: string;
  enderecoId: number;
  endereco: Endereco;
  dataCadastro: string;
  dataAtualizacao?: string;
}

export interface CreatePessoaFisicaDTO {
  nome: string;
  emailEmpresarial: string;
  emailPessoal?: string;
  codinome?: string;
  sexo: string;
  dataNascimento: string;
  estadoCivil: string;
  cpf: string;
  rg?: string;
  cnh?: string;
  telefone1: string;
  telefone2?: string;
  endereco: CreateEnderecoDTO;
}

export interface UpdatePessoaFisicaDTO extends CreatePessoaFisicaDTO {
  id: number;
  enderecoId: number;
}

export interface PessoaJuridica {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  responsavelTecnicoId: number;
  responsavelTecnico: PessoaFisica;
  email: string;
  telefone1: string;
  telefone2?: string;
  telefone3?: string;
  telefone4?: string;
  enderecoId: number;
  endereco: Endereco;
  dataCadastro: string;
  dataAtualizacao?: string;
}

export interface CreatePessoaJuridicaDTO {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  responsavelTecnicoId: number;
  email: string;
  telefone1: string;
  telefone2?: string;
  endereco: CreateEnderecoDTO;
}

export interface UpdatePessoaJuridicaDTO extends CreatePessoaJuridicaDTO {
  id: number;
  enderecoId: number;
}

// Tipos de Usuario - NOVOS
export interface Usuario {
  id: number;
  login: string;
  email: string;
  senha: string;
  grupoAcessoId?: number;
  grupoAcesso?: {
    id: number;
    nome: string;
    descricao: string;
    ativo: boolean;
    dataCadastro: string;
    dataAtualizacao?: string;
  }; // Objeto do grupo (para exibição)
  filialId?: number;
  filial?: {
    id: number;
    nome: string;
    dataInclusao: string;
    usuarioImportacao?: string;
  };
  consultorId?: number;
  consultor?: {
    id: number;
    nome: string;
  };
  tipoPessoa: string; // "Fisica" ou "Juridica"
  pessoaFisicaId?: number;
  pessoaFisica?: PessoaFisica;
  pessoaJuridicaId?: number;
  pessoaJuridica?: PessoaJuridica;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao?: string;
  ultimoAcesso?: string;
}

export interface CreateUsuarioDTO {
  login: string;
  email: string;
  senha: string;
  grupoAcessoId?: number;
  filialId?: number;
  consultorId?: number;
  tipoPessoa: string;
  pessoaFisicaId?: number;
  pessoaJuridicaId?: number;
  ativo?: boolean;
}

export interface UpdateUsuarioDTO extends CreateUsuarioDTO {
  id: number;
}

// Tipos para Login
export interface LoginUsuarioDTO {
  login: string;
  senha: string;
}

export interface LoginResponseDTO {
  message: string;
  usuario: {
    id: number;
    login: string;
    email: string;
    grupoAcesso: string;
    tipoPessoa: string;
    nome: string;
    ativo: boolean;
    ultimoAcesso?: string;
  };
}

// Tipos para options de select
export interface ResponsavelTecnicoOption {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  sexo: string;
  dataNascimento: string;
  estadoCivil: string;
  telefone1: string;
  telefone2?: string;
  enderecoId: number;
  endereco: Endereco;
}

export interface PessoaFisicaOption {
  id: number;
  nome: string;
  cpf: string;
  emailEmpresarial: string;
  emailPessoal?: string;
}

export interface PessoaJuridicaOption {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  email: string;
}

export interface FilialOption {
  id: number;
  nome: string;
  codigo: string;
}

// Tipos para Consultor
export interface Consultor {
  id: number;
  pessoaFisicaId: number;
  pessoaFisica: PessoaFisica;
  filialId: number;
  filial: Filial;
  dataCadastro: string;
  dataAtualizacao?: string;
  ativo: boolean;
  // Propriedades adicionadas durante transformação no frontend
  nome?: string;
  email?: string;
  telefone1?: string;
  telefone2?: string;
  oab?: string;
  status?: "ativo" | "inativo" | "ferias" | "licenca";
  casosAtivos?: number;
  taxaSucesso?: number;
}

export interface CreateConsultorDTO {
  pessoaFisicaId: number;
  filialId: number;
  // Propriedades adicionais para o frontend
  nome?: string;
  email?: string;
  oab?: string;
  telefone1?: string;
  telefone2?: string;
  status?: "ativo" | "inativo" | "ferias" | "licenca";
}

export interface UpdateConsultorDTO extends CreateConsultorDTO {
  id: number;
}

// Tipos para Cliente
export interface Cliente {
  id: number;
  tipoPessoa: "Fisica" | "Juridica";
  pessoaFisicaId?: number;
  pessoaFisica?: PessoaFisica;
  pessoaJuridicaId?: number;
  pessoaJuridica?: PessoaJuridica;
  consultorAtualId?: number;
  filialId?: number;
  filial?: Filial;
  status?: string;
  observacoes?: string;
  valorContrato: number;
  dataCadastro: string;
  dataAtualizacao?: string;
  ativo: boolean;
  // Propriedades adicionadas durante transformação no frontend
  tipo?: "fisica" | "juridica";
  nome?: string;
  razaoSocial?: string;
  email?: string;
  emailPessoal?: string;
  cpf?: string;
  cnpj?: string;
  telefone1?: string;
  telefone2?: string;
  telefone3?: string;
  telefone4?: string;
  segmento?: string;
}

export interface CreateClienteDTO {
  tipoPessoa: "Fisica" | "Juridica";
  pessoaId: number;
  filialId: number;
  status?: string;
  observacoes?: string;
  valorContrato?: number;
  // Propriedades adicionais para o frontend
  tipo?: "fisica" | "juridica";
  nome?: string;
  razaoSocial?: string;
  email?: string;
  emailPessoal?: string;
  cpf?: string;
  cnpj?: string;
  telefone1?: string;
  telefone2?: string;
  telefone3?: string;
  telefone4?: string;
  segmento?: string;
}

export interface UpdateClienteDTO extends CreateClienteDTO {
  id: number;
}

// Tipos para HistoricoConsultor
export interface HistoricoConsultor {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  consultorId: number;
  consultor?: Consultor;
  dataInicio: string;
  dataFim?: string;
  motivoTransferencia?: string;
  dataCadastro: string;
}

export interface AtribuirClienteDTO {
  consultorId: number;
  clienteId: number;
  motivoAtribuicao?: string;
}

// Tipos para Filial
export interface Filial {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  dataCadastro: string;
  dataAtualizacao?: string;
}

// Enums
export const SexoOptions = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "O", label: "Outros" },
] as const;

export const EstadoCivilOptions = [
  { value: "Solteiro", label: "Solteiro(a)" },
  { value: "Casado", label: "Casado(a)" },
  { value: "Divorciado", label: "Divorciado(a)" },
  { value: "Viuvo", label: "Viúvo(a)" },
  { value: "Separado", label: "Separado(a)" },
  { value: "Uniao_Estavel", label: "União Estável" },
] as const;

export const GrupoAcessoOptions = [
  { value: "Usuario", label: "Usuário" },
  { value: "Administrador", label: "Administrador" },
  { value: "Consultores", label: "Consultores" },
  { value: "Administrativo de Filial", label: "Administrativo de Filial" },
  { value: "Gestor de Filial", label: "Gestor de Filial" },
  { value: "Cobrança e Financeiro", label: "Cobrança e Financeiro" },
  { value: "Faturamento", label: "Faturamento" },
] as const;

// Tipos para Contrato
export type SituacaoContrato =
  | "Leed"
  | "Prospecto"
  | "Em Análise"
  | "Contrato Enviado"
  | "Contrato Assinado"
  | "Quitado"
  | "Retornar"
  | "Sem Interesse"
  | "RESCINDIDO"
  | "RESCINDIDO COM DEBITO"
  | "SUSPENSO"
  | "SUSP. C/ DEBITO"
  | "CLIENTE";

export interface Contrato {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  consultorId: number;
  consultor?: Consultor;
  parceiroId?: number;
  parceiro?: Parceiro;
  situacao: SituacaoContrato;
  dataUltimoContato: string;
  dataProximoContato: string;
  valorDevido: number;
  valorNegociado?: number;
  observacoes?: string;
  dataCadastro: string;
  dataAtualizacao?: string;
  ativo: boolean;
  // Novos campos adicionados
  numeroPasta?: string;
  dataFechamentoContrato?: string;
  tipoServico?: string;
  objetoContrato?: string;
  comissao?: number;
  valorEntrada?: number;
  valorParcela?: number;
  numeroParcelas?: number;
  primeiroVencimento?: string;
  anexoDocumento?: string;
  pendencias?: string;
}

export interface CreateContratoDTO {
  clienteId: number;
  consultorId: number;
  parceiroId?: number;
  situacao: SituacaoContrato;
  dataUltimoContato?: string;
  dataProximoContato?: string;
  valorDevido: number;
  valorNegociado?: number;
  observacoes?: string;
  // Novos campos adicionados
  numeroPasta?: string;
  dataFechamentoContrato?: string;
  tipoServico?: string;
  objetoContrato?: string;
  comissao?: number;
  valorEntrada?: number;
  valorParcela?: number;
  numeroParcelas?: number;
  primeiroVencimento?: string;
  anexoDocumento?: string;
  pendencias?: string;
}

export interface UpdateContratoDTO extends CreateContratoDTO {
  id: number;
  parceiroId?: number;
}

export interface MudancaSituacaoDTO {
  novaSituacao: SituacaoContrato;
  motivoMudanca: string;
  dataUltimoContato?: string;
  dataProximoContato?: string;
  valorNegociado?: number;
  observacoes?: string;
}

export interface HistoricoSituacaoContrato {
  id: number;
  contratoId: number;
  contrato?: Contrato;
  situacaoAnterior: SituacaoContrato;
  novaSituacao: SituacaoContrato;
  motivoMudanca: string;
  dataMudanca: string;
  dataCadastro: string;
}

// Tipos para Parceiro
export interface Parceiro {
  id: number;
  pessoaFisicaId: number;
  pessoaFisica: PessoaFisica;
  filialId: number;
  filial: Filial;
  oab?: string;
  email?: string;
  telefone?: string;
  dataCadastro: string;
  dataAtualizacao?: string;
  ativo: boolean;
}

export interface CreateParceiroDTO {
  pessoaFisicaId: number;
  filialId: number;
  oab?: string;
  email?: string;
  telefone?: string;
}

export interface UpdateParceiroDTO {
  id: number;
  filialId: number;
  oab?: string;
  email?: string;
  telefone?: string;
}

export const SituacaoContratoOptions = [
  {
    value: "Leed",
    label: "Lead",
    color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  },
  {
    value: "Prospecto",
    label: "Prospecto",
    color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  },
  {
    value: "Em Análise",
    label: "Em Análise",
    color: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  },
  {
    value: "Contrato Enviado",
    label: "Contrato Enviado",
    color: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  {
    value: "Contrato Assinado",
    label: "Contrato Assinado",
    color: "bg-green-500/20 text-green-300 border border-green-500/30",
  },
  {
    value: "Quitado",
    label: "Quitado",
    color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  {
    value: "Retornar",
    label: "Retornar",
    color: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
  },
  {
    value: "Sem Interesse",
    label: "Sem Interesse",
    color: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
  {
    value: "RESCINDIDO",
    label: "Rescindido",
    color: "bg-red-500/30 text-red-200 border border-red-500/50",
  },
  {
    value: "RESCINDIDO COM DEBITO",
    label: "Rescindido c/ Débito",
    color: "bg-red-600/30 text-red-200 border border-red-600/50",
  },
  {
    value: "SUSPENSO",
    label: "Suspenso",
    color: "bg-neutral-500/20 text-neutral-300 border border-neutral-500/30",
  },
  {
    value: "SUSP. C/ DEBITO",
    label: "Suspensão c/ Débito",
    color: "bg-neutral-600/20 text-neutral-200 border border-neutral-600/30",
  },
  {
    value: "CLIENTE",
    label: "Cliente",
    color: "bg-green-500/30 text-green-200 border border-green-500/50",
  },
] as const;

export const TipoPessoaOptions = [
  { value: "Fisica", label: "Pessoa Física" },
  { value: "Juridica", label: "Pessoa Jurídica" },
] as const;

export const TipoServicoOptions = [
  { value: "CIVEL", label: "Cível" },
  { value: "TRIBUTARIO", label: "Tributário" },
  { value: "PENAL", label: "Penal" },
  { value: "TRABALHISTA", label: "Trabalhista" },
  { value: "EMPRESARIAL", label: "Empresarial" },
  { value: "FAMILIA", label: "Família" },
  { value: "CONSUMIDOR", label: "Consumidor" },
  { value: "IMOBILIARIO", label: "Imobiliário" },
  { value: "MARCAS", label: "Marcas" },
  { value: "PI", label: "PI - Propriedade Intelectual" },
  { value: "EXITO", label: "Êxito" },
  { value: "ACAO_COBRANCA_FRADEMA", label: "Ação de Cobrança (Parceiro Fradema)" },
] as const;
