import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  sortField,
  sortOrder,
  onSort,
  onRowClick,
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}) => {
  const handleSort = (key, sortable) => {
    if (!sortable || !onSort) return;
    onSort(key);
  };

  const renderSortIcon = (columnKey, sortable) => {
    if (!sortable) return null;
    if (sortField !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted/60 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary ml-1 inline" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary ml-1 inline" />
    );
  };

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-line text-xs font-semibold uppercase tracking-wider text-muted">
              {columns.map((col) => (
                <th
                  key={col.key || col.header}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={cn(
                    'py-3.5 px-4 select-none',
                    col.sortable && 'cursor-pointer hover:text-ink transition-colors',
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {renderSortIcon(col.key, col.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm text-ink bg-surface">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="py-4 px-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data && data.length > 0 ? (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || row.id_key || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors hover:bg-canvas/50',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={`${row.id || rIdx}-${col.key}`}
                      className={cn('py-3.5 px-4 align-middle', col.className)}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        {!isLoading && (!data || data.length === 0) && (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
            className="border-0 shadow-none my-0 rounded-none"
          />
        )}
      </div>

      {page !== undefined && totalPages !== undefined && onPageChange && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total || 0}
          limit={limit || 10}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
