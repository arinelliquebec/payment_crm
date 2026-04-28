import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TableNavigationProps {
  onScrollLeft: () => void;
  onScrollRight: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  pageId?: string; // Identificador único da página
}

export function TableNavigation({
  onScrollLeft,
  onScrollRight,
  canScrollLeft,
  canScrollRight,
  pageId = "default",
}: TableNavigationProps) {
  // Mostrar setas se houver overflow horizontal
  const showNavigation = canScrollLeft || canScrollRight;

  if (!showNavigation) return null;

  return (
    <AnimatePresence>
      {/* Seta Esquerda - fixa, centro vertical da viewport */}
      <motion.button
        key={`${pageId}-scroll-left`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ scale: canScrollLeft ? 1.1 : 1.0 }}
        whileTap={{ scale: canScrollLeft ? 0.9 : 1.0 }}
        onClick={onScrollLeft}
        disabled={!canScrollLeft}
        className={`fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full transition-all table-navigation-button border-2 ${
          canScrollLeft
            ? "bg-white/95 text-secondary-700 hover:bg-white hover:text-secondary-800 shadow-2xl hover:shadow-3xl border-secondary-200 hover:border-secondary-300"
            : "bg-white/80 text-secondary-300 cursor-not-allowed shadow border-secondary-100"
        }`}
        title="Rolar para esquerda"
        aria-label="Rolar tabela para a esquerda"
      >
        <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
      </motion.button>

      {/* Seta Direita - fixa, centro vertical da viewport */}
      <motion.button
        key={`${pageId}-scroll-right`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ scale: canScrollRight ? 1.1 : 1.0 }}
        whileTap={{ scale: canScrollRight ? 0.9 : 1.0 }}
        onClick={onScrollRight}
        disabled={!canScrollRight}
        className={`fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full transition-all table-navigation-button border-2 ${
          canScrollRight
            ? "bg-white/95 text-secondary-700 hover:bg-white hover:text-secondary-800 shadow-2xl hover:shadow-3xl border-secondary-200 hover:border-secondary-300"
            : "bg-white/80 text-secondary-300 cursor-not-allowed shadow border-secondary-100"
        }`}
        title="Rolar para direita"
        aria-label="Rolar tabela para a direita"
      >
        <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
      </motion.button>
    </AnimatePresence>
  );
}
