import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({ page = 1, totalPages = 1, onPageChange, total = 0, limit = 10 }) => {
  if (totalPages <= 1 && total <= limit) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1 text-sm text-muted">
      <span className="text-xs">
        Showing <strong className="text-ink">{start}</strong> -{' '}
        <strong className="text-ink">{end}</strong> of <strong className="text-ink">{total}</strong>
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          icon={ChevronLeft}
        >
          Previous
        </Button>

        <span className="text-xs font-semibold px-2 text-ink">
          {page} / {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
