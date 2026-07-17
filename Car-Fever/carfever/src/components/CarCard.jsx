import { useState } from 'react'
import { Heart, TrendingDown, ChevronRight, Zap } from 'lucide-react'

// Badge config — Great Price uses vibrant emerald, Rare Find uses accent-red (#bb0014)
const BADGE_STYLES = {
  'Great Price': 'bg-[#10B981] text-white',
  'New In':      'bg-deep-navy text-white',
  'Electric':    'bg-[#003189] text-white',
  'Good Price':  'bg-[#10B981] text-white',
  'Rare Find':   'bg-[#bb0014] text-white',
  'Popular':     'bg-deep-navy text-white',
}

function SpecPill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-body-sm text-on-surface-variant text-[12px] font-medium">
      {children}
    </span>
  )
}

function PriceLabel({ label, style }) {
  return (
    <span className={`text-label-bold font-semibold px-2 py-0.5 rounded-full text-[11px] ${style}`}>
      {label}
    </span>
  )
}

const PRICE_LABEL_STYLES = {
  'below market': 'bg-green-50 text-success',
  'Popular':      'bg-blue-50 text-blue-700',
  'Fair Price':   'bg-gray-100 text-on-surface-variant',
  'High Spec':    'bg-amber-50 text-amber-700',
}

export default function CarCard({ car, onViewDetails }) {
  const [saved, setSaved] = useState(false)

  const monthlyFinance = Math.round(car.price / 48 * 1.08)

  return (
    <article
      className="group bg-white border border-outline-variant rounded-lg overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => onViewDetails?.(car.id)}
    >
      {/* Image area */}
      <div className="relative overflow-hidden aspect-[16/10] bg-surface-container-low">
        <img
          src={car.image}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient scrim at bottom of image */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Top-left badges — anchored at top-left corner of image */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
          {car.badges.map(badge => (
            <span
              key={badge}
              className={`text-[11px] font-bold px-2 py-[3px] rounded-full uppercase tracking-wide shadow-sm ${BADGE_STYLES[badge] ?? 'bg-white/90 text-deep-navy'}`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Wishlist button */}
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
          aria-label={saved ? 'Remove from saved' : 'Save car'}
          className={`
            absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-sm transition-all duration-150
            ${saved
              ? 'bg-accent-red text-white'
              : 'bg-white/80 text-on-surface-variant hover:bg-white hover:text-accent-red'
            }
          `}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {/* Electric badge overlay */}
        {car.fuelType === 'Electric' && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Zap size={11} fill="currentColor" />
            EV
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-1">
          <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy leading-snug line-clamp-1 group-hover:text-navy-mid transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{car.trim}</p>
        </div>

        {/* Spec pills */}
        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
          <SpecPill>{car.year}</SpecPill>
          <SpecPill>{car.mileage.toLocaleString()} mi</SpecPill>
          <SpecPill>{car.fuelType}</SpecPill>
          {car.gearbox && <SpecPill>{car.gearbox}</SpecPill>}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price block */}
        <div className="border-t border-outline-variant pt-3 mt-1">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="font-grotesk font-bold text-headline-sm text-deep-navy">
                £{car.price.toLocaleString()}
              </div>
              <div className="text-[12px] text-on-surface-variant mt-0.5">
                £{monthlyFinance}/mo <span className="text-outline">est. finance</span>
              </div>
            </div>

            {/* Price signal */}
            <div>
              {car.priceLabel === 'below market' ? (
                <span className="flex items-center gap-1 text-success text-[12px] font-semibold">
                  <TrendingDown size={14} />
                  £{car.belowMarket} below market
                </span>
              ) : (
                <PriceLabel label={car.priceLabel} style={PRICE_LABEL_STYLES[car.priceLabel] ?? ''} />
              )}
            </div>
          </div>

          {/* View details button */}
          <button
            onClick={e => { e.stopPropagation(); onViewDetails?.(car.id) }}
            className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded border border-deep-navy text-body-sm text-deep-navy font-semibold hover:bg-deep-navy hover:text-white active:scale-[0.98] transition-all duration-150"
          >
            View Details <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}
