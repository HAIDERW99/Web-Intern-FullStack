import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onChange }) {
  // Build page array with ellipsis logic
  const buildPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    const delta = 1

    pages.push(1)
    if (currentPage - delta > 2) pages.push('...')

    const start = Math.max(2, currentPage - delta)
    const end   = Math.min(totalPages - 1, currentPage + delta)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage + delta < totalPages - 1) pages.push('...')
    pages.push(totalPages)

    return pages
  }

  const pages = buildPages()

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded border text-body-sm font-medium transition-all duration-150'
  const activeCls = 'bg-deep-navy border-deep-navy text-white'
  const inactiveCls = 'bg-white border-outline-variant text-on-surface hover:border-deep-navy hover:text-deep-navy'
  const disabledCls = 'opacity-30 cursor-not-allowed bg-white border-outline-variant text-on-surface-variant'

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 py-6">
      {/* Prev */}
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${currentPage === 1 ? disabledCls : inactiveCls}`}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Pages */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="flex items-center justify-center w-9 h-9 text-outline select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`${btnBase} ${p === currentPage ? activeCls : inactiveCls}`}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${currentPage === totalPages ? disabledCls : inactiveCls}`}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
