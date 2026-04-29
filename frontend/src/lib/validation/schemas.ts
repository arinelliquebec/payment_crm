import { z } from "zod";
import { SituacaoContrato } from "@/types/api";
import { validarCPF, validarCNPJ } from './cpf-cnpj';

// ===========================
// VALIDAÇÕES CUSTOMIZADAS
// ===========================

// CPF Validation - usando função centralizada
export const cpfSchema = z
  .string()
  .min(1, "CPF é obrigatório")
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11, {
    message: "CPF deve conter 11 dígitos",
  })
  .refine((cpf) => validarCPF(cpf), {
    message: "CPF inválido"
  });

// CNPJ Validation - usando função centralizada
export const cnpjSchema = z
  .string()
  .min(1, "CNPJ é obrigatório")
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 14, {
    message: "CNPJ deve conter 14 dígitos",
  })
  .refine((cnpj) => validarCNPJ(cnpj), {
    message: "CNPJ inválido"
  });

// Email Validation
export const emailSchema = z
  .string()
  .min(1, "Email é obrigatório")
  .email("Email inválido")
  .max(255, "Email deve ter no máximo 255 caracteres");

// Telefone Validation
export const telefoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 11;
    },
    { message: "Telefone deve ter 10 ou 11 dígitos" }
  );

// Valor monetário
export const valorMonetarioSchema = z
  .number()
  .nonnegative("Valor não pode ser negativo")
  .finite("Valor inválido");

// Data futura
export const dataFuturaSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return false;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "Data deve ser futura" }
  );

// Data passada
export const dataPassadaSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return false;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    },
    { message: "Data não pode estar no futuro" }
  );

// ===========================
// SCHEMAS DE ENTIDADES
// ===========================

// Login Schema
export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 11, {
      message: "CPF deve conter 11 dígitos",
    }),
  senha: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Contrato Schema
export const contratoSchema = z
  .object({
    clienteId: z
      .number()
      .int("ID do cliente deve ser um número inteiro")
      .positive("Selecione um cliente"),
    consultorId: z
      .number()
      .int("ID do consultor deve ser um número inteiro")
      .positive("Selecione um consultor"),
    parceiroId: z
      .number()
      .int("ID do parceiro deve ser um número inteiro")
      .positive()
      .optional(),
    situacao: z.enum([
      "Leed",
      "Negociacao",
      "Fechado",
      "Perdido",
      "Cancelado",
    ] as const, {
      errorMap: () => ({ message: "Situação inválida" }),
    }),
    dataUltimoContato: z
      .string()
      .min(1, "Data do último contato é obrigatória"),
    dataProximoContato: dataFuturaSchema,
    valorDevido: valorMonetarioSchema
      .positive("Valor devido deve ser maior que zero"),
    valorNegociado: valorMonetarioSchema.optional(),
    observacoes: z
      .string()
      .max(1000, "Observações deve ter no máximo 1000 caracteres")
      .optional(),
    numeroPasta: z
      .string()
      .max(100, "Número da pasta deve ter no máximo 100 caracteres")
      .optional(),
    dataFechamentoContrato: z.string().optional(),
    tipoServico: z
      .string()
      .max(200, "Tipo de serviço deve ter no máximo 200 caracteres")
      .optional(),
    objetoContrato: z
      .string()
      .max(1000, "Objeto do contrato deve ter no máximo 1000 caracteres")
      .optional(),
    comissao: valorMonetarioSchema.optional(),
    valorEntrada: valorMonetarioSchema.optional(),
    valorParcela: valorMonetarioSchema.optional(),
    numeroParcelas: z
      .number()
      .int("Número de parcelas deve ser um número inteiro")
      .positive("Número de parcelas deve ser maior que zero")
      .optional(),
    primeiroVencimento: z.string().optional(),
    anexoDocumento: z.string().optional(),
    pendencias: z
      .string()
      .max(2000, "Pendências deve ter no máximo 2000 caracteres")
      .optional(),
  })
  .refine(
    (data) => {
      // Valor negociado não pode ser maior que valor devido
      if (data.valorNegociado && data.valorDevido) {
        return data.valorNegociado <= data.valorDevido;
      }
      return true;
    },
    {
      message: "Valor negociado não pode ser maior que o valor devido",
      path: ["valorNegociado"],
    }
  )
  .refine(
    (data) => {
      // Data de fechamento não pode estar no futuro
      if (data.dataFechamentoContrato) {
        const fechamento = new Date(data.dataFechamentoContrato);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        fechamento.setHours(0, 0, 0, 0);
        return fechamento <= hoje;
      }
      return true;
    },
    {
      message: "Data de fechamento não pode estar no futuro",
      path: ["dataFechamentoContrato"],
    }
  )
  .refine(
    (data) => {
      // Primeiro vencimento não pode ser anterior à data de fechamento
      if (data.primeiroVencimento && data.dataFechamentoContrato) {
        const venc = new Date(data.primeiroVencimento);
        const fechamento = new Date(data.dataFechamentoContrato);
        venc.setHours(0, 0, 0, 0);
        fechamento.setHours(0, 0, 0, 0);
        return venc >= fechamento;
      }
      return true;
    },
    {
      message:
        "Primeiro vencimento não pode ser anterior à data de fechamento",
      path: ["primeiroVencimento"],
    }
  )
  .refine(
    (data) => {
      // Validar soma de parcelas + entrada = valor negociado
      if (
        data.numeroParcelas &&
        data.valorParcela &&
        data.valorNegociado &&
        data.numeroParcelas > 0
      ) {
        const totalParcelas = data.numeroParcelas * data.valorParcela;
        const entrada = data.valorEntrada || 0;
        const total = totalParcelas + entrada;
        const diff = Math.abs(total - data.valorNegociado);
        return diff <= 0.01; // Tolerância de 1 centavo
      }
      return true;
    },
    {
      message: "A soma das parcelas + entrada não corresponde ao valor negociado",
      path: ["valorNegociado"],
    }
  );

export type ContratoFormData = z.infer<typeof contratoSchema>;

// Cliente Pessoa Física Schema
export const clientePessoaFisicaSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  cpf: cpfSchema,
  emailEmpresarial: emailSchema.optional(),
  emailPessoal: emailSchema.optional(),
  telefone1: telefoneSchema,
  telefone2: telefoneSchema,
  status: z.enum(["Ativo", "Inativo", "Pendente"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export type ClientePessoaFisicaFormData = z.infer<
  typeof clientePessoaFisicaSchema
>;

// Cliente Pessoa Jurídica Schema
export const clientePessoaJuridicaSchema = z.object({
  razaoSocial: z
    .string()
    .min(1, "Razão social é obrigatória")
    .min(3, "Razão social deve ter no mínimo 3 caracteres")
    .max(200, "Razão social deve ter no máximo 200 caracteres"),
  cnpj: cnpjSchema,
  email: emailSchema.optional(),
  telefone1: telefoneSchema,
  telefone2: telefoneSchema,
  telefone3: telefoneSchema,
  telefone4: telefoneSchema,
  status: z.enum(["Ativo", "Inativo", "Pendente"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export type ClientePessoaJuridicaFormData = z.infer<
  typeof clientePessoaJuridicaSchema
>;

// Mudança de Situação Schema
export const mudancaSituacaoSchema = z.object({
  novaSituacao: z.enum([
    "Leed",
    "Negociacao",
    "Fechado",
    "Perdido",
    "Cancelado",
  ] as const, {
    errorMap: () => ({ message: "Situação inválida" }),
  }),
  motivoMudanca: z
    .string()
    .min(1, "Motivo da mudança é obrigatório")
    .min(10, "Motivo deve ter no mínimo 10 caracteres")
    .max(500, "Motivo deve ter no máximo 500 caracteres"),
  dataUltimoContato: z.string().optional(),
  dataProximoContato: z.string().optional(),
});

export type MudancaSituacaoFormData = z.infer<typeof mudancaSituacaoSchema>;
