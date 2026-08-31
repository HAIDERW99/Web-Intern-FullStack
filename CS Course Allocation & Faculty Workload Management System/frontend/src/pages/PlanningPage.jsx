import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  CalendarDays, 
  Plus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  X, 
  Calendar, 
  Clock, 
  Layers, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const PlanningPage = () => {
  const {
    showToast,
    currentSession,
    currentUser,
    sessions,
    addAcademicSession,
    updateSessionLock,
    selectActiveSession,
    convenerPermissions,
  } = useApp();

  const isHOD = currentUser?.role === 'hod';
  const canManageSessions = isHOD || convenerPermissions?.canManageSessions?.allowed;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // New Session Form State
  const [newSessionCode, setNewSessionCode] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newIsCurrent, setNewIsCurrent] = useState(false);

  const handleOpenModal = () => {
    setFormError('');
    setNewSessionCode('');
    setNewSessionName('');
    setNewStartDate(new Date().toISOString().split('T')[0]);
    setNewEndDate('');
    setNewIsCurrent(false);
    setIsModalOpen(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newSessionCode.trim() || !newSessionName.trim()) {
      setFormError('Session Code and Session Name are required.');
      return;
    }

    setIsSaving(true);

    const payload = {
      session_code: newSessionCode.trim().toUpperCase(),
      name: newSessionName.trim(),
      start_date: newStartDate || null,
      end_date: newEndDate || null,
      is_current: newIsCurrent,
    };

    try {
      // 1. Try backend API save (graceful fallback)
      await api.createAcademicSession(payload).catch((err) => {
        console.warn('Backend session creation fallback:', err.message);
      });

      // 2. Persist via global context (localStorage-backed)
      const createdSessionObj = {
        id: `sess-${Date.now()}`,
        code: payload.session_code,
        name: payload.name,
        start_date: payload.start_date,
        end_date: payload.end_date,
        dates: `${payload.start_date || 'TBD'} – ${payload.end_date || 'TBD'}`,
        isCurrent: payload.is_current,
        isLocked: false,
        offeringsCount: 0,
      };

      addAcademicSession(createdSessionObj);

      showToast(`Academic Session ${payload.session_code} created successfully!`, 'success');
      setIsModalOpen(false);
      // Reset form
      setNewSessionCode('');
      setNewSessionName('');
      setNewStartDate('');
      setNewEndDate('');
      setNewIsCurrent(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create academic session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = (sessionCode) => {
    const sess = sessions.find(s => s.code === sessionCode);
    if (!sess) return;
    const newLocked = !sess.isLocked;
    updateSessionLock(sessionCode, newLocked);
    showToast(`Session ${sessionCode} is now ${newLocked ? 'Locked 🔒' : 'Unlocked 🔓'}`, 'info');
  };

  const handleSetActive = (s) => {
    selectActiveSession(s);
    showToast(`Active Session switched to ${s.code} — ${s.name}`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays size={24} className="text-academic-600" />
            <span>Academic Planning &amp; Semester Offerings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure academic sessions, programme semesters, and batch offerings
          </p>
        </div>

        {canManageSessions && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>New Academic Session</span>
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((s) => {
          const isActive = s.code === currentSession?.session_code || s.isCurrent;
          return (
            <div 
              key={s.code} 
              className={`p-5 rounded-2xl bg-white border transition-all shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isActive ? 'border-academic-300 ring-2 ring-academic-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-black text-slate-950 text-lg tracking-tight">{s.code}</span>
                  <span className="text-slate-700 text-sm font-semibold">{s.name}</span>
                  {isActive && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Active Session</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Timeline: {s.dates}</span>
                </div>
                <div className="text-xs font-semibold text-academic-700 mt-1 flex items-center gap-1.5">
                  <Layers size={13} />
                  <span>{s.offeringsCount} Course Offerings Configured</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {!isActive && (
                  <button
                    onClick={() => handleSetActive(s)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
                  >
                    Set as Active
                  </button>
                )}

                {canManageSessions ? (
                  <button
                    onClick={() => handleToggleLock(s.code)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      s.isLocked 
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {s.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>{s.isLocked ? 'Session Locked' : 'Allocations Open'}</span>
                  </button>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                      s.isLocked 
                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {s.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>{s.isLocked ? 'Locked (HOD)' : 'Allocations Open'}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Academic Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-academic-800 via-academic-700 to-academic-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Create Academic Session</h2>
                  <p className="text-xs text-white/80">Configure terms, semester dates &amp; offering scope</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Session Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Session Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionCode}
                    onChange={(e) => setNewSessionCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FA26, SP27"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500 uppercase"
                  />
                </div>

                {/* Session Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Session Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g. Fall Semester 2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-academic-500"
                  />
                </div>
              </div>

              {/* Set as Active Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Set as Current Active Session</div>
                  <p className="text-[11px] text-slate-500">Automatically switch workspace and timetable context</p>
                </div>
                <input
                  type="checkbox"
                  checked={newIsCurrent}
                  onChange={(e) => setNewIsCurrent(e.target.checked)}
                  className="w-4 h-4 text-academic-600 rounded focus:ring-academic-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-academic-600 hover:bg-academic-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60"
                >
                  {isSaving ? 'Creating Session...' : 'Create Session'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningPage;

