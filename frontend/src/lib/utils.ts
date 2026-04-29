import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trunca um texto se exceder o comprimento máximo
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo (padrão: 25)
 * @returns Texto truncado com "..." se necessário
 */
export function truncateText(text: string, maxLength: number = 25): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

/**
 * Formata um CNPJ para exibição: 00.000.000/0000-00
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ formatado ou string original se inválido
 */
export function formatCNPJDisplay(cnpj: string | null | undefined): string {
  if (!cnpj) return "";

  // Remove tudo que não é número
  const numbers = cnpj.replace(/\D/g, "");

  // Se não tem 14 dígitos, retorna o original
  if (numbers.length !== 14) {
    return cnpj;
  }

  // Aplica a máscara: 00.000.000/0000-00
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

/**
 * Formata um CPF para exibição: 000.000.000-00
 * @param cpf - CPF com ou sem formatação
 * @returns CPF formatado ou string original se inválido
 */
export function formatCPFDisplay(cpf: string | null | undefined): string {
  if (!cpf) return "";

  // Remove tudo que não é número
  const numbers = cpf.replace(/\D/g, "");

  // Se não tem 11 dígitos, retorna o original
  if (numbers.length !== 11) {
    return cpf;
  }

  // Aplica a máscara: 000.000.000-00
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

/**
 * Formata um documento (CPF ou CNPJ) para exibição
 * Detecta automaticamente se é CPF (11 dígitos) ou CNPJ (14 dígitos)
 * @param documento - CPF ou CNPJ com ou sem formatação
 * @returns Documento formatado ou string original se inválido
 */
export function formatDocumentoDisplay(documento: string | null | undefined): string {
  if (!documento) return "";

  // Remove tudo que não é número
  const numbers = documento.replace(/\D/g, "");

  if (numbers.length === 11) {
    return formatCPFDisplay(documento);
  } else if (numbers.length === 14) {
    return formatCNPJDisplay(documento);
  }

  // Retorna original se não for CPF nem CNPJ
  return documento;
}
