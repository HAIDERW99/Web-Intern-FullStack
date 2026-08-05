import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Star, BadgeCheck, CheckCircle2, PoundSterling,
  AlertTriangle, MapPin, Bell, LogOut, X, Loader2, Timer,
  CalendarDays, ClipboardList, Headphones, UserCircle2,
  Zap, Phone, MessageSquare, Shield, TrendingUp,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";
import toast from "react-hot-toast";
import EngineerActionsPanel from "../components/EngineerActions";

// ── Geo options ────────────────────────────────────────────────────────────
const GEO_OPTS = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 };

// ── Dispatch Countdown Banner ──────────────────────────────────────────────
function DispatchBanner({ job, onAccept, onDecline, accepting }) {
  const [seconds, setSeconds] = useState(165);
  useEffect(() => {
    if (seconds <= 0) { onDecline(); return; }
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const urgent = seconds <= 30;
  return (
    <div className={`mx-4 mt-4 rounded-2xl border-2 p-4 shadow-lg animate-fade-in ${urgent ? "border-red-400 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${urgent ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-white"}`}>
            <AlertTriangle size={11} />
            {job.urgency === "emergency" ? "EMERGENCY" : "NEW DISPATCH"}
          </span>
          {job.postcode && <span className="text-xs text-slate-500">{job.postcode}</span>}
        </div>
        <div className={`font-mono text-lg font-black tabular-nums px-3 py-1 rounded-xl ${urgent ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
          {mm}:{ss}
        </div>
      </div>
      <p className="text-base font-bold text-navy-900 mb-0.5">{job.title}</p>
      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
        <MapPin size={13} className="text-slate-400 flex-shrink-0" />
        {job.address}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onAccept} disabled={accepting}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl min-h-[56px] transition-all shadow-cta disabled:opacity-60">
          {accepting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {accepting ? "Accepting…" : "ACCEPT DISPATCH"}
        </button>
        <button onClick={onDecline}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 font-bold text-sm rounded-xl min-h-[56px] transition-all">
          <X size={16} /> DECLINE
        </button>
      </div>
    </div>
  );
}

// ── Metric Strip ───────────────────────────────────────────────────────────
function MetricStrip({ jobsDone, earnings, avgResponse, loading }) {
  const items = [
    { label: "Jobs Today",   value: loading ? "…" : jobsDone,          icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Today's Earn", value: loading ? "…" : `£${earnings}`,    icon: PoundSterling, color: "text-blue-600",    bg: "bg-blue-50"    },
    { label: "Avg Response", value: loading ? "…" : `${avgResponse}m`, icon: Timer,         color: "text-amber-600",   bg: "bg-amber-50"   },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 px-4 mt-4">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-card p-3 flex flex-col items-center gap-1.5 text-center">
          <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon size={15} className={color} />
          </div>
          <p className="text-lg font-black text-navy-900 leading-none">{value}</p>
          <p className="text-[10px] font-semibold text-slate-500 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Completed Jobs Feed ────────────────────────────────────────────────────
function CompletedFeed({ jobs, loading }) {
  if (loading) {
    return (
      <div className="px-4 pb-4">
        <h2 className="text-base font-bold text-navy-900 mb-3">Today's Completed Jobs</h2>
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 pb-4 space-y-3">
      <h2 className="text-base font-bold text-navy-900">Today's Completed Jobs</h2>
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No completed jobs yet today.</div>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{job.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {job.customers?.profiles?.full_name ?? "Customer"} ·{" "}
                {job.completed_at ? new Date(job.completed_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black text-emerald-600">£{job.final_price ?? job.quoted_price ?? "—"}</p>
              <div className="flex gap-0.5 justify-end mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={9} className="text-amber-400 fill-current" />
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Job Board Tab ──────────────────────────────────────────────────────────
function JobBoardTab({ engineerTrade, engineerId }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("jobs")
        .select("id, title, trade, urgency, postcode, address, quoted_price, created_at, customers(profiles(full_name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);
      setJobs(data ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("job-board-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, load)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-emerald-500" /></div>;
  if (jobs.length === 0) return (
    <div className="text-center py-12 px-4 text-slate-400">
      <Zap size={32} className="mx-auto mb-3 opacity-30" />
      <p className="font-semibold">No pending jobs right now.</p>
      <p className="text-sm mt-1">New jobs will appear here as bookings come in.</p>
    </div>
  );
  return (
    <div className="px-4 pb-4 space-y-3 mt-4">
      <h2 className="text-base font-bold text-navy-900">Available Jobs</h2>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-2xl border border-slate-200 shadow-card p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {job.urgency === "emergency" && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">EMERGENCY</span>
                )}
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{job.trade}</span>
              </div>
              <p className="font-semibold text-navy-900 text-sm">{job.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin size={10} />{job.postcode}
              </p>
            </div>
            <p className="text-base font-black text-emerald-600 flex-shrink-0">£{job.quoted_price ?? "—"}</p>
          </div>
          <p className="text-xs text-slate-400">{job.customers?.profiles?.full_name ?? "Customer"}</p>
        </div>
      ))}
    </div>
  );
}

// ── Support Tab ────────────────────────────────────────────────────────────
function SupportTab() {
  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-base font-bold text-navy-900">Support</h2>
      {[
        { icon: Phone,       label: "Call Operations", sub: "0800 123 4567",    href: "tel:08001234567",        bg: "bg-emerald-50",  color: "text-emerald-700", border: "border-emerald-200" },
        { icon: MessageSquare,label: "WhatsApp Support",sub: "Quick response",  href: "https://wa.me/441234567890", bg: "bg-green-50",   color: "text-green-700",   border: "border-green-200"  },
        { icon: Shield,      label: "Report an Issue",  sub: "ops@tradepro360.com", href: "mailto:ops@tradepro360.com", bg: "bg-blue-50", color: "text-blue-700",  border: "border-blue-200"   },
      ].map(({ icon: Icon, label, sub, href, bg, color, border }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg} transition-opacity hover:opacity-80`}>
          <div className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={color} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${color}`}>{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Account Tab ────────────────────────────────────────────────────────────
function AccountTab({ engineer, onSignOut }) {
  return (
    <div className="px-4 py-6 space-y-4">
      <h2 className="text-base font-bold text-navy-900">My Account</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
          {(engineer.name?.[0] ?? "E").toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-navy-900 text-base">{engineer.name}</p>
          <p className="text-sm text-slate-500 capitalize">{engineer.trade?.replace(/_/g, " ")}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-amber-400 fill-current" />
            <span className="text-xs font-semibold text-slate-700">{Number(engineer.rating).toFixed(1)}</span>
            <span className="text-xs text-slate-400">· {engineer.totalJobs ?? 0} jobs</span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card divide-y divide-slate-100">
        {[
          { label: "Trade", value: engineer.trade?.replace(/_/g," ") ?? "—" },
          { label: "Hourly Rate", value: `£${engineer.hourlyRate ?? "—"}/hr` },
          { label: "Callout Fee", value: `£${engineer.calloutFee ?? "—"}` },
          { label: "Service Radius", value: `${engineer.radiusMiles ?? 15} miles` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-semibold text-navy-900 capitalize">{value}</span>
          </div>
        ))}
      </div>
      <button onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-2xl min-h-[48px] border border-red-200 transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────
function BottomNav({ activeTab, onTabChange, pendingCount }) {
  const tabs = [
    { id: "jobs",    label: "My Jobs",  icon: CalendarDays  },
    { id: "board",   label: "Job Board",icon: ClipboardList, badge: pendingCount },
    { id: "support", label: "Support",  icon: Headphones    },
    { id: "account", label: "Account",  icon: TrendingUp    },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex max-w-md mx-auto">
      {tabs.map(({ id, label, icon: Icon, badge }) => (
        <button key={id} onClick={() => onTabChange(id)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-semibold transition-colors relative ${activeTab === id ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
          aria-label={label} aria-current={activeTab === id ? "page" : undefined}>
          <div className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${activeTab === id ? "bg-emerald-100" : ""}`}>
            <Icon size={18} />
            {badge > 0 && (
              <span className="absolute top-1.5 right-[calc(50%-18px)] w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </div>
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function EngineerDashboard() {
  const navigate = useNavigate();

  // ── Core state ────────────────────────────────────────────
  const [engineer,      setEngineer]      = useState(null);   // real DB data
  const [profileId,     setProfileId]     = useState(null);   // auth user id
  const [initLoading,   setInitLoading]   = useState(true);
  const [isOnDuty,      setIsOnDuty]      = useState(false);
  const [activeTab,     setActiveTab]     = useState("jobs");

  // ── Jobs state ────────────────────────────────────────────
  const [dispatchJob,   setDispatchJob]   = useState(null);   // incoming dispatch
  const [activeJob,     setActiveJob]     = useState(null);   // accepted & in-progress
  const [jobAccepted,   setJobAccepted]   = useState(false);
  const [accepting,     setAccepting]     = useState(false);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [jobsLoading,   setJobsLoading]   = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);

  // ── Metrics ───────────────────────────────────────────────
  const [metrics, setMetrics] = useState({ jobsDone: 0, earnings: 0, avgResponse: 18 });

  // ── GPS duty tracking ─────────────────────────────────────
  const geoWatchRef   = useRef(null);
  const geoIntervalRef= useRef(null);

  // ── 1. Load engineer profile on mount ─────────────────────
  useEffect(() => {
    const load = async () => {
      setInitLoading(true);
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { navigate("/"); return; }
      setProfileId(user.id);

      const { data: eng, error: engErr } = await supabase
        .from("engineers")
        .select("id, trade, status, rating, hourly_rate, callout_fee, service_radius_miles, total_jobs, profiles(full_name, phone, avatar_url)")
        .eq("profile_id", user.id)
        .single();

      if (engErr || !eng) {
        toast.error("Engineer profile not found. Contact admin.");
        setInitLoading(false);
        return;
      }

      setEngineer({
        id:          eng.id,
        name:        eng.profiles?.full_name ?? "Engineer",
        trade:       eng.trade,
        rating:      eng.rating ?? 5.0,
        hourlyRate:  eng.hourly_rate,
        calloutFee:  eng.callout_fee,
        radiusMiles: eng.service_radius_miles,
        totalJobs:   eng.total_jobs ?? 0,
        avatar:      (eng.profiles?.full_name ?? "E")[0].toUpperCase(),
        phone:       eng.profiles?.phone,
      });

      // Restore duty status from DB
      setIsOnDuty(eng.status === "available" || eng.status === "en_route" || eng.status === "on_site");
      setInitLoading(false);
    };
    load();
  }, [navigate]);

  // ── 2. Load today's metrics & completed jobs ───────────────
  const loadTodayData = useCallback(async (engineerId) => {
    if (!engineerId) return;
    setJobsLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [{ data: done }, { data: pending }] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, quoted_price, final_price, completed_at, customers(profiles(full_name))")
        .eq("engineer_id", engineerId)
        .eq("status", "completed")
        .gte("completed_at", todayStart.toISOString())
        .order("completed_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    setCompletedJobs(done ?? []);
    setPendingCount(pending ?? 0);

    const todayEarnings = (done ?? []).reduce((s, j) => s + Number(j.final_price ?? j.quoted_price ?? 0), 0);
    setMetrics({ jobsDone: (done ?? []).length, earnings: Math.round(todayEarnings), avgResponse: 18 });
    setJobsLoading(false);
  }, []);

  useEffect(() => {
    if (engineer?.id) loadTodayData(engineer.id);
  }, [engineer?.id, loadTodayData]);

  // ── 3. Realtime — listen for new dispatch (assigned jobs) ──
  useEffect(() => {
    if (!engineer?.id) return;

    // Check for any currently assigned job first
    const checkAssigned = async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*, customers(profiles(full_name, phone))")
        .eq("engineer_id", engineer.id)
        .in("status", ["assigned", "en_route", "on_site"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        if (data.status === "assigned") {
          setDispatchJob(data);
        } else {
          // Job already accepted/in-progress
          setActiveJob(data);
          setJobAccepted(true);
        }
      }
    };
    checkAssigned();

    // Subscribe to new assignments
    const ch = supabase
      .channel(`dispatch-${engineer.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "jobs",
        filter: `engineer_id=eq.${engineer.id}`,
      }, (payload) => {
        const job = payload.new;
        if (job.status === "assigned") {
          setDispatchJob(job);
          toast("🔔 New job dispatched to you!", { duration: 5000 });
        } else if (job.status === "completed" || job.status === "cancelled") {
          setDispatchJob(null);
          setActiveJob(null);
          setJobAccepted(false);
          loadTodayData(engineer.id);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [engineer?.id, loadTodayData]);

  // ── 4. Duty toggle — update Supabase + start/stop GPS ──────
  const handleDutyToggle = useCallback(async () => {
    if (!engineer?.id) return;
    const next = !isOnDuty;
    setIsOnDuty(next);

    const { error } = await supabase
      .from("engineers")
      .update({ status: next ? "available" : "offline" })
      .eq("id", engineer.id);

    if (error) {
      toast.error("Failed to update duty status");
      setIsOnDuty(!next); // revert
      return;
    }

    if (next) {
      // Start GPS heartbeat
      if (navigator.geolocation) {
        geoWatchRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            await supabase.from("engineers").update({
              location: `POINT(${lng} ${lat})`,
              last_seen_at: new Date().toISOString(),
            }).eq("id", engineer.id);
          },
          () => {}, // silent — GPS optional when just on duty
          GEO_OPTS
        );
        geoIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords;
              await supabase.from("engineers").update({
                location: `POINT(${lng} ${lat})`,
                last_seen_at: new Date().toISOString(),
              }).eq("id", engineer.id);
            },
            () => {},
            GEO_OPTS
          );
        }, 60_000);
      }
      toast("🟢 You are now Online & accepting dispatches");
    } else {
      // Stop GPS
      if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
      if (geoIntervalRef.current) clearInterval(geoIntervalRef.current);
      geoWatchRef.current = null;
      geoIntervalRef.current = null;
      toast("⚫ You are now Off Duty");
    }
  }, [isOnDuty, engineer?.id]);

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
      if (geoIntervalRef.current) clearInterval(geoIntervalRef.current);
    };
  }, []);

  // ── 5. Accept dispatch ─────────────────────────────────────
  const handleAcceptDispatch = useCallback(async () => {
    if (!dispatchJob?.id || !engineer?.id) return;
    setAccepting(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "en_route" })
        .eq("id", dispatchJob.id)
        .eq("engineer_id", engineer.id);
      if (error) throw error;

      // Fetch full job with customer info
      const { data: fullJob } = await supabase
        .from("jobs")
        .select("*, customers(profiles(full_name, phone))")
        .eq("id", dispatchJob.id)
        .single();

      toast.success("Dispatch accepted! Head to the customer.");
      setDispatchJob(null);
      setActiveJob(fullJob ?? dispatchJob);
      setJobAccepted(true);
    } catch (err) {
      toast.error("Failed to accept dispatch. Try again.");
    } finally {
      setAccepting(false);
    }
  }, [dispatchJob, engineer?.id]);

  // ── 6. Decline dispatch ────────────────────────────────────
  const handleDeclineDispatch = useCallback(async () => {
    if (!dispatchJob?.id) return;
    try {
      await supabase.from("jobs").update({
        status: "pending",
        engineer_id: null,
      }).eq("id", dispatchJob.id);
    } catch (_) {}
    toast("Dispatch declined. Job will be reassigned.", { icon: "🔄" });
    setDispatchJob(null);
  }, [dispatchJob?.id]);

  // ── 7. Job update callback from EngineerActions ────────────
  const handleJobUpdate = useCallback((updatedJob) => {
    setActiveJob(updatedJob);
    if (updatedJob.status === "completed") {
      setActiveJob(null);
      setJobAccepted(false);
      loadTodayData(engineer?.id);
      toast.success("Job completed! Great work 🎉");
    }
  }, [engineer?.id, loadTodayData]);

  // ── 8. Sign out ────────────────────────────────────────────
  const handleSignOut = async () => {
    if (engineer?.id) {
      await supabase.from("engineers").update({ status: "offline" }).eq("id", engineer.id);
    }
    await supabase.auth.signOut();
    navigate("/");
  };

  // ── Loading splash ─────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!engineer) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-bold text-navy-900 text-lg mb-2">No engineer profile found</p>
          <p className="text-sm text-slate-500 mb-4">Your account needs to be set up by an admin.</p>
          <button onClick={handleSignOut} className="btn-primary text-sm px-6 py-2.5">Sign Out</button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  const hasNewDispatch = !!dispatchJob && !jobAccepted;

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col max-w-md mx-auto relative">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-card px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="font-black text-navy-900 text-base tracking-tight">
              TradePro <span className="text-emerald-500">360</span>
            </span>
          </div>

          {/* Duty toggle */}
          <button onClick={handleDutyToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold border-2 transition-all min-h-[36px] ${isOnDuty ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-slate-100 border-slate-300 text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {isOnDuty ? "ONLINE" : "OFF DUTY"}
          </button>

          {/* Bell + sign out */}
          <div className="flex items-center gap-1">
            <button className="relative p-2 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition-colors min-h-0" aria-label="Notifications">
              <Bell size={18} />
              {hasNewDispatch && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </button>
            <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors min-h-0" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Profile row */}
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md">
            {engineer.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-navy-900 leading-tight">Hello, {engineer.name.split(" ")[0]}!</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                <BadgeCheck size={10} />
                <span className="capitalize">{engineer.trade?.replace(/_/g, " ")}</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Star size={9} className="fill-current" />
                {Number(engineer.rating).toFixed(1)}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Daily Earnings</p>
            <p className="text-2xl font-black text-emerald-600 leading-none">£{metrics.earnings}</p>
          </div>
        </div>
      </header>

      {/* ── Tab content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* MY JOBS tab */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {/* Incoming dispatch banner */}
            {hasNewDispatch && (
              <DispatchBanner
                job={dispatchJob}
                onAccept={handleAcceptDispatch}
                onDecline={handleDeclineDispatch}
                accepting={accepting}
              />
            )}

            {/* Metrics */}
            <MetricStrip jobsDone={metrics.jobsDone} earnings={metrics.earnings} avgResponse={metrics.avgResponse} loading={jobsLoading} />

            {/* Active job workflow */}
            {activeJob && jobAccepted && (
              <div className="px-4">
                <EngineerActionsPanel job={activeJob} engineerId={engineer.id} onJobUpdate={handleJobUpdate} />
              </div>
            )}

            {/* Idle state */}
            {!activeJob && !hasNewDispatch && isOnDuty && (
              <div className="px-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap size={28} className="text-emerald-600" />
                  </div>
                  <p className="font-bold text-navy-900 text-base mb-1">Ready for your next call?</p>
                  <p className="text-sm text-slate-500">You're Online. New jobs will appear here automatically.</p>
                </div>
              </div>
            )}

            {!isOnDuty && !activeJob && (
              <div className="px-4">
                <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 text-center">
                  <p className="font-bold text-slate-600 text-base mb-1">You're Off Duty</p>
                  <p className="text-sm text-slate-400">Toggle Online above to start receiving dispatches.</p>
                </div>
              </div>
            )}

            {/* Completed feed */}
            <CompletedFeed jobs={completedJobs} loading={jobsLoading} />
          </div>
        )}

        {/* JOB BOARD tab */}
        {activeTab === "board" && (
          <JobBoardTab engineerTrade={engineer.trade} engineerId={engineer.id} />
        )}

        {/* SUPPORT tab */}
        {activeTab === "support" && <SupportTab />}

        {/* ACCOUNT tab */}
        {activeTab === "account" && (
          <AccountTab engineer={engineer} onSignOut={handleSignOut} />
        )}
      </div>

      {/* ── Bottom Nav ───────────────────────────────────────── */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} pendingCount={pendingCount} />
    </div>
  );
}
