import { useState } from 'react';
import AdminLayout from './AdminLayout';

export default function AdminSettings() {
  const [platformName, setPlatformName]   = useState('HostHaven');
  const [supportEmail, setSupportEmail]   = useState('support@hosthaven.com');
  const [reviewDays, setReviewDays]       = useState('48');
  const [maintenanceMode, setMaintenance] = useState(false);
  const [emailNotif, setEmailNotif]       = useState(true);
  const [saved, setSaved]                 = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#191c1e]">Settings</h1>
          <p className="text-sm text-[#45464d] mt-1">Configure platform-wide settings.</p>
        </div>

        {saved && (
          <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Settings saved successfully.
          </div>
        )}

        <div className="space-y-5">
          {/* Platform */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5">
            <h2 className="font-semibold text-[#191c1e] mb-4 text-sm">Platform Configuration</h2>
            <div className="space-y-4">
              {[
                { label: 'Platform Name', value: platformName, set: setPlatformName },
                { label: 'Support Email', value: supportEmail, set: setSupportEmail },
                { label: 'Application Review Period (hours)', value: reviewDays, set: setReviewDays, type: 'number' },
              ].map(({ label, value, set, type = 'text' }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={type} value={value} onChange={(e) => set(e.target.value)} className="form-input" />
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5">
            <h2 className="font-semibold text-[#191c1e] mb-4 text-sm">Platform Toggles</h2>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Send email alerts for new applications, bookings, and approvals.', val: emailNotif, set: setEmailNotif },
                { label: 'Maintenance Mode',    desc: 'Take the platform offline for guests while keeping admin access.', val: maintenanceMode, set: setMaintenance, danger: true },
              ].map(({ label, desc, val, set, danger }) => (
                <div key={label} className={`flex items-start justify-between gap-4 p-3 rounded-xl ${danger && val ? 'bg-red-50 border border-red-100' : 'bg-[#f7f9fb]'}`}>
                  <div>
                    <p className={`text-sm font-semibold ${danger && val ? 'text-red-600' : 'text-[#191c1e]'}`}>{label}</p>
                    <p className="text-xs text-[#76777d] mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  <button
                    onClick={() => set(v => !v)}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
                      ${val ? (danger ? 'bg-red-500' : 'bg-[#131b2e]') : 'bg-[#d8dadc]'}`}
                    role="switch" aria-checked={val}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                      ${val ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave}
              className="px-6 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
