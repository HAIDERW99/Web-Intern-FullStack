import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

const CATEGORY_COLORS = {
  'hotel':     'bg-blue-50 text-blue-700 border border-blue-200',
  'resort':    'bg-purple-50 text-purple-700 border border-purple-200',
  'villa':     'bg-amber-50 text-amber-700 border border-amber-200',
  'apartment': 'bg-green-50 text-green-700 border border-green-200',
};

const STATUS_TABS = ['Pending', 'Approved', 'Changes Requested', 'Rejected', 'Suspended'];

const CLEANING_REQUESTS_INIT = [
  { id: 'c1', room: 'Room 402', type: 'Checkout',  urgency: 'urgent',    assignedTo: '' },
  { id: 'c2', room: 'Room 105', type: 'Standard',  urgency: 'scheduled', scheduledAt: '2PM', assignedTo: '' },
  { id: 'c3', room: 'Room 213', type: 'Deep Clean', urgency: 'normal',   assignedTo: '' },
  { id: 'c4', room: 'Room 318', type: 'Checkout',  urgency: 'urgent',    assignedTo: '' },
];

const TEAMS = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];

// ─── Review Modal ─────────────────────────────────────────────────────────
function ReviewModal({ app, onClose, onApprove, onReject, onRequestChanges, loading }) {
  const [reason, setReason]             = useState('');
  const [actionType, setActionType]     = useState(null); // 'reject' | 'changes' | null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e3e5]">
          <h2 className="font-semibold text-[#191c1e]">Review Property Application</h2>
          <button onClick={onClose} className="text-[#76777d] hover:text-[#191c1e] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3 bg-[#f7f9fb] rounded-xl">
            <div className="w-12 h-12 rounded-lg bg-[#e0e3e5] overflow-hidden flex items-center justify-center flex-shrink-0">
              {app.image_url ? (
                <img src={app.image_url} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-[#76777d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-[#191c1e] text-sm">{app.name}</p>
              <p className="text-xs text-[#76777d]">
                {[app.address, app.city, app.country].filter(Boolean).join(', ')} · {app.room_count || 0} rooms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { label: 'Submitted By', value: app.profiles?.full_name || app.contact_name || 'Owner' },
              { label: 'Category',     value: app.category?.toUpperCase() },
              { label: 'Email',        value: app.contact_email || '—' },
              { label: 'Phone',        value: app.contact_phone || '—' },
              { label: 'Business',     value: app.business_name || '—' },
              { label: 'Base Price',   value: `$${app.price_per_night || 150}/night` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#f7f9fb] rounded-lg px-3 py-2">
                <p className="text-[#76777d] text-[10px] uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                <p className="font-medium text-[#191c1e] truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Attached Documents Status */}
          <div className="p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] space-y-1.5">
            <p className="text-[11px] font-bold text-[#191c1e] uppercase tracking-wider">Submitted Documents</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${app.license_doc_name ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-[#45464d] truncate">
                  License: {app.license_doc_name || 'Not attached'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${app.owner_id_doc_name ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-[#45464d] truncate">
                  Owner ID: {app.owner_id_doc_name || 'Not attached'}
                </span>
              </div>
            </div>
          </div>

          {actionType === 'reject' && (
            <div>
              <label className="block text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this property is being rejected…"
                className="w-full px-3 py-2.5 rounded-lg border border-red-300 text-xs text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none"
              />
            </div>
          )}

          {actionType === 'changes' && (
            <div>
              <label className="block text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1.5">
                Required Details / Changes for Owner <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Please attach a clear scan of your business license and valid CNIC..."
                className="w-full px-3 py-2.5 rounded-lg border border-amber-300 text-xs text-[#191c1e] placeholder:text-[#76777d] focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex flex-wrap gap-2">
          {!actionType ? (
            <>
              <button
                onClick={() => setActionType('reject')}
                className="px-4 py-2.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setActionType('changes')}
                className="px-4 py-2.5 text-xs font-semibold text-amber-800 border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                Require Docs / Info
              </button>
              <button
                onClick={() => onApprove(app.id)}
                disabled={loading}
                className="flex-1 py-2.5 text-xs font-semibold bg-[#131b2e] text-white rounded-lg hover:bg-[#1e2d47] transition-colors disabled:opacity-50"
              >
                {loading ? 'Approving…' : 'Approve & Publish'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setActionType(null); setReason(''); }}
                className="px-4 py-2.5 text-xs font-medium border border-[#c6c6cd] text-[#45464d] rounded-lg hover:bg-[#f2f4f6] transition-colors"
              >
                Back
              </button>
              {actionType === 'reject' && (
                <button
                  onClick={() => reason.trim() && onReject(app.id, reason)}
                  disabled={!reason.trim() || loading}
                  className="flex-1 py-2.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Confirm Reject'}
                </button>
              )}
              {actionType === 'changes' && (
                <button
                  onClick={() => reason.trim() && onRequestChanges(app.id, reason)}
                  disabled={!reason.trim() || loading}
                  className="flex-1 py-2.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Send Requirements to Owner'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Pending');
  const [search, setSearch]       = useState('');
  const [hotels, setHotels]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewApp, setReviewApp] = useState(null);
  const [toast, setToast]         = useState({ msg: '', type: 'success' });
  const [cleaning, setCleaning]   = useState(CLEANING_REQUESTS_INIT);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  async function fetchHotels() {
    setLoading(true);
    const { data, error } = await supabase
      .from('hotels')
      .select('*, profiles:owner_id(full_name, role)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hotels:', error.message);
      showToast('Failed to load applications.', 'error');
    } else {
      setHotels(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchHotels(); }, []);

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('hotels')
      .update({ status: 'approved', rejection_reason: null, admin_notes: null })
      .eq('id', id);

    if (error) {
      showToast('❌ Failed to approve: ' + error.message, 'error');
    } else {
      setHotels((prev) => prev.map((h) => h.id === id ? { ...h, status: 'approved', rejection_reason: null, admin_notes: null } : h));
      setReviewApp(null);
      showToast('✅ Property approved and is now visible to customers!');
    }
    setActionLoading(false);
  };

  // ── Request Changes ──────────────────────────────────────────────────────
  const handleRequestChanges = async (id, notes) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('hotels')
      .update({ status: 'changes_requested', admin_notes: notes })
      .eq('id', id);

    if (error) {
      showToast('❌ Failed to send request: ' + error.message, 'error');
    } else {
      setHotels((prev) => prev.map((h) => h.id === id ? { ...h, status: 'changes_requested', admin_notes: notes } : h));
      setReviewApp(null);
      showToast('📝 Requirements sent to owner dashboard.');
    }
    setActionLoading(false);
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = async (id, reason) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('hotels')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);

    if (error) {
      showToast('❌ Failed to reject: ' + error.message, 'error');
    } else {
      setHotels((prev) => prev.map((h) => h.id === id ? { ...h, status: 'rejected', rejection_reason: reason } : h));
      setReviewApp(null);
      showToast('Application rejected.', 'error');
    }
    setActionLoading(false);
  };

  // ── Suspend ──────────────────────────────────────────────────────────────
  const handleSuspend = async (id) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('hotels')
      .update({ status: 'suspended' })
      .eq('id', id);

    if (!error) {
      setHotels((prev) => prev.map((h) => h.id === id ? { ...h, status: 'suspended' } : h));
      showToast('⚠️ Property suspended.', 'error');
    }
    setActionLoading(false);
  };

  const assignTeam = (id, team) => {
    setCleaning((prev) => prev.map((c) => c.id === id ? { ...c, assignedTo: team } : c));
  };

  // Filter by tab + search
  const tabStatusMap = {
    'Pending': 'pending',
    'Approved': 'approved',
    'Changes Requested': 'changes_requested',
    'Rejected': 'rejected',
    'Suspended': 'suspended',
  };

  const filtered = hotels.filter((h) => {
    const targetStatus = tabStatusMap[activeTab];
    const tabMatch = h.status === targetStatus;
    const searchMatch = !search ||
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase());
    return tabMatch && searchMatch;
  });

  const counts = {
    pending:           hotels.filter((h) => h.status === 'pending').length,
    approved:          hotels.filter((h) => h.status === 'approved').length,
    changes_requested: hotels.filter((h) => h.status === 'changes_requested').length,
    rejected:          hotels.filter((h) => h.status === 'rejected').length,
    suspended:         hotels.filter((h) => h.status === 'suspended').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 min-h-full">

        {/* ── Toast ── */}
        {toast.msg && (
          <div className={`fixed top-4 right-4 z-50 text-sm font-medium px-4 py-3 rounded-xl shadow-float ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#131b2e] text-white'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1e]">Application Management</h1>
          <p className="text-sm text-[#45464d] mt-1">Review and manage incoming property applications.</p>
        </div>

        {/* ── Status Tabs ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          {STATUS_TABS.map((tab) => {
            const statusKey = tabStatusMap[tab];
            const count = counts[statusKey] || 0;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border cursor-pointer
                  ${activeTab === tab
                    ? 'bg-[#fea619]/10 text-[#855300] border-[#fea619]'
                    : 'bg-white text-[#45464d] border-[#e0e3e5] hover:border-[#c6c6cd] hover:text-[#191c1e]'}`}
              >
                {tab}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${activeTab === tab ? 'bg-[#fea619] text-[#2a1700]' : 'bg-[#e0e3e5] text-[#76777d]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Applications Panel ── */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
            {/* Panel header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#f2f4f6]">
              <h2 className="font-semibold text-[#191c1e]">
                {activeTab} Review{' '}
                <span className="text-[#76777d] font-normal">({filtered.length})</span>
              </h2>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search applications…"
                  className="pl-9 pr-4 py-2 text-sm border border-[#e0e3e5] rounded-lg bg-[#f7f9fb] text-[#191c1e] placeholder:text-[#76777d] outline-none focus:border-[#131b2e] w-full sm:w-56"
                />
              </div>
            </div>

            {/* Application list */}
            <div className="divide-y divide-[#f2f4f6]">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-12 h-12 bg-[#e0e3e5] rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#e0e3e5] rounded w-2/3" />
                        <div className="h-3 bg-[#e0e3e5] rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <svg className="w-10 h-10 text-[#c6c6cd] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-[#191c1e]">No {activeTab.toLowerCase()} applications</p>
                  <p className="text-xs text-[#76777d] mt-1">
                    {search ? 'Try a different search term.' : `All ${activeTab.toLowerCase()} applications will appear here.`}
                  </p>
                </div>
              ) : (
                filtered.map((hotel) => {
                  const location = [hotel.city, hotel.country].filter(Boolean).join(', ');
                  const submittedAgo = hotel.created_at
                    ? Math.round((Date.now() - new Date(hotel.created_at)) / 3600000)
                    : '?';
                  return (
                    <div key={hotel.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f7f9fb] transition-colors group">
                      {/* Hotel icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#eceef0] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {hotel.image_url ? (
                          <img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <svg className="w-6 h-6 text-[#76777d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#191c1e] text-sm truncate">{hotel.name}</p>
                        <p className="text-xs text-[#76777d] mt-0.5">
                          {hotel.contact_name || hotel.profiles?.full_name || 'Owner'}
                          {typeof submittedAgo === 'number' ? ` · ${submittedAgo}h ago` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[hotel.category] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                            {hotel.category}
                          </span>
                          {location && (
                            <span className="text-[11px] text-[#76777d] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(hotel.status === 'pending' || hotel.status === 'changes_requested') && (
                          <button
                            onClick={() => setReviewApp(hotel)}
                            className="px-4 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                        )}
                        {hotel.status === 'approved' && (
                          <>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Approved
                            </span>
                            <button
                              onClick={() => handleSuspend(hotel.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          </>
                        )}
                        {hotel.status === 'rejected' && (
                          <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                            Rejected
                          </span>
                        )}
                        {hotel.status === 'suspended' && (
                          <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Cleaning Requests Panel ── */}
          <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f2f4f6]">
              <div className="w-8 h-8 rounded-lg bg-[#fea619]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#fea619]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-[#191c1e] text-sm">Cleaning Requests</h2>
                <p className="text-[11px] text-[#76777d]">{cleaning.filter(c => !c.assignedTo).length} unassigned</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {cleaning.map((c) => (
                <div key={c.id} className="border border-[#e0e3e5] rounded-xl p-3.5 hover:border-[#c6c6cd] transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#191c1e]">{c.room} - {c.type}</p>
                    {c.urgency === 'urgent' && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex-shrink-0">Urgent</span>
                    )}
                    {c.urgency === 'scheduled' && (
                      <span className="text-[10px] font-medium text-[#76777d] flex-shrink-0">@ {c.scheduledAt}</span>
                    )}
                  </div>
                  <div className="relative mt-2">
                    <select
                      value={c.assignedTo || ''}
                      onChange={(e) => assignTeam(c.id, e.target.value)}
                      className={`w-full appearance-none text-xs font-medium px-3 py-2 pr-8 rounded-lg border outline-none cursor-pointer transition-colors
                        ${c.assignedTo
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-[#e0e3e5] bg-[#f7f9fb] text-[#45464d] hover:border-[#c6c6cd]'
                        }`}
                    >
                      <option value="">Assign Team…</option>
                      {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#45464d] pointer-events-none"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ))}

              <button
                onClick={() =>
                  setCleaning((prev) => [...prev, {
                    id: `c${Date.now()}`, room: `Room ${100 + prev.length + 1}`,
                    type: 'Standard', urgency: 'normal', assignedTo: '',
                  }])
                }
                className="w-full py-2 text-xs font-semibold text-[#45464d] border border-dashed border-[#c6c6cd] rounded-xl hover:border-[#131b2e] hover:text-[#131b2e] transition-colors"
              >
                + Add Cleaning Request
              </button>
            </div>
          </div>

        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { label: 'Total Applications', value: loading ? '…' : hotels.length,            icon: '📋', color: 'text-[#131b2e]' },
            { label: 'Pending Review',     value: loading ? '…' : counts.pending,            icon: '⏳', color: 'text-amber-600' },
            { label: 'Approved Hotels',    value: loading ? '…' : counts.approved,           icon: '✅', color: 'text-emerald-600' },
            { label: 'Changes Requested',  value: loading ? '…' : counts.changes_requested,  icon: '📝', color: 'text-amber-700' },
            { label: 'Rejected',           value: loading ? '…' : counts.rejected,           icon: '❌', color: 'text-red-600' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4">
              <div className="text-xl mb-1.5">{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[#76777d] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Review Modal ── */}
      {reviewApp && (
        <ReviewModal
          app={reviewApp}
          onClose={() => setReviewApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestChanges={handleRequestChanges}
          loading={actionLoading}
        />
      )}
    </AdminLayout>
  );
}
