import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wrench, Menu, X, Bell, ChevronDown, LogOut,
  User, LayoutDashboard, ClipboardList, Phone, MapPin,
  Shield, HardHat,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

/**
 * onOpenAuth — callback prop injected by App.jsx.
 * Calling it opens the global AuthModal from any route.
 */

const NAV_LINKS = [
  { label: "Emergency Repair", to: "/book?urgency=emergency" },
  { label: "Pricing",          to: "/#pricing"               },
  { label: "How It Works",     to: "/#how-it-works"          },
];

export default function Header({ onOpenAuth }) {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [session, setSession]           = useState(null);
  const [profile, setProfile]           = useState(null);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [scrolled, setScrolled]         = useState(false);
  const userMenuRef                      = useRef(null);
  const location                         = useLocation();
  const navigate                         = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) fetchProfile(sess.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", session.user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const sub = supabase
      .channel("header-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications",
        filter: `profile_id=eq.${session.user.id}` }, () => setUnreadCount((n) => n + 1))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [session]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const dashboardLink =
    profile?.role === "admin" ? "/admin" :
    profile?.role === "engineer" ? "/engineer" : "/";

  const isActive = (to) => location.pathname === to.split("?")[0];

  return (
    <header className={`sticky top-0 z-50 bg-navy-900 transition-shadow duration-200 ${scrolled ? "shadow-xl" : ""}`}>
      <div className="page-container">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 min-h-0 py-0 flex-shrink-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wrench size={17} className="text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-white tracking-tight">
                TradePro <span className="text-emerald-400">360</span>
              </span>
              <span className="text-[10px] text-emerald-400/70 font-medium tracking-wide hidden sm:block">
                24/7 UK Emergency
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-0 whitespace-nowrap ${
                  isActive(link.to)
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {/* Emergency call CTA */}
            <a
              href="tel:08001234567"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-sm font-semibold transition-colors min-h-0 whitespace-nowrap"
              aria-label="Call emergency dispatch"
            >
              <Phone size={14} />
              <span className="hidden lg:inline">Emergency Dispatch</span>
              <span className="lg:hidden">Call</span>
            </a>

            {/* Track shortcut */}
            <Link
              to="/track"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors min-h-0 whitespace-nowrap"
            >
              <MapPin size={14} />
              <span className="hidden lg:inline">Track Engineer</span>
            </Link>

            {session ? (
              <>
                {/* Notifications */}
                <button
                  className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-0"
                  aria-label="Notifications"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors min-h-0"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {profile?.full_name?.[0] ?? "U"}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate hidden lg:block">
                      {profile?.full_name ?? "Account"}
                    </span>
                    <ChevronDown size={15} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-card-hover border border-slate-100 py-1 animate-fade-in z-50">
                      <Link to={dashboardLink} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-navy-900 hover:bg-slate-50 transition-colors min-h-0">
                        <LayoutDashboard size={16} className="text-slate-500" /> Dashboard
                      </Link>
                      <Link to="/track" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-navy-900 hover:bg-slate-50 transition-colors min-h-0">
                        <ClipboardList size={16} className="text-slate-500" /> Track Job
                      </Link>
                      {/* Admin link — only visible to admin role */}
                      {profile?.role === "admin" && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-navy-900 hover:bg-emerald-50 transition-colors min-h-0 border-t border-slate-100">
                          <Shield size={16} className="text-emerald-600" />
                          <span>Admin Dispatch</span>
                          <span className="ml-auto text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">LIVE</span>
                        </Link>
                      )}
                      {/* Engineer Portal — only visible to engineer/admin role */}
                      {(profile?.role === "engineer" || profile?.role === "admin") && (
                        <Link to="/engineer" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-navy-900 hover:bg-blue-50 transition-colors min-h-0 border-t border-slate-100">
                          <HardHat size={16} className="text-blue-600" />
                          <span>Engineer Portal</span>
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-0">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAuth}
                  className="btn-outline text-sm py-2 px-4 min-h-0 flex items-center gap-2"
                  aria-label="Open login / sign up"
                >
                  <User size={14} />
                  Login
                </button>
                <Link to="/book" className="btn-primary text-sm py-2 px-4 min-h-0">
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-0"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-900 border-t border-white/10 animate-slide-up">
          <div className="page-container py-4 flex flex-col gap-1">
            {/* Emergency call — top of mobile menu */}
            <a href="tel:08001234567"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-semibold text-sm mb-2">
              <Phone size={16} /> Call Emergency Dispatch
            </a>

            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link to="/track" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              <MapPin size={15} /> Track Engineer
            </Link>

            <div className="border-t border-white/10 mt-3 pt-3 flex flex-col gap-2">
              {session ? (
                <>
                  <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="btn-secondary text-sm">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  {profile?.role === "admin" && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-emerald-300 hover:text-white hover:bg-white/10 transition-colors border border-emerald-500/20">
                      <Shield size={16} /> Admin Dispatch Centre
                    </Link>
                  )}
                  {(profile?.role === "engineer" || profile?.role === "admin") && (
                    <Link to="/engineer" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-blue-300 hover:text-white hover:bg-white/10 transition-colors border border-blue-500/20">
                      <HardHat size={16} /> Engineer Portal
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="btn-outline text-sm">
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); onOpenAuth?.(); }}
                    className="btn-secondary text-sm flex items-center gap-2 justify-center w-full"
                    aria-label="Open sign in"
                  >
                    <User size={16} /> Sign In / Register
                  </button>
                  <Link to="/book" onClick={() => setMobileOpen(false)} className="btn-primary text-sm">
                    Book Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
