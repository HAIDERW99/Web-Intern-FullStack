import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

const STATUS_CFG = {
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-600 border-red-200' },
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('All');

  useEffect(() => {
    async function fetchAllBookings() {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:customer_id(full_name),
          hotels:hotel_id(name),
          rooms:room_id(type, room_number)
        `)
        .order('created_at', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    }
    fetchAllBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const statusOk = filter === 'All' || b.status === filter.toLowerCase();
    const guest = b.profiles?.full_name || '';
    const hotel = b.hotels?.name || '';
    const searchOk = !search ||
      guest.toLowerCase().includes(search.toLowerCase()) ||
      hotel.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + Number(b.total_amount || 0), 0);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#191c1e]">Bookings</h1>
          <p className="text-sm text-[#45464d] mt-1">Monitor all reservations across every property in real-time.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Bookings', value: loading ? '…' : bookings.length,                                          color: 'text-[#131b2e]' },
            { label: 'Confirmed',      value: loading ? '…' : bookings.filter(b => b.status === 'confirmed').length,    color: 'text-emerald-600' },
            { label: 'Pending',        value: loading ? '…' : bookings.filter(b => b.status === 'pending').length,      color: 'text-amber-600' },
            { label: 'Total Revenue',  value: loading ? '…' : `$${totalRevenue.toLocaleString()}`,                      color: 'text-[#fea619]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#76777d] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#f2f4f6]">
            {/* Filter pills */}
            <div className="flex gap-1 bg-[#f7f9fb] p-1 rounded-lg">
              {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    filter === f ? 'bg-white text-[#191c1e] shadow-xs' : 'text-[#76777d] hover:text-[#191c1e]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings…"
              className="px-3.5 py-1.5 text-xs border border-[#c6c6cd] rounded-lg outline-none focus:border-[#131b2e] w-full sm:w-52"
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-[#e0e3e5] rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-semibold text-[#191c1e]">No bookings found</p>
              <p className="text-xs text-[#76777d] mt-1">Customer reservations will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#76777d] font-semibold uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Guest</th>
                    <th className="px-5 py-3">Hotel</th>
                    <th className="px-5 py-3">Room</th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {filtered.map((b) => {
                    const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
                    return (
                      <tr key={b.id} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-[#191c1e]">
                          {b.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#191c1e]">{b.profiles?.full_name || 'Guest'}</td>
                        <td className="px-5 py-3.5 text-[#45464d]">{b.hotels?.name || 'Hotel'}</td>
                        <td className="px-5 py-3.5 text-[#76777d]">{b.rooms?.type || 'Room'}{b.rooms?.room_number ? ` ${b.rooms.room_number}` : ''}</td>
                        <td className="px-5 py-3.5 text-[#76777d]">{fmt(b.check_in)} – {fmt(b.check_out)}</td>
                        <td className="px-5 py-3.5 font-bold text-[#191c1e]">${Number(b.total_amount).toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
