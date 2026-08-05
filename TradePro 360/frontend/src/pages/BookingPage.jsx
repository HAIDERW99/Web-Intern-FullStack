import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Wrench, ChevronRight, Shield, Star, CheckCircle2 } from "lucide-react";
import BookingWidget from "../components/BookingWidget";

/**
 * Standalone full-page booking flow (/book).
 * The BookingWidget handles all 3 steps and the Supabase submission.
 * This wrapper provides the page chrome — header strip, trust bar, footer.
 */
export default function BookingPage() {
  const [params] = useSearchParams();

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">

      {/* ── Slim page header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-card">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="TradePro 360 home">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wrench size={14} className="text-white" />
            </div>
            <span className="font-black text-navy-900 text-sm tracking-tight">
              TradePro <span className="text-emerald-500">360</span>
            </span>
          </Link>

          {/* Trust pills */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Shield size={12} className="text-emerald-500" />
              No upfront payment
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Gas Safe & NICEIC verified
            </span>
          </div>

          <Link to="/" className="text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors">
            ✕ Cancel
          </Link>
        </div>
      </header>

      {/* ── Trust bar ───────────────────────────────────────────────── */}
      <div className="bg-navy-900 py-2.5">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center gap-6 flex-wrap">
          {[
            { icon: Star,         label: "5-Star Google Rating" },
            { icon: Shield,       label: "Fully Insured"        },
            { icon: CheckCircle2, label: "Verified Tradesmen"   },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Icon size={11} className="text-emerald-400 flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Widget ──────────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="max-w-lg mx-auto px-4 py-8">
          <BookingWidget embedded={false} />
        </div>
      </main>

      {/* ── Slim footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-5">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} TradePro 360 Marketplace</span>
          <div className="flex items-center gap-5">
            <a href="/privacy" className="hover:text-navy-900 transition-colors">Privacy Policy</a>
            <a href="/terms"   className="hover:text-navy-900 transition-colors">Terms of Service</a>
            <a href="#"        className="hover:text-navy-900 transition-colors">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
