import { useState } from 'react'
import { Search } from 'lucide-react'
import { getYearSelectOptions } from '../utils/yearOptions'

const YEAR_OPTIONS = getYearSelectOptions('Min Year', 2026, 1990)

// --- Data ---
const MAKES_MODELS = {
  'Any Make': [],
  Audi: ['Any Model', 'A1', 'A3', 'A4', 'A5', 'Q3', 'Q5', 'Q7', 'RS3', 'RS6', 'TT'],
  BMW: ['Any Model', '1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'M3', 'M4', 'M5', 'X3', 'X5'],
  'Mercedes-Benz': ['Any Model', 'A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'AMG GT'],
  Tesla: ['Any Model', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Ford: ['Any Model', 'Fiesta', 'Focus', 'Mustang', 'Puma', 'Kuga', 'Explorer'],
  Volkswagen: ['Any Model', 'Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'ID.4'],
  Porsche: ['Any Model', '911', 'Cayenne', 'Macan', 'Taycan', 'Panamera', 'Boxster'],
  Toyota: ['Any Model', 'Yaris', 'Corolla', 'Camry', 'RAV4', 'Land Cruiser', 'GR86'],
  Jaguar: ['Any Model', 'XE', 'XF', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace'],
}

const PRICES = [
  { label: 'No Max',  value: '' },
  { label: '£5,000',  value: '5000' },
  { label: '£10,000', value: '10000' },
  { label: '£15,000', value: '15000' },
  { label: '£20,000', value: '20000' },
  { label: '£25,000', value: '25000' },
  { label: '£30,000', value: '30000' },
  { label: '£40,000', value: '40000' },
  { label: '£50,000', value: '50000' },
  { label: '£75,000', value: '75000' },
  { label: '£100,000+', value: '100000' },
]

// --- Sub-components ---
function SelectField({ label, id, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label-bold uppercase tracking-widest text-on-surface-variant font-semibold">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none border border-outline-variant rounded py-2.5 pl-3 pr-8 
            text-body-sm text-on-surface bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy
            transition-colors
            ${disabled ? 'opacity-40 cursor-not-allowed bg-surface-container-low' : 'cursor-pointer hover:border-slate-gray'}
          `}
        >
          {options.map(opt => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-outline">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </span>
      </div>
    </div>
  )
}

function InputField({ label, id, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label-bold uppercase tracking-widest text-on-surface-variant font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-outline-variant rounded py-2.5 px-3 text-body-sm text-on-surface placeholder-outline bg-white focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
      />
    </div>
  )
}

// --- UK Registration Plate input ---
function RegPlateInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-bold uppercase tracking-widest text-on-surface-variant font-semibold">
        Registration Number
      </label>

      {/* Plate shell: yellow background, 2px #F5C518 border, rounded-[4px] */}
      <div
        className="flex items-stretch rounded overflow-hidden"
        style={{
          border: '2px solid #F5C518',
          background: '#F5C518',
          height: '52px',
        }}
      >
        {/* Blue GB strip */}
        <div
          className="flex flex-col items-center justify-center px-2 gap-0.5 flex-shrink-0"
          style={{ background: '#003189', minWidth: '32px' }}
        >
          {/* EU stars */}
          <span
            style={{
              fontSize: '7px',
              color: '#FFD700',
              letterSpacing: '1.5px',
              lineHeight: 1,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            ★★★
          </span>
          {/* GB text */}
          <span
            style={{
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.05em',
              lineHeight: 1,
              fontFamily: 'Arial Black, Arial, sans-serif',
            }}
          >
            GB
          </span>
        </div>

        {/* Yellow input area */}
        <input
          type="text"
          placeholder="AB12 CDE"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          maxLength={8}
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent border-none outline-none"
          style={{
            background: '#F5C518',
            color: '#000000',
            fontSize: '24px',
            fontWeight: 900,
            letterSpacing: '0.14em',
            paddingLeft: '12px',
            paddingRight: '10px',
            fontFamily: '"Arial Black", "Arial", sans-serif',
            textTransform: 'uppercase',
          }}
        />
      </div>

      <p className="text-[11px] text-outline mt-0.5">Enter your full UK registration, e.g. AB12 CDE</p>
    </div>
  )
}

// --- Main Component ---
export default function SearchWidget({ onSearch }) {
  const [activeTab, setActiveTab] = useState('spec')

  // Spec tab state
  const [make,     setMake]     = useState('Any Make')
  const [model,    setModel]    = useState('Any Model')
  const [minYear,  setMinYear]  = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [postcode, setPostcode] = useState('')

  // Reg tab state
  const [reg,     setReg]     = useState('')
  const [mileage, setMileage] = useState('')

  const makeOptions = Object.keys(MAKES_MODELS)
  const modelOptions = make === 'Any Make' ? ['Any Model'] : MAKES_MODELS[make]

  const handleMakeChange = val => {
    setMake(val)
    setModel('Any Model')
  }

  const handleSearch = () => {
    const query = activeTab === 'spec'
      ? { make, model, minYear: minYear === 'Min Year' ? '' : minYear, maxPrice, postcode, fuelTypes: [] }
      : { reg, mileage, fuelTypes: [] }

    if (onSearch) {
      onSearch(query)
    } else {
      console.log(query)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-widget overflow-hidden w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: 'spec', label: 'Search by Spec' },
          { key: 'reg',  label: 'Search by Registration' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex-1 py-3.5 text-body-sm font-semibold transition-all duration-200 relative
              ${activeTab === tab.key
                ? 'text-deep-navy'
                : 'text-on-surface-variant hover:text-deep-navy hover:bg-surface-container-low'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-deep-navy" />
            )}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div className="p-5 sm:p-6">
        {activeTab === 'spec' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <SelectField
                id="make"
                label="Make"
                value={make}
                onChange={handleMakeChange}
                options={makeOptions}
              />
              <SelectField
                id="model"
                label="Model"
                value={model}
                onChange={setModel}
                options={modelOptions}
                disabled={make === 'Any Make'}
              />
              <SelectField
                id="minYear"
                label="Min Year"
                value={minYear}
                onChange={setMinYear}
                options={YEAR_OPTIONS}
              />
              <SelectField
                id="maxPrice"
                label="Max Price"
                value={maxPrice}
                onChange={setMaxPrice}
                options={PRICES}
              />
              <InputField
                id="postcode"
                label="Postcode"
                placeholder="e.g. SW1A 1AA"
                value={postcode}
                onChange={setPostcode}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RegPlateInput value={reg} onChange={setReg} />
            <InputField
              id="mileage"
              label="Max Mileage"
              placeholder="e.g. 50,000"
              value={mileage}
              onChange={setMileage}
              type="text"
            />
          </div>
        )}

        {/* Search CTA */}
        <button
          onClick={handleSearch}
          className="mt-5 w-full flex items-center justify-center gap-2.5 py-3.5 rounded bg-accent-red text-white font-grotesk font-semibold text-body-md hover:bg-red-bright active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          <Search size={18} strokeWidth={2.5} />
          Search 142,593 cars
        </button>
      </div>
    </div>
  )
}
