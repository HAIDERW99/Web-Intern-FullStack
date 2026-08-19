import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone]       = useState(profile?.phone ?? '');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg]         = useState('');
  const [pwdErr, setPwdErr]         = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq('id', user.id);
      if (err) { setError(err.message); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdErr(''); setPwdMsg('');
    if (newPwd.length < 8) { setPwdErr('Password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdErr('Passwords do not match.'); return; }
    setPwdLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPwd });
      if (err) { setPwdErr(err.message); return; }
      setPwdMsg('Password updated successfully.');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const ROLE_LABELS = { customer: 'Guest', hotel_owner: 'Hotel Owner', admin: 'Administrator' };
  const ROLE_COLORS = { customer: 'bg-blue-50 text-blue-700', hotel_owner: 'bg-amber-50 text-amber-700', admin: 'bg-purple-50 text-purple-700' };
  const role = profile?.role ?? 'customer';

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ── Header card ── */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#131b2e] text-white text-2xl font-bold flex items-center justify-center uppercase flex-shrink-0 select-none">
              {profile?.full_name?.[0] ?? user?.email?.[0] ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[#191c1e] truncate">{profile?.full_name || 'Your Name'}</h1>
              <p className="text-sm text-[#76777d] truncate">{user?.email}</p>
              <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
            <button onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Profile details ── */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
          <h2 className="font-semibold text-[#191c1e] mb-1">Personal Information</h2>
          <p className="text-xs text-[#76777d] mb-5">Update your name and contact details.</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          {saved && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Profile saved successfully.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={user?.email ?? ''} disabled
                className="form-input bg-[#f7f9fb] text-[#76777d] cursor-not-allowed" />
              <p className="text-[11px] text-[#76777d] mt-1">Email cannot be changed here. Contact support.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000" className="form-input" />
            </div>
            <div className="pt-1">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Change password ── */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] p-6">
          <h2 className="font-semibold text-[#191c1e] mb-1">Change Password</h2>
          <p className="text-xs text-[#76777d] mb-5">Choose a strong password of at least 8 characters.</p>

          {pwdErr && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwdErr}</div>
          )}
          {pwdMsg && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{pwdMsg}</div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: 'Current Password', val: currentPwd, set: setCurrentPwd, auto: 'current-password' },
              { label: 'New Password',     val: newPwd,     set: setNewPwd,     auto: 'new-password' },
              { label: 'Confirm New Password', val: confirmPwd, set: setConfirmPwd, auto: 'new-password' },
            ].map(({ label, val, set, auto }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">{label}</label>
                <input type="password" value={val} onChange={(e) => set(e.target.value)}
                  autoComplete={auto} placeholder="••••••••" className="form-input" />
              </div>
            ))}
            <div className="pt-1">
              <button type="submit" disabled={pwdLoading}
                className="px-5 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors disabled:opacity-50">
                {pwdLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Danger zone ── */}
        <div className="bg-white rounded-xl border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-1">Danger Zone</h2>
          <p className="text-xs text-[#76777d] mb-4">These actions are irreversible. Please be certain.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSignOut}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Sign Out of All Devices
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
