import { useState } from 'react';
import AdminLayout from './AdminLayout';

const STAFF = [
  { id: 1, name: 'Maria Gonzalez', role: 'Housekeeping',    hotel: 'The Azure Resort & Spa', status: 'active',   email: 'maria.g@hosthaven.com',  phone: '+1-555-0101', joined: '2024-03-15' },
  { id: 2, name: 'Tom Bradley',    role: 'Front Desk',      hotel: 'The Azure Resort & Spa', status: 'active',   email: 'tom.b@hosthaven.com',    phone: '+1-555-0102', joined: '2024-05-20' },
  { id: 3, name: 'Anika Singh',    role: 'Manager',         hotel: 'Desert Bloom Resort',    status: 'active',   email: 'anika.s@hosthaven.com',  phone: '+1-555-0103', joined: '2023-11-01' },
  { id: 4, name: 'James Carter',   role: 'Maintenance',     hotel: 'Desert Bloom Resort',    status: 'inactive', email: 'james.c@hosthaven.com',  phone: '+1-555-0104', joined: '2025-01-10' },
  { id: 5, name: 'Yuki Tanaka',    role: 'Concierge',       hotel: 'Metropolis Grand Hotel', status: 'active',   email: 'yuki.t@hosthaven.com',   phone: '+1-555-0105', joined: '2024-08-30' },
  { id: 6, name: 'Lena Fischer',   role: 'Housekeeping',    hotel: 'Metropolis Grand Hotel', status: 'active',   email: 'lena.f@hosthaven.com',   phone: '+1-555-0106', joined: '2025-02-14' },
  { id: 7, name: 'Omar Hassan',    role: 'Security',        hotel: 'The Azure Resort & Spa', status: 'active',   email: 'omar.h@hosthaven.com',   phone: '+1-555-0107', joined: '2024-09-05' },
];

const ROLE_COLORS = {
  'Housekeeping': 'bg-purple-50 text-purple-700',
  'Front Desk':   'bg-blue-50 text-blue-700',
  'Manager':      'bg-amber-50 text-amber-700',
  'Maintenance':  'bg-orange-50 text-orange-600',
  'Concierge':    'bg-teal-50 text-teal-700',
  'Security':     'bg-red-50 text-red-600',
};

export default function AdminStaff() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = STAFF.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    s.hotel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Staff</h1>
            <p className="text-sm text-[#45464d] mt-1">Manage staff members across all properties.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Staff',  value: STAFF.length,                                    color: 'text-[#131b2e]' },
            { label: 'Active',       value: STAFF.filter(s => s.status === 'active').length,  color: 'text-emerald-600' },
            { label: 'Inactive',     value: STAFF.filter(s => s.status === 'inactive').length, color: 'text-[#76777d]' },
            { label: 'Properties',   value: [...new Set(STAFF.map(s => s.hotel))].length,     color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#76777d] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Staff list */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f4f6]">
            <h2 className="font-semibold text-[#191c1e] text-sm">All Staff Members</h2>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff…"
                className="pl-9 pr-4 py-2 text-sm border border-[#e0e3e5] rounded-lg bg-[#f7f9fb] outline-none focus:border-[#131b2e] w-52" />
            </div>
          </div>

          <div className="divide-y divide-[#f7f9fb]">
            {filtered.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f7f9fb] transition-colors">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#131b2e] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 uppercase select-none">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#191c1e] text-sm">{s.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[s.role] ?? 'bg-gray-50 text-gray-600'}`}>
                      {s.role}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                      {s.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-[#76777d] mt-0.5 truncate">{s.hotel} · {s.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <button className="text-xs font-medium text-[#3980f4] hover:underline">Edit</button>
                  <span className="text-[#e0e3e5]">·</span>
                  <button className="text-xs font-medium text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-float w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#191c1e]">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {['Full Name', 'Email Address', 'Phone Number', 'Property / Hotel'].map((f) => (
                <div key={f}>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">{f}</label>
                  <input type="text" placeholder={f} className="form-input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Role</label>
                <select className="form-input cursor-pointer">
                  {Object.keys(ROLE_COLORS).map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm border border-[#c6c6cd] rounded-lg text-[#45464d] hover:bg-[#f2f4f6]">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-semibold bg-[#131b2e] text-white rounded-lg hover:bg-[#1e2d47]">
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
