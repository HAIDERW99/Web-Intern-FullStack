import { useState, useEffect } from 'react';
import OwnerLayout from './OwnerLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    if (!user) return;
    async function fetchBookings() {
      setLoading(true);
      // Get owner's hotel IDs first
      const { data: hotels } = await supabase
        .from('hotels')
        .select('id')
        .eq('owner_id', user.id);

      if (!hotels || hotels.length === 0) { setLoading(false); return; }

      const hotelIds = hotels.map((h) => h.id);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:customer_id(full_name),
          hotels:hotel_id(name),
          rooms:room_id(type, room_number)
        `)
        .in('hotel_id', hotelIds)
        .order('created_at', { ascending: false });

      if (!error) setBookings(data || []);
      setLoading(false);
    }
    fetchBookings();
  }, [user]);

  const filtered = bookings.filter((b) => {
    const guestName = b.profiles?.full_name || '';
    const matchFilter = filter === 'all' || b.status === filter;
    const matchSearch = guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.id?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });


  const STATUS_BADGES = {
    confirmed:  'bg-[#d8e2ff] text-[#004395]',
    checked_in: 'bg-emerald-100 text-emerald-800',
    pending:    'bg-[#ffddb8] text-[#653e00]',
    completed:  'bg-slate-100 text-slate-700',
    cancelled:  'bg-red-100 text-red-700',
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Property Bookings</h1>
            <p className="text-xs text-[#76777d]">Manage guest reservations & check-in schedules.</p>
          </div>
          <input
            type="text"
            placeholder="Search guest or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2.5 px-4 rounded-xl border border-[#c6c6cd] text-xs bg-white focus:border-[#131b2e] outline-none w-full sm:w-64"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'confirmed', 'checked_in', 'pending', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize whitespace-nowrap cursor-pointer transition-colors ${
                filter === tab ? 'bg-[#131b2e] text-white' : 'bg-white text-[#45464d] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-[#e0e3e5] rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-semibold text-[#191c1e]">No bookings found</p>
              <p className="text-xs text-[#76777d] mt-1">Bookings for your approved hotels will appear here.</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#45464d] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3e5] text-[#191c1e]">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="p-4 font-bold text-[10px]">{b.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-4 font-medium">{b.profiles?.full_name || 'Guest'}</td>
                    <td className="p-4 text-[#45464d]">
                      {b.rooms?.type || 'Room'}{b.rooms?.room_number ? ` ${b.rooms.room_number}` : ''}
                    </td>
                    <td className="p-4 text-[#45464d]">{b.check_in}</td>
                    <td className="p-4 text-[#45464d]">{b.check_out}</td>
                    <td className="p-4 font-bold text-[#191c1e]">${Number(b.total_amount).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${STATUS_BADGES[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}
