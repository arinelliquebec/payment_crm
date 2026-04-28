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
