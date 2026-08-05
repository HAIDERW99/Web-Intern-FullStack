import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Wrench, Zap, Flame, Lock, Droplets, HardHat,
  LayoutDashboard, ClipboardList, Map, CreditCard,
  Settings, Bell, LogOut, Search, Plus,
  Phone, MoreVertical, MapPin, Navigation,
  Shield, PoundSterling, RefreshCw, ChevronDown,
  Menu, X, Bolt, AlertTriangle, Clock, Users,
  TrendingUp, TrendingDown, CheckCircle2, Loader2,
  Star, Activity, Building2, ExternalLink,
  Eye, EyeOff,
} from "lucide-react";
import AdminKanban, { TRADE_META } from "../components/AdminKanban";
import { supabase, triggerDispatch, supabaseAdmin } from "../services/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────
const BUSINESSES = [
  { id: "tp360",   name: "TradePro 360",       sub: "HQ · All Regions"    },
  { id: "express", name: "Express Plumbing UK", sub: "London & South East" },
  { id: "gasfast", name: "GasFast Services",    sub: "Midlands"            },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview",    icon: LayoutDashboard, badge: null  },
  { id: "dispatch",  label: "Dispatch Kanban",       icon: ClipboardList,   badge: "jobs" },
  { id: "fleet",     label: "Live Engineer Fleet",   icon: Map,             badge: null  },
  { id: "invoices",  label: "Invoices & Payments",   icon: CreditCard,      badge: null  },
  { id: "pricing",   label: "Pricing & Callout Rules", icon: Settings,      badge: null  },
  { id: "engineers", label: "Engineer Accounts",     icon: Users,           badge: null  },
];

const STATUS_META = {
  available: { label: "Available", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200"  },
  on_site:   { label: "On-Site",   dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700 border-amber-200"        },
  en_route:  { label: "En Route",  dot: "bg-purple-500",  pill: "bg-purple-50 text-purple-700 border-purple-200"     },
  busy:      { label: "Busy",      dot: "bg-red-500",     pill: "bg-red-50 text-red-700 border-red-200"              },
  offline:   { label: "Offline",   dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-500 border-slate-200"       },
};

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, trend, icon: Icon, iconBg, iconColor, alert }) {
  const isUp = trend > 0;
  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-shadow relative overflow-hidden ${
      alert ? "border-red-200" : "border-slate-200"
    }`}>
      {/* Background glow for alert */}
      {alert && <div className="absolute inset-0 bg-red-500/3 pointer-events-none" />}

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-black text-navy-900 leading-none mb-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}% vs yesterday
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {alert && (
        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// ── Business Switcher ──────────────────────────────────────────────────────
function BusinessSwitcher({ active, setActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative px-4 pb-5 border-b border-white/10" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group min-h-0 text-left"
        aria-label="Switch business"
        aria-expanded={open}
      >
        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/40">
          <Building2 size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{active.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{active.sub}</p>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-slate-800 rounded-xl border border-white/10 shadow-2xl py-1.5 z-50 animate-fade-in">
          {BUSINESSES.map((biz) => (
            <button
              key={biz.id}
              onClick={() => { setActive(biz); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-colors min-h-0 ${
                active.id === biz.id ? "bg-white/10" : ""
              }`}
            >
              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wrench size={11} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{biz.name}</p>
                <p className="text-[10px] text-slate-400">{biz.sub}</p>
              </div>
              {active.id === biz.id && <CheckCircle2 size={13} className="text-emerald-400 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Glassmorphic Sidebar ───────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, jobCount, profile, onSignOut, sidebarOpen, setSidebarOpen }) {
  const [activeBiz, setActiveBiz] = useState(BUSINESSES[0]);

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:flex
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, #0b1c30 0%, #0d2137 50%, #091829 100%)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
        aria-label="Admin navigation"
      >
        {/* Logo header */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Wrench size={15} className="text-white" />
              </div>
              <div>
                <span className="font-black text-white text-sm tracking-tight">TradePro</span>
                <span className="font-black text-emerald-400 text-sm tracking-tight"> 360</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-0"
              aria-label="Close sidebar"
            >
              <X size={15} />
            </button>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-emerald-400 font-semibold">Operations Centre LIVE</span>
          </div>
        </div>

        {/* Business switcher */}
        <BusinessSwitcher active={activeBiz} setActive={setActiveBiz} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 min-h-0 text-left group ${
                  active
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/8"
                }`}
                style={!active ? { "--tw-bg-opacity": "0.08" } : {}}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} className={`flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-white" : "text-slate-500"}`} />
                <span className="flex-1 truncate">{label}</span>
                {badge === "jobs" && jobCount > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight ${
                    active ? "bg-white/20 text-white" : "bg-red-500 text-white"
                  }`}>
                    {jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom profile footer */}
        <div className="p-3 border-t border-white/8 space-y-3">
          {/* Support link */}
          <a
            href="#"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <Shield size={15} className="text-emerald-500 flex-shrink-0" />
            Support Portal
            <ExternalLink size={11} className="ml-auto text-slate-600" />
          </a>

          {/* Profile row */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
              {(profile?.full_name ?? "A")[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{profile?.full_name ?? "Admin"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[11px] text-slate-400 truncate capitalize">{profile?.role ?? "Lead Dispatcher"}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-0 flex-shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Top Header ─────────────────────────────────────────────────────────────
function TopHeader({ activeTab, autoDispatch, setAutoDispatch, onSearch, onNewJob, onSignOut, unreadCount, onMenuOpen, notifications, onMarkAllRead }) {
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const tabLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Dashboard";

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-card">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors min-h-0 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Page title */}
        <div className="hidden md:block flex-shrink-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Admin</p>
          <p className="text-sm font-bold text-navy-900 leading-tight">{tabLabel}</p>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm mx-auto md:mx-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); onSearch?.(e.target.value); }}
            placeholder="Search jobs, postcodes, customers…"
            className="w-full h-10 pl-10 pr-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            aria-label="Search"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* AI dispatch toggle */}
          <button
            onClick={() => setAutoDispatch((v) => !v)}
            className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all min-h-0 ${
              autoDispatch
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
            }`}
            aria-pressed={autoDispatch}
            title="Toggle AI Auto-Dispatch"
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${autoDispatch ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            AI Dispatch: {autoDispatch ? "ON" : "OFF"}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition-colors min-h-0"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card-hover border border-slate-200 z-50 animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-navy-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={onMarkAllRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold min-h-0 p-0">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <Bell size={24} className="mb-2 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${!n.read ? "bg-emerald-50/40" : ""}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? "bg-emerald-500" : "bg-slate-200"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Job */}
          <button
            onClick={onNewJob}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-950 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors min-h-0 shadow-sm"
          >
            <Plus size={15} /> <span className="hidden sm:inline">New Job</span>
          </button>

          {/* Emergency alert */}
          <button className="hidden md:flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors min-h-0">
            <AlertTriangle size={14} />
            <span className="hidden lg:inline">Emergency</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Animated Dispatch Map ──────────────────────────────────────────────────
function DispatchMap({ engineers }) {
  const [positions, setPositions] = useState(
    () => Object.fromEntries(engineers.map((e) => [e.id, { ...e.pos }]))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev };
        engineers.forEach((eng) => {
          if (eng.status === "en_route" || eng.status === "available") {
            next[eng.id] = {
              x: Math.min(88, Math.max(8, (prev[eng.id]?.x ?? eng.pos.x) + (Math.random() * 1.4 - 0.5))),
              y: Math.min(88, Math.max(8, (prev[eng.id]?.y ?? eng.pos.y) + (Math.random() * 1.4 - 0.5))),
            };
          }
        });
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, [engineers]);

  const sm = (status) => STATUS_META[status] ?? STATUS_META.offline;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-card" style={{ height: "260px", background: "linear-gradient(135deg,#e8f0fe,#d1e8ff 50%,#e0f7fa)" }}>
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" aria-hidden="true">
        <defs><pattern id="admingrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
        </pattern></defs>
        <rect width="100%" height="100%" fill="url(#admingrid)" />
      </svg>
      {/* Roads */}
      <svg className="absolute inset-0 w-full h-full opacity-35" aria-hidden="true">
        <line x1="0" y1="42%" x2="100%" y2="42%" stroke="#94a3b8" strokeWidth="6" />
        <line x1="0" y1="68%" x2="100%" y2="68%" stroke="#94a3b8" strokeWidth="3" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#94a3b8" strokeWidth="6" />
        <line x1="62%" y1="0" x2="62%" y2="100%" stroke="#94a3b8" strokeWidth="3" />
        <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#94a3b8" strokeWidth="2" />
        <line x1="0" y1="22%" x2="100%" y2="22%" stroke="#94a3b8" strokeWidth="2" />
      </svg>

      {/* Engineer pins */}
      {engineers.filter((e) => e.status !== "offline").map((eng) => {
        const pos = positions[eng.id] ?? eng.pos;
        const dotColor = sm(eng.status).dot;
        return (
          <div
            key={eng.id}
            className="absolute transition-all duration-1000 ease-linear"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
          >
            <div className="relative flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${dotColor}`}>
                <span className="text-white font-black text-[11px]">{eng.avatar}</span>
              </div>
              {(eng.status === "en_route" || eng.status === "available") && (
                <span className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-25`} />
              )}
              <span className={`mt-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full whitespace-nowrap ${dotColor}`}>
                {eng.name.split(" ")[0]}
              </span>
            </div>
          </div>
        );
      })}

      {/* LIVE badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow border border-slate-200 space-y-1.5">
        {[
          { dot: "bg-emerald-500", label: "Available" },
          { dot: "bg-amber-500",   label: "On-Site"   },
          { dot: "bg-purple-500",  label: "En Route"  },
          { dot: "bg-red-500",     label: "Busy"      },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <span className={`w-2 h-2 rounded-full ${dot}`} />{label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fleet Panel ────────────────────────────────────────────────────────────
function FleetPanel({ engineers }) {
  const [query, setQuery]   = useState("");
  const [menu,  setMenu]    = useState(null);
  const visible = engineers.filter((e) =>
    !query || e.name.toLowerCase().includes(query.toLowerCase()) || e.trade.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fleet Status</p>
        <div className="flex items-center gap-3 flex-wrap">
          {["available","on_site","en_route"].map((s) => (
            <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[s].dot}`} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search engineers…"
          className="w-full h-9 pl-8 pr-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          aria-label="Search engineers"
        />
      </div>

      <div className="space-y-1">
        {visible.map((eng) => {
          const sm = STATUS_META[eng.status] ?? STATUS_META.offline;
          return (
            <div key={eng.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group relative">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg,#1e3a5f,#0F172A)" }}>
                {eng.avatar}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-navy-900 text-sm truncate">{eng.name}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sm.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-xs text-slate-500 capitalize">{eng.trade}</p>
                  <span className="text-[10px] text-slate-400">{eng.jobs}/{eng.cap} jobs</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                    <Star size={9} className="fill-current" /> {eng.rating}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={`tel:${eng.phone}`} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors min-h-0" aria-label={`Call ${eng.name}`}>
                  <Phone size={13} />
                </a>
                <a href={`/track?engineer=${eng.id}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-0" aria-label={`Track ${eng.name}`}>
                  <Navigation size={13} />
                </a>
              </div>
              {/* Last sync */}
              <span className="text-[10px] text-slate-400 flex-shrink-0 hidden sm:block">{eng.lastSync}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Dashboard Overview ────────────────────────────────────────────────
function TabDashboard({ metrics, engineers, recentJobs }) {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Bookings Today"
          value={metrics.bookingsToday}
          sub={`${metrics.bookingsPending} pending dispatch`}
          trend={metrics.bookingsTrend}
          icon={ClipboardList}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Today's Revenue"
          value={`£${metrics.revenueToday.toLocaleString("en-GB")}`}
          sub="Captured payments"
          trend={metrics.revenueTrend}
          icon={PoundSterling}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Active Engineers"
          value={`${metrics.activeEngineers} / ${metrics.totalEngineers}`}
          sub="Online right now"
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          label="Avg Response Time"
          value={`${metrics.avgResponse} min`}
          sub="Last 24 hours"
          trend={metrics.responseTrend}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Map + fleet */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Live Dispatch Map</p>
          <DispatchMap engineers={engineers} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <FleetPanel engineers={engineers} />
        </div>
      </div>

      {/* Activity feed — real recent jobs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-navy-900">Recent Activity</p>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
          </span>
        </div>
        <div className="space-y-3">
          {recentJobs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No recent activity yet.</p>
          ) : (
            recentJobs.map((job) => {
              const statusIcons = {
                pending:   { icon: AlertTriangle, color: "bg-red-100 text-red-600"     },
                en_route:  { icon: Navigation,    color: "bg-purple-100 text-purple-600"},
                on_site:   { icon: Bolt,          color: "bg-amber-100 text-amber-600" },
                completed: { icon: CheckCircle2,  color: "bg-emerald-100 text-emerald-600"},
                cancelled: { icon: X,             color: "bg-slate-100 text-slate-500" },
              };
              const { icon: Icon, color } = statusIcons[job.status] ?? statusIcons.pending;
              const customer = job.customers?.profiles?.full_name ?? "Customer";
              const time = job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) : "";
              return (
                <div key={job.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-900 leading-snug">
                      <span className="font-semibold capitalize">{job.status?.replace("_", " ")}</span>
                      {" — "}{job.title} · {job.postcode}
                      {job.quoted_price ? ` · £${job.quoted_price}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{customer}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap">{time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Invoices ──────────────────────────────────────────────────────────
function TabInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("jobs")
          .select("id, title, trade, quoted_price, final_price, payment_status, created_at, customers(profiles(full_name))")
          .not("payment_status", "eq", "unpaid")
          .order("created_at", { ascending: false })
          .limit(50);
        if (data) setInvoices(data);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const statusMap = {
    captured:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    authorised: "bg-blue-100 text-blue-700 border-blue-200",
    unpaid:     "bg-slate-100 text-slate-500 border-slate-200",
    failed:     "bg-red-100 text-red-700 border-red-200",
    refunded:   "bg-purple-100 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">Invoices & Payments</h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">Stripe Integration</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <PoundSterling size={28} className="mx-auto mb-2 opacity-30" />
            <p className="font-semibold">No payments yet.</p>
            <p className="text-sm mt-1">Completed jobs with Stripe payments will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Job ID", "Customer", "Service", "Amount", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">#{String(inv.id).slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{inv.customers?.profiles?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{inv.trade}</td>
                  <td className="px-4 py-3 font-black text-navy-900">£{inv.final_price ?? inv.quoted_price ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${statusMap[inv.payment_status] ?? statusMap.unpaid}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {inv.created_at ? formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-emerald-600 hover:underline font-semibold min-h-0">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab: Pricing Rules ─────────────────────────────────────────────────────
function TabPricing() {
  const [rules, setRules] = useState([
    { id: 1, trade: "plumbing",   label: "Plumbing",   callout: 89, hourly: 75,  emergency: 50 },
    { id: 2, trade: "electrical", label: "Electrical", callout: 99, hourly: 85,  emergency: 50 },
    { id: 3, trade: "heating",    label: "Heating",    callout: 120,hourly: 95,  emergency: 60 },
    { id: 4, trade: "drainage",   label: "Drainage",   callout: 95, hourly: 70,  emergency: 50 },
    { id: 5, trade: "locksmith",  label: "Locksmith",  callout: 75, hourly: 60,  emergency: 40 },
    { id: 6, trade: "general",    label: "General",    callout: 70, hourly: 55,  emergency: 35 },
  ]);

  const update = (id, field, val) =>
    setRules((r) => r.map((rule) => rule.id === id ? { ...rule, [field]: Number(val) } : rule));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900">Pricing & Callout Rules</h2>
        <button className="btn-primary text-sm px-5 py-2 shadow-cta" onClick={() => toast.success("Pricing saved!")}>
          Save Changes
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Trade", "Callout Fee (£)", "Hourly Rate (£)", "Emergency Surcharge (£)", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule) => {
              const tm = TRADE_META[rule.trade] ?? TRADE_META.general;
              const TIcon = tm.icon;
              return (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${tm.bg} border ${tm.border}`}>
                      <TIcon size={13} className={tm.color} />
                      <span className="text-xs font-semibold text-navy-900">{rule.label}</span>
                    </div>
                  </td>
                  {["callout","hourly","emergency"].map((field) => (
                    <td key={field} className="px-4 py-3">
                      <div className="relative max-w-[100px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">£</span>
                        <input
                          type="number"
                          value={rule[field]}
                          onChange={(e) => update(rule.id, field, e.target.value)}
                          className="w-full h-9 pl-6 pr-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          min="0"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">Total (1h): £{rule.callout + rule.hourly + rule.emergency}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Engineer Accounts (Admin creates / manages engineer users) ────────
function TabEngineers() {
  const TRADE_OPTIONS = ["plumbing","electrical","heating","drainage","locksmith","general"];

  const [engineers, setEngineers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [showPwd,   setShowPwd]   = useState(false);
  const [form,      setForm]      = useState({
    full_name: "", email: "", password: "", trade: "plumbing",
    phone: "", hourly_rate: "60", callout_fee: "50",
  });
  const [errors, setErrors] = useState({});

  const serviceKey  = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const loadEngineers = useCallback(async () => {
    setLoading(true);
    try {
      const client = supabaseAdmin ?? supabase;
      const { data } = await client
        .from("engineers")
        .select("id, trade, status, rating, hourly_rate, callout_fee, profile_id, profiles(full_name, phone)")
        .order("created_at", { ascending: false });
      setEngineers(data ?? []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { loadEngineers(); }, [loadEngineers]);

  const update = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())                              e.full_name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.password || form.password.length < 8)          e.password = "Min 8 characters";
    if (!form.hourly_rate || isNaN(Number(form.hourly_rate))) e.hourly_rate = "Valid number required";
    if (!form.callout_fee  || isNaN(Number(form.callout_fee))) e.callout_fee = "Valid number required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!serviceKey) {
      toast.error("Service role key not configured. Check VITE_SUPABASE_SERVICE_ROLE_KEY in frontend/.env");
      return;
    }
    setSaving(true);
    let newUserId = null;
    try {
      // Step 1: Create auth user via admin REST API (auto-confirmed)
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey:         serviceKey,
          Authorization:  `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email:         form.email.trim().toLowerCase(),
          password:      form.password,
          email_confirm: true,
          user_metadata: { full_name: form.full_name.trim(), role: "engineer" },
          app_metadata:  { role: "engineer" },
        }),
      });
      const userData = await res.json();
      if (!res.ok) {
        const errCode = userData.error_code ?? "";
        const errMsg  = userData.msg ?? userData.message ?? JSON.stringify(userData);
        if (errCode === "email_exists" || errMsg.includes("already been registered")) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered. Use a different address." }));
        } else {
          toast.error(`Auth error: ${errMsg}`);
        }
        setSaving(false);
        return;
      }
      newUserId = userData.id;

      // Step 2: Update profiles row via admin client (bypasses RLS)
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update({ role: "engineer", full_name: form.full_name.trim(), phone: form.phone.trim() || null })
        .eq("id", newUserId);
      if (profileErr) throw new Error(`Profile update failed: ${profileErr.message}`);

      // Step 3: Insert engineer row via admin client (bypasses RLS)
      const { error: engErr } = await supabaseAdmin
        .from("engineers")
        .insert({
          profile_id:  newUserId,
          trade:       form.trade,
          hourly_rate: Number(form.hourly_rate),
          callout_fee: Number(form.callout_fee),
          status:      "offline",
        });
      if (engErr) throw new Error(`Engineer row failed: ${engErr.message}`);

      toast.success(`Engineer account created for ${form.full_name.trim()}`);
      setForm({ full_name: "", email: "", password: "", trade: "plumbing", phone: "", hourly_rate: "60", callout_fee: "50" });
      setShowForm(false);
      loadEngineers();
    } catch (err) {
      // Rollback — delete orphaned auth user if DB steps failed
      if (newUserId) {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${newUserId}`, {
          method: "DELETE",
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        }).catch(() => {});
      }
      toast.error(err.message ?? "Something went wrong");
    }
    setSaving(false);
  };

  const handleDeactivate = async (engineerId) => {
    if (!window.confirm("Set this engineer to offline/inactive?")) return;
    const client = supabaseAdmin ?? supabase;
    await client.from("engineers").update({ status: "offline" }).eq("id", engineerId);
    toast.success("Engineer set to offline");
    loadEngineers();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-navy-900">Engineer Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Only admins can create engineer accounts. Engineers cannot self-register.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors min-h-0 shadow-cta"
        >
          <Plus size={15} />
          {showForm ? "Cancel" : "Add Engineer"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-card p-6 animate-fade-in">
          <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
            <HardHat size={16} className="text-emerald-600" />
            New Engineer Account
          </h3>
          <form onSubmit={handleCreate} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
                  placeholder="Dave Miller"
                  className={`w-full h-11 px-4 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.full_name ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-emerald-400"}`} />
                {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
              </div>
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Work Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                  placeholder="dave@tradepro360.com"
                  className={`w-full h-11 px-4 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.email ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-emerald-400"}`} />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              {/* Temporary Password — with show/hide toggle */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Temporary Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Min 8 characters"
                    className={`w-full h-11 pl-4 pr-11 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.password ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-emerald-400"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors min-h-0 p-0"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Phone</label>
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  placeholder="+44 7700 900000"
                  className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
              </div>
              {/* Trade */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Trade <span className="text-red-500">*</span></label>
                <select value={form.trade} onChange={(e) => update("trade", e.target.value)}
                  className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all">
                  {TRADE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              {/* Hourly rate */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Hourly Rate (£) <span className="text-red-500">*</span></label>
                <input type="number" value={form.hourly_rate} onChange={(e) => update("hourly_rate", e.target.value)}
                  placeholder="60" min="0"
                  className={`w-full h-11 px-4 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.hourly_rate ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-emerald-400"}`} />
                {errors.hourly_rate && <p className="mt-1 text-xs text-red-600">{errors.hourly_rate}</p>}
              </div>
              {/* Callout fee */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Callout Fee (£) <span className="text-red-500">*</span></label>
                <input type="number" value={form.callout_fee} onChange={(e) => update("callout_fee", e.target.value)}
                  placeholder="50" min="0"
                  className={`w-full h-11 px-4 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${errors.callout_fee ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-emerald-400"}`} />
                {errors.callout_fee && <p className="mt-1 text-xs text-red-600">{errors.callout_fee}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors min-h-0 shadow-cta">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {saving ? "Creating…" : "Create Engineer Account"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setErrors({}); }}
                className="text-sm text-slate-500 hover:text-navy-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors min-h-0">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Engineer list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Loading engineers…
          </div>
        ) : engineers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <HardHat size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No engineer accounts yet.</p>
            <p className="text-sm mt-1">Click "Add Engineer" above to create one.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Engineer", "Trade", "Rate / Callout", "Status", "Rating", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {engineers.map((eng) => {
                const tm = TRADE_META[eng.trade] ?? TRADE_META.general;
                const TIcon = tm.icon;
                const sm = STATUS_META[eng.status] ?? STATUS_META.offline;
                return (
                  <tr key={eng.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(eng.profiles?.full_name ?? "E")[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-900">{eng.profiles?.full_name ?? "—"}</p>
                          <p className="text-xs text-slate-400">{eng.profiles?.phone ?? "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${tm.bg} border ${tm.border}`}>
                        <TIcon size={12} className={tm.color} />
                        <span className="text-xs font-semibold text-navy-900 capitalize">{eng.trade}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      £{eng.hourly_rate}/hr · £{eng.callout_fee} callout
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${sm.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />{sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                        <Star size={11} className="fill-current" />{eng.rating ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeactivate(eng.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold min-h-0 p-0"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main AdminDashboard ────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const [activeTab,    setActiveTab]    = useState("dispatch");
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [engineers,    setEngineers]    = useState([]);
  const [profile,      setProfile]      = useState(null);
  const [metrics,      setMetrics]      = useState({
    bookingsToday:    0,
    bookingsPending:  0,
    bookingsTrend:    0,
    revenueToday:     0,
    revenueTrend:     0,
    activeEngineers:  0,
    totalEngineers:   0,
    avgResponse:      0,
    responseTrend:    0,
  });
  const [jobCount, setJobCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState([]);

  // ── Load real profile + engineers + notifications from DB ─────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        // Profile
        const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (p) setProfile(p);

        // Notifications (unread count + latest 10)
        const { data: notifs } = await supabaseAdmin
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
        if (notifs) {
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      } catch (_) {}
    });
  }, []);

  // ── Load real engineers from DB ────────────────────────────────────────
  useEffect(() => {
    const loadEngineers = async () => {
      try {
        const client = supabaseAdmin ?? supabase;
        const { data } = await client
          .from("engineers")
          .select("id, trade, status, rating, hourly_rate, profile_id, profiles(full_name, phone)")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) {
          // Map to the shape the rest of the dashboard expects
          setEngineers(data.map((e, i) => ({
            id:       e.id,
            name:     e.profiles?.full_name ?? "Engineer",
            trade:    e.trade,
            status:   e.status,
            jobs:     0,
            cap:      5,
            lastSync: "just now",
            rating:   Number(e.rating) || 5.0,
            phone:    e.profiles?.phone ?? "",
            avatar:   (e.profiles?.full_name ?? "E")[0].toUpperCase(),
            pos:      { x: 20 + (i * 15) % 70, y: 20 + (i * 20) % 60 },
          })));
        }
      } catch (_) {}
    };
    loadEngineers();
  }, []);

  // ── Realtime: new notifications ────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
        setUnreadCount((n) => n + 1);
        toast(`🔔 ${payload.new.title}`, { duration: 4000 });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Metrics refresh ────────────────────────────────────────────────────
  const refreshMetrics = useCallback(async () => {
    try {
      const [
        { count: bookingsToday },
        { count: pendingJobs },
        { count: activeEngineers },
        { count: totalEngineers },
        { data: revenue },
        { data: recent },
      ] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("engineers").select("id", { count: "exact", head: true }).in("status", ["available","on_site","en_route"]),
        supabase.from("engineers").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("final_price").eq("payment_status", "captured").gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("jobs").select("id, title, status, postcode, quoted_price, created_at, customers(profiles(full_name))").order("created_at", { ascending: false }).limit(8),
      ]);
      const revenueToday = (revenue ?? []).reduce((s, j) => s + (Number(j.final_price) || 0), 0);
      if (pendingJobs !== null) setJobCount(pendingJobs);
      if (recent) setRecentJobs(recent);
      setMetrics((m) => ({
        ...m,
        bookingsToday:   bookingsToday   ?? m.bookingsToday,
        bookingsPending: pendingJobs     ?? m.bookingsPending,
        activeEngineers: activeEngineers ?? m.activeEngineers,
        totalEngineers:  totalEngineers  ?? m.totalEngineers,
        revenueToday:    revenueToday    || m.revenueToday,
      }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshMetrics();
    const t = setInterval(refreshMetrics, 30_000);
    return () => clearInterval(t);
  }, [refreshMetrics]);

  // ── Realtime: pending job count for badge ──────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        refreshMetrics();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refreshMetrics]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const client = supabaseAdmin ?? supabase;
      await client.from("notifications").update({ read: true }).eq("read", false);
    } catch (_) {}
  };

  const kanbanEngineers = engineers.map((e) => ({
    id: e.id, name: e.name, trade: e.trade, status: e.status,
  }));

  // ── Render active tab content ──────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <TabDashboard metrics={metrics} engineers={engineers} recentJobs={recentJobs} />;

      case "dispatch":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-navy-900">Live Dispatch Board</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Drag cards between columns · Realtime sync · Auto-refreshes every 30s
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
                  autoDispatch ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${autoDispatch ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                  AI Dispatch {autoDispatch ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
            </div>
            <AdminKanban engineers={kanbanEngineers} />
          </div>
        );

      case "fleet":
        return (
          <div className="space-y-6">
            <h1 className="text-xl font-bold text-navy-900">Live Engineer Fleet</h1>
            <DispatchMap engineers={engineers} />
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
              <FleetPanel engineers={engineers} />
            </div>
          </div>
        );

      case "invoices":
        return <TabInvoices />;

      case "pricing":
        return <TabPricing />;

      case "engineers":
        return <TabEngineers />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9ff" }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        jobCount={jobCount}
        profile={profile}
        onSignOut={handleSignOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          activeTab={activeTab}
          autoDispatch={autoDispatch}
          setAutoDispatch={setAutoDispatch}
          onSearch={setSearchQuery}
          onNewJob={() => navigate("/book")}
          onSignOut={handleSignOut}
          unreadCount={unreadCount}
          onMenuOpen={() => setSidebarOpen(true)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
