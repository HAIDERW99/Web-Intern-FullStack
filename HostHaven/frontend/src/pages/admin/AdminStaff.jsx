import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

const INITIAL_STAFF = [
  {
    id: 'staff-1',
    name: 'Maria Gonzalez',
    role: 'Housekeeping',
    hotel: 'The Azure Resort & Spa',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: true,
    email: 'maria.g@hosthaven.com',
    phone: '+1-555-0101',
    shift: 'Morning (8AM - 4PM)',
    joined: '2024-03-15',
  },
  {
    id: 'staff-2',
    name: 'Tom Bradley',
    role: 'Front Desk',
    hotel: 'The Azure Resort & Spa',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: false,
    email: 'tom.b@hosthaven.com',
    phone: '+1-555-0102',
    shift: 'Day (10AM - 6PM)',
    joined: '2024-05-20',
  },
  {
    id: 'staff-3',
    name: 'Anika Singh',
    role: 'Manager',
    hotel: 'Desert Bloom Resort',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: true,
    email: 'anika.s@hosthaven.com',
    phone: '+1-555-0103',
    shift: 'Day (10AM - 6PM)',
    joined: '2023-11-01',
  },
  {
    id: 'staff-4',
    name: 'James Carter',
    role: 'Maintenance',
    hotel: 'Desert Bloom Resort',
    hotel_id: '',
    status: 'inactive',
    is_available_restaurant: false,
    email: 'james.c@hosthaven.com',
    phone: '+1-555-0104',
    shift: 'On Call (24/7)',
    joined: '2025-01-10',
  },
  {
    id: 'staff-5',
    name: 'Yuki Tanaka',
    role: 'Concierge',
    hotel: 'Metropolis Grand Hotel',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: false,
    email: 'yuki.t@hosthaven.com',
    phone: '+1-555-0105',
    shift: 'Evening (4PM - 12AM)',
    joined: '2024-08-30',
  },
  {
    id: 'staff-6',
    name: 'Lena Fischer',
    role: 'Restaurant & Dining',
    hotel: 'Metropolis Grand Hotel',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: true,
    email: 'lena.f@hosthaven.com',
    phone: '+1-555-0106',
    shift: 'Evening (4PM - 12AM)',
    joined: '2025-02-14',
  },
  {
    id: 'staff-7',
    name: 'Omar Hassan',
    role: 'Security',
    hotel: 'The Azure Resort & Spa',
    hotel_id: '',
    status: 'active',
    is_available_restaurant: false,
    email: 'omar.h@hosthaven.com',
    phone: '+1-555-0107',
    shift: 'Night (12AM - 8AM)',
    joined: '2024-09-05',
  },
];

const ROLE_COLORS = {
  'Housekeeping':        'bg-purple-50 text-purple-700 border-purple-200',
  'Front Desk':          'bg-blue-50 text-blue-700 border-blue-200',
  'Manager':             'bg-amber-50 text-amber-800 border-amber-200',
  'Maintenance':         'bg-orange-50 text-orange-700 border-orange-200',
  'Concierge':           'bg-teal-50 text-teal-700 border-teal-200',
  'Security':            'bg-red-50 text-red-700 border-red-200',
  'Restaurant & Dining': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Chef & Kitchen':      'bg-rose-50 text-rose-800 border-rose-200',
  'Spa & Wellness':      'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Room Service':        'bg-cyan-50 text-cyan-700 border-cyan-200',
};

export default function AdminStaff() {
  const [staff, setStaff] = useState(() => {
    try {
      const saved = localStorage.getItem('hosthaven_admin_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STAFF;
  });

  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hotel: '',
    role: 'Front Desk',
    shift: 'Morning (8AM - 4PM)',
    status: 'active',
    is_available_restaurant: true,
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hosthaven_admin_staff', JSON.stringify(staff));
    } catch (e) {
      console.error(e);
    }
  }, [staff]);

  // Fetch real registered hotels from Supabase
  useEffect(() => {
    async function loadHotels() {
      const { data } = await supabase.from('hotels').select('id, name');
      if (data && data.length > 0) {
        setHotels(data);
      }
    }
    loadHotels();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      hotel: hotels[0]?.name || 'The Azure Resort & Spa',
      role: 'Front Desk',
      shift: 'Morning (8AM - 4PM)',
      status: 'active',
      is_available_restaurant: true,
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      hotel: s.hotel || (hotels[0]?.name || 'The Azure Resort & Spa'),
      role: s.role || 'Front Desk',
      shift: s.shift || 'Morning (8AM - 4PM)',
      status: s.status || 'active',
      is_available_restaurant: s.is_available_restaurant !== false,
    });
  };

  // Save New Staff
  const handleSaveAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please enter staff name and email address.');
      return;
    }

    const newMember = {
      id: `staff-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || '+1-555-0000',
      hotel: formData.hotel || (hotels[0]?.name || 'The Azure Resort & Spa'),
      role: formData.role,
      shift: formData.shift,
      status: formData.status,
      is_available_restaurant: formData.is_available_restaurant,
      joined: new Date().toISOString().slice(0, 10),
    };

    setStaff((prev) => [newMember, ...prev]);
    setShowAddModal(false);
    showToast(`Staff member "${newMember.name}" successfully added!`);
  };

  // Save Edited Staff
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please enter staff name and email address.');
      return;
    }

    setStaff((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              phone: formData.phone.trim(),
              hotel: formData.hotel,
              role: formData.role,
              shift: formData.shift,
              status: formData.status,
              is_available_restaurant: formData.is_available_restaurant,
            }
          : s
      )
    );

    setEditingStaff(null);
    showToast(`Staff member "${formData.name}" updated successfully!`);
  };

  // Toggle Single Staff Status directly from list
  const handleToggleStaffStatus = (id) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = s.status === 'active' ? 'inactive' : 'active';
          return { ...s, status: next };
        }
        return s;
      })
    );
    showToast('Staff status toggled!');
  };

  // Toggle Restaurant Availability directly
  const handleToggleRestaurant = (id) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, is_available_restaurant: !s.is_available_restaurant };
        }
        return s;
      })
    );
    showToast('Restaurant availability updated!');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingStaff) return;
    setStaff((prev) => prev.filter((s) => s.id !== deletingStaff.id));
    showToast(`Staff member "${deletingStaff.name}" has been removed.`);
    setDeletingStaff(null);
  };

  const filtered = staff.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.hotel.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    const matchDept = selectedDept === 'all' || s.role === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Staff Management</h1>
            <p className="text-sm text-[#45464d] mt-1">Manage staff team members, shifts, roles, and restaurant availability.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-xl hover:bg-[#1e2d47] transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            + Add Staff
          </button>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            {toastMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Staff',  value: staff.length,                                    color: 'text-[#131b2e]' },
            { label: 'Active',       value: staff.filter(s => s.status === 'active').length,  color: 'text-emerald-600' },
            { label: 'Inactive',     value: staff.filter(s => s.status === 'inactive').length, color: 'text-[#76777d]' },
            { label: 'Properties',   value: [...new Set(staff.map(s => s.hotel))].length,     color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4 shadow-2xs">
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-[#76777d] font-semibold mt-0.5 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Staff Table Card */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          {/* Filter / Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-5 py-4 border-b border-[#f2f4f6] bg-[#f7f9fb]">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#191c1e] text-sm">All Staff Members</h2>
              <span className="text-xs font-semibold text-[#76777d] bg-white px-2 py-0.5 rounded-full border border-[#e0e3e5]">
                {filtered.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs font-semibold bg-white border border-[#e0e3e5] rounded-xl px-3 py-2 outline-none focus:border-[#131b2e] cursor-pointer"
              >
                <option value="all">All Departments</option>
                {Object.keys(ROLE_COLORS).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative flex-1 sm:flex-initial">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff, property, role…"
                  className="pl-9 pr-4 py-2 text-xs font-medium border border-[#e0e3e5] rounded-xl bg-white outline-none focus:border-[#131b2e] w-full sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-[#f2f4f6]">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#76777d]">
                No staff members found matching your search.
              </div>
            ) : (
              filtered.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-[#f7f9fb] transition-colors">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#131b2e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase select-none shadow-2xs">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-[#191c1e] text-sm">{s.name}</p>
                        
                        {/* Department Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[s.role] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {s.role}
                        </span>

                        {/* Status Toggle Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(s.id)}
                          title="Click to toggle status"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-transform active:scale-95 cursor-pointer ${
                            s.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {s.status === 'active' ? '● Active' : '○ Inactive'}
                        </button>

                        {/* Restaurant Available Option Badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleRestaurant(s.id)}
                          title="Toggle Restaurant Service Availability"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            s.is_available_restaurant !== false
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                          }`}
                        >
                          🍽️ Rest. Available
                        </button>
                      </div>

                      <p className="text-xs text-[#76777d] truncate font-medium">
                        <span className="text-[#191c1e] font-semibold">{s.hotel}</span> &bull; {s.email} &bull; {s.phone}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <span className="text-[11px] text-[#76777d] bg-[#f2f4f6] px-2.5 py-1 rounded-lg font-medium hidden md:inline-block">
                      {s.shift || 'Standard Shift'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="px-3 py-1.5 text-xs font-bold text-[#004395] bg-[#d8e2ff]/60 hover:bg-[#d8e2ff] rounded-lg transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingStaff(s)}
                      className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal 1: Add Staff Member ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
              <h2 className="text-base font-bold text-[#191c1e]">Add Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Gonzalez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="staff@hosthaven.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1-555-0123"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Assigned Property / Hotel</label>
                <select
                  value={formData.hotel}
                  onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                >
                  {hotels.length > 0 ? (
                    hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)
                  ) : (
                    <>
                      <option value="The Azure Resort & Spa">The Azure Resort & Spa</option>
                      <option value="Desert Bloom Resort">Desert Bloom Resort</option>
                      <option value="Metropolis Grand Hotel">Metropolis Grand Hotel</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Department / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    {Object.keys(ROLE_COLORS).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Shift Schedule</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="Morning (8AM - 4PM)">Morning (8AM - 4PM)</option>
                    <option value="Day (10AM - 6PM)">Day (10AM - 6PM)</option>
                    <option value="Evening (4PM - 12AM)">Evening (4PM - 12AM)</option>
                    <option value="Night (12AM - 8AM)">Night (12AM - 8AM)</option>
                    <option value="On Call (24/7)">On Call (24/7)</option>
                  </select>
                </div>
              </div>

              {/* ── Toggles Section ── */}
              <div className="pt-2 border-t border-[#e0e3e5] space-y-3">
                {/* Active Status Toggle */}
                <div className="flex items-center justify-between bg-[#f7f9fb] p-3 rounded-xl border border-[#e0e3e5]">
                  <div>
                    <span className="text-xs font-bold text-[#191c1e] block">Duty Status</span>
                    <span className="text-[11px] text-[#76777d]">Set staff active / available on schedule</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Restaurant & Dining Service Availability Toggle */}
                <div className="flex items-center justify-between bg-teal-50/50 p-3 rounded-xl border border-teal-200">
                  <div>
                    <span className="text-xs font-bold text-teal-950 block">🍽️ Restaurant & Service Availability</span>
                    <span className="text-[11px] text-teal-800">Available for dining, bar & room delivery requests</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available_restaurant}
                      onChange={(e) => setFormData({ ...formData, is_available_restaurant: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47] shadow-sm"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Edit Staff Member ── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
              <h2 className="text-base font-bold text-[#191c1e]">Edit Staff Member</h2>
              <button onClick={() => setEditingStaff(null)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Assigned Property / Hotel</label>
                <select
                  value={formData.hotel}
                  onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                >
                  {hotels.length > 0 ? (
                    hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)
                  ) : (
                    <>
                      <option value="The Azure Resort & Spa">The Azure Resort & Spa</option>
                      <option value="Desert Bloom Resort">Desert Bloom Resort</option>
                      <option value="Metropolis Grand Hotel">Metropolis Grand Hotel</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Department / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    {Object.keys(ROLE_COLORS).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Shift Schedule</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="Morning (8AM - 4PM)">Morning (8AM - 4PM)</option>
                    <option value="Day (10AM - 6PM)">Day (10AM - 6PM)</option>
                    <option value="Evening (4PM - 12AM)">Evening (4PM - 12AM)</option>
                    <option value="Night (12AM - 8AM)">Night (12AM - 8AM)</option>
                    <option value="On Call (24/7)">On Call (24/7)</option>
                  </select>
                </div>
              </div>

              {/* ── Toggles Section ── */}
              <div className="pt-2 border-t border-[#e0e3e5] space-y-3">
                {/* Active Status Toggle */}
                <div className="flex items-center justify-between bg-[#f7f9fb] p-3 rounded-xl border border-[#e0e3e5]">
                  <div>
                    <span className="text-xs font-bold text-[#191c1e] block">Duty Status</span>
                    <span className="text-[11px] text-[#76777d]">Set staff active / available on schedule</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Restaurant Availability Toggle */}
                <div className="flex items-center justify-between bg-teal-50/50 p-3 rounded-xl border border-teal-200">
                  <div>
                    <span className="text-xs font-bold text-teal-950 block">🍽️ Restaurant & Service Availability</span>
                    <span className="text-[11px] text-teal-800">Available for dining, bar & room delivery requests</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available_restaurant}
                      onChange={(e) => setFormData({ ...formData, is_available_restaurant: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47] shadow-sm"
                >
                  Update Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Confirm Delete ── */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="font-bold text-base text-[#191c1e] mb-1">Remove Staff Member?</h3>
            <p className="text-xs text-[#76777d] mb-5">
              Are you sure you want to remove <strong className="text-[#191c1e]">{deletingStaff.name}</strong> from {deletingStaff.hotel}?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
