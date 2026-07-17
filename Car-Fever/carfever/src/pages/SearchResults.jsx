import { useState, useMemo, useEffect } from 'react'
import { SlidersHorizontal, X, ArrowLeft } from 'lucide-react'
import FilterSidebar from '../components/search/FilterSidebar'
import ResultsHeader from '../components/search/ResultsHeader'
import VehicleListCard from '../components/search/VehicleListCard'
import Pagination from '../components/search/Pagination'
import { ALL_VEHICLES } from '../data/vehicles'

// ── Default filter state ──────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  make:       'Any Make',
  model:      'Any Model',
  maxPrice:   300000,
  maxMileage: '',
  fuelTypes:  [],
  bodyTypes:  [],
  conditions: 'Any',
}

const PAGE_SIZE = 6

// ── Sort helper ───────────────────────────────────────────────────────────────
function sortVehicles(vehicles, sortKey) {
  const v = [...vehicles]
  switch (sortKey) {
    case 'price_asc':    return v.sort((a, b) => a.price - b.price)
    case 'price_desc':   return v.sort((a, b) => b.price - a.price)
    case 'mileage_asc':  return v.sort((a, b) => a.mileage - b.mileage)
    case 'year_desc':    return v.sort((a, b) => b.year - a.year)
    case 'distance_asc': return v.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    default:             return v
  }
}

// ── Build active filter chips from current filter state ───────────────────────
function buildActiveFilters(filters) {
  const chips = []
  if (filters.make !== 'Any Make') chips.push({ key: 'make', label: filters.make })
  if (filters.maxPrice < 300000)   chips.push({ key: 'maxPrice', label: `Max £${filters.maxPrice.toLocaleString()}` })
  if (filters.maxMileage)          chips.push({ key: 'maxMileage', label: `Max ${Number(filters.maxMileage).toLocaleString()} mi` })
  filters.fuelTypes.forEach(f => chips.push({ key: `fuel_${f}`, label: f }))
  filters.bodyTypes.forEach(b => chips.push({ key: `body_${b}`, label: b }))
  if (filters.conditions !== 'Any') chips.push({ key: 'conditions', label: filters.conditions })
  return chips
}

// ── Main page component ───────────────────────────────────────────────────────
export default function SearchResults({ initialQuery = {}, onBack, onViewDetails }) {
  const [filters, setFilters]       = useState({
    ...DEFAULT_FILTERS,
    make:      initialQuery.make      ?? 'Any Make',
    fuelTypes: initialQuery.fuelTypes ?? [],
  })
  const [pendingFilters, setPendingFilters] = useState(filters)
  const [sortKey,   setSortKey]     = useState('relevance')
  const [viewMode,  setViewMode]    = useState('list')
  const [page,      setPage]        = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // ── Filter + sort logic ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return ALL_VEHICLES.filter(car => {
      if (filters.make !== 'Any Make' && car.make !== filters.make) return false
      if (filters.model !== 'Any Model' && car.model !== filters.model) return false
      if (car.price > filters.maxPrice) return false
      if (filters.maxMileage && car.mileage > Number(filters.maxMileage)) return false
      if (filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(car.fuelType)) return false
      if (filters.bodyTypes.length > 0 && !filters.bodyTypes.includes(car.bodyType)) return false
      if (filters.conditions !== 'Any' && car.condition !== filters.conditions) return false
      return true
    })
  }, [filters])

  const sorted     = useMemo(() => sortVehicles(filtered, sortKey), [filtered, sortKey])
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeFilters = buildActiveFilters(filters)

  // Reset page on filter / sort change
  useEffect(() => { setPage(1) }, [filters, sortKey])

  // Remove a single chip
  const removeFilter = key => {
    if (key === 'make')       setFilters(f => ({ ...f, make: 'Any Make', model: 'Any Model' }))
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

  const applyDrawerFilters = () => {
    setFilters(pendingFilters)
    setDrawerOpen(false)
  }

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
    setPendingFilters(DEFAULT_FILTERS)
  }

  // Subtitle
  const subtitle = (() => {
    const parts = []
    if (filters.fuelTypes.length === 1) parts.push(`${filters.fuelTypes[0]} Cars`)
    else parts.push('Cars')
    if (filters.make !== 'Any Make') parts.unshift(filters.make)
    return `Showing ${parts.join(' ')}`
  })()

  return (
    <div className="min-h-screen bg-surface pt-16">
      {/* ── Breadcrumb / back button ── */}
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

          {/* ── Desktop Sidebar ── */}
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
                totalCount={filtered.length}
                subtitle={subtitle}
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
                onClearAll={resetAll}
                sortValue={sortKey}
                onSortChange={setSortKey}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Cards */}
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy mb-2">No results found</h3>
                <p className="text-body-sm text-on-surface-variant max-w-xs">
                  Try adjusting your filters to see more vehicles.
                </p>
                <button
                  onClick={resetAll}
                  className="mt-5 px-5 py-2.5 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-5'
                  : 'flex flex-col gap-4'
              }>
                {paginated.map(car => (
                  <VehicleListCard key={car.id} car={car} viewMode={viewMode}
                    onViewDetails={onViewDetails} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {sorted.length > PAGE_SIZE && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
              />
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

      {/* ── Mobile Filter Drawer ── */}
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
          {/* Drawer handle */}
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

          {/* Sticky apply button at bottom */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-outline-variant bg-white">
            <button
              onClick={applyDrawerFilters}
              className="w-full py-3.5 rounded bg-accent-red text-white font-grotesk font-semibold text-body-md hover:bg-red-bright active:scale-[0.98] transition-all duration-150"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
