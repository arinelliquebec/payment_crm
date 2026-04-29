import { useMemo, useState } from "react";

export interface PaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

/**
 * Hook para paginação client-side
 */
export function usePagination<T>(items: T[], options: PaginationOptions = {}) {
  const { initialPage = 1, pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    pageSize,
    totalItems: items.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
  };
}

/**
 * Exemplo de uso:
 *
 * function ClientesList() {
 *   const { data: allClientes } = useClientes();
 *   const {
 *     items,
 *     currentPage,
 *     totalPages,
 *     nextPage,
 *     previousPage,
 *   } = usePagination(allClientes || [], { pageSize: 20 });
 *
 *   return (
 *     <div>
 *       <DataTable data={items} columns={columns} />
 *
 *       <div className="flex gap-2">
 *         <button onClick={previousPage}>Anterior</button>
 *         <span>Página {currentPage} de {totalPages}</span>
 *         <button onClick={nextPage}>Próxima</button>
 *       </div>
 *     </div>
 *   );
 * }
 */
