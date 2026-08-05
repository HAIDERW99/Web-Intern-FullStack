import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Phone, MessageSquare, X, Shield, ChevronLeft,
  CheckCircle2, Truck, Wrench, Sparkles, Clock,
  AlertTriangle, Navigation,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../services/supabaseClient";
import toast from "react-hot-toast";

// ─── Fix Leaflet icon paths (Vite) ─────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Custom Markers ─────────────────────────────────────────────────────────
const homeIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:44px;height:44px;background:#0F172A;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>
    <div style="margin-top:-4px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #0F172A;"></div>
    <span style="margin-top:3px;background:#0F172A;color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:999px;letter-spacing:0.05em;white-space:nowrap;">YOUR HOME</span>
  </div>`,
  className: "",
  iconSize:   [80, 80],
  iconAnchor: [40, 52],
  popupAnchor:[0, -55],
});

const vanIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:56px;height:56px;border-radius:50%;background:rgba(16,185,129,0.25);animation:pulseRing 1.8s ease-out infinite;"></div>
    <div style="position:absolute;top:4px;left:50%;transform:translateX(-50%);width:44px;height:44px;border-radius:50%;background:rgba(16,185,129,0.18);animation:pulseRing 1.8s ease-out infinite 0.6s;"></div>
    <div style="position:relative;z-index:2;width:44px;height:44px;background:#10B981;border-radius:50%;border:4px solid white;box-shadow:0 4px 14px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zm-.5 1.5 1.96 2.5H17V9.5h2.5zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2.22-3c-.55-.61-1.33-1-2.22-1s-1.67.39-2.22 1H3V6h12v9H8.22zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
      </svg>
    </div>
    <div style="position:relative;z-index:2;margin-top:-4px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #10B981;"></div>
    <span style="position:relative;z-index:2;margin-top:3px;background:#10B981;color:white;font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:0.05em;white-space:nowrap;">DAVE'S VAN</span>
  </div>`,
  className: "",
  iconSize:   [80, 88],
  iconAnchor: [40, 60],
  popupAnchor:[0, -62],
});

// Inject pulse ring CSS once
if (!document.getElementById("tp-van-pulse-style")) {
  const style = document.createElement("style");
  style.id = "tp-van-pulse-style";
  style.textContent = `
    @keyframes pulseRing {
      0%   { transform: translateX(-50%) scale(0.8); opacity: 0.8; }
      100% { transform: translateX(-50%) scale(1.5); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

// ─── Map controller sub-component ───────────────────────────────────────────
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom(), { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: "mock-001",
  status: "en_route",
  title: "Emergency Boiler Repair",
  address: "14 Albemarle Street, London",
  postcode: "W1S 4HW",
  tracking_token: "TP8821",
  quoted_price: 149,
  location_lat: 51.5074,
  location_lng: -0.1278,
  engineers: {
    id: "eng-001",
    trade: "gas_safe_plumber",
    rating: 4.9,
    vehicle: "White Ford Transit",
    vehicle_reg: "AB12 CDE",
    cert_badge: "Gas Safe Certified",
    review_count: 128,
    profiles: {
      full_name: "Dave Miller",
      phone: "07700900000",
      avatar_url: "https://i.pravatar.cc/150?img=12",
    },
  },
};

// Mock route waypoints (approaching London W1)
const MOCK_WAYPOINTS = [
  { lat: 51.4874, lng: -0.1978 },
  { lat: 51.4912, lng: -0.1820 },
  { lat: 51.4960, lng: -0.1650 },
  { lat: 51.5010, lng: -0.1490 },
  { lat: 51.5042, lng: -0.1380 },
  { lat: 51.5074, lng: -0.1278 },
];

// ─── Job Stage config ────────────────────────────────────────────────────────
const STAGES = [
  { key: "confirmed", label: "Booking Confirmed",      icon: CheckCircle2 },
  { key: "en_route",  label: "Engineer En Route",      icon: Truck        },
  { key: "on_site",   label: "On-Site Work Started",   icon: Wrench       },
  { key: "completed", label: "Job Completed & Invoiced", icon: Sparkles   },
];

const STATUS_TO_STAGE = {
  pending:   0, assigned: 0, confirmed: 0,
  en_route:  1,
  on_site:   2,
  completed: 3,
  cancelled: -1,
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { jobId }        = useParams();
  const [searchParams]   = useSearchParams();
  const tokenParam       = searchParams.get("token");

  // ── State ──────────────────────────────────────────────
  const [job,            setJob]            = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [engineerPos,    setEngineerPos]    = useState(null);
  const [trail,          setTrail]          = useState([]);
  const [etaMins,        setEtaMins]        = useState(14);
  const [sheetExpanded,  setSheetExpanded]  = useState(false);
  const [mapRef,         setMapRef]         = useState(null);
  const [recenter,       setRecenter]       = useState(null);
  const [zoom,           setZoom]           = useState(14);
  const [imminent,       setImminent]       = useState(false);
  const [mockDest,       setMockDest]       = useState(null); // geocoded destination for mock
  const [isMockMode,     setIsMockMode]     = useState(false);
  const nearAlertFired   = useRef(false);
  const mockIntervalRef  = useRef(null);
  const etaIntervalRef   = useRef(null);

  // ── Load job (real or mock) ────────────────────────────
  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      if (jobId && jobId !== "demo") {
        const { data, error } = await supabase
          .from("jobs")
          .select(`*, engineers(id,trade,rating,vehicle,vehicle_reg,cert_badge,review_count,profiles(full_name,phone,avatar_url))`)
          .eq("id", jobId)
          .single();
        if (!error && data) {
          setJob(data);
          setIsMockMode(false);
          const match = String(data.location ?? "").match(/POINT\(([^ ]+) ([^ )]+)\)/);
          if (match) data.location_lat = parseFloat(match[2]), data.location_lng = parseFloat(match[1]);
        } else {
          setJob({ ...MOCK_JOB });
          setIsMockMode(true);
        }
      } else {
        setJob({ ...MOCK_JOB });
        setIsMockMode(true);
      }
      setLoading(false);
    }
    loadJob();
  }, [jobId, tokenParam]);

  // ── Geocode MOCK_JOB postcode on mount ────────────────────
  useEffect(() => {
    async function geocodeMockPostcode() {
      try {
        const clean = MOCK_JOB.postcode.replace(/\s+/g, "");
        const res  = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
        const json = await res.json();
        if (json.status === 200 && json.result) {
          setMockDest({ lat: json.result.latitude, lng: json.result.longitude });
        }
      } catch (_) {
        // Fall back to MOCK_JOB hardcoded coords
        setMockDest({ lat: MOCK_JOB.location_lat, lng: MOCK_JOB.location_lng });
      }
    }
    geocodeMockPostcode();
  }, []);

  // ── Supabase realtime location ─────────────────────────
  useEffect(() => {
    if (!job?.engineers?.id || job.id === "mock-001") return;

    const parsePos = (locStr) => {
      const m = String(locStr ?? "").match(/POINT\(([^ ]+) ([^ )]+)\)/);
      if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };
      return null;
    };

    const handlePos = (pos) => {
      setEngineerPos(pos);
      setTrail((t) => [...t.slice(-49), pos]);
      if (job.location_lat) {
        const km = haversineKm(pos.lat, pos.lng, job.location_lat, job.location_lng);
        setEtaMins(Math.max(1, Math.round((km / 40) * 60)));
      }
    };

    // Primary channel: engineer_locations INSERT
    const ch = supabase
      .channel(`track-loc-${job.engineers.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "engineer_locations", filter: `engineer_id=eq.${job.engineers.id}`,
      },
        (payload) => {
          const pos = parsePos(payload.new.location);
          if (pos) handlePos(pos);
        })
      .subscribe();

    // Backup channel: engineers UPDATE (location field)
    const engCh = supabase
      .channel(`track-eng-${job.engineers.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "engineers", filter: `id=eq.${job.engineers.id}`,
      },
        (payload) => {
          const pos = parsePos(payload.new.location);
          if (pos) handlePos(pos);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(engCh);
    };
  }, [job?.engineers?.id, job?.id, job?.location_lat, job?.location_lng]);

  // ── Mock movement simulation ───────────────────────────
  useEffect(() => {
    if (!job || job.id !== "mock-001") return;

    // Use geocoded destination if available, otherwise fall back to MOCK_WAYPOINTS
    const dest = mockDest ?? { lat: MOCK_JOB.location_lat, lng: MOCK_JOB.location_lng };
    const startPos = MOCK_WAYPOINTS[0];

    let stepCount = 0;
    setEngineerPos(startPos);
    setTrail([startPos]);

    mockIntervalRef.current = setInterval(() => {
      stepCount += 1;
      // Interpolate from MOCK_WAYPOINTS[0] toward geocoded destination in ~200 steps
      const t = Math.min(stepCount / 200, 0.99);
      const pos = {
        lat: startPos.lat + (dest.lat - startPos.lat) * t,
        lng: startPos.lng + (dest.lng - startPos.lng) * t,
      };
      setEngineerPos({ ...pos });
      setTrail((prev) => [...prev.slice(-49), pos]);

      const km  = haversineKm(pos.lat, pos.lng, dest.lat, dest.lng);
      const eta = Math.max(1, Math.round((km / 30) * 60));
      setEtaMins(eta);
      if (eta <= 2 && !nearAlertFired.current) {
        nearAlertFired.current = true;
        setImminent(true);
        toast("🚨 Dave is less than 2 minutes away!", { duration: 5000 });
      }
    }, 1000);

    return () => clearInterval(mockIntervalRef.current);
  }, [job?.id, mockDest]);

  // ── Live ETA countdown (ticks every 60s as backup) ────
  useEffect(() => {
    etaIntervalRef.current = setInterval(() => {
      setEtaMins((m) => (m > 1 ? m - 1 : m));
    }, 60000);
    return () => clearInterval(etaIntervalRef.current);
  }, []);

  // ── Recenter map on engineer ───────────────────────────
  const handleRecenter = useCallback(() => {
    if (engineerPos) setRecenter({ ...engineerPos, _t: Date.now() });
  }, [engineerPos]);

  const jobLat = job?.location_lat ?? MOCK_JOB.location_lat;
  const jobLng = job?.location_lng ?? MOCK_JOB.location_lng;
  const engineer = job?.engineers ?? MOCK_JOB.engineers;
  const stageIdx = STATUS_TO_STAGE[job?.status ?? "en_route"] ?? 1;
  const mapCenter = engineerPos
    ? [engineerPos.lat, engineerPos.lng]
    : [jobLat, jobLng];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Loading live tracker…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-100" style={{ zIndex: 0 }}>

      {/* ════ FLOATING TOP BAR (glassmorphism) ════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 z-[1100] flex items-center justify-between px-4 py-3 gap-3"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(226,232,240,0.8)",
        }}
      >
        {/* Left: back + branding */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            aria-label="Back to home"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wrench size={14} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-slate-900 tracking-tight">
              TradePro <span className="text-emerald-500">360</span>
            </span>
          </div>
          {/* Live Job Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Job Status
          </div>
        </div>

        {/* Right: Call Support CTA */}
        <a
          href="tel:08001234567"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-colors min-h-0"
          style={{ background: "#ba1a1a" }}
          aria-label="Call urgent support"
        >
          <Phone size={14} />
          <span className="hidden sm:inline">Urgent Support</span>
          <span className="sm:hidden">SOS</span>
        </a>
      </div>

      {/* ════ FULL-BLEED MAP ════════════════════════════════════ */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          ref={setMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Job / Home destination */}
          <Marker position={[jobLat, jobLng]} icon={homeIcon}>
            <Popup>
              <div className="text-sm font-bold text-slate-900">{job?.title ?? "Your Home"}</div>
              <div className="text-xs text-slate-500">{job?.address}</div>
            </Popup>
          </Marker>

          {/* Engineer van */}
          {engineerPos && (
            <Marker position={[engineerPos.lat, engineerPos.lng]} icon={vanIcon}>
              <Popup>
                <div className="text-sm font-bold">{engineer?.profiles?.full_name ?? "Engineer"}</div>
                <div className="text-xs text-emerald-600 mt-0.5">● En route to you</div>
              </Popup>
            </Marker>
          )}

          {/* Route trail */}
          {trail.length > 1 && (
            <Polyline
              positions={trail.map((p) => [p.lat, p.lng])}
              color="#10B981"
              weight={3.5}
              opacity={0.7}
              dashArray="8 5"
            />
          )}

          {/* Map controller for recenter */}
          {recenter && (
            <MapController center={[recenter.lat, recenter.lng]} zoom={zoom} />
          )}
        </MapContainer>
      </div>

      {/* ════ FLOATING MAP CONTROLS (top-right) ════════════════ */}
      <div
        className="absolute top-20 right-4 z-[1100] flex flex-col gap-2"
      >
        {[
          { label: "+", title: "Zoom in",  onClick: () => { mapRef?.setZoom((mapRef.getZoom() ?? 14) + 1); } },
          { label: "−", title: "Zoom out", onClick: () => { mapRef?.setZoom((mapRef.getZoom() ?? 14) - 1); } },
        ].map(({ label, title, onClick }) => (
          <button
            key={label}
            title={title}
            onClick={onClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 font-bold text-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            aria-label={title}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Recenter / My Location button (bottom-right, above sheet) */}
      <button
        onClick={handleRecenter}
        title="Recenter on engineer"
        className="absolute right-4 z-[1100] w-11 h-11 flex items-center justify-center rounded-xl transition-colors"
        style={{
          bottom: sheetExpanded ? "calc(80vh + 16px)" : "calc(56px + 4.5rem + 16px)",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
        aria-label="Recenter map on engineer"
      >
        <Navigation size={18} className="text-emerald-600" />
      </button>

      {/* ════ IMMINENT ALERT BANNER ════════════════════════════ */}
      {imminent && (
        <div
          className="absolute top-16 left-1/2 z-[1200] -translate-x-1/2 mt-2 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white animate-bounce"
          style={{
            background: "#10B981",
            boxShadow: "0 4px 20px rgba(16,185,129,0.5)",
          }}
        >
          <AlertTriangle size={16} />
          Dave is less than 2 minutes away!
        </div>
      )}

      {/* ════ ETA FLOATING CHIP (top-center, below top bar) ════ */}
      {job?.status !== "completed" && (
        <div
          className="absolute left-1/2 z-[1100] -translate-x-1/2 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
          style={{
            top: "72px",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(226,232,240,0.8)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.09)",
          }}
        >
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <Truck size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                {etaMins <= 4 ? "Arriving soon ⚡" : "Engineer on the way 🚐"}
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="text-[17px] font-bold text-slate-900 leading-tight">
              Estimated Arrival: {etaMins} Min{etaMins !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* ════ MOCK MODE INDICATOR (bottom-left) ════════════════ */}
      {isMockMode && (
        <div
          className="absolute bottom-4 left-4 z-[1200] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: "rgba(15,23,42,0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#94a3b8",
            border: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          MOCK MODE
        </div>
      )}

      {/* ════ BOTTOM SHEET ════════════════════════════════════════ */}
      <div
        className="absolute left-0 right-0 z-[1100] transition-all duration-300"
        style={{
          bottom: 0,
          maxHeight: sheetExpanded ? "80vh" : "auto",
        }}
      >
        <div
          className="bg-white shadow-2xl overflow-y-auto"
          style={{
            borderRadius: "20px 20px 0 0",
            maxHeight: sheetExpanded ? "80vh" : "none",
          }}
        >
          {/* Drag handle + expand toggle */}
          <button
            onClick={() => setSheetExpanded((s) => !s)}
            className="w-full flex flex-col items-center pt-3 pb-1 focus:outline-none"
            aria-label={sheetExpanded ? "Collapse details" : "Expand details"}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mb-1" />
          </button>

          <div className="px-4 pb-6 space-y-4">
            {/* ── Engineer identity row ── */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={engineer?.profiles?.avatar_url ?? `https://i.pravatar.cc/150?img=12`}
                  alt={engineer?.profiles?.full_name ?? "Engineer"}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-base leading-tight">
                    {engineer?.profiles?.full_name ?? "Dave Miller"}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#e5eeff", color: "#3a35d0" }}
                  >
                    ID: #{job?.tracking_token ?? "TP8821"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  {engineer?.cert_badge ?? "Master Plumber"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400 text-sm">★</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {engineer?.rating?.toFixed(1) ?? "4.9"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({engineer?.review_count ?? 128} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* ── Vehicle info ── */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#eff4ff" }}
            >
              <Truck size={18} className="text-slate-500 flex-shrink-0" />
              <span className="text-sm font-medium text-slate-700 flex-1">
                {engineer?.vehicle ?? "White Ford Transit"}
              </span>
              <span
                className="text-sm font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "#0F172A", color: "white", letterSpacing: "0.06em" }}
              >
                {engineer?.vehicle_reg ?? "AB12 CDE"}
              </span>
            </div>

            {/* ── Action buttons ── */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${engineer?.profiles?.phone ?? "07700900000"}`}
                className="flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "#0F172A" }}
                aria-label="Call engineer"
              >
                <Phone size={16} />
                Call Engineer
              </a>
              <a
                href={`sms:${engineer?.profiles?.phone ?? "07700900000"}`}
                className="flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: "#10B981" }}
                aria-label="Live chat with engineer"
              >
                <MessageSquare size={16} />
                Live Chat
              </a>
            </div>

            {/* ── 4-Stage Progress Stepper (shown when expanded) ── */}
            {sheetExpanded && (
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Job Progress</h3>
                <div className="relative flex flex-col gap-0">
                  {STAGES.map(({ key, label, icon: Icon }, i) => {
                    const done    = i < stageIdx;
                    const active  = i === stageIdx;
                    const future  = i > stageIdx;
                    return (
                      <div key={key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                        {/* Vertical connector line */}
                        {i < STAGES.length - 1 && (
                          <div
                            className="absolute left-[18px] top-[36px] w-0.5 h-[calc(100%-20px)]"
                            style={{ background: done ? "#10B981" : "#e2e8f0" }}
                          />
                        )}
                        {/* Step icon */}
                        <div
                          className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                          style={{
                            background:   done ? "#10B981" : active ? "white" : "white",
                            borderColor:  done || active ? "#10B981" : "#e2e8f0",
                            boxShadow:    active ? "0 0 0 4px rgba(16,185,129,0.18)" : "none",
                          }}
                        >
                          {done ? (
                            <CheckCircle2 size={17} className="text-white" style={{ color: "white" }} />
                          ) : active ? (
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          ) : (
                            <Icon size={15} className="text-slate-300" />
                          )}
                        </div>
                        {/* Label */}
                        <div className="pt-1">
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: done ? "#059669" : active ? "#0F172A" : "#94a3b8",
                            }}
                          >
                            {label}
                          </p>
                          {active && (
                            <p className="text-xs text-emerald-500 animate-pulse mt-0.5">In progress…</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Cancel / Reschedule ── */}
            <button
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1 underline underline-offset-2"
              onClick={() => toast("To cancel or reschedule, please call 0800 123 4567", { icon: "📞" })}
            >
              Cancel / Reschedule Booking
            </button>

            {/* ── Trust footer ── */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
              <Shield size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All TradePro 360 engineers are ID-verified, DBS-checked, and fully insured.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
