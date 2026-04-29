import { forwardRef, InputHTMLAttributes, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ValidatedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur"> {
  label?: string;
  error?: string;
  touched?: boolean;
  validating?: boolean;
  required?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onValueChange?: (value: string) => void;
  onFieldBlur?: () => void;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      label,
      error,
      touched,
      validating,
      required,
      helperText,
      leftIcon,
      rightIcon,
      onValueChange,
      onFieldBlur,
      className,
      ...props
    },
    ref
  ) => {
    const showError = touched && error;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange?.(e.target.value);
      },
      [onValueChange]
    );

    const handleBlur = useCallback(() => {
      onFieldBlur?.();
    }, [onFieldBlur]);

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-neutral-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "w-full h-12 bg-neutral-800/50 backdrop-blur-sm rounded-xl",
              "border-2 transition-all duration-300 text-neutral-100",
              "focus:outline-none focus:ring-4",
              "placeholder:text-neutral-500",
              leftIcon ? "pl-12" : "pl-4",
              rightIcon || validating ? "pr-12" : "pr-4",
              showError
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                : "border-neutral-700 focus:border-amber-500 focus:ring-amber-500/20 hover:border-neutral-600",
              className
            )}
            {...props}
          />

          {validating && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
          )}

          {!validating && rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showError ? (
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
          ) : helperText ? (
            <motion.p
              key="helper"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-neutral-500"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";
