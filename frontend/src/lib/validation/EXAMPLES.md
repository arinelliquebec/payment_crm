# Exemplos Práticos de Uso

## 📋 Exemplo 1: Formulário de Login com Validação em Tempo Real

```typescript
// src/app/login/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema, type LoginFormData } from "@/lib/validation/schemas";
import { sanitizeInput, sanitizeCPF } from "@/lib/validation/sanitize";
import { ValidatedInput } from "@/components/forms/ValidatedInput";
import { User, Lock } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    cpf: "",
    senha: "",
  });

  const validation = useFormValidation(loginSchema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500,
  });

  const handleChange = useCallback(
    (field: keyof LoginFormData, value: string) => {
      // Sanitizar input
      const sanitizedValue = field === "cpf"
        ? sanitizeCPF(value)
        : sanitizeInput(value, "text");

      const newFormData = { ...formData, [field]: sanitizedValue };
      setFormData(newFormData);

      // Validar em tempo real
      validation.handleChange(field, sanitizedValue, newFormData);
    },
    [formData, validation]
  );

  const handleBlur = useCallback(
    (field: keyof LoginFormData) => {
      validation.handleBlur(field, formData[field], formData);
    },
    [formData, validation]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    validation.touchAll(formData);

    // Validar todos os campos
    const isValid = await validation.validateAll(formData);

    if (!isValid) {
      return;
    }

    // Sanitizar dados antes de enviar
    const sanitizedData = {
      login: sanitizeCPF(formData.cpf),
      senha: sanitizeInput(formData.senha, "text"),
    };

    // Enviar para API
    await login(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <ValidatedInput
        label="CPF"
        required
        value={formData.cpf}
        error={validation.getFieldError("cpf")}
        touched={validation.touched.cpf}
        validating={validation.isFieldValidating("cpf")}
        onValueChange={(value) => handleChange("cpf", value)}
        onFieldBlur={() => handleBlur("cpf")}
        leftIcon={<User className="w-5 h-5" />}
        placeholder="Digite seu CPF"
        maxLength={14}
      />

      <ValidatedInput
        label="Senha"
        required
        type="password"
        value={formData.senha}
        error={validation.getFieldError("senha")}
        touched={validation.touched.senha}
        validating={validation.isFieldValidating("senha")}
        onValueChange={(value) => handleChange("senha", value)}
        onFieldBlur={() => handleBlur("senha")}
        leftIcon={<Lock className="w-5 h-5" />}
        placeholder="Digite sua senha"
        maxLength={100}
      />

      <button type="submit">Entrar</button>
    </form>
  );
}
```

## 📄 Exemplo 2: Upload de Arquivo com Validação

```typescript
// src/components/DocumentUpload.tsx
"use client";

import { useState } from "react";
import { ValidatedFileInput } from "@/components/forms/ValidatedFileInput";
import { toast } from "sonner";

export function DocumentUpload() {
  const [documento, setDocumento] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string>();

  const handleFileSelect = async (file: File | null, base64?: string) => {
    if (!file) {
      setDocumento(undefined);
      return;
    }

    setDocumento(base64);
    setError(undefined);
    toast.success(`Arquivo "${file.name}" selecionado com sucesso!`);
  };

  const handleValidationError = (errorMessage: string) => {
    setError(errorMessage);
    setTouched(true);
    toast.error(errorMessage);
  };

  return (
    <ValidatedFileInput
      label="Anexar Contrato"
      required
      accept=".pdf"
      validationType="pdf"
      maxSize={10 * 1024 * 1024} // 10MB
      error={error}
      touched={touched}
      onFileSelect={handleFileSelect}
      onValidationError={handleValidationError}
      helperText="Apenas arquivos PDF até 10MB"
    />
  );
}
```

## 🔄 Exemplo 3: Formulário Complexo com Múltiplos Campos

```typescript
// src/components/ContratoFormSimplified.tsx
"use client";

import { useState, useCallback } from "react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { contratoSchema, type ContratoFormData } from "@/lib/validation/schemas";
import { sanitizeInput } from "@/lib/validation/sanitize";
import { ValidatedInput } from "@/components/forms/ValidatedInput";
import { ValidatedFileInput } from "@/components/forms/ValidatedFileInput";

export function ContratoFormSimplified() {
  const [formData, setFormData] = useState<Partial<ContratoFormData>>({
    clienteId: 0,
    consultorId: 0,
    situacao: "Leed",
    dataUltimoContato: new Date().toISOString().split("T")[0],
    dataProximoContato: "",
    valorDevido: 0,
  });

  const validation = useFormValidation(contratoSchema, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
  });

  const handleChange = useCallback(
    (field: keyof ContratoFormData, value: any) => {
      // Sanitizar strings
      const sanitizedValue = typeof value === "string"
        ? sanitizeInput(value, "text")
        : value;

      const newFormData = { ...formData, [field]: sanitizedValue };
      setFormData(newFormData);

      // Validar em tempo real
      validation.handleChange(field, sanitizedValue, newFormData);
    },
    [formData, validation]
  );

  const handleBlur = useCallback(
    (field: keyof ContratoFormData) => {
      validation.handleBlur(field, formData[field], formData);
    },
    [formData, validation]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    validation.touchAll(formData);
    const isValid = await validation.validateAll(formData);

    if (!isValid) {
      console.error("Erros de validação:", validation.errors);
      return;
    }

    // Enviar dados
    await createContrato(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campos de texto */}
      <ValidatedInput
        label="Número da Pasta"
        value={formData.numeroPasta || ""}
        error={validation.getFieldError("numeroPasta")}
        touched={validation.touched.numeroPasta}
        validating={validation.isFieldValidating("numeroPasta")}
        onValueChange={(value) => handleChange("numeroPasta", value)}
        onFieldBlur={() => handleBlur("numeroPasta")}
        maxLength={100}
        helperText="Máximo 100 caracteres"
      />

      {/* Campo de valor monetário */}
      <ValidatedInput
        label="Valor Devido"
        required
        type="number"
        step="0.01"
        min="0"
        value={formData.valorDevido?.toString() || ""}
        error={validation.getFieldError("valorDevido")}
        touched={validation.touched.valorDevido}
        validating={validation.isFieldValidating("valorDevido")}
        onValueChange={(value) => handleChange("valorDevido", parseFloat(value) || 0)}
        onFieldBlur={() => handleBlur("valorDevido")}
        helperText="Valor em reais"
      />

      {/* Campo de data */}
      <ValidatedInput
        label="Data do Próximo Contato"
        required
        type="date"
        value={formData.dataProximoContato || ""}
        error={validation.getFieldError("dataProximoContato")}
        touched={validation.touched.dataProximoContato}
        validating={validation.isFieldValidating("dataProximoContato")}
        onValueChange={(value) => handleChange("dataProximoContato", value)}
        onFieldBlur={() => handleBlur("dataProximoContato")}
        helperText="Deve ser uma data futura"
      />

      {/* Upload de arquivo */}
      <ValidatedFileInput
        label="Anexar Documento"
        accept=".pdf"
        validationType="pdf"
        error={validation.getFieldError("anexoDocumento")}
        touched={validation.touched.anexoDocumento}
        onFileSelect={(file, base64) => {
          handleChange("anexoDocumento", base64);
        }}
        onValidationError={(error) => {
          console.error("Erro de validação de arquivo:", error);
        }}
      />

      {/* Textarea com validação */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Observações
        </label>
        <textarea
          value={formData.observacoes || ""}
          onChange={(e) => handleChange("observacoes", e.target.value)}
          onBlur={() => handleBlur("observacoes")}
          maxLength={1000}
          rows={4}
          className={validation.hasFieldError("observacoes") ? "border-red-500" : ""}
        />
        {validation.getFieldError("observacoes") && (
          <p className="text-sm text-red-400">
            {validation.getFieldError("observacoes")}
          </p>
        )}
      </div>

      <button type="submit" disabled={!validation.isValid}>
        Salvar Contrato
      </button>
    </form>
  );
}
```

## 🎯 Exemplo 4: Validação Manual de Dados

```typescript
// src/utils/dataValidation.ts
import { cpfSchema, cnpjSchema, emailSchema } from "@/lib/validation/schemas";
import { sanitizeCPF, sanitizeCNPJ, sanitizeEmail } from "@/lib/validation/sanitize";

export async function validateUserData(data: any) {
  const errors: Record<string, string> = {};

  // Validar CPF
  if (data.cpf) {
    const sanitizedCPF = sanitizeCPF(data.cpf);
    const result = await cpfSchema.safeParseAsync(sanitizedCPF);

    if (!result.success) {
      errors.cpf = result.error.errors[0].message;
    }
  }

  // Validar CNPJ
  if (data.cnpj) {
    const sanitizedCNPJ = sanitizeCNPJ(data.cnpj);
    const result = await cnpjSchema.safeParseAsync(sanitizedCNPJ);

    if (!result.success) {
      errors.cnpj = result.error.errors[0].message;
    }
  }

  // Validar Email
  if (data.email) {
    const sanitizedEmail = sanitizeEmail(data.email);
    const result = await emailSchema.safeParseAsync(sanitizedEmail);

    if (!result.success) {
      errors.email = result.error.errors[0].message;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

## 🔐 Exemplo 5: Sanitização de Dados da API

```typescript
// src/services/api.service.ts
import { sanitizeObject } from "@/lib/validation/sanitize";

export async function createCliente(data: any) {
  // Sanitizar todos os campos antes de enviar
  const sanitizedData = sanitizeObject(data, "text");

  const response = await fetch("/api/clientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedData),
  });

  return response.json();
}

export async function updateClienteObservacoes(id: number, observacoes: string) {
  // Permitir HTML básico em observações
  const sanitizedData = {
    id,
    observacoes: sanitizeInput(observacoes, "basicHtml"),
  };

  const response = await fetch(`/api/clientes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sanitizedData),
  });

  return response.json();
}
```

## 📊 Exemplo 6: Validação em Batch

```typescript
// src/utils/batchValidation.ts
import { validateFiles } from "@/lib/validation/file-validation";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZES } from "@/lib/validation/file-validation";

export async function validateMultipleDocuments(files: File[]) {
  const results = await validateFiles(files, {
    maxSize: MAX_FILE_SIZES.document,
    allowedTypes: ALLOWED_MIME_TYPES.documents,
    checkMagicNumbers: true,
  });

  const validFiles = results.filter(r => r.valid).map(r => r.file!);
  const invalidFiles = results.filter(r => !r.valid);

  return {
    validFiles,
    invalidFiles: invalidFiles.map(r => ({
      error: r.error,
    })),
    allValid: invalidFiles.length === 0,
  };
}
```

## 🎨 Exemplo 7: Feedback Visual Avançado

```typescript
// src/components/SmartInput.tsx
"use client";

import { useState, useEffect } from "react";
import { ValidatedInput } from "@/components/forms/ValidatedInput";
import { Check, X } from "lucide-react";

export function SmartInput({
  schema,
  onValidChange
}: {
  schema: any;
  onValidChange: (value: string, isValid: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!touched) return;

    const timer = setTimeout(async () => {
      setValidating(true);

      const result = await schema.safeParseAsync(value);

      if (result.success) {
        setError(undefined);
        setIsValid(true);
        onValidChange(value, true);
      } else {
        setError(result.error.errors[0].message);
        setIsValid(false);
        onValidChange(value, false);
      }

      setValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, touched, schema, onValidChange]);

  return (
    <ValidatedInput
      value={value}
      error={error}
      touched={touched}
      validating={validating}
      onValueChange={setValue}
      onFieldBlur={() => setTouched(true)}
      rightIcon={
        touched && !validating && (
          isValid ? (
            <Check className="w-5 h-5 text-green-400" />
          ) : error ? (
            <X className="w-5 h-5 text-red-400" />
          ) : null
        )
      }
    />
  );
}
```

## 🚀 Dicas de Performance

### 1. Debounce em Validações Pesadas

```typescript
const validation = useFormValidation(schema, {
  validateOnChange: true,
  debounceMs: 500, // Aguardar 500ms após parar de digitar
});
```

### 2. Validação Assíncrona Apenas Quando Necessário

```typescript
// Validação síncrona (mais rápida)
const result = schema.safeParse(data);

// Validação assíncrona (quando necessário)
const result = await schema.safeParseAsync(data);
```

### 3. Memoização de Schemas

```typescript
import { useMemo } from "react";

const schema = useMemo(() =>
  z.object({
    // ... schema definition
  }),
[]); // Criar apenas uma vez
```
