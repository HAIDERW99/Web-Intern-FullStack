import { useState, useEffect } from 'react';
import OwnerLayout from './OwnerLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  available:   'bg-emerald-100 text-emerald-800 border-emerald-300',
  occupied:    'bg-[#d8e2ff] text-[#004395] border-[#a5c0ff]',
  cleaning:    'bg-[#ffddb8] text-[#653e00] border-[#ffc68a]',
  maintenance: 'bg-red-100 text-red-800 border-red-300',
};

export default function OwnerInventory() {
  const { user } = useAuth();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    async function fetchRooms() {
      setLoading(true);
      // Get owner's hotel IDs
      const { data: hotels } = await supabase
        .from('hotels')
        .select('id')
        .eq('owner_id', user.id);

      if (!hotels || hotels.length === 0) { setLoading(false); return; }

      const hotelIds = hotels.map((h) => h.id);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .in('hotel_id', hotelIds)
        .order('room_number');

      if (!error) setRooms(data || []);
      setLoading(false);
    }
    fetchRooms();
  }, [user]);

  const toggleRoomStatus = async (room) => {
    const STATUS_CYCLE = { available: 'occupied', occupied: 'cleaning', cleaning: 'maintenance', maintenance: 'available' };
    const nextStatus = STATUS_CYCLE[room.status] || 'available';
    setUpdatingId(room.id);
    const { error } = await supabase
      .from('rooms')
      .update({ status: nextStatus })
      .eq('id', room.id);

    if (!error) {
      setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, status: nextStatus } : r));
    }
    setUpdatingId(null);
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Room Inventory</h1>
          <p className="text-xs text-[#76777d]">Track room availability, nightly rates, and maintenance states.</p>
        </div>

        {/* Summary chips */}
        {!loading && rooms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_COLORS).map(([status, cls]) => {
              const count = rooms.filter((r) => r.status === status).length;
              return (
                <span key={status} className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>
                  {count} {status}
                </span>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#e0e3e5] p-5 animate-pulse space-y-4">
                <div className="h-4 bg-[#e0e3e5] rounded w-1/2" />
                <div className="h-6 bg-[#e0e3e5] rounded w-3/4" />
                <div className="h-8 bg-[#e0e3e5] rounded" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e0e3e5] py-16 text-center">
            <p className="text-3xl mb-3">🛏️</p>
            <p className="font-semibold text-[#191c1e]">No rooms added yet</p>
            <p className="text-xs text-[#76777d] mt-1">Add rooms from your dashboard to manage inventory here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl border border-[#e0e3e5] p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#76777d] uppercase">{room.type || 'Room'}</span>
                    <h3 className="text-lg font-bold text-[#191c1e]">Room {room.room_number || room.id?.slice(0, 4)}</h3>
                    <p className="text-xs text-[#45464d]">{room.beds || '—'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_COLORS[room.status] || STATUS_COLORS.available}`}>
                    {room.status}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-[#e0e3e5]">
                  <span className="text-[#76777d]">Nightly Rate</span>
                  <span className="font-bold text-[#191c1e] text-sm">${Number(room.price).toLocaleString()} / night</span>
                </div>

                <button
                  onClick={() => toggleRoomStatus(room)}
                  disabled={updatingId === room.id}
                  className="w-full py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updatingId === room.id ? 'Updating…' : 'Change Status'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
