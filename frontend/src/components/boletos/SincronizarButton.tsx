import { RefreshCw } from "lucide-react";
import { useBoletoStatus } from "@/hooks/useBoletoStatus";

interface SincronizarButtonProps {
  boletoId: number;
  onSincronizado?: () => void;
  variant?: "icon" | "button";
  size?: "sm" | "md";
}

export function SincronizarButton({
  boletoId,
  onSincronizado,
  variant = "button",
  size = "md",
}: SincronizarButtonProps) {
  const { loading, sincronizar } = useBoletoStatus();

  const handleSincronizar = async () => {
    try {
      await sincronizar(boletoId);
      onSincronizado?.();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    }
  };

  const sizeClasses = size === "sm" ? "p-1.5 text-xs" : "p-2";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (variant === "icon") {
    return (
      <button
        onClick={handleSincronizar}
        disabled={loading}
        className={`hover:bg-blue-50 text-blue-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        title="Sincronizar com Santander"
      >
        <RefreshCw
          className={`${iconSize} ${loading ? "animate-spin" : ""}`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleSincronizar}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Sincronizando..." : "Sincronizar"}
    </button>
  );
}

