import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Zap, Flame, Lock, Droplets, HardHat,
  MapPin, AlertTriangle, Calendar, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, Upload, X, Camera,
  Bolt, User, Phone, Mail,
  FileText, Shield, Star,
} from "lucide-react";
import { supabase, triggerDispatch } from "../services/supabaseClient";
import toast from "react-hot-toast";

// ── Static Data ────────────────────────────────────────────────────────────
const SERVICES = [
  { id: "plumbing",   label: "Plumbing",   icon: Wrench,   color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   badge: "24/7 Response"    },
  { id: "electrical", label: "Electrical", icon: Zap,      color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", badge: "NICEIC Certified"  },
  { id: "heating",    label: "Heating",    icon: Flame,    color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    badge: "Gas Safe Pro"      },
  { id: "drainage",   label: "Drainage",   icon: Droplets, color: "text-cyan-600",   bg: "bg-cyan-50",   border: "border-cyan-200",   badge: "Blocked Pipes"     },
  { id: "locksmith",  label: "Locksmith",  icon: Lock,     color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300",  badge: "30-Min Arrival"    },
  { id: "general",    label: "General",    icon: HardHat,  color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", badge: "All Repairs"       },
];

const ISSUE_CHIPS = {
  plumbing:   ["Leaking Pipe",  "Burst Pipe",    "No Hot Water",  "Blocked Drain",   "Leak from Ceiling", "Radiator Issue"],
  electrical: ["Power Outage",  "Sparking Outlet","Fuse Trip",    "Flickering Lights","New Socket",       "Consumer Unit"],
  heating:    ["No Heating",    "Boiler Error",   "Cold Radiator", "Boiler Service",  "Gas Smell",        "Thermostat"],
  drainage:   ["Blocked Sink",  "Blocked Toilet", "Slow Drain",    "Overflowing",     "Bad Smell",        "CCTV Survey"],
  locksmith:  ["Locked Out",    "Lock Change",    "Broken Key",    "New Lock",        "Door Won't Close", "Deadbolt"],
  general:    ["Carpentry",     "Tiling",         "Plastering",    "Painting",        "Assembly",         "Other Repair"],
};

const CALLOUT_FEES = {
  emergency: 89,
  scheduled: 49,
};

const LABOUR_RANGES = {
  plumbing:   [40, 80],
  electrical: [50, 90],
  heating:    [60, 100],
  drainage:   [45, 85],
  locksmith:  [30, 60],
  general:    [30, 70],
};

const STEPS = [
  { label: "Location & Service", short: "Location" },
  { label: "Issue Details",       short: "Details"  },
  { label: "Quote & Confirm",     short: "Confirm"  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const isValidPostcode = (pc) =>
  /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(pc.trim());

const formatPostcode = (raw) => {
  const v = raw.replace(/\s/g, "").toUpperCase();
  if (v.length > 4) return v.slice(0, -3) + " " + v.slice(-3);
  return v;
};

// ── Step Progress Bar ──────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="mb-6">
      {/* Step meta text */}
      <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-1">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2 className="text-xl font-bold text-navy-900 mb-3">{STEPS[step].label}</h2>

      {/* Progress track */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
            {/* Dot */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
              i < step  ? "bg-emerald-500 text-white" :
              i === step ? "bg-emerald-500 text-white ring-4 ring-emerald-100" :
                           "bg-slate-200 text-slate-400"
            }`}>
              {i < step ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            {/* Label (hidden on tiny screens) */}
            <span className={`hidden sm:block text-xs font-semibold transition-colors ${
              i <= step ? "text-emerald-600" : "text-slate-400"
            }`}>{s.short}</span>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full transition-all duration-500 mx-1 hidden sm:block" style={{
                background: i < step ? "#10B981" : "#e2e8f0"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Full progress bar (mobile) */}
      <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden sm:hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Photo / Video Uploader ─────────────────────────────────────────────────
function PhotoUploader({ files, setFiles }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((incoming) => {
    const valid = Array.from(incoming)
      .filter((f) => {
        if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return false;
        if (f.size > 50 * 1024 * 1024) {
          toast.error(`${f.name} exceeds 50 MB`);
          return false;
        }
        return true;
      })
      .slice(0, 5 - files.length);
    const previews = valid.map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }));
    setFiles((prev) => [...prev, ...previews]);
  }, [files.length, setFiles]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <label className="text-sm font-semibold text-navy-900 mb-1 block">
        Upload Photo / Video
        <span className="text-slate-400 font-normal ml-1">(Optional)</span>
      </label>
      <p className="text-xs text-slate-500 mb-3">Show us the problem. Clear photos result in more accurate estimates.</p>

      {files.length < 5 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Upload files"
        >
          <Upload size={28} className="mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-semibold text-navy-900">Click or drag files to upload</p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG or MP4 up to 50MB</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {files.map((f, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square shadow-card group">
              {f.file.type.startsWith("video/") ? (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Camera size={24} className="text-slate-400" />
                </div>
              ) : (
                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
              )}
              {/* File name chip */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate">
                {f.name}
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, j) => j !== i)); }}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center min-h-0 p-0 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${f.name}`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quote Breakdown Card ───────────────────────────────────────────────────
function QuoteCard({ service, urgency }) {
  const callout    = CALLOUT_FEES[urgency] ?? 49;
  const [labMin, labMax] = LABOUR_RANGES[service] ?? [30, 70];
  const subtotalMin = callout + labMin;
  const subtotalMax = callout + labMax;
  const vatMin      = Math.round(subtotalMin * 0.2);
  const vatMax      = Math.round(subtotalMax * 0.2);
  const totalMin    = subtotalMin + vatMin;
  const totalMax    = subtotalMax + vatMax;

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Estimated Cost Range</p>
        <p className="text-3xl font-black text-navy-900">
          £{totalMin} <span className="text-slate-400 font-bold text-2xl">–</span> £{totalMax}
        </p>
      </div>

      {/* Line items */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Base Callout Fee</span>
          <span className="font-semibold text-navy-900">£{callout}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Parts / Labour Estimate</span>
          <span className="font-semibold text-navy-900">£{labMin} – £{labMax}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-semibold text-navy-900">£{subtotalMin} – £{subtotalMax}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">VAT (20%)</span>
          <span className="font-semibold text-navy-900">£{vatMin} – £{vatMax}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-200 pt-3">
          <span className="font-bold text-navy-900">Total Estimated</span>
          <span className="font-black text-emerald-600">£{totalMin} – £{totalMax}</span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mx-5 mb-4 flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <AlertTriangle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          Exact cost will be confirmed by your engineer upon arrival before any work begins.
        </p>
      </div>
    </div>
  );
}

// ── Step 1: Location & Service ─────────────────────────────────────────────
function Step1({ form, update }) {
  const svc = SERVICES.find((s) => s.id === form.service);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Postcode */}
      <div>
        <label className="text-sm font-semibold text-navy-900 mb-1.5 block">Service Location</label>
        <div className="relative">
          <MapPin size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={form.postcode}
            onChange={(e) => update("postcode", formatPostcode(e.target.value))}
            placeholder="Enter UK Postcode (e.g. SW1A 1AA)"
            className="input-field pl-11 h-14 text-base font-mono uppercase tracking-widest pr-11"
            maxLength={8}
            autoComplete="postal-code"
            aria-label="UK Postcode"
          />
          {form.postcode.length >= 5 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidPostcode(form.postcode)
                ? <CheckCircle2 size={18} className="text-emerald-500" />
                : <AlertTriangle size={18} className="text-amber-500" />}
            </div>
          )}
        </div>
        {form.postcode.length >= 5 && !isValidPostcode(form.postcode) && (
          <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Please enter a valid UK postcode
          </p>
        )}
        {isValidPostcode(form.postcode) && (
          <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1.5">
            <Shield size={11} /> Secure location verified for local accuracy.
          </p>
        )}
      </div>

      {/* Service chips */}
      <div>
        <label className="text-sm font-semibold text-navy-900 mb-3 block">Select Service</label>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map(({ id, label, icon: Icon, color, bg, border }) => {
            const active = form.service === id;
            const isEmergency = id === "general"; // treat "general" slot as Emergency in design
            return (
              <button
                key={id}
                onClick={() => update("service", active ? "" : id)}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center group ${
                  active
                    ? `${bg} ${border} ring-2 ring-offset-1 ring-emerald-400 shadow-sm`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-card"
                }`}
                aria-pressed={active}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  active ? bg : "bg-slate-50 group-hover:" + bg
                } ${border} border`}>
                  <Icon size={22} className={color} />
                </div>
                <span className={`text-sm font-bold leading-tight ${active ? "text-navy-900" : "text-navy-900"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-sm font-semibold text-navy-900 mb-2 block">Urgency</label>
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: "emergency", label: "Emergency (Under 30 mins dispatch)", icon: Bolt, sub: "50% surcharge applies", highlight: true },
            { id: "scheduled", label: "Standard / Scheduled Appointment",   icon: Calendar, sub: "Choose a convenient time slot", highlight: false },
          ].map(({ id, label, icon: Icon, sub, highlight }) => (
            <button
              key={id}
              onClick={() => update("urgency", id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                form.urgency === id
                  ? highlight
                    ? "border-red-400 bg-red-50"
                    : "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              aria-pressed={form.urgency === id}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                form.urgency === id ? (highlight ? "bg-red-100" : "bg-emerald-100") : "bg-slate-100"
              }`}>
                <Icon size={18} className={
                  form.urgency === id ? (highlight ? "text-red-600" : "text-emerald-600") : "text-slate-400"
                } />
              </div>
              <div>
                <p className="text-sm font-bold text-navy-900">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
              </div>
              {form.urgency === id && (
                <CheckCircle2 size={18} className={`ml-auto flex-shrink-0 ${highlight ? "text-red-500" : "text-emerald-500"}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Trust block */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-card">
        <div className="h-28 bg-gradient-to-br from-slate-700 to-navy-900 relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=60')] bg-cover bg-center" aria-hidden="true" />
          <div className="relative z-10 text-center px-4">
            <p className="text-white font-bold text-base">Vetted Professionals</p>
            <p className="text-slate-300 text-xs mt-1">All TradePro partners undergo background checks and carry valid certifications to ensure your peace of mind.</p>
          </div>
        </div>
        <div className="flex gap-6 px-4 py-3 bg-white">
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <CheckCircle2 size={13} className="text-emerald-500" /> Insured
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <CheckCircle2 size={13} className="text-emerald-500" /> Background Checked
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Issue Details & Photos ─────────────────────────────────────────
function Step2({ form, update, files, setFiles }) {
  const chips = ISSUE_CHIPS[form.service] ?? ISSUE_CHIPS.general;
  const svc = SERVICES.find((s) => s.id === form.service);

  // Toggle chip in description
  const toggleChip = (chip) => {
    update("selectedChips",
      form.selectedChips.includes(chip)
        ? form.selectedChips.filter((c) => c !== chip)
        : [...form.selectedChips, chip]
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Photo uploader */}
      <PhotoUploader files={files} setFiles={setFiles} />

      {/* Issue chips */}
      {svc && (
        <div>
          <label className="text-sm font-semibold text-navy-900 mb-2 block">
            Common {svc.label} Issues
          </label>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const active = form.selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all min-h-0 ${
                    active
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"
                  }`}
                  aria-pressed={active}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description textarea */}
      <div>
        <label className="text-sm font-semibold text-navy-900 mb-1.5 block">Describe the issue</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Please describe what's happening. When did it start? Are there any specific sounds or smells?"
          rows={4}
          className="input-field resize-none text-sm py-3"
          maxLength={600}
          aria-label="Issue description"
        />
        <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/600</p>
      </div>

      {/* Full address */}
      <div>
        <label className="text-sm font-semibold text-navy-900 mb-1.5 block">Full Address *</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. 22 Baker Street, London"
            className="input-field pl-10 h-14 text-sm"
            autoComplete="street-address"
            aria-label="Full address"
          />
        </div>
      </div>

      {/* Pro tip card */}
      <div className="bg-navy-900 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Bolt size={12} className="text-white" />
          </div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Pro Tip</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-3 italic">
          "Including a short video helps our tradespeople diagnose the issue and bring the right tools on the first visit."
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mike Jensen</p>
            <p className="text-xs text-slate-400">Master Plumber, 12y exp.</p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-navy-900">Your Data is Secure</p>
        {["Encrypted file storage", "Shared only with assigned pros"].map((t) => (
          <div key={t} className="flex items-center gap-2 text-xs text-slate-500">
            <Shield size={12} className="text-emerald-500 flex-shrink-0" />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Quote & Confirmation ───────────────────────────────────────────
function Step3({ form, update, onSubmit, loading }) {
  const svc = SERVICES.find((s) => s.id === form.service);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Service summary card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="font-bold text-navy-900 text-sm">Service Details</span>
          <span className="text-xs font-semibold text-emerald-600 cursor-pointer hover:underline">Edit</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          {svc && (
            <div className="flex items-center gap-3">
              <svc.icon size={16} className={svc.color} />
              <span className="text-sm text-navy-900 font-semibold">{svc.label}</span>
              {form.urgency === "emergency" && (
                <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200 uppercase">
                  Emergency
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Calendar size={15} className="text-slate-400 flex-shrink-0" />
            <span>{form.urgency === "emergency" ? "Within 30 mins of confirmation" : "Scheduled — time TBC"}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <MapPin size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{form.address}{form.address && form.postcode ? ", " : ""}{form.postcode}</span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 px-5 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={9} className="text-amber-400 fill-current" />)}
            </div>
            5-star Google Rating
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Verified UK Tradesmen
          </div>
        </div>
      </div>

      {/* Quote breakdown */}
      <QuoteCard service={form.service} urgency={form.urgency} />

      {/* Contact details form */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-navy-900">Your Contact Details</h3>

        <div>
          <label className="text-xs font-semibold text-navy-900 mb-1.5 block">Full Name *</label>
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Jane Smith"
              className="input-field pl-10 h-12 text-sm"
              autoComplete="name"
              aria-label="Full name"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-navy-900 mb-1.5 block">Phone Number *</label>
          <div className="relative">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+44 7700 900000"
              className="input-field pl-10 h-12 text-sm"
              autoComplete="tel"
              aria-label="Phone number"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-navy-900 mb-1.5 block">Email Address *</label>
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jane@example.com"
              className="input-field pl-10 h-12 text-sm"
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-navy-900 mb-1.5 block">
            Access Notes
            <span className="text-slate-400 font-normal ml-1">(optional)</span>
          </label>
          <div className="relative">
            <FileText size={15} className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" />
            <textarea
              value={form.accessNotes}
              onChange={(e) => update("accessNotes", e.target.value)}
              placeholder="e.g. Ring doorbell twice, gate code 1234, dog in garden…"
              rows={2}
              className="input-field pl-10 resize-none text-sm py-3"
              maxLength={250}
              aria-label="Access notes"
            />
          </div>
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-slate-400 text-center">
        By confirming you agree to our{" "}
        <a href="/terms" className="text-emerald-600 hover:underline">Terms of Service</a> and{" "}
        <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>.
        No upfront payment required.
      </p>

      {/* CTA */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-base rounded-2xl transition-all shadow-cta disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: "56px" }}
        aria-label="Confirm and dispatch engineer"
      >
        {loading ? (
          <><Loader2 size={20} className="animate-spin" /> Booking…</>
        ) : (
          <>Confirm &amp; Dispatch Engineer <ChevronRight size={20} /></>
        )}
      </button>
    </div>
  );
}

// ── Main BookingWidget ─────────────────────────────────────────────────────
export default function BookingWidget({ embedded = false }) {
  const navigate  = useNavigate();
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [files,   setFiles]   = useState([]);

  const [form, setForm] = useState({
    postcode:      "",
    urgency:       "emergency",
    service:       "",
    selectedChips: [],
    description:   "",
    address:       "",
    fullName:      "",
    phone:         "",
    email:         "",
    accessNotes:   "",
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ── Validation per step ─────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0)
      return isValidPostcode(form.postcode) && !!form.service;
    if (step === 1)
      return form.address.trim().length > 5;
    if (step === 2)
      return (
        form.fullName.trim().length > 1 &&
        form.phone.trim().length > 7 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      );
    return true;
  };

  // ── Upload photos to Supabase Storage ──────────────────────────────────
  const uploadPhotos = async () => {
    if (!files.length) return [];
    const urls = [];
    for (const { file } of files) {
      const ext  = file.name.split(".").pop();
      const path = `job-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("job-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (!error && data) {
        const { data: pub } = supabase.storage.from("job-photos").getPublicUrl(data.path);
        urls.push(pub.publicUrl);
      }
    }
    return urls;
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Try to get authenticated session
      const { data: { session } } = await supabase.auth.getSession();

      // 2. Geocode postcode
      let location = null;
      try {
        const res  = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(form.postcode.replace(/\s/g,""))}`);
        const json = await res.json();
        if (json.status === 200) {
          location = `POINT(${json.result.longitude} ${json.result.latitude})`;
        }
      } catch (_) { /* non-fatal */ }

      // 3. Upload photos
      const photoUrls = await uploadPhotos();

      // 4. Build description from chips + text
      const issueText = [
        form.selectedChips.length ? `Issues: ${form.selectedChips.join(", ")}.` : "",
        form.description.trim(),
      ].filter(Boolean).join(" ");

      // 5. Compute estimated quote
      const callout          = CALLOUT_FEES[form.urgency] ?? 49;
      const [labMin, labMax] = LABOUR_RANGES[form.service] ?? [30, 70];
      const vatRate          = 0.2;
      const estimatedQuote   = Math.round(((callout + (labMin + labMax) / 2) * (1 + vatRate)));

      // 6. Build insert payload
      const payload = {
        trade:           form.service,
        urgency:         form.urgency === "emergency" ? "emergency" : "standard",
        title:           form.selectedChips[0] ?? `${SERVICES.find(s => s.id === form.service)?.label ?? "General"} Job`,
        description:     issueText || null,
        address:         form.address.trim(),
        postcode:        form.postcode.trim().toUpperCase(),
        location,
        status:          "pending",
        quoted_price:    estimatedQuote,
        customer_notes:  form.accessNotes.trim() || null,
        photos_before:   photoUrls.length ? photoUrls : null,
      };

      // 7. Attach customer_id if authenticated
      if (session) {
        const { data: customer } = await supabase
          .from("customers")
          .select("id")
          .eq("profile_id", session.user.id)
          .single();
        if (customer) payload.customer_id = customer.id;
      }

      // 8. Insert job
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert(payload)
        .select("id, tracking_token")
        .single();

      if (jobErr) throw jobErr;

      // 9. Store contact info in notifications / metadata (best-effort)
      if (session && job) {
        await supabase.from("notifications").insert({
          profile_id: session.user.id,
          job_id:     job.id,
          title:      "Booking Confirmed",
          body:       `Your ${SERVICES.find(s => s.id === form.service)?.label} job has been submitted. We're finding your engineer.`,
        }).then(() => {});
      }

      // 10. Trigger dispatch engine
      if (job) {
        triggerDispatch(job.id).catch(() => {});
      }

      setJobData({ ...job, estimatedQuote, service: form.service, urgency: form.urgency });
      setSuccess(true);
      toast.success("Booking confirmed! Finding your engineer…");

      // 11. Redirect to tracking page
      setTimeout(() => {
        navigate(`/track/${job.id}?token=${job.tracking_token}`);
      }, 2400);

    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (success && jobData) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-navy-900 mb-2">Booking Confirmed!</h3>
        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
          We're matching you with the nearest available engineer. Redirecting to live tracking…
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left border border-slate-200 space-y-2">
          <div>
            <p className="text-xs text-slate-400">Tracking reference</p>
            <p className="font-mono font-semibold text-navy-900 text-sm break-all">{jobData.tracking_token}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Estimated quote</p>
            <p className="font-bold text-emerald-600">£{jobData.estimatedQuote} (incl. VAT)</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={13} className="animate-spin text-emerald-500" />
          Redirecting to engineer tracking…
        </div>
      </div>
    );
  }

  // ── Main wizard ─────────────────────────────────────────────────────────
  return (
    <div className={embedded ? "" : "max-w-lg mx-auto px-4 py-8"}>
      <StepBar step={step} />

      {step === 0 && (
        <Step1 form={form} update={update} />
      )}
      {step === 1 && (
        <Step2 form={form} update={update} files={files} setFiles={setFiles} />
      )}
      {step === 2 && (
        <Step3 form={form} update={update} onSubmit={handleSubmit} loading={loading} />
      )}

      {/* Navigation row */}
      {!success && (
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-200 bg-white text-navy-900 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-40 min-h-0"
              aria-label="Go back"
            >
              <ChevronLeft size={17} />
              Back
            </button>
          )}

          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-cta disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              style={{ height: "52px" }}
              aria-label={`Continue to ${STEPS[step + 1]?.label}`}
            >
              {step === 0 ? "Continue to Job Details" : "Continue to Schedule"}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
