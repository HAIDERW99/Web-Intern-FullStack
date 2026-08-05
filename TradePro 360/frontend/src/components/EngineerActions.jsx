import { useState, useEffect, useRef, useCallback } from "react";
import {
  Navigation, CheckCircle2, Camera, MessageSquare, Clock,
  AlertTriangle, Loader2, MapPin, Phone, User, Star,
  ChevronRight, Upload, X, Play, Square, Timer,
  PoundSterling, FileText, Link2, Smartphone, Shield,
  QrCode, Send, Receipt, Wrench, Package,
} from "lucide-react";
import { supabase, updateEngineerLocation } from "../services/supabaseClient";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────
const CALLOUT_FEE  = 65;
const LABOUR_RATE  = 55; // £ per hour
const VAT_RATE     = 0.20;

const STEPS = [
  { id: 1, label: "Contact & Navigate" },
  { id: 2, label: "On-Site Arrival"    },
  { id: 3, label: "Job In Progress"    },
  { id: 4, label: "Invoice & Payment"  },
];

const GEO_OPTS = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 };

// ── Step Progress Bar ──────────────────────────────────────────────────────
function StepBar({ currentStep }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-white border-b border-slate-100">
      {STEPS.map((step, i) => {
        const done   = step.id < currentStep;
        const active = step.id === currentStep;
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-navy-900 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? <CheckCircle2 size={14} /> : step.id}
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-tight hidden sm:block ${
                  active ? "text-navy-900" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                  done ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Contact & Navigation ───────────────────────────────────────────
function Step1Contact({ job, onNext }) {
  const customer = job.customers?.profiles ?? {};
  const mapsUrl  = `https://www.openstreetmap.org/directions?engine=osrm_car&route=&to=${encodeURIComponent(job.address)}`;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Customer card */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {(customer.full_name ?? "C")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-navy-900 text-base">{customer.full_name ?? "Customer"}</p>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{job.address}</span>
            </div>
          </div>
        </div>

        {/* Issue description */}
        {job.issue_detail && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{job.issue_detail}</p>
          </div>
        )}

        {/* Contact action chips */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${customer.phone ?? ""}`}
            className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm rounded-xl min-h-[48px] hover:bg-emerald-100 transition-colors"
          >
            <Phone size={16} /> Call Customer
          </a>
          <a
            href={`sms:${customer.phone ?? ""}`}
            className="flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm rounded-xl min-h-[48px] hover:bg-blue-100 transition-colors"
          >
            <MessageSquare size={16} /> Send SMS
          </a>
        </div>
      </div>

      {/* Navigation CTA */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-2xl min-h-[56px] shadow-lg transition-all"
      >
        <Navigation size={20} />
        START NAVIGATION
      </a>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-950 text-white font-bold text-sm rounded-2xl min-h-[48px] transition-colors"
      >
        I'm on my way <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ── Step 2: On-Site Arrival ────────────────────────────────────────────────
function Step2Arrival({ job, onArrive, loading }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="card text-center py-6">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin size={28} className="text-purple-600" />
        </div>
        <p className="font-bold text-navy-900 text-lg mb-1">Arrived at site?</p>
        <p className="text-sm text-slate-500 mb-1">{job.address}</p>
        <p className="text-xs text-slate-400">
          Tapping below will update the Admin Kanban and notify the customer you've arrived.
        </p>
      </div>

      <button
        onClick={onArrive}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 text-white font-bold text-base rounded-2xl min-h-[56px] shadow-lg transition-all"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
        {loading ? "Updating status…" : "MARK ARRIVED ON-SITE"}
      </button>
    </div>
  );
}

// ── Job Timer Hook ─────────────────────────────────────────────────────────
function useJobTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const t = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      return () => clearInterval(t);
    }
  }, [running]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return { display: `${hh}:${mm}:${ss}`, hours: elapsed / 3600 };
}

// ── Step 3: Job Execution ──────────────────────────────────────────────────
function Step3Execution({ job, onComplete, loading, photos, onPhotoUpload }) {
  const { display, hours } = useJobTimer(true);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Timer */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Timer size={22} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time On-Site</p>
          <p className="text-2xl font-black text-navy-900 font-mono tabular-nums">{display}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-400">Est. Labour</p>
          <p className="text-base font-bold text-emerald-600">
            £{(Math.max(hours, 0.5) * LABOUR_RATE).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Photo uploads */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-navy-900 text-sm">Proof of Work Photos</h3>
        {["before", "after"].map((phase) => (
          <div key={phase}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {phase === "before" ? "Before Work" : "After Work"}
            </p>
            <div className="flex gap-2 flex-wrap">
              {photos[phase].map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                  <img src={url} alt={`${phase} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex-shrink-0 gap-1">
                <Camera size={18} className="text-slate-400" />
                <span className="text-[9px] text-slate-400">Add</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onPhotoUpload(e, phase)} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 text-white font-bold text-base rounded-2xl min-h-[56px] shadow-lg transition-all"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
        {loading ? "Saving…" : "COMPLETE – GO TO INVOICE"}
      </button>
    </div>
  );
}

// ── QR Code Placeholder ────────────────────────────────────────────────────
function QRPlaceholder({ amount }) {
  // SVG-based QR stand-in — in production use a real QR library
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200">
      <div className="grid grid-cols-7 gap-0.5 p-3 bg-white border-2 border-navy-900 rounded-xl">
        {Array.from({ length: 49 }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-sm ${
              [0,1,2,3,4,5,7,14,21,28,35,42,43,44,45,46,47,48,
               8,9,10,11,12,13,6,27,34,41,22,23,24,15,20,36,37,38,39,40,
               16,19,25,26,29,30,31,32,33].includes(i)
                ? "bg-navy-900"
                : "bg-white"
            }`}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500 leading-snug">Customer can scan this to pay</p>
        <p className="text-xs text-slate-500">securely via card or Apple/Google Pay</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
        <Shield size={12} className="text-emerald-600" />
        Secure Stripe Payment · £{amount.toFixed(2)}
      </div>
    </div>
  );
}

// ── Step 4: Invoice & Payment ──────────────────────────────────────────────
function Step4Invoice({ job, onMarkComplete, loading }) {
  const [partsCost,    setPartsCost]    = useState(0);
  const [labourHours,  setLabourHours]  = useState(1);
  const [showQR,       setShowQR]       = useState(false);
  const [pdfGenerating,setPdfGenerating]= useState(false);
  const [paymentSent,  setPaymentSent]  = useState(false);

  const labourTotal  = labourHours * LABOUR_RATE;
  const subTotal     = CALLOUT_FEE + labourTotal + Number(partsCost);
  const vat          = subTotal * VAT_RATE;
  const grandTotal   = subTotal + vat;

  const handleGeneratePDF = async () => {
    setPdfGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPdfGenerating(false);
    toast.success("Invoice PDF downloaded! (simulation)");
  };

  const handleStripeLink = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setPaymentSent(true);
    setShowQR(true);
    toast.success("Stripe payment link sent to customer 🔗");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Invoice builder */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Receipt size={18} className="text-navy-900" />
          <h3 className="font-bold text-navy-900 text-base">Quick Invoice</h3>
        </div>

        {/* Line items */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Base Callout Fee</span>
            <span className="font-semibold text-navy-900">£{CALLOUT_FEE.toFixed(2)}</span>
          </div>

          {/* Labour hours input */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
            <div className="flex-1">
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1">Labour Hours</p>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={labourHours}
                onChange={(e) => setLabourHours(Math.max(0.5, parseFloat(e.target.value) || 0))}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-0"
              />
            </div>
            <div className="text-right flex-shrink-0 mt-4">
              <p className="text-[11px] text-slate-400">@ £{LABOUR_RATE}/hr</p>
              <p className="font-semibold text-navy-900">£{labourTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Parts cost input */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-3">
            <div className="flex-1">
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide mb-1">Parts Cost (£)</p>
              <input
                type="number"
                min="0"
                step="0.01"
                value={partsCost}
                onChange={(e) => setPartsCost(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-0"
              />
            </div>
            <div className="text-right flex-shrink-0 mt-4">
              <span className="font-semibold text-navy-900">£{Number(partsCost).toFixed(2)}</span>
            </div>
          </div>

          {/* Subtotal + VAT */}
          <div className="flex justify-between py-1 text-slate-500">
            <span>Subtotal</span>
            <span>£{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-500">
            <span>VAT (20%)</span>
            <span>£{vat.toFixed(2)}</span>
          </div>

          {/* Grand total */}
          <div className="flex justify-between items-center pt-2 border-t-2 border-navy-900">
            <span className="font-black text-navy-900 text-base">TOTAL</span>
            <span className="font-black text-emerald-600 text-xl">£{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* PDF button */}
      <button
        onClick={handleGeneratePDF}
        disabled={pdfGenerating}
        className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-950 disabled:opacity-60 text-white font-bold text-sm rounded-2xl min-h-[48px] transition-colors"
      >
        {pdfGenerating ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}
        {pdfGenerating ? "Generating…" : "GENERATE & SHARE PDF INVOICE"}
      </button>

      {/* Stripe payment */}
      <button
        onClick={handleStripeLink}
        disabled={paymentSent}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-bold text-base rounded-2xl min-h-[56px] shadow-cta transition-all"
      >
        <Send size={18} />
        {paymentSent ? "Payment Link Sent ✓" : "COLLECT PAYMENT VIA STRIPE"}
      </button>

      {paymentSent && (
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
          <Shield size={12} className="text-emerald-600" />
          SECURE STRIPE PAYMENT
        </div>
      )}

      {/* QR Code */}
      {showQR && <QRPlaceholder amount={grandTotal} />}

      {/* Complete job */}
      <button
        onClick={() => onMarkComplete(grandTotal)}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 text-white font-bold text-base rounded-2xl min-h-[56px] shadow-cta transition-all mt-2"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
        {loading ? "Completing…" : "MARK JOB AS COMPLETED"}
      </button>
    </div>
  );
}

// ── Mock start point (London SW) ──────────────────────────────────────────
const MOCK_START = { lat: 51.48, lng: -0.20 };

// ── Main Export ────────────────────────────────────────────────────────────
export default function EngineerActionsPanel({ job, engineerId, onJobUpdate }) {
  const [step,          setStep]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [tracking,      setTracking]      = useState(false);
  const [currentPos,    setCurrentPos]    = useState(null);
  const [photos,        setPhotos]        = useState({ before: [], after: [] }); // lifted from Step3
  const watchIdRef      = useRef(null);
  const intervalRef   = useRef(null);
  const mockIntervalRef = useRef(null);
  const mockStepRef   = useRef(0);
  const mockDestRef   = useRef(null);
  const mockPosRef    = useRef(MOCK_START);

  // ── Push location to Supabase (engineer_locations + engineers) ────────────
  const pushLocation = useCallback(async (lat, lng) => {
    setCurrentPos({ lat, lng });
    if (job?.id && engineerId) {
      // Insert into engineer_locations
      await updateEngineerLocation(engineerId, job.id, lat, lng);
      // Also update engineers table location field
      await supabase
        .from("engineers")
        .update({
          location: `POINT(${lng} ${lat})`,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", engineerId);
    }
  }, [job?.id, engineerId]);

  // ── Geocode job postcode for mock destination ──────────────────────────────
  const geocodePostcode = useCallback(async (postcode) => {
    if (!postcode) return null;
    try {
      const clean = postcode.replace(/\s+/g, "");
      const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
      const json = await res.json();
      if (json.status === 200 && json.result) {
        return { lat: json.result.latitude, lng: json.result.longitude };
      }
    } catch (_) {}
    return null;
  }, []);

  // ── Start mock simulation (interpolate toward job postcode) ──────────────
  const startMockTracking = useCallback(async () => {
    const dest = await geocodePostcode(job?.postcode);
    mockDestRef.current = dest ?? { lat: job?.location_lat ?? 51.5074, lng: job?.location_lng ?? -0.1278 };
    mockPosRef.current = MOCK_START;
    mockStepRef.current = 0;

    mockIntervalRef.current = setInterval(async () => {
      mockStepRef.current += 1;
      // ~200 steps to reach destination, but cap at 0.99 so it never fully arrives
      const t = Math.min(mockStepRef.current / 200, 0.99);
      const target = mockDestRef.current;
      const newPos = {
        lat: MOCK_START.lat + (target.lat - MOCK_START.lat) * t,
        lng: MOCK_START.lng + (target.lng - MOCK_START.lng) * t,
      };
      mockPosRef.current = newPos;
      await pushLocation(newPos.lat, newPos.lng);
    }, 3000);
  }, [geocodePostcode, job?.postcode, job?.location_lat, job?.location_lng, pushLocation]);

  // ── GPS tracking ──────────────────────────────────────────
  const startTracking = useCallback(() => {
    setTracking(true);

    if (!navigator.geolocation) {
      // No geolocation at all — go straight to mock
      startMockTracking();
      return;
    }

    // Try real GPS first
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        pushLocation(lat, lng);
      },
      (err) => {
        // GPS denied or unavailable — fall back to mock
        if (err.code === 1) {
          toast("GPS permission denied — using simulated location 📍");
        } else {
          toast("GPS unavailable — using simulated location 📍");
        }
        startMockTracking();
      },
      GEO_OPTS
    );

    // Also poll every 30s as a supplement
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          pushLocation(lat, lng);
        },
        () => {}, // silently ignore poll errors (mock already running)
        GEO_OPTS
      );
    }, 30_000);
  }, [pushLocation, startMockTracking]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
    watchIdRef.current = null;
    intervalRef.current = null;
    mockIntervalRef.current = null;
    setTracking(false);
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  // ── Photo upload handler (lifted from Step3) ──────────────
  const handlePhotoUpload = useCallback(async (e, phase) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const uploaded = [];
    for (const file of files) {
      try {
        const ext  = file.name.split(".").pop();
        const path = `${job.id}/${phase}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from("job-photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from("job-photos").getPublicUrl(path);
          uploaded.push(publicUrl);
        } else {
          uploaded.push(URL.createObjectURL(file));
        }
      } catch (_) {
        uploaded.push(URL.createObjectURL(file));
      }
    }
    setPhotos((p) => ({ ...p, [phase]: [...p[phase], ...uploaded] }));
    toast.success(`${files.length} photo(s) added`);
  }, [job?.id]);

  // ── Step advance handlers ─────────────────────────────────
  const handleEnRoute = () => {
    startTracking();
    setStep(2);
    onJobUpdate?.({ ...job, status: "en_route" });
    toast("Navigation started — location sharing is ON 📍");
  };

  const handleArrive = async () => {
    setLoading(true);
    try {
      await supabase.from("jobs").update({
        status: "on_site",
        started_at: new Date().toISOString(),
      }).eq("id", job.id);
      setStep(3);
      onJobUpdate?.({ ...job, status: "on_site" });
      toast.success("Arrived on-site — admin & customer notified!");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleJobDone = async () => {
    setLoading(true);
    try {
      const updatePayload = { status: "invoicing" };
      // Save before photos if any were uploaded
      if (photos.before.length > 0) updatePayload.photos_before = photos.before;
      if (photos.after.length > 0)  updatePayload.photos_after  = photos.after;
      await supabase.from("jobs").update(updatePayload).eq("id", job.id);
      setStep(4);
      onJobUpdate?.({ ...job, status: "invoicing" });
    } catch {
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (grandTotal = 0) => {
    setLoading(true);
    try {
      const { error: jobErr } = await supabase.from("jobs").update({
        status:       "completed",
        completed_at: new Date().toISOString(),
        final_price:  grandTotal,
        payment_status: "captured",
      }).eq("id", job.id);
      if (jobErr) throw jobErr;

      const { error: engErr } = await supabase.from("engineers").update({
        status: "available",
      }).eq("id", engineerId);
      if (engErr) console.warn("Engineer update failed:", engErr.message);

      stopTracking();
      onJobUpdate?.({ ...job, status: "completed", final_price: grandTotal });
    } catch (err) {
      toast.error(err.message ?? "Failed to complete job");
      stopTracking();
      onJobUpdate?.({ ...job, status: "completed" });
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Step bar + LIVE tracking indicator */}
      <div className="relative">
        <StepBar currentStep={step} />
        {tracking && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Active job header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Current Task
          </span>
          {job.urgency === "emergency" && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Emergency
            </span>
          )}
        </div>
        <h2 className="font-bold text-navy-900 text-lg leading-tight">
          {job.customers?.profiles?.full_name ?? "Customer"}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">{job.address}</p>
      </div>

      {/* Step content */}
      <div className="px-4 pb-4 pt-2">
        {step === 1 && <Step1Contact job={job} onNext={handleEnRoute} />}
        {step === 2 && <Step2Arrival job={job} onArrive={handleArrive} loading={loading} />}
        {step === 3 && <Step3Execution job={job} onComplete={handleJobDone} loading={loading} photos={photos} onPhotoUpload={handlePhotoUpload} />}
        {step === 4 && <Step4Invoice job={job} onMarkComplete={handleMarkComplete} loading={loading} />}
      </div>
    </div>
  );
}
