import { useState } from 'react'
import { Heart, MapPin, Calendar, Gauge, Zap, ChevronRight, TrendingDown, Star } from 'lucide-react'

const BADGE_STYLES = {
  'Electric':    { bg: '#003189', text: '#ffffff' },
  'Featured':    { bg: '#001839', text: '#ffffff' },
  'Great Price': { bg: '#10B981', text: '#ffffff' },
  'Good Price':  { bg: '#10B981', text: '#ffffff' },
  'New In':      { bg: '#001839', text: '#ffffff' },
  'Rare Find':   { bg: '#bb0014', text: '#ffffff' },
}

const PRICE_SIGNAL = {
  'Good Price':          { text: 'Good Price',          color: 'text-[#10B981]' },
  'Price Dropped':       { text: 'Price Dropped ↓',     color: 'text-accent-red' },
  'Brand New Condition': { text: 'Brand New Condition',  color: 'text-blue-600' },
  'Popular':             { text: 'Popular',              color: 'text-deep-navy' },
  'Fair Price':          { text: 'Fair Price',           color: 'text-on-surface-variant' },
}

function SpecTag({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container text-body-sm text-on-surface-variant text-[13px]">
      {icon}
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// List view card (horizontal row on desktop, stacked on mobile)
// ─────────────────────────────────────────────────────────────────────────────
export default function VehicleListCard({ car, viewMode = 'list', onViewDetails }) {
  const [saved, setSaved] = useState(false)

  const monthly = Math.round(car.price / 48 * 1.085)
  const signal  = PRICE_SIGNAL[car.priceLabel]

  if (viewMode === 'grid') {
    // Grid mode — compact card (reuses homepage card style)
    return (
      <article className="group bg-white border border-outline-variant rounded-lg overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
      onClick={() => onViewDetails?.(car.id)}>
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-low">
          <img
            src={car.image}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            {car.badges.slice(0, 2).map(b => (
              <span key={b} style={{ background: BADGE_STYLES[b]?.bg ?? '#001839', color: BADGE_STYLES[b]?.text ?? '#fff' }}
                className="text-[11px] font-bold px-2 py-[3px] rounded-full uppercase tracking-wide shadow-sm">
                {b}
              </span>
            ))}
          </div>
          {/* Wishlist */}
          <button onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-sm transition-all ${saved ? 'bg-accent-red text-white' : 'bg-white/80 text-on-surface-variant hover:bg-white hover:text-accent-red'}`}>
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-grotesk font-bold text-body-md text-deep-navy line-clamp-1 group-hover:text-navy-mid transition-colors">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1 mb-2">{car.trim}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <SpecTag icon={<Calendar size={12}/>} label={car.year}/>
            <SpecTag icon={<Gauge size={12}/>} label={`${car.mileage.toLocaleString()} mi`}/>
            <SpecTag icon={<Zap size={12}/>} label={car.fuelType}/>
          </div>
          <div className="flex-1" />
          <div className="border-t border-outline-variant pt-3">
            <div className="font-grotesk font-bold text-headline-sm text-deep-navy">
              £{car.price.toLocaleString()}
            </div>
            <div className="text-[12px] text-on-surface-variant">£{monthly}/mo est.</div>
            {signal && <div className={`text-[12px] font-semibold mt-1 ${signal.color}`}>{signal.text}</div>}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group bg-white border border-outline-variant rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,26,53,0.05)] hover:shadow-[0_8px_32px_rgba(0,26,53,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      onClick={() => onViewDetails?.(car.id)}>
      <div className="flex flex-col sm:flex-row">

        {/* ── Image pane ── */}
        <div className="relative sm:w-[260px] lg:w-[300px] flex-shrink-0 overflow-hidden bg-surface-container-low">
          {/* aspect-ratio trick: keeps 4:3 on mobile, fixed width on desktop */}
          <div className="aspect-[4/3] sm:aspect-auto sm:h-full min-h-[180px]">
            <img
              src={car.image}
              alt={`${car.year} ${car.make} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Gradient scrim */}
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent" />

          {/* Badges — top-left of image */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            {car.badges.map(b => (
              <span
                key={b}
                style={{ background: BADGE_STYLES[b]?.bg ?? '#001839', color: BADGE_STYLES[b]?.text ?? '#fff' }}
                className="text-[11px] font-bold px-2 py-[3px] rounded-full uppercase tracking-wide shadow-sm"
              >
                {b}
              </span>
            ))}
          </div>

          {/* Wishlist button */}
          <button
            onClick={e => { e.stopPropagation(); setSaved(s => !s) }}
            aria-label={saved ? 'Remove from saved' : 'Save this car'}
            className={`
              absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-sm transition-all duration-150
              ${saved ? 'bg-accent-red text-white' : 'bg-white/80 text-on-surface-variant hover:bg-white hover:text-accent-red'}
            `}
          >
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* ── Metadata pane ── */}
        <div className="flex flex-col flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Title */}
              <h2 className="font-grotesk font-bold text-headline-sm text-deep-navy leading-snug group-hover:text-navy-mid transition-colors line-clamp-1">
                {car.make} {car.model}
              </h2>
              {/* Trim */}
              <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2 leading-snug">
                {car.trim}
              </p>
            </div>
          </div>

          {/* Spec tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <SpecTag icon={<Calendar size={12} />} label={String(car.year)} />
            <SpecTag icon={<Gauge size={12} />}    label={`${car.mileage.toLocaleString()} miles`} />
            <SpecTag icon={<Zap size={12} />}      label={car.fuelType} />
            {car.gearbox && <SpecTag icon={null}   label={car.gearbox} />}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 mt-2 text-[12px] text-on-surface-variant">
            <MapPin size={12} className="flex-shrink-0" />
            <span>{car.location}</span>
            {car.distance && <span className="text-outline">· {car.distance} mi away</span>}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Price + CTA row ── */}
          <div className="flex flex-wrap items-end justify-between gap-3 pt-3 mt-3 border-t border-outline-variant">
            <div>
              <div className="font-grotesk font-bold text-[26px] leading-none text-deep-navy">
                £{car.price.toLocaleString()}
              </div>
              <div className="text-body-sm text-on-surface-variant mt-1">
                £{monthly}/mo <span className="text-outline text-[12px]">Representative APR 8.9%</span>
              </div>
              {signal && (
                <div className={`text-body-sm font-semibold mt-1 ${signal.color}`}>
                  {signal.text}
                </div>
              )}
            </div>

            <button
              onClick={e => { e.stopPropagation(); onViewDetails?.(car.id) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-deep-navy text-white font-grotesk font-semibold text-body-sm hover:bg-navy-mid active:scale-[0.98] transition-all duration-150 whitespace-nowrap flex-shrink-0">
              View Details
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </article>
  )
}
