import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all"
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-all"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
