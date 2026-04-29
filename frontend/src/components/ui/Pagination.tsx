'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-neutral-200
          hover:border-black transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={16} />
        Назад
      </button>
      <span className="text-sm text-neutral-500 px-3">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-neutral-200
          hover:border-black transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        Вперед
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
