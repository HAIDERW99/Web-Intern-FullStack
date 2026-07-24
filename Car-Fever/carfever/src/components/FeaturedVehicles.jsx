import { ChevronRight } from 'lucide-react'
import CarCard from './CarCard'
import { useVehicles } from '../hooks/useVehicles'

// ── Skeleton loader card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-outline-variant rounded-lg overflow-hidden shadow-card animate-pulse">
      <div className="aspect-[16/10] bg-surface-container-highest" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface-container-highest rounded w-3/4" />
        <div className="h-3 bg-surface-container-highest rounded w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-surface-container-highest rounded-full w-14" />
          <div className="h-5 bg-surface-container-highest rounded-full w-20" />
          <div className="h-5 bg-surface-container-highest rounded-full w-16" />
        </div>
        <div className="border-t border-outline-variant pt-3 mt-2">
          <div className="h-5 bg-surface-container-highest rounded w-28" />
          <div className="h-8 bg-surface-container-highest rounded mt-3" />
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">🚗</div>
      <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy mb-2">
        No featured vehicles yet
      </h3>
      <p className="text-body-sm text-on-surface-variant max-w-xs">
        Be the first — list your car today and reach thousands of buyers.
      </p>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <p className="text-body-sm text-on-surface-variant">{message}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FeaturedVehicles({ onViewDetails, onViewAll }) {
  // Fetch the 4 newest active vehicles for the featured section
  const { vehicles, loading, error } = useVehicles({ status: 'Active', sort: 'newest', limit: 4 })

  return (
    <section className="py-14 bg-surface">
      <div className="max-w-container mx-auto px-5 lg:px-10">

        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="font-grotesk font-bold text-headline-lg-mobile md:text-headline-md text-deep-navy">
              Featured Vehicles
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {loading
                ? 'Loading latest listings…'
                : error
                  ? 'Could not load vehicles right now'
                  : vehicles.length > 0
                    ? 'Curated premium selections for your next journey.'
                    : 'New listings coming soon.'}
            </p>
          </div>
          {!loading && vehicles.length > 0 && (
            <button
              onClick={onViewAll}
              className="flex-shrink-0 flex items-center gap-1 text-body-sm font-semibold text-deep-navy hover:text-accent-red transition-colors mt-1"
            >
              View all <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && vehicles.length === 0 && <EmptyState />}
          {!loading && !error && vehicles.map(car => (
            <CarCard key={car.id} car={car} onViewDetails={onViewDetails} />
          ))}
        </div>

        {/* Mobile CTA */}
        {!loading && vehicles.length > 0 && (
          <div className="mt-8 text-center sm:hidden">
            <button
              onClick={onViewAll}
              className="inline-flex items-center gap-2 px-6 py-3 rounded border border-deep-navy text-body-sm text-deep-navy font-semibold hover:bg-deep-navy hover:text-white transition-all duration-150"
            >
              View all vehicles <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
