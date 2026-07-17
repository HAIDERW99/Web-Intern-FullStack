import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, ChevronRight, MapPin, Star, Shield, Phone, Mail,
  Camera, Play, ChevronLeft, ChevronRight as ChevronRightIcon,
  Gauge, Zap, Fuel, Settings, Car, Wind, Coins, Users,
  CheckCircle, X, Calculator, Share2, Heart, Flag,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — replace with API call
// ─────────────────────────────────────────────────────────────────────────────
const VEHICLE_DATA = {
  id: 1,
  year: 2021,
  make: 'Ford',
  model: 'Fiesta',
  trim: '1.0 EcoBoost MHEV ST-Line',
  fullTitle: '2021 Ford Fiesta 1.0 EcoBoost MHEV ST-Line',
  price: 14450,
  priceLabel: 'Great Price',
  location: 'London, UK',
  distance: 3.5,
  condition: 'Used',
  colour: 'Metallic Blue',
  images: [
    'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614200185099-30e5cce38a7b?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=85&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&auto=format&fit=crop',
  ],
  specs: {
    mileage:    '15,200 miles',
    engine:     '1.0L',
    power:      '125 BHP',
    fuelType:   'Petrol',
    gearbox:    'Manual',
    bodyType:   'Hatchback',
    emissions:  '114 g/km',
    annualTax:  '£185',
    owners:     '1 Owner',
  },
  features: [
    'ST-Line Body Kit', 'Ford SYNC 3 Navigation', 'DAB Digital Radio',
    'Heated Front Seats', 'Cruise Control', 'Lane Keep Assist',
    'Rear Parking Sensors', '17" Alloy Wheels', 'Apple CarPlay & Android Auto',
    'Auto Headlights', 'Rain-Sensing Wipers', 'Keyless Entry',
  ],
  description: `This 2021 Ford Fiesta ST-Line in striking metallic blue is a fantastic example of the UK's favourite hatchback. Featuring the efficient and punchy 1.0L EcoBoost Mild Hybrid (MHEV) engine, it delivers a spirited 125 BHP while maintaining excellent fuel economy.\n\nEquipped with the desirable ST-Line trim, the car boasts a sporty aesthetic including a bespoke honeycomb grille, sportier bumpers, and exclusive 17" alloy wheels. The interior is equally impressive with sport seats, a flat-bottomed steering wheel, and the latest Ford SYNC 3 infotainment system with built-in satellite navigation and wireless Apple CarPlay.\n\nThis one-owner vehicle comes with a full Ford service history and has been meticulously maintained. It has been subject to a comprehensive 12-point inspection by our workshop team and comes with a 6-month warranty for complete peace of mind.`,
  dealer: {
    name:        'City Motors London',
    rating:      4.8,
    reviewCount: 120,
    address:     '142 Kensington High St, London, W8 6AB',
    phone:       '020 7946 0900',
    phoneMasked: '020 7946 0...',
    verified:    true,
  },
  finance: {
    deposit:       1500,
    term:          48,
    apr:           9.9,
    monthlyBase:   210,
  },
  historyChecks: [
    { label: 'No finance outstanding', pass: true },
    { label: 'No write-off history',   pass: true },
    { label: 'No stolen record',       pass: true },
    { label: 'Mileage verified',       pass: true },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// SPEC GRID ITEM
// ─────────────────────────────────────────────────────────────────────────────
function SpecItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-white rounded-lg border border-outline-variant">
      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-surface-container text-deep-navy">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant leading-none mb-0.5">
          {label}
        </p>
        <p className="font-grotesk font-bold text-body-sm text-deep-navy leading-snug truncate">
          {value}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={13}
            className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-outline-variant fill-outline-variant'}
          />
        ))}
      </div>
      <span className="text-body-sm font-semibold text-deep-navy">{rating}</span>
      <span className="text-body-sm text-on-surface-variant">({count} reviews)</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#10B981]" />
        </div>
        <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy mb-2">Enquiry Sent!</h3>
        <p className="text-body-sm text-on-surface-variant mb-6">
          City Motors London will be in touch within 2 business hours.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GALLERY
// ─────────────────────────────────────────────────────────────────────────────
function ImageGallery({ images }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox,  setLightbox]  = useState(false)
  const thumbsRef = useRef(null)

  const prev = () => setActiveIdx(i => (i - 1 + images.length) % images.length)
  const next = () => setActiveIdx(i => (i + 1) % images.length)

  // Keyboard nav in lightbox
  useEffect(() => {
    if (!lightbox) return
    const handler = e => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  // Scroll active thumb into view
  useEffect(() => {
    const el = thumbsRef.current?.children[activeIdx]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeIdx])

  const VISIBLE_THUMBS = 5

  return (
    <>
      {/* Main image */}
      <div className="relative rounded-lg overflow-hidden bg-surface-container-low aspect-[16/10] cursor-zoom-in group"
           onClick={() => setLightbox(true)}>
        <img
          src={images[activeIdx]}
          alt={`Vehicle photo ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Photo count badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[12px] font-semibold">
            <Camera size={13} />
            {activeIdx + 1} of {images.length} Photos
          </span>
          <button
            onClick={e => { e.stopPropagation() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[12px] font-semibold hover:bg-black/80 transition-colors"
          >
            <Play size={13} fill="currentColor" />
            Video Walkthrough
          </button>
        </div>

        {/* Arrow controls */}
        <button onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
          <ChevronLeft size={18} />
        </button>
        <button onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div ref={thumbsRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide mt-2 pb-1">
        {images.map((img, i) => (
          <button key={i} onClick={() => setActiveIdx(i)}
            className={`flex-shrink-0 w-[80px] h-[58px] rounded overflow-hidden border-2 transition-all duration-150
              ${i === activeIdx ? 'border-deep-navy scale-[1.03] shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:border-outline-variant'}`}>
            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center"
          onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
            <X size={22} />
          </button>
          <button onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <img src={images[activeIdx]} alt="" onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          <p className="text-white/60 text-body-sm mt-4">{activeIdx + 1} / {images.length}</p>
          <button onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ChevronRightIcon size={24} />
          </button>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE WIDGET
// ─────────────────────────────────────────────────────────────────────────────
function FinanceWidget({ finance, price }) {
  const [deposit, setDeposit] = useState(finance.deposit)
  const [term,    setTerm]    = useState(finance.term)

  const loanAmount   = price - deposit
  const monthlyRate  = finance.apr / 100 / 12
  const monthly = monthlyRate > 0
    ? Math.round((loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term)))
    : Math.round(loanAmount / term)

  return (
    <div className="bg-white rounded-lg border border-outline-variant p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator size={16} className="text-deep-navy" />
        <p className="text-label-bold uppercase tracking-widest text-on-surface-variant font-semibold">
          Estimated Finance
        </p>
      </div>

      {/* Monthly */}
      <div>
        <span className="font-grotesk font-bold text-[36px] leading-none text-deep-navy">
          £{monthly.toLocaleString()}
        </span>
        <span className="text-body-md text-on-surface-variant ml-1">/month</span>
      </div>

      {/* Summary rows */}
      <div className="space-y-2 border-t border-outline-variant pt-3">
        {[
          { label: 'Deposit',  value: `£${deposit.toLocaleString()}` },
          { label: 'Term',     value: `${term} months` },
          { label: 'APR',      value: `${finance.apr}%`, red: true },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">{row.label}</span>
            <span className={`text-body-sm font-semibold ${row.red ? 'text-accent-red' : 'text-deep-navy'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Adjust Finance Terms toggle */}
      <details className="group">
        <summary className="list-none flex items-center justify-between cursor-pointer text-body-sm font-semibold text-deep-navy hover:text-navy-mid transition-colors select-none">
          Adjust Finance Terms
          <ChevronRightIcon size={15} className="group-open:rotate-90 transition-transform duration-200" />
        </summary>
        <div className="mt-3 space-y-4 pt-3 border-t border-outline-variant">
          {/* Deposit slider */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Deposit</label>
              <span className="text-body-sm font-bold text-deep-navy">£{deposit.toLocaleString()}</span>
            </div>
            <input type="range" min={0} max={Math.round(price * 0.5)} step={100}
              value={deposit} onChange={e => setDeposit(Number(e.target.value))}
              className="w-full accent-[#001839] cursor-pointer" />
            <div className="flex justify-between text-[11px] text-outline mt-0.5">
              <span>£0</span><span>£{Math.round(price * 0.5).toLocaleString()}</span>
            </div>
          </div>
          {/* Term selector */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block mb-2">
              Term (months)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[24, 36, 48, 60].map(t => (
                <button key={t} onClick={() => setTerm(t)}
                  className={`py-1.5 rounded text-body-sm font-semibold border transition-all duration-150
                    ${term === t ? 'bg-deep-navy text-white border-deep-navy' : 'bg-white text-on-surface border-outline-variant hover:border-deep-navy'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      <p className="text-[11px] text-outline leading-relaxed">
        Representative example. Credit subject to status. City Motors London acts as a credit broker and not a lender.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT SIDEBAR WIDGET
// ─────────────────────────────────────────────────────────────────────────────
function ContactWidget({ dealer, onEnquirySuccess }) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: "Hi, I am interested in this vehicle. Please let me know its availability and if I can arrange a viewing." })
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name || !form.email) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      onEnquirySuccess()
    }, 1000)
  }

  return (
    <div className="space-y-4">
      {/* Dealer card */}
      <div className="bg-white rounded-lg border border-outline-variant p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              {dealer.verified && (
                <Shield size={14} className="text-[#10B981] flex-shrink-0" />
              )}
              <h3 className="font-grotesk font-bold text-body-md text-deep-navy leading-snug">
                {dealer.name}
              </h3>
            </div>
            <StarRating rating={dealer.rating} count={dealer.reviewCount} />
          </div>
          {/* Dealer logo placeholder */}
          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
            <Car size={22} className="text-on-surface-variant" />
          </div>
        </div>
        <div className="flex items-start gap-1.5 text-[12px] text-on-surface-variant">
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{dealer.address}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        {/* Reveal phone */}
        <button
          onClick={() => setPhoneRevealed(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded border-2 border-deep-navy text-deep-navy font-grotesk font-semibold text-body-sm hover:bg-deep-navy hover:text-white active:scale-[0.98] transition-all duration-150"
        >
          <Phone size={16} />
          {phoneRevealed ? dealer.phone : dealer.phoneMasked}
          {!phoneRevealed && <span className="text-on-surface-variant font-normal text-[12px]">— Tap to reveal</span>}
        </button>

        {/* Save */}
        <button
          onClick={() => setSaved(s => !s)}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded border text-body-sm font-semibold transition-all duration-150 active:scale-[0.98]
            ${saved ? 'bg-red-50 border-accent-red text-accent-red' : 'border-outline-variant text-on-surface-variant hover:border-deep-navy hover:text-deep-navy'}`}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Saved to Favourites' : 'Save Vehicle'}
        </button>
      </div>

      {/* Enquiry form */}
      <div className="bg-white rounded-lg border border-outline-variant p-5">
        <h4 className="font-grotesk font-semibold text-body-md text-deep-navy mb-4">
          Enquire about this vehicle
        </h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" placeholder="Full Name" required
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
          />
          <input
            type="email" placeholder="Email Address" required
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
          />
          <textarea
            rows={4} placeholder="Your message..."
            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors resize-none"
          />
          <button
            type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded font-grotesk font-semibold text-body-sm text-white active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: '#bb0014' }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending…
              </span>
            ) : (
              <><Mail size={16} /> Email Dealer</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TITLE + PRICE BLOCK (shared between mobile inline & desktop sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function TitlePriceBlock({ car }) {
  return (
    <div>
      <h1 className="font-grotesk font-bold text-[22px] leading-snug text-deep-navy mb-1">
        {car.fullTitle}
      </h1>
      <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant mb-4">
        <MapPin size={13} className="flex-shrink-0" />
        <span>{car.location} ({car.distance} miles away)</span>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-grotesk font-bold text-[32px] leading-none text-deep-navy">
            £{car.price.toLocaleString()}
          </div>
          <div className="text-body-sm text-on-surface-variant mt-1">
            or from <span className="font-bold text-deep-navy">£{Math.round((car.price - car.finance.deposit) / car.finance.term * 1.08)}/mo</span> est. finance
          </div>
        </div>
        {car.priceLabel && (
          <span className="px-3 py-1 rounded-full bg-[#10B981] text-white text-[11px] font-bold uppercase tracking-wider">
            {car.priceLabel}
          </span>
        )}
      </div>
      {/* Share / compare */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant">
        <button className="flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-deep-navy transition-colors">
          <Share2 size={14} /> Share
        </button>
        <span className="text-outline-variant">·</span>
        <span className="text-label-bold uppercase tracking-wider text-on-surface-variant">
          {car.condition} · {car.colour}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function VehicleDetails({ vehicleId, onBack, onBackToSearch }) {
  const car = VEHICLE_DATA  // swap with: ALL_VEHICLES.find(v => v.id === vehicleId)
  const [showModal,   setShowModal]   = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  const SPECS = [
    { icon: <Gauge size={18} />,    label: 'Mileage',     value: car.specs.mileage },
    { icon: <Settings size={18} />, label: 'Engine Size', value: car.specs.engine },
    { icon: <Zap size={18} />,      label: 'Power',       value: car.specs.power },
    { icon: <Fuel size={18} />,     label: 'Fuel Type',   value: car.specs.fuelType },
    { icon: <Car size={18} />,      label: 'Gearbox',     value: car.specs.gearbox },
    { icon: <Car size={18} />,      label: 'Body Style',  value: car.specs.bodyType },
    { icon: <Wind size={18} />,     label: 'Emissions',   value: car.specs.emissions },
    { icon: <Coins size={18} />,    label: 'Annual Tax',  value: car.specs.annualTax },
    { icon: <Users size={18} />,    label: 'Owners',      value: car.specs.owners },
  ]

  const descShort = car.description.slice(0, 320)

  return (
    <div className="min-h-screen bg-[#f1f5f9] pt-16">
      {/* ── Breadcrumb bar ── */}
      <div className="bg-white border-b border-outline-variant">
        <div className="max-w-container mx-auto px-5 lg:px-10 h-11 flex items-center gap-1.5 text-body-sm text-on-surface-variant overflow-x-auto whitespace-nowrap">
          <button onClick={onBack} className="hover:text-deep-navy transition-colors">Home</button>
          <ChevronRight size={13} className="flex-shrink-0" />
          <button onClick={onBackToSearch} className="hover:text-deep-navy transition-colors">Used Cars</button>
          <ChevronRight size={13} className="flex-shrink-0" />
          <button onClick={onBackToSearch} className="hover:text-deep-navy transition-colors">{car.make}</button>
          <ChevronRight size={13} className="flex-shrink-0" />
          <button onClick={onBackToSearch} className="hover:text-deep-navy transition-colors">{car.model}</button>
          <ChevronRight size={13} className="flex-shrink-0" />
          <span className="text-deep-navy font-medium">{car.fullTitle}</span>
        </div>
      </div>

      <div className="max-w-container mx-auto px-5 lg:px-10 py-6">
        {/* Back to search */}
        <button onClick={onBackToSearch}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-deep-navy transition-colors mb-5 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Search Results
        </button>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Gallery */}
            <div className="bg-white rounded-lg border border-outline-variant p-4">
              <ImageGallery images={car.images} />
            </div>

            {/* Title + price (mobile shows here; desktop in right col) */}
            <div className="lg:hidden bg-white rounded-lg border border-outline-variant p-5">
              <TitlePriceBlock car={car} />
            </div>

            {/* Finance widget — mobile only */}
            <div className="lg:hidden">
              <FinanceWidget finance={car.finance} price={car.price} />
            </div>

            {/* Key Specs */}
            <div className="bg-white rounded-lg border border-outline-variant p-5">
              <h2 className="font-grotesk font-bold text-body-md text-deep-navy mb-4">Key Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPECS.map(s => <SpecItem key={s.label} {...s} />)}
              </div>
            </div>

            {/* Vehicle History Checks */}
            <div className="bg-white rounded-lg border border-outline-variant p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-[#10B981]" />
                <h2 className="font-grotesk font-bold text-body-md text-deep-navy">Vehicle History Check</h2>
                <span className="ml-auto text-[11px] font-bold text-[#10B981] bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">All Clear</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {car.historyChecks.map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-2.5 py-1.5">
                    <CheckCircle size={16} className={pass ? 'text-[#10B981]' : 'text-accent-red'} fill="currentColor" />
                    <span className="text-body-sm text-on-surface">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg border border-outline-variant p-5">
              <h2 className="font-grotesk font-bold text-body-md text-deep-navy mb-4">Standard Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                {car.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-body-sm text-on-surface">
                    <span className="w-1.5 h-1.5 rounded-full bg-deep-navy flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-outline-variant p-5">
              <h2 className="font-grotesk font-bold text-body-md text-deep-navy mb-3">Vehicle Description</h2>
              <div className={`text-body-sm text-on-surface leading-relaxed whitespace-pre-line ${!descExpanded ? 'line-clamp-5' : ''}`}>
                {car.description}
              </div>
              <button
                onClick={() => setDescExpanded(e => !e)}
                className="mt-3 flex items-center gap-1 text-body-sm font-semibold text-accent-red hover:text-red-bright transition-colors"
              >
                {descExpanded ? 'Show Less' : 'Read More'}
                <ChevronRight size={15} className={`transition-transform duration-200 ${descExpanded ? 'rotate-90' : ''}`} />
              </button>
            </div>

            {/* Report listing */}
            <button className="flex items-center gap-1.5 text-body-sm text-outline hover:text-on-surface-variant transition-colors">
              <Flag size={13} />
              Report this listing
            </button>
          </div>

          {/* ══ RIGHT COLUMN (sticky sidebar) ════════════════════════════════ */}
          <div className="hidden lg:flex flex-col gap-5 w-[320px] xl:w-[340px] flex-shrink-0 sticky top-20">
            {/* Title + price */}
            <div className="bg-white rounded-lg border border-outline-variant p-5">
              <TitlePriceBlock car={car} />
            </div>

            {/* Finance */}
            <FinanceWidget finance={car.finance} price={car.price} />

            {/* Contact */}
            <ContactWidget dealer={car.dealer} onEnquirySuccess={() => setShowModal(true)} />
          </div>
        </div>

        {/* Mobile: sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-outline-variant px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,26,53,0.08)]">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded border-2 border-deep-navy text-deep-navy font-semibold text-body-sm hover:bg-deep-navy hover:text-white transition-all duration-150">
            <Phone size={16} />
            Call Dealer
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded text-white font-semibold text-body-sm active:scale-[0.98] transition-all duration-150"
            style={{ background: '#bb0014' }}
          >
            <Mail size={16} />
            Email Dealer
          </button>
        </div>
        {/* Spacer for mobile sticky bar */}
        <div className="lg:hidden h-20" />
      </div>

      {showModal && <SuccessModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
