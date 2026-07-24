import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { getYearSelectOptions } from '../../utils/yearOptions'

const YEAR_OPTIONS = getYearSelectOptions('Any Year', 2026, 1990)

// ── Collapsible section wrapper ───────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-outline-variant last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 text-left group"
      >
        <span className="font-grotesk font-semibold text-body-sm text-deep-navy group-hover:text-navy-mid transition-colors">
          {title}
        </span>
        {open
          ? <ChevronUp size={15} className="text-outline flex-shrink-0" />
          : <ChevronDown size={15} className="text-outline flex-shrink-0" />
        }
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

// ── Checkbox row ──────────────────────────────────────────────────────────────
function CheckboxRow({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer group">
      <div className="flex items-center gap-2.5">
        {/* Square checkbox — rounded-sm per DESIGN.md */}
        <div
          onClick={onChange}
          className={`
            w-4 h-4 flex-shrink-0 rounded-sm border-2 flex items-center justify-center
            transition-colors duration-150 cursor-pointer
            ${checked
              ? 'bg-deep-navy border-deep-navy'
              : 'bg-white border-outline-variant group-hover:border-deep-navy'
            }
          `}
        >
          {checked && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className={`text-body-sm transition-colors ${checked ? 'text-deep-navy font-medium' : 'text-on-surface group-hover:text-deep-navy'}`}>
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-outline flex-shrink-0">{count.toLocaleString()}</span>
      )}
    </label>
  )
}

// ── Price range slider ────────────────────────────────────────────────────────
function PriceSlider({ min, max, value, onChange }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-body-sm text-on-surface-variant">£{min.toLocaleString()}</span>
        <span className="font-grotesk font-bold text-body-sm text-deep-navy">
          £{value >= max ? `${(max / 1000).toFixed(0)}k+` : value.toLocaleString()}
        </span>
      </div>

      {/* Track + thumb */}
      <div className="relative h-5 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-surface-container-highest" />
        {/* Filled track */}
        <div
          className="absolute left-0 h-1.5 rounded-full bg-deep-navy"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1000}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-deep-navy
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-deep-navy
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-md
          "
        />
      </div>

      <div className="flex justify-between text-[11px] text-outline">
        <span>£5k</span>
        <span>£300k+</span>
      </div>
    </div>
  )
}

// ── Mileage select ────────────────────────────────────────────────────────────
function MileageSelect({ value, onChange }) {
  const opts = [
    { label: 'Unlimited', value: '' },
    { label: 'Up to 5,000', value: '5000' },
    { label: 'Up to 10,000', value: '10000' },
    { label: 'Up to 25,000', value: '25000' },
    { label: 'Up to 50,000', value: '50000' },
    { label: 'Up to 75,000', value: '75000' },
    { label: 'Up to 100,000', value: '100000' },
  ]
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy cursor-pointer transition-colors hover:border-slate-gray"
      >
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </span>
    </div>
  )
}

// ── Make / Model selects ──────────────────────────────────────────────────────
const MAKES = ['Any Make', 'Audi', 'BMW', 'Hyundai', 'Jaguar', 'Mercedes-Benz', 'Porsche', 'Tesla', 'Toyota', 'Volkswagen']
const MODELS_MAP = {
  Audi: ['Any Model', 'A3', 'A4', 'Q5', 'RS3', 'e-tron GT'],
  BMW: ['Any Model', '3 Series', '5 Series', 'iX', 'M3'],
  'Mercedes-Benz': ['Any Model', 'C-Class', 'E-Class', 'EQS', 'GLE'],
  Tesla: ['Any Model', 'Model 3', 'Model S', 'Model X', 'Model Y'],
  Porsche: ['Any Model', '911', 'Cayenne', 'Taycan'],
  Jaguar: ['Any Model', 'F-Pace', 'I-Pace'],
  Hyundai: ['Any Model', 'IONIQ 5', 'IONIQ 6', 'Tucson'],
  Volkswagen: ['Any Model', 'Golf', 'ID.3', 'ID.4', 'Tiguan'],
  Toyota: ['Any Model', 'Corolla', 'RAV4', 'bZ4X'],
}

// ── Main FilterSidebar ────────────────────────────────────────────────────────
export default function FilterSidebar({ filters, onChange, onReset, onApply, isMobile = false }) {
  const { make, model, maxPrice, maxMileage, fuelTypes, bodyTypes, conditions } = filters

  const toggle = (key, val) => {
    const current = filters[key]
    onChange({
      ...filters,
      [key]: current.includes(val) ? current.filter(x => x !== val) : [...current, val],
    })
  }

  const FUEL_OPTIONS  = [
    { label: 'Petrol',   count: 41300 },
    { label: 'Diesel',   count: 28900 },
    { label: 'Electric', count: 9870  },
    { label: 'Hybrid',   count: 14200 },
    { label: 'Plug-in Hybrid', count: 6300 },
  ]
  const BODY_OPTIONS  = [
    { label: 'Hatchback',   count: 34210 },
    { label: 'SUV',         count: 28450 },
    { label: 'Saloon',      count: 22100 },
    { label: 'Estate',      count: 12800 },
    { label: 'Coupe',       count: 8400  },
    { label: 'Convertible', count: 6540  },
  ]
  const COND_OPTIONS  = ['Any', 'New', 'Nearly New', 'Used']

  const modelOptions = make === 'Any Make' ? ['Any Model'] : (MODELS_MAP[make] ?? ['Any Model'])

  const activeCount = fuelTypes.length + bodyTypes.length +
    (make !== 'Any Make' ? 1 : 0) +
    (filters.minYear ? 1 : 0) +
    (maxPrice < 300000 ? 1 : 0) +
    (maxMileage ? 1 : 0)

  return (
    <div className={`bg-white ${isMobile ? '' : 'rounded-lg border border-outline-variant'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <h2 className="font-grotesk font-bold text-body-md text-deep-navy">Filters</h2>
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-red text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-body-sm font-semibold text-accent-red hover:text-red-bright transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="px-4 divide-y divide-outline-variant/60">
        {/* Make */}
        <FilterSection title="Make">
          <div className="relative">
            <select
              value={make}
              onChange={e => onChange({ ...filters, make: e.target.value, model: 'Any Model' })}
              className="w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy cursor-pointer hover:border-slate-gray transition-colors"
            >
              {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </span>
          </div>
        </FilterSection>

        {/* Model */}
        <FilterSection title="Model">
          <div className="relative">
            <select
              value={model}
              onChange={e => onChange({ ...filters, model: e.target.value })}
              disabled={make === 'Any Make'}
              className={`w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors
                ${make === 'Any Make' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-slate-gray'}`}
            >
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </span>
          </div>
        </FilterSection>

        {/* Min Year */}
        <FilterSection title="Min Year">
          <div className="relative">
            <select
              value={filters.minYear || 'Any Year'}
              onChange={e => onChange({ ...filters, minYear: e.target.value === 'Any Year' ? '' : e.target.value })}
              className="w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy cursor-pointer hover:border-slate-gray transition-colors"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </span>
          </div>
        </FilterSection>

        {/* Max Price */}
        <FilterSection title="Max Price">
          <PriceSlider
            min={5000}
            max={300000}
            value={maxPrice}
            onChange={val => onChange({ ...filters, maxPrice: val })}
          />
        </FilterSection>

        {/* Max Mileage */}
        <FilterSection title="Max Mileage">
          <MileageSelect
            value={maxMileage}
            onChange={val => onChange({ ...filters, maxMileage: val })}
          />
        </FilterSection>

        {/* Fuel Type */}
        <FilterSection title="Fuel Type">
          <div className="space-y-0.5">
            {FUEL_OPTIONS.map(({ label, count }) => (
              <CheckboxRow
                key={label}
                label={label}
                count={count}
                checked={fuelTypes.includes(label)}
                onChange={() => toggle('fuelTypes', label)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Body Type */}
        <FilterSection title="Body Type" defaultOpen={false}>
          <div className="space-y-0.5">
            {BODY_OPTIONS.map(({ label, count }) => (
              <CheckboxRow
                key={label}
                label={label}
                count={count}
                checked={bodyTypes.includes(label)}
                onChange={() => toggle('bodyTypes', label)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Condition */}
        <FilterSection title="Condition" defaultOpen={false}>
          <div className="space-y-0.5">
            {COND_OPTIONS.map(label => (
              <label key={label} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                {/* Radio — square-ish per DESIGN.md */}
                <div
                  onClick={() => onChange({ ...filters, conditions: label })}
                  className={`w-4 h-4 flex-shrink-0 rounded-sm border-2 flex items-center justify-center transition-colors duration-150 cursor-pointer
                    ${conditions === label ? 'bg-deep-navy border-deep-navy' : 'bg-white border-outline-variant group-hover:border-deep-navy'}`}
                >
                  {conditions === label && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <span className={`text-body-sm transition-colors ${conditions === label ? 'text-deep-navy font-medium' : 'text-on-surface group-hover:text-deep-navy'}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Apply button (shown in mobile drawer + always) */}
      <div className="px-4 pb-4 pt-3">
        <button
          onClick={onApply}
          className="w-full py-3 rounded bg-accent-red text-white font-grotesk font-semibold text-body-sm hover:bg-red-bright active:scale-[0.98] transition-all duration-150"
        >
          Update Results
        </button>
      </div>
    </div>
  )
}
