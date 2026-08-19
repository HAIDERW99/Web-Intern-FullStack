import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  approved:          { label: 'Approved',          bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  pending:           { label: 'Under Review',      bg: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400'  },
  changes_requested: { label: 'Action Required',   bg: 'bg-amber-100 text-amber-800',    dot: 'bg-amber-500'  },
  rejected:          { label: 'Rejected',          bg: 'bg-red-50 text-red-600',         dot: 'bg-red-400'    },
  suspended:         { label: 'Suspended',         bg: 'bg-orange-50 text-orange-600',   dot: 'bg-orange-400' },
};

const CATEGORY_IMAGE = {
  hotel:     'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=75',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=75',
  villa:     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75',
  apartment: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=75',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');

  useEffect(() => {
    if (!user) return;
    async function fetchOwnerProperties() {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setProperties(data || []);
      setLoading(false);
    }
    fetchOwnerProperties();
  }, [user]);

  const filtered = properties.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">My Properties</h1>
            <p className="text-sm text-[#45464d] mt-1">Manage listings and review submission status.</p>
          </div>
          <Link
            to="/owner/register-property"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#fea619] text-[#2a1700] text-xs font-bold rounded-xl hover:bg-[#e59410] transition-colors"
          >
            <span className="material-symbols-outlined text-base">domain_add</span>
            + Register New Property
          </Link>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Properties', value: loading ? '…' : properties.length,                                    color: 'text-[#131b2e]' },
            { label: 'Approved & Live',  value: loading ? '…' : properties.filter(p => p.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Under Review',     value: loading ? '…' : properties.filter(p => p.status === 'pending' || p.status === 'changes_requested').length,  color: 'text-amber-600' },
            { label: 'Rejected',         value: loading ? '…' : properties.filter(p => p.status === 'rejected').length, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#76777d] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Filter Pills ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'approved', 'pending', 'changes_requested', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-[#131b2e] text-white'
                  : 'bg-white text-[#45464d] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
              }`}
            >
              {f === 'pending' ? 'Under Review' : f === 'changes_requested' ? 'Action Required' : f}
            </button>
          ))}
        </div>

        {/* ── Properties Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden animate-pulse">
                <div className="h-44 bg-[#e0e3e5]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#e0e3e5] rounded w-2/3" />
                  <div className="h-3 bg-[#e0e3e5] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e0e3e5] py-16 text-center">
            <p className="text-3xl mb-3">🏨</p>
            <p className="font-semibold text-[#191c1e]">No properties found</p>
            <p className="text-xs text-[#76777d] mt-1 mb-4">Register your first property to start welcoming guests.</p>
            <Link
              to="/owner/register-property"
              className="inline-block px-5 py-2.5 bg-[#131b2e] text-white text-xs font-semibold rounded-xl hover:bg-[#1e2d47] transition-colors"
            >
              Register a Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const imgSrc = p.image_url || p.cover_image_url || CATEGORY_IMAGE[p.category] || CATEGORY_IMAGE.hotel;
              const location = [p.city, p.country].filter(Boolean).join(', ');
              const hasFeedback = p.admin_notes || p.rejection_reason;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 overflow-hidden">
                      <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = CATEGORY_IMAGE.hotel; }} />
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="absolute bottom-3 left-3 bg-[#131b2e]/80 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-md capitalize">
                        {p.category}
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-base text-[#191c1e] truncate">{p.name}</h3>
                      <p className="text-xs text-[#76777d] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {location || 'Location N/A'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-[#45464d] pt-2 border-t border-[#f2f4f6]">
                        <span>Room count: <strong>{p.room_count || 0}</strong></span>
                        <span>Rate: <strong>${Number(p.price_per_night || 150)}/night</strong></span>
                      </div>

                      {hasFeedback && (p.status === 'rejected' || p.status === 'changes_requested') && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                          <strong className="block mb-0.5 font-semibold">Admin Requirement:</strong>
                          {p.admin_notes || p.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 space-y-2">
                    {(p.status === 'changes_requested' || p.status === 'rejected') ? (
                      <Link
                        to={`/owner/register-property?edit=${p.id}`}
                        className="block w-full py-2 bg-amber-600 hover:bg-amber-700 text-center text-xs font-bold text-white rounded-xl transition-colors"
                      >
                        Edit & Resubmit Application
                      </Link>
                    ) : (
                      <Link
                        to="/owner/dashboard"
                        className="block w-full py-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] text-center text-xs font-semibold text-[#191c1e] rounded-xl transition-colors"
                      >
                        Manage Operations
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
