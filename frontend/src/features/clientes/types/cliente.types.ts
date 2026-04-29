import { z } from "zod";

/**
 * Schema de validação para Cliente
 */
export const ClienteSchema = z.object({
  id: z.number(),
  pessoaFisicaId: z.number().nullable(),
  pessoaJuridicaId: z.number().nullable(),
  consultorId: z.number().nullable(),
  filialId: z.number().nullable(),
  tipoPessoa: z.enum(["Fisica", "Juridica"]),
  situacao: z.string(),
  dataContato: z.string().nullable(),
  observacoes: z.string().nullable(),
  ativo: z.boolean(),
  dataCadastro: z.string(),
  dataAtualizacao: z.string().nullable(),
  // Relacionamentos
  pessoaFisica: z.any().nullable(),
  pessoaJuridica: z.any().nullable(),
  consultor: z.any().nullable(),
  filial: z.any().nullable(),
});

export const CreateClienteSchema = z.object({
  pessoaFisicaId: z.number().nullable(),
  pessoaJuridicaId: z.number().nullable(),
  consultorId: z.number().nullable(),
  filialId: z.number().nullable(),
  tipoPessoa: z.enum(["Fisica", "Juridica"]),
  situacao: z.string().default("Prospecto"),
  dataContato: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
});

export const UpdateClienteSchema = CreateClienteSchema.partial();

export const ClienteFiltersSchema = z.object({
  tipoPessoa: z.enum(["Fisica", "Juridica"]).optional(),
  situacao: z.string().optional(),
  consultorId: z.number().optional(),
  filialId: z.number().optional(),
  ativo: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Types inferidos dos schemas
 */
export type Cliente = z.infer<typeof ClienteSchema>;
export type CreateClienteDTO = z.infer<typeof CreateClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof UpdateClienteSchema>;
export type ClienteFilters = z.infer<typeof ClienteFiltersSchema>;

/**
 * Situações possíveis de um cliente
 */
export const SITUACOES_CLIENTE = {
  PROSPECTO: "Prospecto",
  CONTATO_INICIAL: "Contato Inicial",
  QUALIFICADO: "Qualificado",
  PROPOSTA: "Proposta Enviada",
  NEGOCIACAO: "Em Negociação",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  INATIVO: "Inativo",
} as const;

export type SituacaoCliente =
  (typeof SITUACOES_CLIENTE)[keyof typeof SITUACOES_CLIENTE];

/**
 * Helper para obter nome do cliente
 */
export function getClienteNome(cliente: Cliente): string {
  if (cliente.tipoPessoa === "Fisica" && cliente.pessoaFisica) {
    return cliente.pessoaFisica.nome;
  }
  if (cliente.tipoPessoa === "Juridica" && cliente.pessoaJuridica) {
    return (
      cliente.pessoaJuridica.razaoSocial || cliente.pessoaJuridica.nomeFantasia
    );
  }
  return "Cliente sem nome";
}

/**
 * Helper para obter documento do cliente
 */
export function getClienteDocumento(cliente: Cliente): string {
  if (cliente.tipoPessoa === "Fisica" && cliente.pessoaFisica) {
    return cliente.pessoaFisica.cpf;
  }
  if (cliente.tipoPessoa === "Juridica" && cliente.pessoaJuridica) {
    return cliente.pessoaJuridica.cnpj;
  }
  return "";
}
