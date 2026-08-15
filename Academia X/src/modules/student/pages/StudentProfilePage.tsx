/**
 * StudentProfilePage — Editable student profile with avatar upload and Supabase sync.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Hash,
  Clock, BookOpen, Edit2, Save, X, Camera, RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@components/common/Skeleton';
import { useAuth } from '@hooks/useAuth';
import { getStudentProfile, updateStudentProfile, uploadStudentAvatar } from '@services/student.service';
import type { StudentProfile } from '@services/student.service';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const studentId = user?.id ?? '';

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentProfile(studentId);
      setProfile(data);
      setPhone(data?.phone ?? '');
      setAddress(data?.address ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudentProfile(studentId, { phone, address });
      setProfile((prev) => prev ? { ...prev, phone, address } : prev);
      setEditing(false);
      setToastMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadStudentAvatar(file, studentId);
      await updateStudentProfile(studentId, { avatar_url: url });
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
      setToastMsg({ type: 'success', text: 'Profile picture updated!' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setToastMsg({ type: 'error', text: 'Failed to upload profile picture.' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 pb-8">
        <Skeleton className="h-8 w-48" />
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div>
          </div>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">View and update your personal information.</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors">
            <Edit2 className="w-4 h-4" />Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(false); setPhone(profile?.phone ?? ''); setAddress(profile?.address ?? ''); }}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <X className="w-4 h-4" />Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {toastMsg && (
        <div role="status" className={`rounded-lg px-4 py-3 text-sm font-medium border flex items-center justify-between ${toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-xs underline font-semibold">Dismiss</button>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {profile?.full_name?.[0]?.toUpperCase() ?? 'S'}
                  </span>
                )}
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white text-blue-600 shadow-md hover:bg-blue-50 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile?.full_name ?? '—'}</h2>
              <p className="text-blue-100 text-sm mt-0.5">{profile?.email ?? '—'}</p>
              <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 capitalize">
                {profile?.role ?? 'Student'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Read-only fields */}
          {[
            { label: 'Full Name', value: profile?.full_name, icon: User },
            { label: 'Father Name', value: profile?.father_name, icon: User },
            { label: 'Email Address', value: profile?.email, icon: Mail },
            { label: 'Roll / App ID', value: profile?.roll_id, icon: Hash },
            { label: 'Enrolled Course', value: profile?.batch ? `Batch ${profile.batch}` : null, icon: BookOpen },
            { label: 'Class Timing', value: profile?.timing, icon: Clock },
            { label: 'Enrollment Date', value: profile?.enrollment_date ? new Date(profile.enrollment_date).toLocaleDateString() : null, icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{value ?? '—'}</p>
            </div>
          ))}

          {/* Editable: Phone */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</span>
              {editing && <span className="text-xs text-blue-600 font-medium">(Editable)</span>}
            </div>
            {editing ? (
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full mt-1 px-0 py-0 border-0 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
            ) : (
              <p className="text-sm font-semibold text-slate-800">{profile?.phone ?? '—'}</p>
            )}
          </div>

          {/* Editable: Address */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3 sm:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Home Address</span>
              {editing && <span className="text-xs text-blue-600 font-medium">(Editable)</span>}
            </div>
            {editing ? (
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                placeholder="Enter your home address…"
                className="w-full mt-1 px-0 py-0 border-0 bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none" />
            ) : (
              <p className="text-sm font-semibold text-slate-800">{profile?.address ?? '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
