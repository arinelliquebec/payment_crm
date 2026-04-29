"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, X } from "lucide-react";

interface ErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  };
}

export default function ErrorDialog({
  isOpen,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
}: ErrorDialogProps) {
  if (!isOpen) return null;

  const getButtonStyles = (variant: string = "primary") => {
    const styles = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };
    return styles[variant as keyof typeof styles] || styles.primary;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <p className="text-gray-600 leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            {(primaryAction || secondaryAction) && (
              <div className="flex gap-3 bg-gray-50 px-6 py-4">
                {secondaryAction && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={secondaryAction.onClick}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-colors duration-200",
                      getButtonStyles(secondaryAction.variant || "secondary")
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{secondaryAction.label}</span>
                  </motion.button>
                )}
                {primaryAction && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={primaryAction.onClick}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-xl font-medium transition-colors duration-200",
                      getButtonStyles(primaryAction.variant || "primary")
                    )}
                  >
                    {primaryAction.label}
                  </motion.button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

// Função auxiliar que pode ser importada separadamente se necessário
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
