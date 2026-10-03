import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';

const EMPTY_PARAMS = {};

export const ResourceListPage = ({
  title,
  subtitle,
  breadcrumbs = [],
  api, // Object with list() or a fetch function
  columns = [],
  actionLabel,
  onAction,
  actionIcon,
  filterComponent,
  searchPlaceholder = 'Search records...',
  emptyTitle,
  emptyDescription,
  defaultParams = EMPTY_PARAMS,
  onRowClick,
  headerChildren,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Direct Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const setPaginationData = useCallback((meta = {}) => {
    if (meta.page !== undefined) setPage(meta.page);
    if (meta.limit !== undefined) setLimit(meta.limit);
    if (meta.total !== undefined) setTotal(meta.total);
    if (meta.totalPages !== undefined) setTotalPages(meta.totalPages);
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const apiRef = useRef(api);
  apiRef.current = api;

  const defaultParamsRef = useRef(defaultParams);
  defaultParamsRef.current = defaultParams;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm || undefined,
        sort: sortField || undefined,
        order: sortField ? sortOrder : undefined,
        ...defaultParamsRef.current,
      };

      const fetchFn = typeof apiRef.current === 'function' ? apiRef.current : apiRef.current.list;
      const res = await fetchFn(params);

      // Handle envelope { success, data, meta } or array
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setData(items);

      if (res?.meta) {
        setPaginationData(res.meta);
      } else {
        setPaginationData({ page, limit, total: items.length, totalPages: 1 });
      }
    } catch (err) {
      console.error(`Failed to load ${title}:`, err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, sortField, sortOrder, title, setPaginationData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (val) => {
    setSearchTerm(val);
    resetPage();
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    resetPage();
  };

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        actionLabel={actionLabel}
        onAction={onAction}
        actionIcon={actionIcon}
        searchComponent={
          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="w-56 sm:w-72"
          />
        }
        filterComponent={filterComponent}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {headerChildren}

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={onRowClick}
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          emptyTitle={emptyTitle || `No ${title.toLowerCase()} found`}
          emptyDescription={emptyDescription}
          emptyActionLabel={actionLabel}
          onEmptyAction={onAction}
        />
      </div>
    </div>
  );
};

export default ResourceListPage;
