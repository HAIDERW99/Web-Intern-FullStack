import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Wrench, Zap, Flame, Lock, Droplets, HardHat,
  Star, CheckCircle2, BadgeCheck, Shield, Headphones,
  CreditCard, ChevronRight, ChevronLeft, MapPin, Clock,
  Navigation, Phone, ArrowRight, Sparkles,
} from "lucide-react";
// ── Static Data ────────────────────────────────────────────────────────────
const SERVICES = [
  { id: "plumbing",   label: "Plumbing",   icon: Wrench,   badge: "24/7 Response",   color: "text-blue-600",   bg: "bg-blue-50"   },
  { id: "electrical", label: "Electrical", icon: Zap,      badge: "NICEIC Certified",color: "text-yellow-600", bg: "bg-yellow-50" },
  { id: "heating",    label: "Heating",    icon: Flame,    badge: "Gas Safe Pro",    color: "text-red-600",    bg: "bg-red-50"    },
  { id: "drainage",   label: "Drainage",   icon: Droplets, badge: "Blocked Pipes",   color: "text-cyan-600",   bg: "bg-cyan-50"   },
  { id: "locksmith",  label: "Locksmith",  icon: Lock,     badge: "30 Min Arrival",  color: "text-slate-600",  bg: "bg-slate-100" },
  { id: "general",    label: "General",    icon: HardHat,  badge: "All Repairs",     color: "text-orange-600", bg: "bg-orange-50" },
];

const FEATURES = [
  { icon: Clock,      title: "Instant GMB Booking",  desc: "Sync directly with local engineers' calendars for immediate confirmation without the wait."           },
  { icon: Navigation, title: "Live GPS Van Tracking", desc: "Watch your engineer arrive in real-time. Know exactly when to expect them at your door."               },
  { icon: Sparkles,   title: "Dynamic UK Pricing",    desc: "Fair, localised pricing based on your UK postcode. No hidden call-out fees or surprises."              },
  { icon: BadgeCheck, title: "Verified & Vetted",     desc: "Every engineer is background-checked, insured, and verified for high-quality workmanship."            },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Enter UK Postcode",    desc: "Tell us where you are to find the closest verified professionals in your area."      },
  { step: "2", title: "Get Live Quote",       desc: "Instant fixed pricing based on your problem. No haggling, no unexpected extras."     },
  { step: "3", title: "Track Engineer Live",  desc: "Receive a tracking link to see your engineer's exact location and ETA."              },
];

const TRUST_BADGES = [
  { icon: Star,        label: "5-star Google Rating"      },
  { icon: BadgeCheck,  label: "Verified UK Tradesmen"     },
  { icon: CreditCard,  label: "No Upfront Cost"           },
  { icon: Shield,      label: "Fully Insured Service"     },
];

const TESTIMONIALS = [
  { name: "Sarah M.",   location: "London SE1",     rating: 5, text: "Engineer arrived in 25 minutes. Sorted my burst pipe and left everything spotless. Brilliant service — will use again." },
  { name: "James T.",   location: "Manchester M1",  rating: 5, text: "Used TradePro for an emergency boiler repair on a Sunday night. Couldn't believe how fast and professional they were."  },
  { name: "Priya K.",   location: "Birmingham B1",  rating: 5, text: "Booked an electrician for a full rewire. The live tracking is a game-changer — knew exactly when he'd arrive."          },
  { name: "Marcus W.",  location: "Leeds LS1",      rating: 5, text: "Fixed a gas leak same night. The engineer was Gas Safe registered, showed his ID, and the price was exactly as quoted."  },
  { name: "Fiona B.",   location: "Bristol BS1",    rating: 5, text: "The booking widget took me 60 seconds. Engineer was on-site in 45 minutes. Absolutely fantastic experience."             },
];

// Tracker statuses for the teaser card
const TRACKER_STATUSES = [
  { label: "Engineer assigned",  color: "text-blue-600",    dot: "bg-blue-500"    },
  { label: "En route to you",    color: "text-purple-600",  dot: "bg-purple-500"  },
  { label: "15 mins away",       color: "text-emerald-600", dot: "bg-emerald-500" },
];

// ── Live Tracking Teaser ────────────────────────────────────────────────────
function TrackerTeaser() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [eta, setEta] = useState(22);

  useEffect(() => {
    // Cycle through statuses
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i + 1) % TRACKER_STATUSES.length);
    }, 2800);
    // Count down ETA
    const etaTimer = setInterval(() => {
      setEta((t) => (t > 5 ? t - 1 : 22));
    }, 1200);
    return () => { clearInterval(statusTimer); clearInterval(etaTimer); };
  }, []);

  const status = TRACKER_STATUSES[statusIndex];

  return (
    <div className="bg-white rounded-2xl shadow-card-hover border border-slate-200 overflow-hidden">
      {/* Simulated map background */}
      <div
        className="relative h-48 flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #e8f0fe 0%, #d1e8ff 50%, #e0f7fa 100%)",
        }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Road lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#94a3b8" strokeWidth="4" />
          <line x1="35%" y1="0" x2="35%" y2="100%" stroke="#94a3b8" strokeWidth="4" />
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#94a3b8" strokeWidth="3" />
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#94a3b8" strokeWidth="2" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#94a3b8" strokeWidth="2" />
        </svg>

        {/* Route line */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <polyline
            points="120,160 160,120 200,100 240,80 280,60 300,52"
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeDasharray="8 4"
            opacity="0.8"
          />
        </svg>

        {/* Destination pin */}
        <div className="absolute right-14 top-10 flex flex-col items-center">
          <div className="w-9 h-9 bg-navy-900 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <div className="mt-1 px-2 py-0.5 bg-navy-900 text-white text-[10px] font-semibold rounded-full whitespace-nowrap">
            Your home
          </div>
        </div>

        {/* Engineer avatar — animated */}
        <div
          className="absolute flex flex-col items-center transition-all duration-1000"
          style={{ left: "28%", top: "55%" }}
        >
          <div className="relative">
            <div className="w-11 h-11 bg-emerald-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
              <Wrench size={18} className="text-white" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
          </div>
          <div className="mt-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-full whitespace-nowrap">
            Dave • Plumber
          </div>
        </div>

        {/* Live badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Info strip */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            <span className={`text-sm font-semibold ${status.color} transition-all duration-500`}>
              {status.label}
            </span>
          </div>
          {/* ETA */}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">
            <Clock size={13} />
            ETA ~{eta} min
          </div>
        </div>

        {/* Engineer card */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-700 font-bold text-sm">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy-900 text-sm">Dave Richardson</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="text-amber-400 fill-current" />
                ))}
              </div>
              <span className="text-xs text-slate-500">Gas Safe • 312 jobs</span>
            </div>
          </div>
          <a
            href="tel:08001234567"
            className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition-colors flex-shrink-0 min-h-0"
            aria-label="Call engineer"
          >
            <Phone size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Review Slider ──────────────────────────────────────────────────────────
function ReviewSlider() {
  const [current, setCurrent] = useState(0);
  const total = TESTIMONIALS.length;
  const prev = () => setCurrent((i) => (i - 1 + total) % total);
  const next = () => setCurrent((i) => (i + 1) % total);

  // Auto-advance
  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Cards — show 1 on mobile, 3 on desktop */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {TESTIMONIALS.map(({ name, location, rating, text }) => (
            <div key={name} className="min-w-full px-2">
              <div className="card max-w-lg mx-auto">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} size={15} className="text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={10} /> {location}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500 ml-auto flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-card min-h-0"
          aria-label="Previous review"
        >
          <ChevronLeft size={18} />
        </button>
        {/* Dots */}
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all min-h-0 p-0 ${
                i === current ? "w-6 h-2 bg-emerald-500" : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-card min-h-0"
          aria-label="Next review"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HomePage({ onOpenAuth }) {
  const [activeService, setActiveService] = useState(null);
  const location = useLocation();

  // Show auth error toast when redirected from a protected route
  useEffect(() => {
    if (location.state?.authError) {
      toast.error(location.state.authError, { duration: 5000 });
      // Clear the state so it doesn't re-show on refresh
      window.history.replaceState({}, "");
    }
  }, [location.state?.authError]);

  return (
    <div className="min-h-screen bg-[#f8f9ff]">

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section className="relative bg-navy-900 overflow-hidden">
        {/* Radial background glows */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 40%, rgba(16,185,129,0.12) 0%, transparent 70%), " +
              "radial-gradient(ellipse 50% 60% at 80% 60%, rgba(96,165,250,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="page-container py-14 md:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-start">

            {/* Left — hero copy */}
            <div className="text-center lg:text-left pt-2">
              {/* Live availability badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Availability in London &amp; UK
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Emergency Plumbers,{" "}
                <span className="text-emerald-400">Electricians</span>{" "}
                &amp; Heating Engineers
              </h1>

              <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Book verified local tradesmen in 60 seconds. Fixed transparent quotes &amp; live engineer tracking. Professional service when you need it most.
              </p>

              {/* Trust badges row */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start mb-8">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-slate-400 text-sm">
                    <Icon size={15} className="text-emerald-400 flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Latest booking ticker */}
              <div className="inline-flex items-center gap-3 bg-white/10 border border-white/15 backdrop-blur rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Latest Booking</p>
                  <p className="text-sm font-semibold text-white">Emergency Electrician — SE1</p>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-2 flex-shrink-0" />
              </div>
            </div>

            {/* Right — Quick-start card linking to full booking flow */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-7 animate-slide-up">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-navy-900">Get Instant Free Quote</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Takes less than 60 seconds</p>
                </div>
                <ArrowRight size={20} className="text-emerald-500 flex-shrink-0" />
              </div>

              {/* Service grid teaser */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: "Plumbing",   icon: Wrench,   color: "text-blue-600",   bg: "bg-blue-50"   },
                  { label: "Electrical", icon: Zap,      color: "text-yellow-600", bg: "bg-yellow-50" },
                  { label: "Heating",    icon: Flame,    color: "text-red-600",    bg: "bg-red-50"    },
                  { label: "Drainage",   icon: Droplets, color: "text-cyan-600",   bg: "bg-cyan-50"   },
                  { label: "Locksmith",  icon: Lock,     color: "text-slate-600",  bg: "bg-slate-100" },
                  { label: "General",    icon: HardHat,  color: "text-orange-600", bg: "bg-orange-50" },
                ].map(({ label, icon: Icon, color, bg }) => (
                  <Link
                    key={label}
                    to={`/book?service=${label.toLowerCase()}`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-card transition-all text-center group"
                  >
                    <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center border border-slate-100`}>
                      <Icon size={17} className={color} />
                    </div>
                    <span className="text-[11px] font-semibold text-navy-900 leading-tight">{label}</span>
                  </Link>
                ))}
              </div>

              {/* CTA */}
              <Link
                to="/book?urgency=emergency"
                className="btn-primary w-full justify-center text-sm shadow-cta"
              >
                <Navigation size={16} />
                Book an Engineer Now
              </Link>
              <p className="text-center text-xs text-slate-400 mt-3">No upfront payment · Most jobs in 30 mins</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TRUST STATS BAR
      ════════════════════════════════════════════════ */}
      <section className="bg-emerald-500">
        <div className="page-container py-5">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-center">
            {[
              { value: "12,400+", label: "Jobs completed" },
              { value: "4.9 ★",   label: "Google Rating"  },
              { value: "28 min",  label: "Avg response"   },
              { value: "100%",    label: "Gas Safe vetted" },
            ].map(({ value, label }) => (
              <div key={label} className="px-4">
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-emerald-100 text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SERVICES GRID
      ════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#eff4ff]">
        <div className="page-container">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-2">Services</p>
            <h2 className="section-heading mb-3">What service do you need?</h2>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              Select a category to get an instant fixed-price estimate.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICES.map(({ id, label, icon: Icon, badge, color, bg }) => {
              const active = activeService === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveService(active ? null : id)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer group text-center ${
                    active
                      ? "border-navy-900 bg-navy-900 shadow-lg scale-[1.03]"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-card-hover hover:scale-[1.02]"
                  }`}
                >
                  <div className={`w-12 h-12 ${active ? "bg-white/10" : bg} rounded-xl flex items-center justify-center transition-colors`}>
                    <Icon size={24} className={active ? "text-white" : color} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${active ? "text-white" : "text-navy-900"}`}>{label}</p>
                    <p className={`text-[11px] mt-0.5 ${active ? "text-emerald-300" : "text-slate-500"}`}>{badge}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {activeService && (
            <div className="mt-8 text-center animate-fade-in">
              <Link
                to={`/book?trade=${activeService}`}
                className="btn-primary text-base px-10 shadow-cta"
              >
                Book {SERVICES.find((s) => s.id === activeService)?.label} Now
                <ChevronRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES STRIP
      ════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-4">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 text-base mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          LIVE TRACKING TEASER
      ════════════════════════════════════════════════ */}
      <section className="py-20 bg-[#eff4ff]">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-3">Real-time</p>
              <h2 className="section-heading mb-5">
                Watch your engineer{" "}
                <span className="text-emerald-500">arrive live</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                No more waiting and wondering. Get a live GPS tracking link the moment your engineer is dispatched. See their exact location, route, and ETA update every 30 seconds.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { status: "Engineer assigned",  desc: "We've matched Dave, your local Gas Safe plumber" },
                  { status: "En route",           desc: "Dave is 2.3 miles away on the A205"              },
                  { status: "Arriving in 15 min", desc: "Track exact location and ETA in real-time"        },
                ].map(({ status, desc }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                      i === 0 ? "bg-blue-500" : i === 1 ? "bg-purple-500" : "bg-emerald-500"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{status}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/track" className="btn-primary">
                <Navigation size={18} />
                See Live Tracking Demo
              </Link>
            </div>

            <div>
              <TrackerTeaser />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="page-container relative z-10">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it Works</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              The fastest way to fix your home emergencies
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-white/10 z-0" />

            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={step} className="relative z-10 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  <span className="text-3xl font-black text-white">{step}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/book" className="btn-primary text-base px-10 py-4 shadow-cta">
              Book Your Engineer Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TRUST & SOCIAL PROOF
      ════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="page-container">
          {/* Trust badges row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: BadgeCheck, label: "Vetted UK Tradesmen",        desc: "Every engineer is DBS-checked, ID-verified, and holds relevant UK certifications.", color: "text-emerald-600", bg: "bg-emerald-50"  },
              { icon: CreditCard, label: "No Call-Out Fee Options",     desc: "Book on a fixed-price basis with no surprise charges when the engineer arrives.",    color: "text-blue-600",   bg: "bg-blue-50"    },
              { icon: Shield,     label: "Upfront Pricing Guarantee",   desc: "Your quote is locked in before we dispatch. What you see is what you pay.",          color: "text-navy-900",   bg: "bg-slate-100"  },
            ].map(({ icon: Icon, label, desc, color, bg }) => (
              <div key={label} className="card flex gap-4">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 text-base mb-1">{label}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews */}
          <div className="text-center mb-10">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-amber-400 fill-current" />
              ))}
            </div>
            <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-2">5-Star Google Rating</p>
            <h2 className="section-heading mb-2">What customers say</h2>
            <p className="text-slate-500 text-base">Over 12,000 five-star reviews from homeowners across the UK.</p>
          </div>

          <ReviewSlider />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════ */}
      <section className="bg-navy-900 py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(16,185,129,0.1) 0%, transparent 70%)",
          }}
        />
        <div className="page-container text-center relative z-10">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-4">Available 24/7</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Need a tradesman <span className="text-emerald-400">right now?</span>
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-lg mx-auto">
            Emergency engineers across the UK. Most jobs responded to within 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book?urgency=emergency" className="btn-primary text-base px-10 py-4 shadow-cta">
              <Phone size={18} />
              Emergency Booking
            </Link>
            <Link to="/book" className="btn-outline text-base px-10 py-4">
              Schedule a Visit
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════ */}
      <footer className="bg-navy-950 border-t border-white/10">
        <div className="page-container py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Wrench size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-base">
                  TradePro <span className="text-emerald-400">360</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                Providing reliable, professional tradesmen services across the UK. Available 24/7 for all your home emergencies.
              </p>
              <a href="tel:08001234567"
                className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors">
                <Phone size={14} /> 0800 123 4567
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Quick Links</h4>
              <ul className="space-y-3">
                {["Emergency Plumber", "24/7 Electrician", "Boiler Repair", "Pricing Guide"].map((s) => (
                  <li key={s}>
                    <Link to="/book" className="text-slate-400 text-sm hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <ChevronRight size={13} className="text-emerald-600/50" /> {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-3">
                {["Local Coverage Areas", "Privacy Policy", "Terms of Service", "Cookie Policy"].map((s) => (
                  <li key={s}>
                    <a href="#" className="text-slate-400 text-sm hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <ChevronRight size={13} className="text-emerald-600/50" /> {s}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tradesmen CTA */}
            <div>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-widest">Are you a tradesman?</h4>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                Join our network and get more high-quality local jobs.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white text-navy-900 text-sm font-bold px-5 py-3 rounded-xl hover:bg-slate-100 transition-colors shadow-sm min-h-0"
              >
                Trade Partner Sign-up
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {/* Local services area */}
          <div className="border-t border-white/10 pt-8 mb-8">
            <p className="text-xs text-slate-600 mb-3 font-semibold uppercase tracking-wider">Service areas</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Sheffield", "Bristol", "Edinburgh", "Glasgow", "Cardiff", "Newcastle", "Nottingham"].map((city) => (
                <a key={city} href="#" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                  {city}
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} TradePro 360 Ltd. Registered in England &amp; Wales.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/engineer" className="text-slate-600 hover:text-slate-400 transition-colors text-xs">Engineer Login</Link>
              <Link to="/admin" className="flex items-center gap-1.5 text-emerald-600/70 hover:text-emerald-400 transition-colors text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
