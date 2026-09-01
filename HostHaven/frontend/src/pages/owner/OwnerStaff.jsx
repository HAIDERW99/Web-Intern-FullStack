import { useState, useEffect } from 'react';
import OwnerLayout from './OwnerLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_STAFF = [
  { id: 'os-1', name: 'Marcus Vance', role: 'Front Desk Manager', phone: '+1 555-0192', shift: 'Morning (8AM - 4PM)', status: 'active', is_available_restaurant: false },
  { id: 'os-2', name: 'Elena Rostova', role: 'Head of Housekeeping', phone: '+1 555-0144', shift: 'Day (10AM - 6PM)', status: 'active', is_available_restaurant: false },
  { id: 'os-3', name: 'James Patterson', role: 'Maintenance Lead', phone: '+1 555-0811', shift: 'On Call (24/7)', status: 'active', is_available_restaurant: false },
  { id: 'os-4', name: 'Aaliyah Rivera', role: 'Restaurant & Dining', phone: '+1 555-0377', shift: 'Evening (4PM - 12AM)', status: 'active', is_available_restaurant: true },
];

export default function OwnerStaff() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('hosthaven_owner_staff');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STAFF;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Front Desk',
    phone: '',
    shift: 'Morning (8AM - 4PM)',
    status: 'active',
    is_available_restaurant: true,
  });

  useEffect(() => {
    try {
      localStorage.setItem('hosthaven_owner_staff', JSON.stringify(staffList));
    } catch (e) {
      console.error(e);
    }
  }, [staffList]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      role: 'Front Desk',
      phone: '',
      shift: 'Morning (8AM - 4PM)',
      status: 'active',
      is_available_restaurant: true,
    });
    setEditingStaff(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormData({
      name: s.name,
      role: s.role,
      phone: s.phone,
      shift: s.shift,
      status: s.status || 'active',
      is_available_restaurant: s.is_available_restaurant !== false,
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaff) {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? { ...s, ...formData, name: formData.name.trim() }
            : s
        )
      );
    } else {
      const newStaff = {
        id: `os-${Date.now()}`,
        ...formData,
        name: formData.name.trim(),
      };
      setStaffList((prev) => [newStaff, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Staff Management</h1>
            <p className="text-xs text-[#76777d]">Assign shifts, roles, and manage restaurant/room service staff.</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#fea619] text-[#2a1700] text-xs font-bold rounded-xl hover:bg-[#e89600] transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            + Add Staff Member
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#45464d] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Department / Role</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Shift Schedule</th>
                  <th className="p-4">Service Availability</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3e5] text-[#191c1e]">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="p-4 font-bold text-sm">{s.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f2f4f6] text-[#45464d]">
                        {s.role}
                      </span>
                    </td>
                    <td className="p-4 text-[#45464d]">{s.phone || '—'}</td>
                    <td className="p-4 text-[#004395] font-semibold">{s.shift}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.is_available_restaurant
                          ? 'bg-teal-50 text-teal-800 border border-teal-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.is_available_restaurant ? '🍽️ Dining & Room Delivery' : 'Standard Duty'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-2.5 py-1 text-xs font-bold text-[#004395] bg-[#d8e2ff]/50 hover:bg-[#d8e2ff] rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
              <h2 className="text-base font-bold text-[#191c1e]">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Role / Dept</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Manager">Manager</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Restaurant & Dining">Restaurant & Dining</option>
                    <option value="Chef & Kitchen">Chef & Kitchen</option>
                    <option value="Room Service">Room Service</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Shift</label>
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

              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555-0192"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />
              </div>

              {/* Restaurant Availability Toggle */}
              <div className="flex items-center justify-between bg-teal-50/60 p-3 rounded-xl border border-teal-200">
                <div>
                  <span className="text-xs font-bold text-teal-950 block">🍽️ Restaurant & Service Available</span>
                  <span className="text-[11px] text-teal-800">Assign to restaurant orders and room deliveries</span>
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

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47] shadow-sm"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
}
