/**
 * FilterPanel Component
 * Painel de filtros reutilizável
 */

"use client";

import { useState, ReactNode } from "react";
import { Button } from "../ui/Button";
import { cn } from "@/shared/utils/cn";

interface FilterPanelProps {
  children: ReactNode;
  onApply: () => void;
  onClear: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function FilterPanel({
  children,
  onApply,
  onClear,
  isOpen: controlledIsOpen,
  onToggle,
}: FilterPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen ?? internalIsOpen;
  const toggle = onToggle ?? (() => setInternalIsOpen(!internalIsOpen));

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-medium text-neutral-900">Filtros</span>
        </div>
        <svg
          className={cn(
            "w-5 h-5 text-neutral-400 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-neutral-200">
          <div className="pt-4 space-y-4">{children}</div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button onClick={onApply} variant="primary" className="flex-1">
              Aplicar Filtros
            </Button>
            <Button onClick={onClear} variant="outline" className="flex-1">
              Limpar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
