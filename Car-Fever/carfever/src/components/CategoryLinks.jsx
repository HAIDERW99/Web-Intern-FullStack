import { ChevronRight } from 'lucide-react'

const CATEGORIES = [
  {
    label: 'Hatchback',
    count: '34,210',
    emoji: '🚗',
    // SVG path for hatchback silhouette
    color: 'from-blue-50 to-blue-100',
    accent: 'text-blue-600',
  },
  {
    label: 'SUV',
    count: '28,450',
    emoji: '🚙',
    color: 'from-emerald-50 to-emerald-100',
    accent: 'text-emerald-600',
  },
  {
    label: 'Electric',
    count: '9,870',
    emoji: '⚡',
    color: 'from-amber-50 to-amber-100',
    accent: 'text-amber-600',
  },
  {
    label: 'Diesel',
    count: '41,300',
    emoji: '⛽',
    color: 'from-slate-50 to-slate-100',
    accent: 'text-slate-600',
  },
  {
    label: 'Automatic',
    count: '52,100',
    emoji: '🔄',
    color: 'from-purple-50 to-purple-100',
    accent: 'text-purple-600',
  },
  {
    label: 'Convertible',
    count: '6,540',
    emoji: '🌞',
    color: 'from-rose-50 to-rose-100',
    accent: 'text-rose-600',
  },
]

// Inline SVG car silhouettes per category
const CarSVGs = {
  Hatchback: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M5 28 C5 28 15 14 28 12 L52 12 C58 12 68 22 72 28 L75 28 C75 32 72 34 68 34 L12 34 C8 34 5 32 5 28Z" fill="currentColor" opacity="0.18"/>
      <circle cx="19" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <circle cx="61" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <path d="M30 12 L35 6 L50 6 L55 12" fill="currentColor" opacity="0.25"/>
    </svg>
  ),
  SUV: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M4 27 C4 27 12 10 26 9 L54 9 C64 9 72 20 74 27 L76 27 C76 32 73 35 69 35 L11 35 C7 35 4 32 4 27Z" fill="currentColor" opacity="0.18"/>
      <circle cx="18" cy="33" r="6" fill="currentColor" opacity="0.35"/>
      <circle cx="62" cy="33" r="6" fill="currentColor" opacity="0.35"/>
    </svg>
  ),
  Electric: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M6 28 C6 28 18 13 30 11 L50 11 C60 11 70 22 72 28 L74 28 C74 33 71 35 67 35 L13 35 C9 35 6 32 6 28Z" fill="currentColor" opacity="0.18"/>
      <circle cx="20" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <circle cx="60" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <path d="M40 8 L36 18 L40 17 L36 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  Diesel: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M5 28 C5 28 14 14 28 12 L52 12 C62 12 70 22 72 28 L75 28 C75 32 72 35 68 35 L12 35 C8 35 5 32 5 28Z" fill="currentColor" opacity="0.18"/>
      <circle cx="19" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <circle cx="61" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
    </svg>
  ),
  Automatic: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M5 28 C5 28 16 12 30 11 L50 11 C62 11 70 22 73 28 L75 28 C75 32 72 35 68 35 L12 35 C8 35 5 32 5 28Z" fill="currentColor" opacity="0.18"/>
      <circle cx="19" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <circle cx="61" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
    </svg>
  ),
  Convertible: (
    <svg viewBox="0 0 80 40" fill="none" className="w-full h-full" aria-hidden="true">
      <path d="M6 28 C6 28 18 18 30 16 L55 16 C64 16 70 23 73 28 L75 28 C75 32 72 35 68 35 L12 35 C8 35 6 32 6 28Z" fill="currentColor" opacity="0.18"/>
      <circle cx="20" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <circle cx="62" cy="33" r="5.5" fill="currentColor" opacity="0.35"/>
      <path d="M29 16 C32 10 48 8 56 16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" fill="none"/>
    </svg>
  ),
}

export default function CategoryLinks() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-container mx-auto px-5 lg:px-10">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-grotesk font-bold text-headline-lg-mobile md:text-headline-md text-deep-navy">
              Browse by Type
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Find the style that suits you</p>
          </div>
          <a
            href="#"
            className="hidden sm:flex items-center gap-1 text-body-sm font-semibold text-deep-navy hover:text-accent-red transition-colors"
          >
            View all <ChevronRight size={16} />
          </a>
        </div>

        {/* Mobile: single-row horizontal scroll with snap, Desktop: 6-col grid */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 md:grid md:grid-cols-6 md:overflow-visible md:pb-0 md:snap-none">
          {CATEGORIES.map(({ label, count, color, accent }) => (
            <a
              key={label}
              href="#"
              className={`
                group flex-shrink-0 snap-start w-[130px] md:w-auto
                flex flex-col items-center gap-3 p-4 rounded-lg border border-outline-variant
                bg-gradient-to-br ${color}
                hover:border-deep-navy hover:shadow-card-hover hover:-translate-y-0.5
                transition-all duration-200 cursor-pointer
              `}
            >
              {/* Icon area */}
              <div className={`w-14 h-10 ${accent} group-hover:scale-105 transition-transform duration-200`}>
                {CarSVGs[label]}
              </div>

              {/* Label */}
              <div className="text-center">
                <p className="font-grotesk font-semibold text-body-sm text-deep-navy">{label}</p>
                <p className="text-label-bold text-on-surface-variant mt-0.5">{count} cars</p>
              </div>
            </a>
          ))}
        </div>

        {/* Mobile: View all link */}
        <div className="mt-5 text-center md:hidden">
          <a href="#" className="inline-flex items-center gap-1 text-body-sm font-semibold text-deep-navy">
            View all categories <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
