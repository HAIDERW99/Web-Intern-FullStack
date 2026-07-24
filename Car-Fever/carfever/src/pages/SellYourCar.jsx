import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Search, CheckCircle, Upload, X, ChevronDown,
  Rocket, AlertCircle, Phone, Mail, MapPin,
  Lightbulb, Camera, Shield, ArrowLeft,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getYearSelectOptions } from '../utils/yearOptions'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Vehicle Reg'   },
  { id: 2, label: 'Car Details'   },
  { id: 3, label: 'Photos'        },
  { id: 4, label: 'Contact'       },
]

const MAKES  = ['Select Make','Audi','BMW','Ford','Honda','Hyundai','Jaguar','Kia','Land Rover','Mercedes-Benz','Nissan','Porsche','Tesla','Toyota','Vauxhall','Volkswagen']
const MODELS = { Ford: ['Select Model','Fiesta','Focus','Kuga','Mustang','Puma'], BMW: ['Select Model','1 Series','3 Series','5 Series','M3','X3','X5'], Audi: ['Select Model','A1','A3','A4','Q3','Q5','RS3'], Volkswagen: ['Select Model','Golf','Polo','Passat','Tiguan','ID.4'] }
const YEARS  = getYearSelectOptions('Select Year', 2026, 1990)
const MOCK_LOOKUP = { make: 'Ford', model: 'Fiesta', year: '2021', engineSize: '1.0L', fuelType: 'Petrol', gearbox: 'Manual', colour: 'Metallic Blue' }

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STEPPER
// ─────────────────────────────────────────────────────────────────────────────
function ProgressStepper({ activeStep, completedSteps }) {
  return (
    <div className="w-full bg-white border-b border-outline-variant sticky top-16 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center">
          {STEPS.map((step, idx) => {
            const done    = completedSteps.includes(step.id)
            const active  = activeStep === step.id
            const future  = !done && !active
            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                {/* Node */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all duration-300
                    ${done   ? 'bg-[#10B981] border-[#10B981] text-white'  :
                      active ? 'bg-deep-navy border-deep-navy text-white'  :
                               'bg-white border-outline-variant text-outline'}`}>
                    {done ? <CheckCircle size={16} strokeWidth={2.5} /> : step.id}
                  </div>
                  <span className={`mt-1 text-[11px] font-semibold whitespace-nowrap hidden sm:block transition-colors
                    ${done ? 'text-[#10B981]' : active ? 'text-deep-navy' : 'text-outline'}`}>
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500
                    ${done ? 'bg-[#10B981]' : 'bg-outline-variant'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UK REG PLATE INPUT
// ─────────────────────────────────────────────────────────────────────────────
function RegPlateInput({ value, onChange }) {
  return (
    <div className="flex items-stretch rounded overflow-hidden border-2 border-black h-12 w-full max-w-[200px]"
         style={{ background: '#FFFA30' }}>
      {/* GB strip */}
      <div className="flex flex-col items-center justify-center px-2 flex-shrink-0 gap-0.5"
           style={{ background: '#003189', minWidth: '30px' }}>
        <span style={{ fontSize: '6px', color: '#FFD700', letterSpacing: '1px', lineHeight: 1 }}>★★★</span>
        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1, fontFamily: 'Arial Black, Arial, sans-serif' }}>GB</span>
      </div>
      <input
        type="text" maxLength={8} spellCheck={false} autoComplete="off"
        placeholder="AB12 CDE"
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase())}
        className="flex-1 bg-transparent border-none outline-none text-center"
        style={{ background: '#FFFA30', color: '#000', fontSize: '20px', fontWeight: 900, letterSpacing: '0.12em', fontFamily: '"Arial Black", Arial, sans-serif', textTransform: 'uppercase' }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM FIELD HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
      {children}{required && <span className="text-accent-red ml-0.5">*</span>}
    </label>
  )
}

function Input({ id, placeholder, value, onChange, type = 'text', prefix, error }) {
  return (
    <div>
      <div className={`flex items-center border rounded overflow-hidden transition-colors
        ${error ? 'border-accent-red ring-1 ring-accent-red' : 'border-outline-variant focus-within:border-deep-navy focus-within:ring-1 focus-within:ring-deep-navy'}`}>
        {prefix && <span className="px-3 bg-surface-container-low text-on-surface-variant text-body-sm border-r border-outline-variant h-full flex items-center py-2.5">{prefix}</span>}
        <input id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 bg-white px-3 py-2.5 text-body-sm text-on-surface placeholder-outline outline-none" />
      </div>
      {error && <p className="text-[11px] text-accent-red mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    </div>
  )
}

function Select({ value, onChange, options, disabled }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-slate-gray'}`}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CARD WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function SectionCard({ number, title, icon, children, id }) {
  return (
    <div id={id} className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant bg-surface-container-lowest">
        <div className="w-7 h-7 rounded-full bg-deep-navy text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
          {number}
        </div>
        <h2 className="font-grotesk font-bold text-body-md text-deep-navy">{title}</h2>
        {icon && <span className="ml-auto text-outline">{icon}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO UPLOADER
// ─────────────────────────────────────────────────────────────────────────────
function PhotoUploader({ photos, setPhotos }) {
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)
  const MAX = 12

  // Compress an image File to a JPEG data-URI (max 800px wide, quality 0.72)
  // This keeps each base64 well under ~200 KB regardless of original file size
  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 800
        let w = img.width, h = img.height
        if (w > MAX_DIM) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM }
        if (h > MAX_DIM) { w = Math.round(w * MAX_DIM / h); h = MAX_DIM }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

  const processFiles = useCallback(async (files) => {
    const remaining = MAX - photos.length
    const valid = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, remaining)
    for (const file of valid) {
      const compressedUrl = await compressImage(file)
      setPhotos(prev => [...prev, { id: Date.now() + Math.random(), url: compressedUrl, name: file.name }])
    }
  }, [photos.length, setPhotos])

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {photos.length < MAX && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all duration-200
            ${dragging ? 'border-deep-navy bg-blue-50/60 scale-[1.01]' : 'border-outline-variant hover:border-deep-navy hover:bg-surface-container-low'}`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-deep-navy text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-body-sm text-deep-navy">
              {dragging ? 'Drop photos here' : 'Drag & Drop or Click to Upload'}
            </p>
            <p className="text-[12px] text-on-surface-variant mt-1">Maximum file size: 10MB — JPG, PNG</p>
            <p className="text-[11px] text-outline mt-0.5">{photos.length}/{MAX} photos added</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { processFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container-low">
              <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
              {/* Main badge */}
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-deep-navy text-white uppercase tracking-wide">Main</span>
              )}
              {/* Delete */}
              <button
                onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-red"
                aria-label="Remove photo"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {/* Add more slot */}
          {photos.length < MAX && (
            <button onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center text-outline hover:border-deep-navy hover:text-deep-navy transition-colors">
              <span className="text-2xl font-light">+</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ onGoHome }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center text-center animate-[fadeInUp_0.35s_ease-out]">
        {/* Animated ring */}
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-full bg-[#10B981]/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-[#10B981]/15 flex items-center justify-center">
            <CheckCircle size={44} className="text-[#10B981]" strokeWidth={1.8} />
          </div>
        </div>
        <h2 className="font-grotesk font-bold text-[24px] text-deep-navy mb-3 leading-tight">
          Congratulations! 🎉
        </h2>
        <p className="text-body-sm text-on-surface-variant leading-relaxed mb-1">
          Your listing is <strong className="text-deep-navy">now live</strong> and visible to thousands of buyers.
        </p>
        <p className="text-[12px] text-outline mb-7">
          You can manage your listing anytime from the Dealer Dashboard.
        </p>
        {/* Checklist */}
        <div className="w-full bg-surface-container-low rounded-lg px-4 py-3 mb-7 space-y-2 text-left">
          {['Listing received', 'Photos uploaded', 'Published & live', 'Email confirmation sent'].map(item => (
            <div key={item} className="flex items-center gap-2 text-body-sm text-on-surface">
              <CheckCircle size={14} className="text-[#10B981] flex-shrink-0" fill="currentColor" />
              {item}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button onClick={onGoHome}
            className="flex-1 py-3 rounded-lg bg-deep-navy text-white font-grotesk font-semibold text-body-sm hover:bg-navy-mid active:scale-[0.98] transition-all duration-150">
            Back to Homepage
          </button>
          <button onClick={onGoHome}
            className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-semibold text-body-sm hover:border-deep-navy hover:text-deep-navy transition-colors">
            View My Listings
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SELLING TIPS SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function SellingTips() {
  const tips = [
    { icon: <Lightbulb size={16} />, title: 'Be Detailed', body: "Buyers appreciate knowing about service history and recent maintenance." },
    { icon: <Camera size={16} />,    title: 'Lighting Matters', body: 'Take photos during the "golden hour" for the most attractive car shots.' },
    { icon: <Shield size={16} />,    title: 'Safe Selling', body: "Always meet buyers in public places and never release the car until funds clear." },
  ]
  return (
    <div className="bg-deep-navy rounded-xl p-5 space-y-4 text-white sticky top-[136px]">
      <h3 className="font-grotesk font-bold text-body-md">Selling Tips</h3>
      <div className="space-y-3">
        {tips.map(t => (
          <div key={t.title} className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-red flex items-center justify-center mt-0.5">{t.icon}</div>
            <div>
              <p className="font-semibold text-body-sm mb-0.5">{t.title}</p>
              <p className="text-[12px] text-white/70 leading-relaxed">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Help line */}
      <div className="border-t border-white/15 pt-4">
        <p className="text-[11px] text-white/50 uppercase tracking-wider mb-2">Need Help?</p>
        <p className="font-grotesk font-bold text-[18px] text-white">0800 123 4567</p>
        <p className="text-[12px] text-white/60">Support available 9am – 8pm</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SellYourCar({ onGoHome }) {
  // ── Step tracking ──────────────────────────────────────────────────────────
  const [activeStep,     setActiveStep]     = useState(1)
  const [completedSteps, setCompletedSteps] = useState([])

  const markComplete = (step) =>
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step])

  // ── Section 1: Vehicle Lookup ──────────────────────────────────────────────
  const [reg,        setReg]        = useState('')
  const [mileage,    setMileage]    = useState('')
  const [looking,    setLooking]    = useState(false)   // loading bar
  const [loadPct,    setLoadPct]    = useState(0)
  const [lookupDone, setLookupDone] = useState(false)

  const handleLookup = () => {
    if (!reg.trim()) return
    setLooking(true); setLoadPct(0); setLookupDone(false)
    // Animate progress bar 0→100 over 1.4s
    const start = performance.now()
    const tick = (now) => {
      const pct = Math.min(((now - start) / 1400) * 100, 100)
      setLoadPct(pct)
      if (pct < 100) requestAnimationFrame(tick)
      else {
        setTimeout(() => {
          setLooking(false)
          setLookupDone(true)
          // Pre-fill vehicle details
          setMake(MOCK_LOOKUP.make)
          setModel(MOCK_LOOKUP.model)
          setYear(MOCK_LOOKUP.year)
          setEngineSize(MOCK_LOOKUP.engineSize)
          setFuelType(MOCK_LOOKUP.fuelType)
          setGearbox(MOCK_LOOKUP.gearbox)
          markComplete(1)
          setActiveStep(2)
        }, 100)
      }
    }
    requestAnimationFrame(tick)
  }

  // ── Section 2: Vehicle Details ─────────────────────────────────────────────
  const [make,        setMake]        = useState('Select Make')
  const [model,       setModel]       = useState('Select Model')
  const [year,        setYear]        = useState('Select Year')
  const [engineSize,  setEngineSize]  = useState('')
  const [fuelType,    setFuelType]    = useState('Petrol')
  const [gearbox,     setGearbox]     = useState('Manual')
  const [description, setDescription] = useState('')

  const modelOptions = MODELS[make] ?? ['Select Model']

  // ── Section 3: Photos ──────────────────────────────────────────────────────
  const [photos, setPhotos] = useState([])

  // ── Section 4: Pricing & Contact ──────────────────────────────────────────
  const [price,    setPrice]    = useState('')
  const [postcode, setPostcode] = useState('')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [errors,   setErrors]   = useState({})

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showModal])

  // ── Scroll spy to update active step ──────────────────────────────────────
  useEffect(() => {
    const ids = ['section-1','section-2','section-3','section-4']
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const n = Number(entry.target.id.split('-')[1])
          setActiveStep(n)
        }
      })
    }, { rootMargin: '-40% 0px -55% 0px' })
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  // ── Publish validation & API submission ───────────────────────────────────
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handlePublish = async () => {
    const errs = {}
    if (!price.trim())    errs.price    = 'Asking price is required'
    if (!postcode.trim()) errs.postcode = 'Postcode is required'
    if (!name.trim())     errs.name     = 'Your name is required'
    if (!email.trim())    errs.email    = 'Email address is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (make === 'Select Make')   errs.make  = 'Please select a make'
    if (year === 'Select Year')   errs.year  = 'Please select a year'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError('')
    try {
      // Extract compressed base64 URLs from photo objects
      const imageUrls = photos
        .map(p => typeof p === 'string' ? p : (p?.url || null))
        .filter(Boolean)

      const result = await api.vehicles.create({
        dealer_id:          user?.id || null,
        make:               make.trim(),
        model:              model === 'Select Model' ? make : model.trim(),
        year:               Number(year),
        price:              Number(price.replace(/[^0-9.]/g, '')),
        mileage:            mileage ? Number(mileage.replace(/[^0-9]/g, '')) : 0,
        fuel_type:          fuelType,
        transmission:       gearbox,
        engine_size:        engineSize || null,
        description:        description || null,
        registration_plate: reg || null,
        color:              null,
        image_url:          imageUrls[0] || null,   // primary photo — direct column write
        image_urls:         imageUrls,              // array for vehicle_images table
        images:             imageUrls,              // alias accepted by backend
      })

      // ── Persist this vehicle ID in the session so the dashboard can find it ──
      if (result?.data?.id) {
        try {
          const sessionKey = 'cf_session'
          const session = JSON.parse(localStorage.getItem(sessionKey) || '{}')
          const ids = Array.isArray(session.listing_ids) ? session.listing_ids : []
          if (!ids.includes(result.data.id)) ids.push(result.data.id)
          localStorage.setItem(sessionKey, JSON.stringify({ ...session, listing_ids: ids }))
        } catch { /* non-critical */ }
      }

      markComplete(2); markComplete(3); markComplete(4)
      setShowModal(true)
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f1f5f9] pt-16">
      <ProgressStepper activeStep={activeStep} completedSteps={completedSteps} />

      {/* Page header */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-2">
        <button onClick={onGoHome}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-deep-navy transition-colors mb-4 group">
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </button>
        <h1 className="font-grotesk font-bold text-[28px] text-deep-navy leading-tight">List Your Car for Sale</h1>
        <p className="text-body-sm text-on-surface-variant mt-1 mb-6">
          Reach thousands of buyers — it takes less than 5 minutes.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="max-w-4xl mx-auto px-4 pb-20 flex flex-col lg:flex-row gap-6 items-start">

        {/* ══ LEFT: form sections ══ */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── SECTION 1: Vehicle Lookup ── */}
          <SectionCard id="section-1" number="1" title="Vehicle Lookup">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-shrink-0">
                <Label>Enter Registration</Label>
                <RegPlateInput value={reg} onChange={setReg} />
              </div>
              <div className="flex-1 min-w-0">
                <Label>Current Mileage</Label>
                <Input placeholder="e.g. 45,000" value={mileage} onChange={setMileage} />
              </div>
              <button onClick={handleLookup} disabled={looking || !reg.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-deep-navy text-white font-grotesk font-semibold text-body-sm hover:bg-navy-mid active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 h-[42px]">
                <Search size={16} />
                Find My Car
              </button>
            </div>

            {/* Loading bar */}
            {looking && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[12px] text-on-surface-variant mb-1">
                  <span>Searching DVLA database…</span>
                  <span className="font-semibold text-accent-red">{Math.round(loadPct)}%</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-accent-red rounded-full transition-all duration-75 ease-linear"
                       style={{ width: `${loadPct}%` }} />
                </div>
              </div>
            )}

            {/* Success banner */}
            {lookupDone && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-[#10B981]/30 text-[#10B981] text-body-sm font-semibold">
                <CheckCircle size={16} fill="currentColor" />
                Vehicle found! Details pre-filled below. Please review and correct if needed.
              </div>
            )}
          </SectionCard>

          {/* ── SECTION 2: Vehicle Details ── */}
          <SectionCard id="section-2" number="2" title="Car Details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Select value={make} onChange={v => { setMake(v); setModel('Select Model') }} options={MAKES} />
                </div>
                <div>
                  <Label>Model</Label>
                  <Select value={model} onChange={setModel} options={modelOptions} disabled={make === 'Select Make'} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Year</Label>
                  <Select value={year} onChange={setYear} options={YEARS} />
                </div>
                <div>
                  <Label>Engine Size</Label>
                  <Input placeholder="e.g. 2.0L" value={engineSize} onChange={setEngineSize} />
                </div>
              </div>

              {/* Fuel type */}
              <div>
                <Label>Fuel Type</Label>
                <div className="flex gap-3 flex-wrap">
                  {['Petrol','Diesel','Electric','Hybrid'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer group">
                      <div onClick={() => setFuelType(f)}
                        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors cursor-pointer
                          ${fuelType === f ? 'bg-deep-navy border-deep-navy' : 'bg-white border-outline-variant group-hover:border-deep-navy'}`}>
                        {fuelType === f && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-body-sm transition-colors ${fuelType === f ? 'text-deep-navy font-medium' : 'text-on-surface'}`}>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Gearbox toggle */}
              <div>
                <Label>Gearbox</Label>
                <div className="flex items-center gap-3">
                  <span className={`text-body-sm transition-colors ${gearbox === 'Manual' ? 'text-deep-navy font-semibold' : 'text-on-surface-variant'}`}>Manual</span>
                  <button onClick={() => setGearbox(g => g === 'Manual' ? 'Automatic' : 'Manual')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${gearbox === 'Automatic' ? 'bg-deep-navy' : 'bg-outline-variant'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${gearbox === 'Automatic' ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className={`text-body-sm transition-colors ${gearbox === 'Automatic' ? 'text-deep-navy font-semibold' : 'text-on-surface-variant'}`}>Automatic</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Seller's Description</Label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Mention features like service history, new tyres, or special modifications…"
                  className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors resize-none" />
                <p className="text-[11px] text-outline text-right mt-0.5">{description.length}/2000</p>
              </div>
            </div>
          </SectionCard>

          {/* ── SECTION 3: Photos ── */}
          <SectionCard id="section-3" number="3" title="Photos" icon={<Camera size={18} />}>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Add up to 12 high-resolution photos for 5× more views.
            </p>
            <PhotoUploader photos={photos} setPhotos={setPhotos} />
          </SectionCard>

          {/* ── SECTION 4: Pricing & Contact ── */}
          <SectionCard id="section-4" number="4" title="Pricing & Contact">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Asking Price</Label>
                  <Input placeholder="Enter amount" value={price} onChange={setPrice} prefix="£" error={errors.price} />
                </div>
                <div>
                  <Label required>Seller Name</Label>
                  <Input placeholder="Full Name" value={name} onChange={setName} error={errors.name} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Email Address</Label>
                  <Input placeholder="email@example.com" value={email} onChange={setEmail} type="email" error={errors.email} />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input placeholder="07123 456789" value={phone} onChange={setPhone} type="tel" />
                </div>
              </div>
              <div className="sm:w-1/2">
                <Label required>Postcode</Label>
                <Input placeholder="e.g. SW1A 1AA" value={postcode} onChange={setPostcode} error={errors.postcode} />
              </div>
            </div>
          </SectionCard>

          {/* ── Publish CTA ── */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 pb-4">
            {submitError && (
              <div className="w-full px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-[13px] text-red-700 font-medium flex items-center gap-2">
                <AlertCircle size={14} /> {submitError}
              </div>
            )}
            <button onClick={handlePublish} disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-lg text-white font-grotesk font-bold text-body-md hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: '#bb0014' }}>
              {submitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Publishing…
                </>
              ) : (
                <><Rocket size={20} /> Publish Listing</>
              )}
            </button>
            <p className="text-[12px] text-on-surface-variant text-center sm:text-left">
              By publishing you agree to our <a href="#" className="underline hover:text-deep-navy">Terms of Service</a> and <a href="#" className="underline hover:text-deep-navy">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Selling tips sidebar ══ */}
        <div className="w-full lg:w-[260px] flex-shrink-0">
          <SellingTips />
        </div>
      </div>

      {/* Success modal */}
      {showModal && <SuccessModal onGoHome={onGoHome} />}
    </div>
  )
}
