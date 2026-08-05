import { useState, useCallback, useEffect, useRef } from "react";
import {
  Wrench, Zap, Flame, Lock, Droplets, HardHat,
  MapPin, Clock, AlertTriangle, CheckCircle2,
  MoreVertical, Loader2, Phone, Image as ImageIcon,
  User, ChevronDown, RefreshCw, Search, Bolt,
  Navigation, X, ExternalLink, PoundSterling,
  ArrowRight, Camera,
} from "lucide-react";
import { supabase, triggerDispatch } from "../services/supabaseClient";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

// ── Column config ──────────────────────────────────────────────────────────
export const COLUMNS = [
  {
    id: "pending",
    emoji: "🆕",
    label: "Unassigned / New",
    dot: "bg-red-500",
    dotPulse: true,
    headerBg: "bg-red-50 border-red-200",
    headerText: "text-red-800",
    countBg: "bg-red-500 text-white",
    dropBg: "bg-red-50/60",
  },
  {
    id: "en_route",
    emoji: "🚚",
    label: "Dispatched / En Route",
    dot: "bg-purple-500",
    dotPulse: true,
    headerBg: "bg-purple-50 border-purple-200",
    headerText: "text-purple-800",
    countBg: "bg-purple-500 text-white",
    dropBg: "bg-purple-50/60",
  },
  {
    id: "on_site",
    emoji: "🛠️",
    label: "On-Site / In Progress",
    dot: "bg-amber-500",
    dotPulse: true,
    headerBg: "bg-amber-50 border-amber-200",
    headerText: "text-amber-800",
    countBg: "bg-amber-500 text-white",
    dropBg: "bg-amber-50/60",
  },
  {
    id: "completed",
    emoji: "✅",
    label: "Completed & Invoiced",
    dot: "bg-emerald-500",
    dotPulse: false,
    headerBg: "bg-emerald-50 border-emerald-200",
    headerText: "text-emerald-800",
    countBg: "bg-emerald-500 text-white",
    dropBg: "bg-emerald-50/60",
  },
];

export const TRADE_META = {
  plumbing:   { icon: Wrench,   label: "Plumbing",   color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200"   },
  electrical: { icon: Zap,      label: "Electrical", color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200" },
  heating:    { icon: Flame,    label: "Heating",    color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200"    },
  locksmith:  { icon: Lock,     label: "Locksmith",  color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-300"  },
  drainage:   { icon: Droplets, label: "Drainage",   color: "text-cyan-600",   bg: "bg-cyan-50",    border: "border-cyan-200"   },
  general:    { icon: HardHat,  label: "General",    color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200" },
};

// ── Mock seed ──────────────────────────────────────────────────────────────
const MOCK_JOBS = [
  { id: "mock-1", title: "Water Leak - Kitchen Floor",  trade: "plumbing",   urgency: "emergency", status: "pending",   postcode: "NW1 6XE",  address: "22 Camden High St, London",    created_at: new Date(Date.now() -  8*60000).toISOString(), quoted_price: 145, customer_name: "M. Thompson", has_photo: true,  photos_before: [] },
  { id: "mock-2", title: "Boiler Service — Annual",     trade: "heating",    urgency: "standard",  status: "pending",   postcode: "E1 7AA",   address: "14 Brick Lane, London",        created_at: new Date(Date.now() - 22*60000).toISOString(), quoted_price: 95,  customer_name: "J. Richards", has_photo: false, photos_before: [] },
  { id: "mock-3", title: "Electrical Outlet Sparking",  trade: "electrical", urgency: "emergency", status: "on_site",   postcode: "SE1 7PB",  address: "9 Borough Market Rd, London",  created_at: new Date(Date.now() - 55*60000).toISOString(), quoted_price: 210, customer_name: "K. Patel",    has_photo: false, engineer_name: "David M.",  started_at: new Date(Date.now() - 45*60000).toISOString() },
  { id: "mock-4", title: "Fuse Board Upgrade",          trade: "electrical", urgency: "standard",  status: "en_route",  postcode: "W1T 3JA",  address: "55 Fitzrovia St, London",      created_at: new Date(Date.now() - 35*60000).toISOString(), quoted_price: 380, customer_name: "R. Okafor",   has_photo: true,  engineer_name: "Sarah W.",  eta_mins: 12 },
  { id: "mock-5", title: "Blocked Drain — Bathroom",    trade: "drainage",   urgency: "emergency", status: "en_route",  postcode: "EC1A 1AA", address: "3 Barbican Estate, London",    created_at: new Date(Date.now() - 18*60000).toISOString(), quoted_price: 120, customer_name: "T. Brown",    has_photo: false, engineer_name: "Marcus R.", eta_mins: 6  },
  { id: "mock-6", title: "Emergency Lockout",           trade: "locksmith",  urgency: "emergency", status: "completed", postcode: "SW1A 2AA", address: "1 Downing St, London",         created_at: new Date(Date.now() - 90*60000).toISOString(), quoted_price: 150, customer_name: "L. Evans",    has_photo: false, final_price: 150, payment_status: "captured" },
  { id: "mock-7", title: "Central Heating Service",     trade: "heating",    urgency: "standard",  status: "completed", postcode: "N1 9GU",   address: "7 Upper St, Islington",        created_at: new Date(Date.now() -180*60000).toISOString(), quoted_price: 220, customer_name: "A. Singh",    has_photo: true,  final_price: 220, payment_status: "captured" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function useElapsedTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const base = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    setElapsed(base);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function UrgencyBadge({ urgency }) {
  if (urgency === "emergency")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide border border-red-200">
        <AlertTriangle size={9} /> Emergency
      </span>
    );
  if (urgency === "urgent")
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide border border-amber-200">Urgent</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 capitalize">{urgency ?? "Standard"}</span>;
}

function PaymentBadge({ status }) {
  const map = {
    captured:  { label: "Paid",       cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    authorised:{ label: "Authorised", cls: "bg-blue-100 text-blue-700 border-blue-200"          },
    unpaid:    { label: "Unpaid",     cls: "bg-slate-100 text-slate-500 border-slate-200"       },
    failed:    { label: "Failed",     cls: "bg-red-100 text-red-700 border-red-200"             },
  };
  const m = map[status] ?? map.unpaid;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>
      <PoundSterling size={9} /> {m.label}
    </span>
  );
}

// ── Photo Thumbnail Strip ──────────────────────────────────────────────────
function PhotoStrip({ urls = [] }) {
  const [preview, setPreview] = useState(null);
  if (!urls.length) return null;
  return (
    <>
      <div className="flex gap-1.5 mb-3">
        {urls.slice(0, 3).map((url, i) => (
          <button
            key={i}
            onClick={() => setPreview(url)}
            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 hover:ring-2 hover:ring-emerald-400 transition-all min-h-0 p-0"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
        {urls.length > 3 && (
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
            +{urls.length - 3}
          </div>
        )}
      </div>
      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors min-h-0 p-1"
            >
              <X size={22} />
            </button>
            <img src={preview} alt="" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────
function JobCard({ job, onStatusChange, onDispatch, onAssign, engineers, isDragging }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reassign, setReassign] = useState(false);
  const [moving,   setMoving]   = useState(false);
  const menuRef = useRef(null);
  const elapsed = useElapsedTimer(job.status === "on_site" ? (job.started_at ?? job.created_at) : null);

  const trade     = TRADE_META[job.trade] ?? TRADE_META.general;
  const TradeIcon = trade.icon;
  const age       = job.created_at ? formatDistanceToNow(new Date(job.created_at), { addSuffix: false }) : null;
  const photoUrls = job.photos_before ?? [];

  const NEXT_STATUSES = {
    pending:   ["en_route", "on_site"],
    en_route:  ["on_site", "completed"],
    on_site:   ["completed"],
    completed: [],
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setReassign(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMove = async (newStatus) => {
    setMoving(true);
    setMenuOpen(false);
    await onStatusChange(job.id, newStatus);
    setMoving(false);
  };

  const handleDispatch = async () => {
    setMoving(true);
    setMenuOpen(false);
    await onDispatch(job.id);
    setMoving(false);
  };

  const handleAssign = async (engineer) => {
    setMoving(true);
    setReassign(false);
    setMenuOpen(false);
    await onAssign(job.id, engineer);
    setMoving(false);
  };

  const customerName = job.customer_name ?? job.customers?.profiles?.full_name ?? "Customer";
  const engineerName = job.engineer_name ?? job.engineers?.profiles?.full_name;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("jobId", job.id);
        e.dataTransfer.setData("fromStatus", job.status);
      }}
      className={`bg-white rounded-xl border shadow-card transition-all duration-200 cursor-grab active:cursor-grabbing select-none
        ${job.urgency === "emergency" ? "border-red-200 hover:border-red-300" : "border-slate-200 hover:border-slate-300"}
        ${isDragging ? "opacity-50 rotate-1 scale-95" : "hover:shadow-card-hover"}
      `}
    >
      {/* Emergency top stripe */}
      {job.urgency === "emergency" && (
        <div className="h-0.5 w-full bg-gradient-to-r from-red-500 to-red-400 rounded-t-xl" />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${trade.bg} border ${trade.border}`}>
              <TradeIcon size={14} className={trade.color} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-[10px] font-mono text-slate-400">#{String(job.id).slice(-5).toUpperCase()}</span>
                <UrgencyBadge urgency={job.urgency} />
              </div>
              <p className="font-semibold text-navy-900 text-sm leading-snug">{job.title}</p>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => { setMenuOpen((o) => !o); setReassign(false); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors min-h-0"
              aria-label="Job actions"
            >
              {moving ? <Loader2 size={14} className="animate-spin text-emerald-500" /> : <MoreVertical size={14} />}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-52 bg-white rounded-xl shadow-card-hover border border-slate-100 py-1.5 z-30 animate-fade-in">
                {/* Status transitions */}
                {NEXT_STATUSES[job.status]?.map((s) => (
                  <button key={s} onClick={() => handleMove(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-navy-900 hover:bg-slate-50 transition-colors min-h-0 flex items-center gap-2">
                    <ArrowRight size={12} className="text-slate-400" />
                    Move to <span className="capitalize font-semibold ml-1">{s.replace("_", " ")}</span>
                  </button>
                ))}

                {/* Auto-dispatch */}
                {job.status === "pending" && (
                  <button onClick={handleDispatch}
                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors min-h-0 flex items-center gap-2">
                    <Bolt size={13} className="text-emerald-500" /> Auto-Dispatch
                  </button>
                )}

                {/* Assign engineer sub-menu */}
                {engineers?.length > 0 && (
                  <button onClick={() => setReassign((r) => !r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors min-h-0 flex items-center gap-2">
                    <User size={13} className="text-blue-500" />
                    {engineerName ? "Reassign" : "Assign"} Engineer
                    <ChevronDown size={12} className={`ml-auto transition-transform duration-200 ${reassign ? "rotate-180" : ""}`} />
                  </button>
                )}

                {/* Live tracking link */}
                <a
                  href={`/track/${job.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors min-h-0"
                  onClick={() => setMenuOpen(false)}
                >
                  <Navigation size={13} className="text-purple-500" /> Live Tracking
                  <ExternalLink size={11} className="ml-auto text-slate-300" />
                </a>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-0">
                    Cancel Job
                  </button>
                </div>
              </div>
            )}

            {/* Engineer sub-panel */}
            {reassign && engineers?.length > 0 && (
              <div className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-card-hover border border-slate-100 py-2 z-40 animate-fade-in">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pb-2 pt-1">Assign to</p>
                {engineers.map((eng) => (
                  <button key={eng.id} onClick={() => handleAssign(eng)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors min-h-0 text-left">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                      {eng.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{eng.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{eng.trade} · {eng.status ?? "available"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Photo thumbnails */}
        <PhotoStrip urls={photoUrls} />

        {/* Location row */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin size={11} className="text-slate-400 flex-shrink-0" />
          <span className="font-mono font-semibold text-navy-900">{job.postcode}</span>
          {job.address && (
            <span className="text-slate-400 truncate">
              , {job.address.replace(job.postcode, "").trim().replace(/^,\s*/, "")}
            </span>
          )}
        </div>

        {/* Status-specific strip */}
        {job.status === "en_route" && (
          <div className="flex items-center gap-1.5 mb-3 bg-purple-50 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-100">
            <Navigation size={11} className="animate-pulse" />
            {engineerName ? `${engineerName} en route` : "Engineer en route"}
            {job.eta_mins != null && (
              <span className="ml-auto font-bold">ETA ~{job.eta_mins} min</span>
            )}
          </div>
        )}
        {job.status === "on_site" && (
          <div className="flex items-center gap-1.5 mb-3 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-100">
            <Clock size={11} className="text-amber-500" />
            On-site {elapsed}
            {engineerName && <span className="ml-auto font-normal text-amber-500">{engineerName}</span>}
          </div>
        )}
        {job.status === "completed" && (
          <div className="flex items-center justify-between mb-3 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={11} /> Completed · £{job.final_price ?? job.quoted_price}
            </span>
            <PaymentBadge status={job.payment_status ?? "unpaid"} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center font-bold text-[10px] text-navy-700 flex-shrink-0" style={{ background: "#dde7ff" }}>
              {customerName[0]}
            </div>
            <span className="text-xs text-slate-600 truncate font-medium">{customerName}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(job.has_photo || photoUrls.length > 0) && (
              <Camera size={12} className="text-slate-400" title="Has photos" />
            )}
            {age && <span className="text-[10px] text-slate-400 whitespace-nowrap">{age}</span>}
            <span className="text-sm font-black text-navy-900">£{job.quoted_price ?? "—"}</span>
          </div>
        </div>

        {/* Quick dispatch CTA — pending only */}
        {job.status === "pending" && !engineerName && (
          <button
            onClick={handleDispatch}
            disabled={moving}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold transition-colors min-h-0 shadow-cta disabled:opacity-50"
          >
            {moving ? <Loader2 size={12} className="animate-spin" /> : <Bolt size={12} />}
            Dispatch Now
          </button>
        )}
      </div>
    </div>
  );
}

// ── Kanban Column (drag-and-drop target) ───────────────────────────────────
function KanbanColumn({ column, jobs, onStatusChange, onDispatch, onAssign, engineers, draggingId }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const jobId     = e.dataTransfer.getData("jobId");
    const fromStatus = e.dataTransfer.getData("fromStatus");
    if (jobId && fromStatus !== column.id) {
      onStatusChange(jobId, column.id);
    }
  };

  return (
    <div
      className="flex flex-col min-w-[270px] max-w-[300px] flex-1"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 border transition-colors ${
        dragOver ? column.dropBg + " border-dashed border-2 " + column.dot.replace("bg-", "border-") : column.headerBg
      }`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot} ${column.dotPulse ? "animate-pulse" : ""}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${column.headerText}`}>
            {column.emoji} {column.label}
          </span>
        </div>
        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center ${column.countBg}`}>
          {jobs.length}
        </span>
      </div>

      {/* Drop hint */}
      {dragOver && (
        <div className={`mb-3 border-2 border-dashed rounded-xl py-3 text-center text-xs font-semibold text-slate-400 ${
          column.dropBg
        }`}>
          Drop here → {column.label}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 space-y-3 min-h-[80px]">
        {jobs.length === 0 && !dragOver ? (
          <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400">No jobs</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onStatusChange={onStatusChange}
              onDispatch={onDispatch}
              onAssign={onAssign}
              engineers={engineers}
              isDragging={draggingId === job.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main AdminKanban export ────────────────────────────────────────────────
export default function AdminKanban({ externalJobs, engineers = [], onDispatch }) {
  const [dbJobs,        setDbJobs]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [tradeFilter,   setTradeFilter]   = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [draggingId,    setDraggingId]    = useState(null);
  const useMock = useRef(false);

  const allJobs = [...(externalJobs ?? []), ...dbJobs];

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`*, customers(profiles(full_name,phone)), engineers(id,trade,rating,profiles(full_name,phone))`)
        .not("status", "eq", "cancelled")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) {
        // Only fall back to mock on actual network/auth error, NOT empty result
        useMock.current = true;
        setDbJobs(MOCK_JOBS);
      } else {
        useMock.current = false;
        // Real DB data — even if empty, show real (empty) state
        setDbJobs(data ?? []);
      }
    } catch {
      useMock.current = true;
      setDbJobs(MOCK_JOBS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (useMock.current) return;
    const channel = supabase
      .channel("kanban-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jobs" }, (payload) => {
        setDbJobs((prev) => [payload.new, ...prev]);
        toast.success(`New booking: ${payload.new.title ?? "New job"}`, { icon: "🆕" });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs" }, (payload) => {
        setDbJobs((prev) => prev.map((j) => j.id === payload.new.id ? { ...j, ...payload.new } : j));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "jobs" }, (payload) => {
        setDbJobs((prev) => prev.filter((j) => j.id !== payload.old.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (jobId, newStatus) => {
    const prev = allJobs.find((j) => j.id === jobId);
    if (!prev || prev.status === newStatus) return;

    // Optimistic update
    setDbJobs((jobs) => jobs.map((j) =>
      j.id === jobId ? { ...j, status: newStatus, started_at: newStatus === "on_site" ? new Date().toISOString() : j.started_at } : j
    ));

    if (useMock.current) {
      toast.success(`Moved to ${newStatus.replace("_", " ")}`);
      return;
    }
    const { error } = await supabase.from("jobs").update({
      status: newStatus,
      ...(newStatus === "on_site"   ? { started_at:   new Date().toISOString() } : {}),
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
    }).eq("id", jobId);
    if (error) {
      // Rollback
      setDbJobs((jobs) => jobs.map((j) => j.id === jobId ? prev : j));
      toast.error("Failed to update status");
    } else {
      toast.success(`→ ${newStatus.replace("_", " ")}`);
    }
  };

  const handleDispatch = async (jobId) => {
    if (onDispatch) { onDispatch(jobId); return; }
    if (useMock.current) {
      setDbJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: "en_route", engineer_name: "Sarah W.", eta_mins: 18 } : j
      ));
      toast.success("Engineer dispatched (demo)");
      return;
    }
    const toastId = toast.loading("Finding nearest engineer…");
    const { error, data } = await triggerDispatch(jobId);
    if (error) {
      toast.error("Dispatch failed", { id: toastId });
    } else {
      toast.success(`Assigned to ${data?.assigned_to?.full_name ?? "engineer"}`, { id: toastId });
      fetchJobs();
    }
  };

  const handleAssign = async (jobId, engineer) => {
    setDbJobs((prev) => prev.map((j) =>
      j.id === jobId ? { ...j, engineer_name: engineer.name, status: "en_route" } : j
    ));
    toast.success(`Assigned to ${engineer.name}`);
    if (!useMock.current) {
      await supabase.from("jobs")
        .update({ engineer_id: engineer.id, status: "en_route" })
        .eq("id", jobId)
        .then(({ error }) => { if (error) toast.error("Assignment failed"); });
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = allJobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      j.title?.toLowerCase().includes(q) ||
      j.postcode?.toLowerCase().includes(q) ||
      (j.customer_name ?? j.customers?.profiles?.full_name ?? "").toLowerCase().includes(q);
    const matchTrade   = tradeFilter   === "all" || j.trade   === tradeFilter;
    const matchUrgency = urgencyFilter === "all" || j.urgency === urgencyFilter;
    return matchSearch && matchTrade && matchUrgency;
  });

  return (
    <div
      className="space-y-4"
      onDragStart={(e) => setDraggingId(e.target.closest("[draggable]")?.dataset?.id ?? null)}
      onDragEnd={() => setDraggingId(null)}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search postcode, job, customer…"
            className="input-field pl-9 h-10 text-sm"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="select-field h-10 text-sm min-w-[130px]"
          aria-label="Filter by trade"
        >
          <option value="all">All trades</option>
          {Object.entries(TRADE_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="select-field h-10 text-sm min-w-[130px]"
          aria-label="Filter by urgency"
        >
          <option value="all">All urgency</option>
          <option value="emergency">Emergency</option>
          <option value="standard">Standard</option>
        </select>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="btn-secondary h-10 px-4 flex-shrink-0 text-sm"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        {/* Live indicator */}
        {!useMock.current && (
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Realtime
          </span>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 min-h-[400px]">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              jobs={filtered.filter((j) => j.status === col.id)}
              onStatusChange={handleStatusChange}
              onDispatch={handleDispatch}
              onAssign={handleAssign}
              engineers={engineers}
              draggingId={draggingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
