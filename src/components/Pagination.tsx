"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3, "ellipsis", totalPages - 2, totalPages - 1, totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-[var(--muted)]">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[2.25rem] rounded-md px-2 py-1.5 text-sm font-medium transition ${
              p === currentPage
                ? "bg-[var(--text-secondary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-gray-200"
            }`}
          >
            {String(p).padStart(2, "0")}
          </button>
        )
      )}
    </div>
  );
}
