import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/utils/cn';
import { PaginationMeta } from '@/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages } = meta;
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (candidate) => Math.abs(candidate - page) <= 2 || candidate === 1 || candidate === totalPages,
  );

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const showEllipsis = previous && candidate - previous > 1;
        return (
          <span key={candidate} className="flex items-center gap-1">
            {showEllipsis && <span className="px-1 text-ink/40">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(candidate)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl border text-sm',
                candidate === page
                  ? 'border-ink bg-ink text-paper'
                  : 'border-border hover:bg-ink/5',
              )}
              aria-current={candidate === page ? 'page' : undefined}
            >
              {candidate}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
