import { useState, useEffect } from 'react';
import OwnerLayout from './OwnerLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings]   = useState([]);
  const [hotels, setHotels]       = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionAlert, setActionAlert] = useState('');

  async function fetchBookings() {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get all owner hotels
      const { data: ownerHotels, error: hErr } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('owner_id', user.id);

      if (hErr) console.error(hErr);

      if (!ownerHotels || ownerHotels.length === 0) {
        setHotels([]);
        setBookings([]);
        setLoading(false);
        return;
      }

      setHotels(ownerHotels);
      const hotelIds = ownerHotels.map((h) => h.id);

      // 2. Query bookings with hotel & room details
      const { data: rawBookings, error: bErr } = await supabase
        .from('bookings')
        .select(`
          *,
          hotels:hotel_id(id, name),
          rooms:room_id(type, room_number)
        `)
        .in('hotel_id', hotelIds)
        .order('created_at', { ascending: false });

      if (bErr) {
        console.error('Failed to load bookings:', bErr);
      }

      const bookingsList = rawBookings || [];

      // 3. Batch fetch customer profiles
      const customerIds = [...new Set(bookingsList.map((b) => b.customer_id).filter(Boolean))];
      let profileMap = {};
      if (customerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', customerIds);

        if (profilesData) {
          profilesData.forEach((p) => {
            profileMap[p.id] = p;
          });
        }
      }

      const enriched = bookingsList.map((b) => ({
        ...b,
        profiles: profileMap[b.customer_id] || { full_name: 'Guest', email: '—', phone: '—' },
      }));

      setBookings(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Real-time Supabase subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`owner-bookings-live-sync-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleUpdateStatus = async (bookingId, nextStatus, msg) => {
    setUpdatingId(bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );

    const { error } = await supabase
      .from('bookings')
      .update({ status: nextStatus })
      .eq('id', bookingId);

    if (!error) {
      setActionAlert(msg || `Booking status updated to ${nextStatus}!`);
      setTimeout(() => setActionAlert(''), 3000);
    } else {
      console.error(error);
      fetchBookings();
    }
    setUpdatingId(null);
  };

  const filtered = bookings.filter((b) => {
    const guestName = b.profiles?.full_name || '';
    const hotelName = b.hotels?.name || '';
    const matchHotel = selectedHotelId === 'all' || b.hotel_id === selectedHotelId;
    const matchFilter = filter === 'all' || b.status === filter;
    const matchSearch =
      guestName.toLowerCase().includes(search.toLowerCase()) ||
      hotelName.toLowerCase().includes(search.toLowerCase()) ||
      b.id?.toLowerCase().includes(search.toLowerCase());

    return matchHotel && matchFilter && matchSearch;
  });

  const STATUS_BADGES = {
    confirmed:  'bg-blue-100 text-blue-800 border-blue-300',
    checked_in: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pending:    'bg-amber-100 text-amber-800 border-amber-300',
    completed:  'bg-purple-100 text-purple-800 border-purple-300',
    cancelled:  'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Property Bookings</h1>
            <p className="text-xs text-[#76777d]">Manage guest reservations, Check-In, and Check-Out operations in real time.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Hotel Filter */}
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="p-2.5 px-3 rounded-xl border border-[#c6c6cd] text-xs bg-white font-semibold focus:border-[#131b2e] outline-none cursor-pointer"
            >
              <option value="all">🏢 All Properties ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>🏨 {h.name}</option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search guest, hotel, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2.5 px-4 rounded-xl border border-[#c6c6cd] text-xs bg-white focus:border-[#131b2e] outline-none flex-1 sm:w-56"
            />
          </div>
        </div>

        {/* Action Alert */}
        {actionAlert && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            {actionAlert}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['all', 'confirmed', 'checked_in', 'pending', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                filter === tab ? 'bg-[#131b2e] text-white shadow-xs' : 'bg-white text-[#45464d] border border-[#e0e3e5] hover:bg-[#f2f4f6]'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-[#e0e3e5] rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm font-semibold text-[#191c1e]">No bookings found</p>
              <p className="text-xs text-[#76777d] mt-1">Bookings for your approved properties will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#45464d] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Property & Room</th>
                    <th className="p-4">Guest Details</th>
                    <th className="p-4">Check-In / Out</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e3e5] text-[#191c1e]">
                  {filtered.map((b) => {
                    const isUpdating = updatingId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-[#191c1e] text-xs">{b.hotels?.name || 'Property'}</p>
                          <p className="text-[11px] text-[#76777d] font-medium">
                            {b.rooms?.type || 'Room'}{b.rooms?.room_number ? ` #${b.rooms.room_number}` : ''}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-[#191c1e]">{b.profiles?.full_name || 'Guest'}</p>
                          <p className="text-[10px] text-[#76777d]">{b.profiles?.email || `${b.guests || 1} guest${(b.guests || 1) > 1 ? 's' : ''}`}</p>
                        </td>

                        <td className="p-4">
                          <p className="font-semibold text-[#191c1e]">{b.check_in}</p>
                          <p className="text-[11px] text-[#76777d]">to {b.check_out}</p>
                        </td>

                        <td className="p-4 font-bold text-[#191c1e] text-sm">
                          ${Number(b.total_amount).toLocaleString()}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${STATUS_BADGES[b.status] || 'bg-gray-100 text-gray-700'}`}>
                            {b.status?.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Check-In Action (When confirmed or pending) */}
                            {(b.status === 'confirmed' || b.status === 'pending') && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'checked_in', `Guest ${b.profiles?.full_name || ''} checked in!`)}
                                disabled={isUpdating}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">key</span>
                                <span>Check In</span>
                              </button>
                            )}

                            {/* Check-Out Action (When checked_in) */}
                            {b.status === 'checked_in' && (
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'completed', `Guest ${b.profiles?.full_name || ''} checked out!`)}
                                disabled={isUpdating}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-[#004395] hover:bg-[#003170] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span>Check Out</span>
                              </button>
                            )}

                            {/* Quick status selector */}
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                              disabled={isUpdating}
                              className="text-[11px] font-semibold bg-white border border-[#c6c6cd] rounded-lg px-2 py-1 outline-none focus:border-[#131b2e] cursor-pointer"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="checked_in">Checked In</option>
                              <option value="completed">Completed</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
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
    </OwnerLayout>
  );
}
