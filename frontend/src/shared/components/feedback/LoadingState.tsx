"use client";

import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function LoadingState({
  message = "Carregando...",
  size = "md",
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2
          className={`${sizeClasses[size]} animate-spin text-primary-600 mx-auto mb-4`}
        />
        <p className="text-neutral-600 font-medium">{message}</p>
      </div>
    </div>
  );
}
