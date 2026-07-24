import { useState, useMemo, useEffect } from 'react'
import { SlidersHorizontal, X, ArrowLeft, AlertCircle } from 'lucide-react'
import FilterSidebar from '../components/search/FilterSidebar'
import ResultsHeader from '../components/search/ResultsHeader'
import VehicleListCard from '../components/search/VehicleListCard'
import Pagination from '../components/search/Pagination'
import { useVehicles } from '../hooks/useVehicles'

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  make:       'Any Make',
  model:      'Any Model',
  minYear:    '',
  maxPrice:   300000,
  maxMileage: '',
  fuelTypes:  [],
  bodyTypes:  [],
  conditions: 'Any',
}

const PAGE_SIZE = 12

// ── Build the query-param object from the filter state ────────────────────────
function filtersToParams(filters, sort, page) {
  const p = { status: 'Active', sort, page, limit: PAGE_SIZE }

  if (filters.make      !== 'Any Make')   p.make         = filters.make
  if (filters.model     !== 'Any Model')  p.model        = filters.model
  if (filters.maxPrice  < 300000)         p.maxPrice     = filters.maxPrice
  if (filters.maxMileage)                 p.maxMileage   = filters.maxMileage
  if (filters.fuelTypes.length  === 1)    p.fuel_type    = filters.fuelTypes[0]
  if (filters.bodyTypes.length  === 1)    p.body_type    = filters.bodyTypes[0]
  return p
}

// ── Client-side filter for multi-select values the API can't handle ───────────
function applyClientFilters(vehicles, filters) {
  return vehicles.filter(car => {
    if (filters.minYear && Number(car.year) < Number(filters.minYear)) return false
    if (filters.fuelTypes.length > 1 && !filters.fuelTypes.includes(car.fuelType)) return false
    if (filters.bodyTypes.length > 1 && !filters.bodyTypes.includes(car.bodyType)) return false
    if (filters.conditions !== 'Any' && car.condition !== filters.conditions)       return false
    return true
  })
}

// ── Build active filter chips from current filter state ───────────────────────
function buildActiveFilters(filters) {
  const chips = []
  if (filters.make !== 'Any Make')  chips.push({ key: 'make',     label: filters.make })
  if (filters.model !== 'Any Model') chips.push({ key: 'model',   label: filters.model })
  if (filters.minYear)              chips.push({ key: 'minYear',  label: `From ${filters.minYear}` })
  if (filters.maxPrice < 300000)    chips.push({ key: 'maxPrice', label: `Max £${filters.maxPrice.toLocaleString()}` })
  if (filters.maxMileage)           chips.push({ key: 'maxMileage', label: `Max ${Number(filters.maxMileage).toLocaleString()} mi` })
  filters.fuelTypes.forEach(f => chips.push({ key: `fuel_${f}`, label: f }))
  filters.bodyTypes.forEach(b => chips.push({ key: `body_${b}`, label: b }))
  if (filters.conditions !== 'Any') chips.push({ key: 'conditions', label: filters.conditions })
  return chips
}

// ── Skeleton row for loading state ────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="bg-white border border-outline-variant rounded-lg overflow-hidden shadow-card animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-[260px] aspect-[4/3] sm:aspect-auto sm:h-[180px] bg-surface-container-highest flex-shrink-0" />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-5 bg-surface-container-highest rounded w-2/3" />
          <div className="h-3 bg-surface-container-highest rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-7 bg-surface-container-highest rounded w-20" />
            <div className="h-7 bg-surface-container-highest rounded w-24" />
            <div className="h-7 bg-surface-container-highest rounded w-16" />
          </div>
          <div className="border-t border-outline-variant pt-3 flex items-end justify-between">
            <div className="h-7 bg-surface-container-highest rounded w-28" />
            <div className="h-9 bg-surface-container-highest rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onReset, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy mb-2">
        {hasFilters ? 'No results match your filters' : 'No vehicles listed yet'}
      </h3>
      <p className="text-body-sm text-on-surface-variant max-w-xs mb-5">
        {hasFilters
          ? 'Try adjusting or clearing your filters to see more vehicles.'
          : 'Be the first — list your car today and reach thousands of buyers.'}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <AlertCircle size={36} className="text-accent-red" />
      <div>
        <p className="font-grotesk font-semibold text-body-md text-deep-navy mb-1">
          Could not load vehicles
        </p>
        <p className="text-body-sm text-on-surface-variant">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

// ── Main page component ───────────────────────────────────────────────────────
export default function SearchResults({ initialQuery = {}, onBack, onViewDetails }) {
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    make:      initialQuery.make      ?? 'Any Make',
    model:     initialQuery.model     ?? 'Any Model',
    fuelTypes: initialQuery.fuelTypes ?? [],
  })
  const [pendingFilters, setPendingFilters] = useState(filters)
  const [sortKey,   setSortKey]   = useState('newest')
  const [viewMode,  setViewMode]  = useState('list')
  const [page,      setPage]      = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Reset to page 1 whenever filters or sort change
  useEffect(() => { setPage(1) }, [JSON.stringify(filters), sortKey])

  // ── API call via the shared hook ──────────────────────────────────────────
  const queryParams = useMemo(
    () => filtersToParams(filters, sortKey, page),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters), sortKey, page]
  )

  const { vehicles: rawVehicles, loading, error, pagination, refetch } = useVehicles(queryParams)

  // Apply any multi-select filters that the API doesn't natively support
  const vehicles = useMemo(
    () => applyClientFilters(rawVehicles, filters),
    [rawVehicles, filters]
  )

  // ── Filter chip helpers ───────────────────────────────────────────────────
  const activeFilters = buildActiveFilters(filters)
  const hasFilters    = activeFilters.length > 0

  const removeFilter = key => {
    if (key === 'make')       setFilters(f => ({ ...f, make: 'Any Make', model: 'Any Model' }))
    else if (key === 'model')      setFilters(f => ({ ...f, model: 'Any Model' }))
    else if (key === 'maxPrice')   setFilters(f => ({ ...f, maxPrice: 300000 }))
    else if (key === 'maxMileage') setFilters(f => ({ ...f, maxMileage: '' }))
    else if (key === 'conditions') setFilters(f => ({ ...f, conditions: 'Any' }))
    else if (key.startsWith('fuel_')) {
      const val = key.replace('fuel_', '')
      setFilters(f => ({ ...f, fuelTypes: f.fuelTypes.filter(x => x !== val) }))
    } else if (key.startsWith('body_')) {
      const val = key.replace('body_', '')
      setFilters(f => ({ ...f, bodyTypes: f.bodyTypes.filter(x => x !== val) }))
    }
  }

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setPendingFilters(DEFAULT_FILTERS)
    setSortKey('newest')
  }

  const applyDrawerFilters = () => {
    setFilters(pendingFilters)
    setDrawerOpen(false)
  }

  // ── Subtitle ─────────────────────────────────────────────────────────────
  const subtitle = (() => {
    const parts = []
    if (filters.fuelTypes.length === 1) parts.push(`${filters.fuelTypes[0]} Cars`)
    else parts.push('Cars')
    if (filters.make !== 'Any Make') parts.unshift(filters.make)
    return `Showing ${parts.join(' ')}`
  })()

  // Total count: use the pagination total from the API, adjusted for client filters
  const displayTotal = pagination.total

  return (
    <div className="min-h-screen bg-surface pt-16">

      {/* Breadcrumb / back button */}
      <div className="max-w-container mx-auto px-5 lg:px-10 pt-6 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-deep-navy transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Home
        </button>
      </div>

      <div className="max-w-container mx-auto px-5 lg:px-10 pb-16">
        <div className="flex gap-7 items-start">

          {/* ── Desktop sidebar ── */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0 sticky top-20 max-h-[calc(100vh-96px)] overflow-y-auto">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={resetAll}
              onApply={() => {}}
            />
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="mb-5">
              <ResultsHeader
                totalCount={loading ? 0 : displayTotal}
                subtitle={loading ? 'Loading…' : subtitle}
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
                onClearAll={resetAll}
                sortValue={sortKey}
                onSortChange={setSortKey}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* ── States ── */}
            {loading && (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            )}

            {!loading && error && (
              <ErrorBanner message={error} onRetry={refetch} />
            )}

            {!loading && !error && vehicles.length === 0 && (
              <EmptyState onReset={resetAll} hasFilters={hasFilters} />
            )}

            {!loading && !error && vehicles.length > 0 && (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 gap-5'
                    : 'flex flex-col gap-4'
                }>
                  {vehicles.map(car => (
                    <VehicleListCard
                      key={car.id}
                      car={car}
                      viewMode={viewMode}
                      onViewDetails={onViewDetails}
                    />
                  ))}
                </div>

                {/* Pagination — only show when there are multiple pages */}
                {pagination.total_pages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.total_pages}
                    onChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: floating Filter & Sort button ── */}
      <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => { setPendingFilters(filters); setDrawerOpen(true) }}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-deep-navy text-white font-grotesk font-semibold text-body-sm shadow-xl hover:bg-navy-mid active:scale-[0.97] transition-all duration-150"
        >
          <SlidersHorizontal size={17} />
          Filter & Sort
          {activeFilters.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-red text-white text-[10px] font-bold -mr-1">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile filter drawer ── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex flex-col transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer slides up from bottom */}
        <div
          className={`
            relative mt-auto w-full max-h-[90vh] bg-white rounded-t-2xl flex flex-col
            shadow-2xl transition-transform duration-300 ease-out
            ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          {/* Handle */}
          <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-outline-variant" />
          </div>

          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant flex-shrink-0">
            <h2 className="font-grotesk font-bold text-body-md text-deep-navy">Filter & Sort</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto">
            <FilterSidebar
              filters={pendingFilters}
              onChange={setPendingFilters}
              onReset={() => setPendingFilters(DEFAULT_FILTERS)}
              onApply={applyDrawerFilters}
              isMobile
            />
          </div>

          {/* Sticky apply button */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-outline-variant bg-white">
            <button
              onClick={applyDrawerFilters}
              className="w-full py-3.5 rounded bg-accent-red text-white font-grotesk font-semibold text-body-md hover:bg-red-bright active:scale-[0.98] transition-all duration-150"
            >
              {loading ? 'Loading…' : `Show ${displayTotal} results`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
