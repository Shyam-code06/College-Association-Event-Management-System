import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const setPaginationData = useCallback((meta = {}) => {
    if (meta.page !== undefined) {
      setPage((prev) => (prev !== meta.page ? meta.page : prev));
    }
    if (meta.limit !== undefined) {
      setLimit((prev) => (prev !== meta.limit ? meta.limit : prev));
    }
    if (meta.total !== undefined) {
      setTotal((prev) => (prev !== meta.total ? meta.total : prev));
    }
    if (meta.totalPages !== undefined) {
      setTotalPages((prev) => (prev !== meta.totalPages ? meta.totalPages : prev));
    }
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setPaginationData,
    resetPage,
  };
};

export default usePagination;
