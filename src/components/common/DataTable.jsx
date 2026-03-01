import { HiChevronLeft, HiChevronRight, HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi2';

function getPageNumbers(page, totalPages) {
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (page > 3) pages.push('...');
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}

export default function DataTable({
  columns,
  data,
  loading,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  onRowClick,
  emptyMessage = 'No data found',
  perPage = 15,
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {columns.map((col, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {col.label ?? col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full rounded" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const from = total > 0 ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {columns.map((col, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {col.label ?? col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!data?.length ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, j) => {
                    const accessor = col.key ?? col.accessor;
                    const cellValue = row[accessor];
                    return (
                      <td key={j} className="px-4 py-3 text-sm dark:text-gray-200">
                        {col.render ? col.render(cellValue, row) : (cellValue ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="First page"
            >
              <HiChevronDoubleLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-1 text-gray-400 text-sm select-none">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-[#3498db] text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next page"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange?.(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last page"
            >
              <HiChevronDoubleRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
