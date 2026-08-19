import { useState } from 'react';
import OwnerLayout from './OwnerLayout';

const MOCK_STAFF = [
  { id: 1, name: 'Marcus Vance', role: 'Front Desk Manager', phone: '+1 555-0192', shift: 'Morning (8AM - 4PM)' },
  { id: 2, name: 'Elena Rostova', role: 'Head of Housekeeping', phone: '+1 555-0144', shift: 'Day (10AM - 6PM)' },
  { id: 3, name: 'James Patterson', role: 'Maintenance Lead', phone: '+1 555-0811', shift: 'On Call (24/7)' },
  { id: 4, name: 'Aaliyah Rivera', role: 'Guest Experience Specialist', phone: '+1 555-0377', shift: 'Evening (4PM - 12AM)' },
];

export default function OwnerStaff() {
  const [staffList, setStaffList] = useState(MOCK_STAFF);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Staff Management</h1>
            <p className="text-xs text-[#76777d]">Assign shifts and manage hotel staff team members.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] text-[#45464d] font-semibold uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Shift Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5] text-[#191c1e]">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-[#f7f9fb] transition-colors">
                  <td className="p-4 font-bold">{s.name}</td>
                  <td className="p-4 text-[#45464d] font-medium">{s.role}</td>
                  <td className="p-4 text-[#45464d]">{s.phone}</td>
                  <td className="p-4 text-[#3980f4] font-semibold">{s.shift}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </OwnerLayout>
  );
}
