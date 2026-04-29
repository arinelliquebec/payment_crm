/**
 * Utilitários para validação de arquivos
 */

// Tipos MIME permitidos por categoria
export const ALLOWED_MIME_TYPES = {
  images: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ],
  all: [] as string[], // Será preenchido abaixo
};

// Preencher 'all' com todos os tipos
ALLOWED_MIME_TYPES.all = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
];

// Tamanhos máximos por tipo (em bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 5 * 1024 * 1024, // 5MB
};

// Extensões permitidas
export const ALLOWED_EXTENSIONS = {
  images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"],
  all: [] as string[],
};

ALLOWED_EXTENSIONS.all = [
  ...ALLOWED_EXTENSIONS.images,
  ...ALLOWED_EXTENSIONS.documents,
];

/**
 * Resultado da validação de arquivo
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Opções de validação de arquivo
 */
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  checkMagicNumbers?: boolean;
}

/**
 * Valida um arquivo
 * @param file - Arquivo a ser validado
 * @param options - Opções de validação
 * @returns Resultado da validação
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    maxSize = MAX_FILE_SIZES.default,
    allowedTypes = ALLOWED_MIME_TYPES.all,
    allowedExtensions = ALLOWED_EXTENSIONS.all,
    checkMagicNumbers = true,
  } = options;

  // Validar se o arquivo existe
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado" };
  }

  // Validar tamanho do arquivo
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }

  // Validar se o arquivo não está vazio
  if (file.size === 0) {
    return { valid: false, error: "Arquivo vazio" };
  }

  // Validar tipo MIME
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido: ${file.type}`,
    };
  }

  // Validar extensão
  const extension = getFileExtension(file.name);
  if (
    allowedExtensions.length > 0 &&
    !allowedExtensions.includes(extension.toLowerCase())
  ) {
    return {
      valid: false,
      error: `Extensão de arquivo não permitida: ${extension}`,
    };
  }

  // Validar magic numbers (assinatura do arquivo)
  if (checkMagicNumbers) {
    const magicNumberValid = await validateMagicNumbers(file);
    if (!magicNumberValid) {
      return {
        valid: false,
        error: "Arquivo corrompido ou tipo de arquivo não corresponde à extensão",
      };
    }
  }

  return { valid: true, file };
}

/**
 * Obtém a extensão de um arquivo
 * @param filename - Nome do arquivo
 * @returns Extensão do arquivo (com ponto)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? `.${parts.pop()?.toLowerCase()}` : "";
}

/**
 * Valida magic numbers (assinatura do arquivo)
 * @param file - Arquivo a ser validado
 * @returns true se válido, false caso contrário
 */
async function validateMagicNumbers(file: File): Promise<boolean> {
  try {
    // Ler os primeiros bytes do arquivo
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Magic numbers conhecidos
    const magicNumbers: Record<string, number[][]> = {
      "image/jpeg": [
        [0xff, 0xd8, 0xff],
      ],
      "image/png": [
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      ],
      "image/gif": [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
      ],
      "image/webp": [
        [0x52, 0x49, 0x46, 0x46], // RIFF
      ],
      "application/pdf": [
        [0x25, 0x50, 0x44, 0x46], // %PDF
      ],
      "application/zip": [
        [0x50, 0x4b, 0x03, 0x04], // PK
        [0x50, 0x4b, 0x05, 0x06], // PK (empty archive)
        [0x50, 0x4b, 0x07, 0x08], // PK (spanned archive)
      ],
    };

    // Verificar se o tipo do arquivo tem magic numbers conhecidos
    const expectedMagicNumbers = magicNumbers[file.type];
    if (!expectedMagicNumbers) {
      // Se não temos magic numbers para este tipo, considerar válido
      return true;
    }

    // Verificar se algum dos magic numbers esperados corresponde
    for (const expectedBytes of expectedMagicNumbers) {
      let matches = true;
      for (let i = 0; i < expectedBytes.length; i++) {
        if (bytes[i] !== expectedBytes[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Erro ao validar magic numbers:", error);
    // Em caso de erro, considerar válido para não bloquear o usuário
    return true;
  }
}

/**
 * Valida múltiplos arquivos
 * @param files - Lista de arquivos
 * @param options - Opções de validação
 * @returns Array de resultados de validação
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<FileValidationResult[]> {
  const results: FileValidationResult[] = [];

  for (const file of files) {
    const result = await validateFile(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Valida arquivo PDF especificamente
 * @param file - Arquivo a ser validado
 * @returns Resultado da validação
 */
export async function validatePDF(file: File): Promise<FileValidationResult> {
  return validateFile(file, {
    maxSize: MAX_FILE_SIZES.document,
    allowedTypes: ["application/pdf"],
    allowedExtensions: [".pdf"],
    checkMagicNumbers: true,
  });
}

/**
 * Valida arquivo de imagem especificamente
 * @param file - Arquivo a ser validado
 * @returns Resultado da validação
 */
export async function validateImage(file: File): Promise<FileValidationResult> {
  return validateFile(file, {
    maxSize: MAX_FILE_SIZES.image,
    allowedTypes: ALLOWED_MIME_TYPES.images,
    allowedExtensions: ALLOWED_EXTENSIONS.images,
    checkMagicNumbers: true,
  });
}

/**
 * Converte File para Base64
 * @param file - Arquivo a ser convertido
 * @returns Promise com string Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover o prefixo "data:...;base64," se existir
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Valida e converte arquivo para Base64
 * @param file - Arquivo a ser processado
 * @param options - Opções de validação
 * @returns Promise com resultado contendo Base64 ou erro
 */
export async function validateAndConvertToBase64(
  file: File,
  options: FileValidationOptions = {}
): Promise<{ valid: boolean; base64?: string; error?: string }> {
  const validation = await validateFile(file, options);

  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  try {
    const base64 = await fileToBase64(file);
    return { valid: true, base64 };
  } catch (error) {
    return {
      valid: false,
      error: "Erro ao processar arquivo",
    };
  }
}

/**
 * Formata tamanho de arquivo para exibição
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
