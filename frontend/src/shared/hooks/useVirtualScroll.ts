import { useState, useEffect, useRef, useMemo } from "react";

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Hook para virtual scrolling
 * Renderiza apenas itens visíveis para melhor performance
 */
export function useVirtualScroll<T>(items: T[], options: VirtualScrollOptions) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const startWithOverscan = Math.max(0, start - overscan);
    const endWithOverscan = Math.min(items.length - 1, end + overscan);

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      offsetY: startWithOverscan * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
}

/**
 * Exemplo de uso:
 *
 * function LargeList({ items }) {
 *   const {
 *     containerRef,
 *     visibleItems,
 *     totalHeight,
 *     offsetY,
 *     handleScroll,
 *   } = useVirtualScroll(items, {
 *     itemHeight: 50,
 *     containerHeight: 600,
 *   });
 *
 *   return (
 *     <div
 *       ref={containerRef}
 *       onScroll={handleScroll}
 *       style={{ height: 600, overflow: "auto" }}
 *     >
 *       <div style={{ height: totalHeight, position: "relative" }}>
 *         <div style={{ transform: `translateY(${offsetY}px)` }}>
 *           {visibleItems.map((item, index) => (
 *             <div key={index} style={{ height: 50 }}>
 *               {item.name}
 *             </div>
 *           ))}
 *         </div>
 *       </div>
 *     </div>
 *   );
 * }
 */
