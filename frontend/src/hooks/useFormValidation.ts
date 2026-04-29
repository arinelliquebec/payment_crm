import { useState, useCallback, useEffect } from "react";
import { z, ZodError } from "zod";

/**
 * Opções de validação
 */
export interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

/**
 * Estado de validação de um campo
 */
export interface FieldValidation {
  error?: string;
  touched: boolean;
  validating: boolean;
}

/**
 * Hook para validação de formulários com Zod
 * @param schema - Schema Zod para validação
 * @param options - Opções de validação
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  options: ValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
  } = options;

  type FormData = z.infer<T>;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  // Timeout para debounce
  const [debounceTimeouts, setDebounceTimeouts] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  /**
   * Valida um campo específico
   */
  const validateField = useCallback(
    async (fieldName: string, value: any, allData: Partial<FormData>) => {
      try {
        setValidating((prev) => ({ ...prev, [fieldName]: true }));

        // Tentar validar apenas o campo específico
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          await fieldSchema.parseAsync(value);
        } else {
          // Se não conseguir validar campo individual, validar o objeto completo
          await schema.parseAsync(allData);
        }

        // Se passou, remover erro
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });

        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldError = error.errors.find(
            (err) => err.path[0] === fieldName
          );
          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [fieldName]: fieldError.message,
            }));
          }
        }
        return false;
      } finally {
        setValidating((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [schema]
  );

  /**
   * Valida todos os campos
   */
  const validateAll = useCallback(
    async (data: Partial<FormData>): Promise<boolean> => {
      try {
        await schema.parseAsync(data);
        setErrors({});
        setIsValid(true);
        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const fieldName = err.path[0] as string;
            if (fieldName) {
              newErrors[fieldName] = err.message;
            }
          });
          setErrors(newErrors);
        }
        setIsValid(false);
        return false;
      }
    },
    [schema]
  );

  /**
   * Marca um campo como tocado
   */
  const touchField = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Marca todos os campos como tocados
   */
  const touchAll = useCallback((data: Partial<FormData>) => {
    const allTouched: Record<string, boolean> = {};
    Object.keys(data).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
  }, []);

  /**
   * Handler para onChange com validação
   */
  const handleChange = useCallback(
    (fieldName: string, value: any, allData: Partial<FormData>) => {
      if (!validateOnChange) return;

      // Limpar timeout anterior
      if (debounceTimeouts[fieldName]) {
        clearTimeout(debounceTimeouts[fieldName]);
      }

      // Criar novo timeout para debounce
      const timeout = setTimeout(() => {
        validateField(fieldName, value, allData);
      }, debounceMs);

      setDebounceTimeouts((prev) => ({
        ...prev,
        [fieldName]: timeout,
      }));
    },
    [validateOnChange, debounceMs, validateField, debounceTimeouts]
  );

  /**
   * Handler para onBlur com validação
   */
  const handleBlur = useCallback(
    (fieldName: string, value: any, allData: Partial<FormData>) => {
      touchField(fieldName);

      if (!validateOnBlur) return;

      // Limpar timeout de debounce se existir
      if (debounceTimeouts[fieldName]) {
        clearTimeout(debounceTimeouts[fieldName]);
      }

      // Validar imediatamente no blur
      validateField(fieldName, value, allData);
    },
    [validateOnBlur, touchField, validateField, debounceTimeouts]
  );

  /**
   * Limpa erros
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Limpa erro de um campo específico
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Reseta o estado de validação
   */
  const reset = useCallback(() => {
    setErrors({});
    setTouched({});
    setValidating({});
    setIsValid(false);

    // Limpar todos os timeouts
    Object.values(debounceTimeouts).forEach((timeout) => {
      clearTimeout(timeout);
    });
    setDebounceTimeouts({});
  }, [debounceTimeouts]);

  /**
   * Obtém o erro de um campo (apenas se tocado)
   */
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return touched[fieldName] ? errors[fieldName] : undefined;
    },
    [errors, touched]
  );

  /**
   * Verifica se um campo tem erro
   */
  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return touched[fieldName] && !!errors[fieldName];
    },
    [errors, touched]
  );

  /**
   * Verifica se um campo está validando
   */
  const isFieldValidating = useCallback(
    (fieldName: string): boolean => {
      return !!validating[fieldName];
    },
    [validating]
  );

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, [debounceTimeouts]);

  return {
    errors,
    touched,
    validating,
    isValid,
    validateField,
    validateAll,
    touchField,
    touchAll,
    handleChange,
    handleBlur,
    clearErrors,
    clearFieldError,
    reset,
    getFieldError,
    hasFieldError,
    isFieldValidating,
  };
}

/**
 * Hook simplificado para validação de campo único
 */
export function useFieldValidation<T extends z.ZodType>(
  schema: T,
  initialValue?: z.infer<T>
) {
  const [value, setValue] = useState<z.infer<T>>(initialValue);
  const [error, setError] = useState<string>();
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    async (val: z.infer<T>) => {
      try {
        await schema.parseAsync(val);
        setError(undefined);
        return true;
      } catch (err) {
        if (err instanceof ZodError) {
          setError(err.errors[0]?.message);
        }
        return false;
      }
    },
    [schema]
  );

  const handleChange = useCallback(
    (newValue: z.infer<T>) => {
      setValue(newValue);
      if (touched) {
        validate(newValue);
      }
    },
    [touched, validate]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error: touched ? error : undefined,
    touched,
    setValue: handleChange,
    handleBlur,
    validate,
    reset,
  };
}
