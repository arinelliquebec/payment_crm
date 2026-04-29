import { z } from "zod";

/**
 * Schema de validação para Contrato
 */
export const ContratoSchema = z.object({
  id: z.number(),
  clienteId: z.number(),
  consultorId: z.number().nullable(),
  filialId: z.number().nullable(),
  numeroContrato: z.string(),
  situacao: z.string(),
  valorContrato: z.number(),
  dataInicio: z.string(),
  dataFim: z.string().nullable(),
  observacoes: z.string().nullable(),
  ativo: z.boolean(),
  dataCadastro: z.string(),
  dataAtualizacao: z.string().nullable(),
  // Relacionamentos
  cliente: z.any().nullable(),
  consultor: z.any().nullable(),
  filial: z.any().nullable(),
});

export const CreateContratoSchema = z.object({
  clienteId: z.number().positive("Cliente é obrigatório"),
  consultorId: z.number().nullable().optional(),
  filialId: z.number().nullable().optional(),
  numeroContrato: z.string().min(1, "Número do contrato é obrigatório"),
  situacao: z.string().default("Ativo"),
  valorContrato: z.number().positive("Valor deve ser positivo"),
  dataInicio: z.string(),
  dataFim: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
  ativo: z.boolean().default(true),
});

export const UpdateContratoSchema = CreateContratoSchema.partial();

export const ContratoFiltersSchema = z.object({
  clienteId: z.number().optional(),
  consultorId: z.number().optional(),
  filialId: z.number().optional(),
  situacao: z.string().optional(),
  ativo: z.boolean().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Types inferidos
 */
export type Contrato = z.infer<typeof ContratoSchema>;
export type CreateContratoDTO = z.infer<typeof CreateContratoSchema>;
export type UpdateContratoDTO = z.infer<typeof UpdateContratoSchema>;
export type ContratoFilters = z.infer<typeof ContratoFiltersSchema>;

/**
 * Situações possíveis
 */
export const SITUACOES_CONTRATO = {
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
  EM_RENOVACAO: "Em Renovação",
} as const;

export type SituacaoContrato =
  (typeof SITUACOES_CONTRATO)[keyof typeof SITUACOES_CONTRATO];
