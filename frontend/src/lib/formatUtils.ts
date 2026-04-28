// src/lib/formatUtils.ts

/**
 * Formatar CPF
 */
export const formatCPF = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, "");

  return onlyNumbers
    .substring(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2");
};

/**
 * Formatar CNPJ
 */
export const formatCNPJ = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, "");

  return onlyNumbers
    .substring(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/**
 * Formatar CEP
 */
export const formatCEP = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, "");
  return onlyNumbers.substring(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
};

/**
 * Formatar telefone
 */
export const formatTelefone = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, "");

  if (onlyNumbers.length <= 10) {
    return onlyNumbers.replace(/^(\d{2})(\d{4})(\d)/, "($1) $2-$3");
  } else {
    return onlyNumbers
      .substring(0, 11)
      .replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
  }
};

/**
 * Remover formatação de string
 */
export const removeFormatting = (value: string): string => {
  return value.replace(/\D/g, "");
};

/**
 * Validar CPF
 */
export const isValidCPF = (cpf: string): boolean => {
  const numbers = removeFormatting(cpf);

  if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === parseInt(numbers.charAt(10));
};

/**
 * Validar CNPJ
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = removeFormatting(cnpj);

  if (numbers.length !== 14 || /^(\d)\1{13}$/.test(numbers)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }

  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (digit1 !== parseInt(numbers.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }

  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit2 === parseInt(numbers.charAt(13));
};

/**
 * Validar email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formatar data para exibição
 */
export const formatDate = (dateString: string, includeTime = false): string => {
  const date = new Date(dateString);

  if (includeTime) {
    return date.toLocaleString("pt-BR");
  }

  return date.toLocaleDateString("pt-BR");
};

/**
 * Formatar data para input de data (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

/**
 * Calcular idade a partir da data de nascimento
 */
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

/**
 * Formatar moeda brasileira
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

/**
 * Capitalizar primeira letra de cada palavra
 */
export const capitalizeWords = (text: string): string => {
  return text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Truncar texto
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * Gerar cores de avatar baseado no nome
 */
export const getAvatarColor = (name: string): string => {
  const colors = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-green-500 to-green-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
    "bg-gradient-to-br from-red-500 to-red-600",
    "bg-gradient-to-br from-yellow-500 to-yellow-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
  ];

  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

/**
 * Obter iniciais do nome
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Debounce para busca
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Validar senha forte
 */
export const isStrongPassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Deve ter pelo menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Deve conter pelo menos uma letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Deve conter pelo menos um número");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Deve conter pelo menos um caractere especial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Gerar senha aleatória
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
};

/**
 * Converter bytes para formato legível
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Formatar tempo relativo (ex: "2 min atrás", "1 hora atrás")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Agora mesmo";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hora" : "horas"} atrás`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} atrás`;
  } else {
    return date.toLocaleDateString("pt-BR");
  }
};
