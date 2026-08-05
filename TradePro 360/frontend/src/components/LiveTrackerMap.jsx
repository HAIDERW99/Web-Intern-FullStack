import React, { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Navigation,
  MapPin,
  Clock,
  Star,
  Phone,
  User,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

// Fix default Leaflet icon path issues with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom engineer marker (emerald pin)
const engineerIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
      </div>
      <div class="absolute -bottom-1 w-3 h-3 bg-emerald-500 rotate-45 border-r-2 border-b-2 border-white"></div>
    </div>
  `,
  className: "",
  iconSize:   [40, 48],
  iconAnchor: [20, 48],
  popupAnchor:[0, -50],
});

// Custom job location marker (navy pin)
const jobIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 bg-navy-900 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style="background:#0F172A">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="absolute -bottom-1 w-3 h-3 rotate-45 border-r-2 border-b-2 border-white" style="background:#0F172A"></div>
    </div>
  `,
  className: "",
  iconSize:   [40, 48],
  iconAnchor: [20, 48],
  popupAnchor:[0, -50],
});

// Recenter map when engineer moves
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
}

const STATUS_CONFIG = {
  pending:   { label: "Finding Engineer",   color: "badge-pending",   pulse: true  },
  assigned:  { label: "Engineer Assigned",  color: "badge-assigned",  pulse: false },
  en_route:  { label: "On The Way",         color: "badge-en-route",  pulse: true  },
  on_site:   { label: "Engineer On Site",   color: "badge-on-site",   pulse: true  },
  completed: { label: "Job Completed",      color: "badge-completed", pulse: false },
  cancelled: { label: "Cancelled",          color: "badge-cancelled", pulse: false },
};

export default function LiveTrackerMap({ job, engineer }) {
  const [engineerPos,    setEngineerPos]    = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [isLive,         setIsLive]         = useState(false);
  const [eta,            setEta]            = useState(null);
  const [distKm,         setDistKm]         = useState(null);
  const [osrmRoute,      setOsrmRoute]      = useState(null); // GeoJSON coords array [{lat,lng}]
  const channelRef = useRef(null);
  const engChanRef = useRef(null);

  const jobLat = job?.location_lat;
  const jobLng = job?.location_lng;

  // ── Parse PostGIS location helper ────────────────────────
  const parseLocation = (locStr) => {
    if (!locStr) return null;
    try {
      // POINT(lng lat) format
      const match = locStr.match(/POINT\(([^ ]+) ([^ )]+)\)/);
      if (match) return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
      // GeoJSON
      const geo = typeof locStr === "string" ? JSON.parse(locStr) : locStr;
      if (geo?.coordinates) return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    } catch (_) {}
    return null;
  };

  // ── OSRM route fetch ─────────────────────────────────────
  const fetchOsrmRoute = useCallback(async (engPos) => {
    if (!jobLat || !jobLng) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${engPos.lng},${engPos.lat};${jobLng},${jobLat}?overview=full&geometries=geojson`;
      const res  = await fetch(url);
      const json = await res.json();
      if (json.code === "Ok" && json.routes?.length) {
        const coords = json.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
        setOsrmRoute(coords);
      }
    } catch (_) {
      setOsrmRoute(null); // fall back to breadcrumb trail
    }
  }, [jobLat, jobLng]);

  // ── Shared position handler ───────────────────────────────
  const handleNewPosition = useCallback((pos) => {
    if (!pos) return;
    setEngineerPos(pos);
    setLocationHistory((prev) => [...prev.slice(-49), pos]);
    setIsLive(true);

    if (jobLat && jobLng) {
      const km = haversine(pos.lat, pos.lng, jobLat, jobLng);
      setDistKm(km);
      const etaMins = Math.round((km / 40) * 60);
      setEta(etaMins);
      fetchOsrmRoute(pos);
    }
  }, [jobLat, jobLng, fetchOsrmRoute]);

  // ── Set initial engineer location ─────────────────────────
  useEffect(() => {
    if (engineer?.location) {
      const pos = parseLocation(engineer.location);
      if (pos) {
        setEngineerPos(pos);
        setLocationHistory([pos]);
        handleNewPosition(pos);
      }
    }
  }, [engineer]);

  // ── Subscribe to live location updates ───────────────────
  useEffect(() => {
    if (!engineer?.id) return;

    // Primary: engineer_locations INSERT
    channelRef.current = supabase
      .channel(`live-tracker-${engineer.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "engineer_locations",
          filter: `engineer_id=eq.${engineer.id}`,
        },
        (payload) => {
          const pos = parseLocation(payload.new.location);
          if (pos) handleNewPosition(pos);
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    // Backup: engineers table UPDATE (location field)
    engChanRef.current = supabase
      .channel(`live-tracker-eng-${engineer.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "engineers",
          filter: `id=eq.${engineer.id}`,
        },
        (payload) => {
          const pos = parseLocation(payload.new.location);
          if (pos) handleNewPosition(pos);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (engChanRef.current) supabase.removeChannel(engChanRef.current);
    };
  }, [engineer?.id, handleNewPosition]);

  const status = STATUS_CONFIG[job?.status] ?? STATUS_CONFIG.pending;
  const mapCenter = engineerPos ?? (jobLat ? { lat: jobLat, lng: jobLng } : { lat: 51.5074, lng: -0.1278 });

  // ── Dynamic ETA badge label ───────────────────────────────
  const etaBadgeLabel = (() => {
    if (job?.status === "on_site") return "Engineer on site";
    if (eta === null) return null;
    if (eta < 2)  return "Arriving now 🚨";
    if (eta <= 5) return "Arriving soon ⚡";
    return "Engineer on the way 🚐";
  })();

  const distDisplay = distKm !== null
    ? distKm >= 1
      ? `${distKm.toFixed(1)} km / ${(distKm * 0.621).toFixed(1)} mi`
      : `${Math.round(distKm * 1000)} m`
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Status bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`${status.color} ${status.pulse ? "relative" : ""}`}>
            {status.pulse && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-50 bg-current" />
            )}
            {status.label}
          </span>
          {etaBadgeLabel && job?.status === "en_route" && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                eta !== null && eta < 2
                  ? "bg-red-100 text-red-700"
                  : eta !== null && eta <= 5
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {etaBadgeLabel}
            </span>
          )}
          {eta !== null && job?.status === "en_route" && (
            <span className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock size={14} className="text-emerald-500" />
              ETA ~{eta} min
            </span>
          )}
          {distDisplay && job?.status === "en_route" && (
            <span className="text-xs text-slate-500">· {distDisplay}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {isLive ? (
            <><Wifi size={13} className="text-emerald-500" /> Live</>
          ) : (
            <><WifiOff size={13} className="text-slate-400" /> Last known</>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-card" style={{ height: 380 }}>
        {(!jobLat && !engineerPos) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center">
              <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Location not available yet</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Job location */}
            {jobLat && jobLng && (
              <Marker position={[jobLat, jobLng]} icon={jobIcon}>
                <Popup>
                  <div className="text-sm font-medium text-navy-900">{job?.title ?? "Job Location"}</div>
                  <div className="text-xs text-slate-500 mt-1">{job?.address}</div>
                </Popup>
              </Marker>
            )}

            {/* Engineer location */}
            {engineerPos && (
              <Marker position={[engineerPos.lat, engineerPos.lng]} icon={engineerIcon}>
                <Popup>
                  <div className="text-sm font-medium text-navy-900">
                    {engineer?.profiles?.full_name ?? "Your Engineer"}
                  </div>
                  {isLive && <div className="text-xs text-emerald-600 mt-1">● Live location</div>}
                </Popup>
              </Marker>
            )}

            {/* Route: OSRM (blue) or breadcrumb trail (green dashed) */}
            {osrmRoute && osrmRoute.length > 1 ? (
              <Polyline
                positions={osrmRoute.map((p) => [p.lat, p.lng])}
                color="#3B82F6"
                weight={4}
                opacity={0.8}
              />
            ) : (
              locationHistory.length > 1 && (
                <Polyline
                  positions={locationHistory.map((p) => [p.lat, p.lng])}
                  color="#10B981"
                  weight={3}
                  opacity={0.6}
                  dashArray="6 4"
                />
              )
            )}

            {engineerPos && <RecenterMap center={[engineerPos.lat, engineerPos.lng]} />}
          </MapContainer>
        )}

        {/* Live badge overlay */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-md z-[1000]">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* ── Engineer info card ── */}
      {engineer && (
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            {engineer.profiles?.avatar_url ? (
              <img
                src={engineer.profiles.avatar_url}
                alt={engineer.profiles.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User size={22} className="text-emerald-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy-900 text-sm">
              {engineer.profiles?.full_name ?? "Your Engineer"}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Star size={12} className="fill-current" />
                {engineer.rating?.toFixed(1) ?? "5.0"}
              </span>
              <span className="text-xs text-slate-400 capitalize">{engineer.trade?.replace("_", " ")}</span>
            </div>
          </div>

          {engineer.profiles?.phone && (
            <a
              href={`tel:${engineer.profiles.phone}`}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex-shrink-0 min-h-0"
              aria-label="Call engineer"
            >
              <Phone size={18} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
