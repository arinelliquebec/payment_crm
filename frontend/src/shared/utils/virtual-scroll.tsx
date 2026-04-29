/**
 * Virtual Scrolling Utilities
 * Helpers para renderização virtualizada de listas grandes
 */

import { useState, useEffect, useRef, useMemo, CSSProperties } from "react";

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Hook para virtual scrolling
 */
export function useVirtualScroll(
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = itemCount * itemHeight;

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
      });
    }

    return items;
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const scrollToIndex = (index: number) => {
    const scrollTop = index * itemHeight;
    setScrollTop(scrollTop);
  };

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
}

/**
 * Componente VirtualList
 */
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 3,
  className = "",
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { virtualItems, totalHeight } = useVirtualScroll(items.length, {
    itemHeight,
    containerHeight: height,
    overscan,
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map(({ index, start }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: start,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(items[index], index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook para infinite scroll
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 100, enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);

  const lastElementRef = (node: HTMLElement | null) => {
    if (!enabled) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (node) {
      observerRef.current.observe(node);
    }
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return lastElementRef;
}

/**
 * Componente InfiniteScroll
 */
interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  loader?: React.ReactNode;
  threshold?: number;
}

export function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  loader = <div className="text-center py-4">Carregando...</div>,
  threshold = 100,
}: InfiniteScrollProps) {
  const lastElementRef = useInfiniteScroll(onLoadMore, {
    threshold,
    enabled: hasMore && !isLoading,
  });

  return (
    <>
      {children}
      {hasMore && <div ref={lastElementRef}>{isLoading && loader}</div>}
    </>
  );
}
