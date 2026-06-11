"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  total: number;
  page: number;
  perPage: number;
  onChange: (page: number) => void;
}

export function Pagination({ total, page, perPage, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, total);

  // Build visible page numbers with ellipsis
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-gray-400 dark:text-slate-500 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
