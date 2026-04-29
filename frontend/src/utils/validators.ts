/**
 * Utilitários de validação para o frontend
 */

// Validador de CPF
export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;

  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, "");

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (cleanCPF.split("").every((digit) => digit === cleanCPF[0])) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let firstDigit = sum % 11;
  firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;

  if (parseInt(cleanCPF[9]) !== firstDigit) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let secondDigit = sum % 11;
  secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;

  return parseInt(cleanCPF[10]) === secondDigit;
};

// Formatador de CPF
export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/[^\d]/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(
    6,
    9
  )}-${clean.substring(9, 11)}`;
};

// Validador de e-mail
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validador de telefone brasileiro
export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[^\d]/g, "");

  // Celular: 11 dígitos (DDD + 9 + 8 dígitos)
  if (cleanPhone.length === 11) {
    return /^(\d{2})9\d{8}$/.test(cleanPhone);
  }

  // Fixo: 10 dígitos (DDD + 8 dígitos)
  if (cleanPhone.length === 10) {
    return /^(\d{2})[2-5]\d{7}$/.test(cleanPhone);
  }

  return false;
};

// Formatador de telefone
export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[^\d]/g, "");

  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(
      2,
      7
    )}-${clean.substring(7, 11)}`;
  }

  if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(
      2,
      6
    )}-${clean.substring(6, 10)}`;
  }

  return phone;
};

// Validador de CEP
export const validateCEP = (cep: string): boolean => {
  if (!cep) return false;
  const cleanCEP = cep.replace(/[^\d]/g, "");
  return cleanCEP.length === 8;
};

// Formatador de CEP
export const formatCEP = (cep: string): string => {
  const clean = cep.replace(/[^\d]/g, "");
  if (clean.length !== 8) return cep;
  return `${clean.substring(0, 5)}-${clean.substring(5, 8)}`;
};

// Validador de idade mínima
export const validateAge = (
  birthDate: string,
  minAge: number = 18
): boolean => {
  if (!birthDate) return false;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= minAge && age <= 120;
};

// Validador de nome completo
export const validateFullName = (name: string): boolean => {
  if (!name) return false;
  const trimmedName = name.trim();
  const nameParts = trimmedName.split(" ").filter((part) => part.length > 0);
  return (
    nameParts.length >= 2 &&
    trimmedName.length >= 2 &&
    trimmedName.length <= 200
  );
};

// Sanitizador de strings
export const sanitizeString = (str: string): string => {
  return str?.trim().toUpperCase() || "";
};

// Normalizar e-mail
export const normalizeEmail = (email: string): string => {
  return email?.trim().toLowerCase() || "";
};

// Validações específicas para campos opcionais
export const validateRG = (rg: string): boolean => {
  if (!rg) return true; // Opcional
  return rg.trim().length <= 20;
};

export const validateCNH = (cnh: string): boolean => {
  if (!cnh) return true; // Opcional
  return cnh.trim().length <= 20;
};

export const validateCodinome = (codinome: string): boolean => {
  if (!codinome) return true; // Opcional
  return codinome.trim().length <= 100;
};
