import { Minus, Plus } from "lucide-react";

interface TableSizeToggleProps {
  isCompact: boolean;
  onToggle: () => void;
  pageId?: string;
}

export function TableSizeToggle({
  isCompact,
  onToggle,
  pageId = "default",
}: TableSizeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:text-amber-800 hover:bg-amber-100 shadow-sm transition-all duration-200"
      title={
        isCompact ? "Aumentar tamanho da tabela" : "Diminuir tamanho da tabela"
      }
      aria-label={
        isCompact ? "Aumentar tamanho da tabela" : "Diminuir tamanho da tabela"
      }
    >
      {isCompact ? (
        <>
          <Plus className="w-4 h-4" />
          <span className="text-xs font-medium">Normal</span>
        </>
      ) : (
        <>
          <Minus className="w-4 h-4" />
          <span className="text-xs font-medium">Compacto</span>
        </>
      )}
    </button>
  );
}
