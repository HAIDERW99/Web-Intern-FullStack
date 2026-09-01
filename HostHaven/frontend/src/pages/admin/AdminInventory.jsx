import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

const STATUS_CFG = {
  available:   { label: 'Available',   bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  occupied:    { label: 'Occupied',    bg: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500'    },
  maintenance: { label: 'Maintenance', bg: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-500'     },
  cleaning:    { label: 'Cleaning',    bg: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400'   },
};

const STATUS_CYCLE = {
  available:   'occupied',
  occupied:    'cleaning',
  cleaning:    'maintenance',
  maintenance: 'available'
};

export default function AdminInventory() {
  const [rooms, setRooms]         = useState([]);
  const [hotels, setHotels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom]     = useState({ hotel_id: '', room_number: '', type: 'Standard King', price: '150', status: 'available' });
  const [adding, setAdding]       = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  async function fetchData() {
    setLoading(true);
    const [roomsRes, hotelsRes] = await Promise.all([
      supabase.from('rooms').select('*, hotels:hotel_id(name)').order('created_at', { ascending: false }),
      supabase.from('hotels').select('id, name').order('name'),
    ]);

    if (!roomsRes.error) setRooms(roomsRes.data || []);
    if (!hotelsRes.error) setHotels(hotelsRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRoom.hotel_id || !newRoom.room_number || !newRoom.price) return;
    setAdding(true);
    const { data, error } = await supabase.from('rooms').insert([{
      hotel_id:    newRoom.hotel_id,
      room_number: newRoom.room_number.trim(),
      type:        newRoom.type,
      price:       Number(newRoom.price),
      status:      newRoom.status,
    }]).select('*, hotels:hotel_id(name)').maybeSingle();

    if (!error && data) {
      setRooms((prev) => [data, ...prev]);
      setShowModal(false);
      setNewRoom({ hotel_id: '', room_number: '', type: 'Standard King', price: '150', status: 'available' });
      setActionSuccess('Room added successfully!');
      setTimeout(() => setActionSuccess(''), 3000);
    } else if (error) {
      alert(`Could not add room: ${error.message}`);
    }
    setAdding(false);
  };

  const handleSetStatus = async (room, nextStatus) => {
    setUpdatingId(room.id);
    // Optimistic UI update
    setRooms((prev) => prev.map(r => r.id === room.id ? { ...r, status: nextStatus } : r));

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: nextStatus })
        .eq('id', room.id);

      if (error) {
        console.error('Failed to update room status in DB:', error);
      } else {
        setActionSuccess(`Room ${room.room_number || ''} updated to ${nextStatus}!`);
        setTimeout(() => setActionSuccess(''), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = (room) => {
    const next = STATUS_CYCLE[room.status] || 'available';
    handleSetStatus(room, next);
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Inventory</h1>
            <p className="text-sm text-[#45464d] mt-1">Manage room inventory across all registered properties.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-xl hover:bg-[#1e2d47] transition-all shadow-sm cursor-pointer active:scale-98">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add New Room
          </button>
        </div>

        {/* Success Alert */}
        {actionSuccess && (
          <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            {actionSuccess}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <div key={key} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4 shadow-2xs">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-[#76777d] font-semibold uppercase tracking-wider">{cfg.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#191c1e]">
                {loading ? '…' : rooms.filter(r => r.status === key).length}
              </div>
            </div>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-[#e0e3e5] rounded-xl" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-2">🛏️</p>
              <p className="text-sm font-semibold text-[#191c1e]">No rooms in inventory</p>
              <p className="text-xs text-[#76777d] mt-1">Rooms added by owners or admins will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#76777d] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Room #</th>
                    <th className="px-5 py-3.5">Property</th>
                    <th className="px-5 py-3.5">Room Type</th>
                    <th className="px-5 py-3.5">Nightly Rate</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f4f6]">
                  {rooms.map((r) => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.available;
                    const isUpdating = updatingId === r.id;

                    return (
                      <tr key={r.id} className="hover:bg-[#f7f9fb] transition-colors">
                        <td className="px-5 py-4 font-bold text-[#191c1e]">
                          Room {r.room_number || r.id.slice(0, 4)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#191c1e]">
                          {r.hotels?.name || 'Hotel'}
                        </td>
                        <td className="px-5 py-4 text-[#45464d] font-medium">
                          {r.type || 'Standard King'}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#191c1e]">
                          ${Number(r.price || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${cfg.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Direct Status Selector */}
                            <select
                              value={r.status || 'available'}
                              onChange={(e) => handleSetStatus(r, e.target.value)}
                              disabled={isUpdating}
                              className="text-[11px] font-semibold bg-white border border-[#c6c6cd] rounded-lg px-2 py-1 outline-none focus:border-[#131b2e] cursor-pointer"
                            >
                              <option value="available">Available</option>
                              <option value="occupied">Occupied</option>
                              <option value="cleaning">Cleaning</option>
                              <option value="maintenance">Maintenance</option>
                            </select>

                            {/* Cycle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(r)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 border border-[#c6c6cd] bg-white hover:bg-[#131b2e] hover:text-white hover:border-[#131b2e] rounded-lg text-[11px] font-bold text-[#191c1e] transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                              title="Click to cycle to next status"
                            >
                              {isUpdating ? 'Updating…' : 'Cycle Status'}
                            </button>
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

      {/* Add Room Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
              <h2 className="font-bold text-base text-[#191c1e]">Add Room to Inventory</h2>
              <button onClick={() => setShowModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Select Hotel / Property</label>
                <select
                  value={newRoom.hotel_id}
                  onChange={(e) => setNewRoom({ ...newRoom, hotel_id: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                >
                  <option value="">Choose a property…</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Room Number / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. 302"
                  value={newRoom.room_number}
                  onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="Standard King">Standard King</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Family Villa">Family Villa</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Price ($/night)</label>
                  <input
                    type="number"
                    value={newRoom.price}
                    onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                    required
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Initial Status</label>
                <select
                  value={newRoom.status}
                  onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                >
                  <option value="available">🟢 Available</option>
                  <option value="occupied">🔵 Occupied</option>
                  <option value="cleaning">🟡 Cleaning</option>
                  <option value="maintenance">🔴 Maintenance</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47] disabled:opacity-50"
                >
                  {adding ? 'Adding…' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
