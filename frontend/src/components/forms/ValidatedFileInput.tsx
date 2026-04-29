import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Upload,
  File,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  validatePDF,
  validateImage,
  formatFileSize,
  type FileValidationOptions,
} from "@/lib/validation/file-validation";
import { sanitizeFilename } from "@/lib/validation/sanitize";

export interface ValidatedFileInputProps {
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helperText?: string;
  accept?: string;
  maxSize?: number;
  validationType?: "pdf" | "image" | "custom";
  validationOptions?: FileValidationOptions;
  onFileSelect?: (file: File | null, base64?: string) => void;
  onValidationError?: (error: string) => void;
  className?: string;
  value?: string;
}

export function ValidatedFileInput({
  label,
  error,
  touched,
  required,
  helperText,
  accept = ".pdf",
  maxSize,
  validationType = "pdf",
  validationOptions,
  onFileSelect,
  onValidationError,
  className,
  value,
}: ValidatedFileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showError = touched && error;

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      if (!file) {
        setSelectedFile(null);
        setValidationSuccess(false);
        onFileSelect?.(null);
        return;
      }

      setValidating(true);
      setValidationSuccess(false);

      try {
        // Sanitizar nome do arquivo
        const sanitizedName = sanitizeFilename(file.name);

        // Criar novo File com nome sanitizado
        let sanitizedFile: File;
        try {
          // @ts-ignore - File constructor é suportado em navegadores modernos
          sanitizedFile = new File([file], sanitizedName, {
            type: file.type,
            lastModified: file.lastModified,
          });
        } catch {
          // Fallback: usar o arquivo original se não conseguir criar novo File
          sanitizedFile = file;
        }

        // Validar arquivo baseado no tipo
        let validationResult;

        if (validationType === "pdf") {
          validationResult = await validatePDF(sanitizedFile);
        } else if (validationType === "image") {
          validationResult = await validateImage(sanitizedFile);
        } else if (validationOptions) {
          const { validateFile } = await import(
            "@/lib/validation/file-validation"
          );
          validationResult = await validateFile(
            sanitizedFile,
            validationOptions
          );
        } else {
          validationResult = { valid: true, file: sanitizedFile };
        }

        if (!validationResult.valid) {
          onValidationError?.(validationResult.error || "Arquivo inválido");
          setSelectedFile(null);
          setValidationSuccess(false);

          // Limpar input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // Converter para Base64 se necessário
        const { fileToBase64 } = await import(
          "@/lib/validation/file-validation"
        );
        const base64 = await fileToBase64(sanitizedFile);

        setSelectedFile(sanitizedFile);
        setValidationSuccess(true);
        onFileSelect?.(sanitizedFile, base64);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao processar arquivo";
        onValidationError?.(errorMessage);
        setSelectedFile(null);
        setValidationSuccess(false);
      } finally {
        setValidating(false);
      }
    },
    [validationType, validationOptions, onFileSelect, onValidationError]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidationSuccess(false);
    onFileSelect?.(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neutral-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div
        onClick={!selectedFile ? handleClick : undefined}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-neutral-800/50 backdrop-blur-sm",
          !selectedFile &&
            "cursor-pointer hover:border-amber-500/50 hover:bg-neutral-800/70",
          showError
            ? "border-red-500/50"
            : validationSuccess
            ? "border-green-500/50"
            : "border-neutral-700",
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="p-6">
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                  showError
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                )}
              >
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm text-neutral-300 mb-1">
                Clique para selecionar um arquivo
              </p>
              <p className="text-xs text-neutral-500">
                {helperText || `Formatos aceitos: ${accept}`}
              </p>
              {maxSize && (
                <p className="text-xs text-neutral-500 mt-1">
                  Tamanho máximo: {formatFileSize(maxSize)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {validating && (
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
              )}
              {validationSuccess && !validating && (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showError && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
        {value && !selectedFile && !showError && (
          <motion.p
            key="current"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-neutral-500"
          >
            Arquivo atual: {value}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
