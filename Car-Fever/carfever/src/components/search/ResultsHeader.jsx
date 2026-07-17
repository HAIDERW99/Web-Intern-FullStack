import { X, List, LayoutGrid, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { label: 'Relevance',        value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Mileage: Low First', value: 'mileage_asc' },
  { label: 'Newest First',     value: 'year_desc' },
  { label: 'Nearest First',    value: 'distance_asc' },
]

// Custom sort dropdown
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORT_OPTIONS.find(o => o.value === value) ?? SORT_OPTIONS[0]

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3.5 py-2 border border-outline-variant rounded bg-white text-body-sm text-on-surface hover:border-deep-navy transition-colors min-w-[180px] justify-between"
      >
        <span>
          <span className="text-on-surface-variant mr-1">Sort by:</span>
          <span className="font-semibold text-deep-navy">{current.label}</span>
        </span>
        <ChevronDown size={14} className={`text-outline flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-white border border-outline-variant rounded-lg shadow-[0_8px_32px_rgba(0,26,53,0.12)] z-30 overflow-hidden">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-body-sm transition-colors hover:bg-surface-container-low
                ${opt.value === value ? 'text-deep-navy font-semibold bg-surface-container-low' : 'text-on-surface'}`}
            >
              {opt.value === value && <span className="mr-2 text-success">✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Active filter chip
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-deep-navy/5 border border-deep-navy/20 text-body-sm text-deep-navy font-medium">
      {label}
      <button
        onClick={onRemove}
        className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-deep-navy hover:text-white transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  )
}

export default function ResultsHeader({
  totalCount,
  subtitle,
  activeFilters,
  onRemoveFilter,
  onClearAll,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="space-y-3">
      {/* Top row: count + view toggles + sort */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-grotesk font-bold text-headline-md text-deep-navy leading-tight">
            {totalCount.toLocaleString()} Matches Found
          </h1>
          {subtitle && (
            <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* List / Grid toggle */}
          <div className="hidden sm:flex items-center border border-outline-variant rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-deep-navy text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-deep-navy text-white' : 'bg-white text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Sort dropdown */}
          <SortDropdown value={sortValue} onChange={onSortChange} />
        </div>
      </div>

      {/* Active filter chips row */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(filter => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              onRemove={() => onRemoveFilter(filter.key)}
            />
          ))}
          <button
            onClick={onClearAll}
            className="text-body-sm text-accent-red font-semibold hover:text-red-bright transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
