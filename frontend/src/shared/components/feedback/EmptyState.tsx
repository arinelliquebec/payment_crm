"use client";

import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-neutral-400" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>

      {description && (
        <p className="text-neutral-600 mb-6 max-w-md">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
