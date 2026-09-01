import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  completed: { label: 'Completed', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400'    },
};

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function nightsBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

const CATEGORY_IMAGE = {
  hotel:     'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=75',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=75',
  villa:     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=75',
  apartment: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=75',
};

export default function ReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState('All');
  const [cancellingId, setCancellingId] = useState(null);

  async function fetchReservations() {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bookings')
      .select(`
        *,
        hotels:hotel_id (
          id, name, city, country, category,
          image_url, cover_image_url
        ),
        rooms:room_id (
          type, room_number
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (err) {
      setError('Failed to load reservations.');
      console.error(err);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user) fetchReservations();
  }, [user]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    const { error: err } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('customer_id', user.id);

    if (!err) {
      setReservations((prev) =>
        prev.map((r) => r.id === bookingId ? { ...r, status: 'cancelled' } : r)
      );
    }
    setCancellingId(null);
  };

  const filtered = reservations.filter((r) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return r.status === 'confirmed' || r.status === 'pending';
    if (activeTab === 'Completed') return r.status === 'completed';
    if (activeTab === 'Cancelled') return r.status === 'cancelled';
    return true;
  });

  // Summary stats from real data
  const totalSpent = reservations
    .filter((r) => r.status !== 'cancelled')
    .reduce((s, r) => s + Number(r.total_amount || 0), 0);
  const upcoming   = reservations.filter((r) => r.status === 'confirmed' || r.status === 'pending').length;
  const completed  = reservations.filter((r) => r.status === 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 w-full">
        {/* ── Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#191c1e]">My Reservations</h1>
          <p className="text-sm text-[#45464d] mt-1">Track and manage all your bookings in one place.</p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Bookings', value: reservations.length, icon: '🏨' },
            { label: 'Upcoming',       value: upcoming,           icon: '📅' },
            { label: 'Completed',      value: completed,          icon: '✅' },
            { label: 'Total Spent',    value: `$${totalSpent.toLocaleString()}`, icon: '💳' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-3">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-lg font-bold text-[#191c1e]">
                {loading ? <span className="inline-block w-8 h-5 bg-[#e0e3e5] rounded animate-pulse" /> : value}
              </div>
              <div className="text-xs text-[#76777d] font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[#eceef0] rounded-lg p-1 mb-5 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-md transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-white text-[#191c1e] font-semibold shadow-sm'
                  : 'text-[#45464d] font-medium hover:text-[#191c1e]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden animate-pulse">
                <div className="flex">
                  <div className="w-44 h-36 bg-[#e0e3e5] flex-shrink-0" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-4 bg-[#e0e3e5] rounded w-2/3" />
                    <div className="h-3 bg-[#e0e3e5] rounded w-1/3" />
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {[1,2,3,4].map(j => <div key={j} className="h-8 bg-[#e0e3e5] rounded" />)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Reservation Cards ── */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e0e3e5] py-16 text-center">
            <p className="text-3xl mb-3">🏨</p>
            <p className="font-semibold text-[#191c1e]">No reservations found</p>
            <p className="text-sm text-[#76777d] mt-1">Explore properties and book your next stay.</p>
            <Link to="/" className="mt-4 inline-block px-5 py-2.5 bg-[#fea619] text-[#2a1700] text-xs font-bold rounded-xl hover:bg-[#e59410] transition-colors">
              Explore Hotels
            </Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((r) => {
              const hotel = r.hotels || {};
              const room  = r.rooms  || {};
              const imgSrc = hotel.image_url || hotel.cover_image_url || CATEGORY_IMAGE[hotel.category] || CATEGORY_IMAGE.hotel;
              const location = [hotel.city, hotel.country].filter(Boolean).join(', ');
              const dur = nightsBetween(r.check_in, r.check_out);

              return (
                <div key={r.id} className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden hover:shadow-card transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-44 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                      <img src={imgSrc} alt={hotel.name} className="w-full h-full object-cover" loading="lazy"
                        onError={(e) => { e.target.src = CATEGORY_IMAGE.hotel; }} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-[#191c1e] text-sm leading-snug">{hotel.name || 'Hotel'}</h3>
                          <p className="text-xs text-[#76777d] flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {location || 'Location N/A'}
                          </p>
                          {room.type && (
                            <p className="text-[10px] text-[#76777d] mt-0.5">
                              {room.type}{room.room_number ? ` · Room ${room.room_number}` : ''}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                        {[
                          { label: 'Check-in',  value: formatDate(r.check_in) },
                          { label: 'Check-out', value: formatDate(r.check_out) },
                          { label: 'Duration',  value: `${dur} night${dur !== 1 ? 's' : ''}` },
                          { label: 'Guests',    value: `${r.guests || 1} guest${r.guests > 1 ? 's' : ''}` },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] text-[#76777d] uppercase tracking-wide font-semibold">{label}</p>
                            <p className="text-xs font-semibold text-[#191c1e] mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#f2f4f6]">
                        <div>
                          <span className="text-[10px] text-[#76777d] uppercase tracking-wide font-semibold">Total</span>
                          <p className="text-base font-bold text-[#191c1e]">${Number(r.total_amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          {(r.status === 'confirmed' || r.status === 'pending') && (
                            <button
                              onClick={() => handleCancel(r.id)}
                              disabled={cancellingId === r.id}
                              className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                          <Link
                            to={`/hotels/${hotel.id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-[#131b2e] border border-[#c6c6cd] rounded-lg hover:bg-[#f2f4f6] transition-colors"
                          >
                            View Hotel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
