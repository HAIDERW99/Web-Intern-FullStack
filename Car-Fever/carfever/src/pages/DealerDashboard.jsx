import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Bell, Settings, LogOut, BarChart2, MessageSquare,
  Edit2, Trash2, CheckCircle, Clock, Archive, Eye,
  TrendingUp, Send, ChevronRight, Shield, Car,
  AlertCircle, Search, RefreshCw, MoreVertical, X,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─────────────────────────────────────────────────────────────────────────────
// Normalise API vehicle record → dashboard listing shape
// ─────────────────────────────────────────────────────────────────────────────
function normaliseListing(v) {
  let img = v.main_image_url || v.image_url || v.image
  if (!img && Array.isArray(v.images) && v.images.length > 0) {
    const first = v.images[0]
    img = typeof first === 'string' ? first : (first?.url || first?.image_url)
  }
  if (!img && Array.isArray(v.vehicle_images) && v.vehicle_images.length > 0) {
    const main = v.vehicle_images.find(i => i.is_main) || v.vehicle_images[0]
    img = main?.image_url || main?.url
  }
  if (!img) {
    img = 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=200&q=70&auto=format&fit=crop'
  }

  return {
    id:     v.id,
    year:   v.year,
    make:   v.make,
    model:  v.model,
    spec:   [v.transmission, v.mileage ? `${Number(v.mileage).toLocaleString()} miles` : ''].filter(Boolean).join(' · '),
    price:  v.price,
    views:  0,
    leads:  0,
    status: (v.status ?? 'Active').toLowerCase(),
    image:  img,
  }
}

// Normalise API lead record → dashboard lead shape
function normaliseLead(l) {
  const name    = l.buyer_name ?? 'Buyer'
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  const vehicle  = l.vehicles
  const vehicleLabel = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'a vehicle'
  return {
    id:      l.id,
    avatar:  initials || 'B',
    name,
    message: l.message ? `"${l.message}"` : `"Interested in ${vehicleLabel}"`,
    time:    l.created_at
      ? new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : '',
    replied: l.status === 'Replied',
    isNew:   l.status === 'Unread',
  }
}

const PORTAL_TABS = ['Inventory', 'Leads', 'Performance', 'Settings']

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Stat card
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-5 flex flex-col gap-2 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
        <div className="text-on-surface-variant opacity-50">{icon}</div>
      </div>
      <div className="font-grotesk font-bold text-[36px] leading-none text-deep-navy">{value}</div>
      {sub && <div className="text-[12px] text-on-surface-variant flex items-center gap-1">{sub}</div>}
    </div>
  )
}

// Status badge
function StatusBadge({ status }) {
  const MAP = {
    active:  { label: 'Active',           cls: 'bg-green-50 text-[#10B981] border-[#10B981]/30' },
    pending: { label: 'Pending Approval', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
    sold:    { label: 'Sold',             cls: 'bg-surface-container text-on-surface-variant border-outline-variant' },
  }
  const { label, cls } = MAP[status] ?? MAP.active
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

// Avatar circle
function Avatar({ initials, color = 'bg-deep-navy' }) {
  return (
    <div className={`w-9 h-9 rounded-full ${color} text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0 select-none`}>
      {initials}
    </div>
  )
}

// Quick-reply input
function QuickReply({ lead, onReply }) {
  const [text, setText] = useState('')
  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text" placeholder="Type a quick reply…"
        value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { onReply(lead.id, text); setText('') } }}
        className="flex-1 border border-outline-variant rounded-full px-3 py-1.5 text-[12px] text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy transition-colors"
      />
      <button
        onClick={() => { if (text.trim()) { onReply(lead.id, text); setText('') } }}
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ background: '#bb0014', color: '#fff' }}
        aria-label="Send"
      >
        <Send size={13} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS TABLE
// ─────────────────────────────────────────────────────────────────────────────
function ListingsTable({ listings, onMarkSold, onMarkActive, onDelete, onEditCar, onCreateListing }) {
  const [search, setSearch] = useState('')
  const filtered = listings.filter(l =>
    `${l.year} ${l.make} ${l.model}`.toLowerCase().includes(search.toLowerCase())
  )

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Car size={40} className="text-outline mb-3" />
        <p className="font-grotesk font-semibold text-body-md text-deep-navy mb-1">No listings here yet</p>
        <p className="text-body-sm text-on-surface-variant mb-5">Create your first listing to get started.</p>
        <button onClick={onCreateListing}
          className="flex items-center gap-2 px-5 py-2.5 rounded text-white font-semibold text-body-sm transition-all active:scale-[0.98]"
          style={{ background: '#bb0014' }}>
          <Plus size={16} /> Create New Listing
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input type="text" placeholder="Search listings…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-outline-variant rounded pl-9 pr-3 py-2 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl overflow-hidden border border-outline-variant">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-deep-navy text-white">
              {['Vehicle Detail', 'Price', 'Metrics', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.map(listing => (
              <tr key={listing.id} className="bg-white hover:bg-surface-container-low transition-colors group">
                {/* Vehicle */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={listing.image} alt="" className="w-14 h-10 rounded object-cover flex-shrink-0 border border-outline-variant" />
                    <div>
                      <p className="font-grotesk font-bold text-body-sm text-deep-navy">
                        {listing.year} {listing.make} {listing.model}
                      </p>
                      <p className="text-[12px] text-on-surface-variant">{listing.spec}</p>
                    </div>
                  </div>
                </td>
                {/* Price */}
                <td className="px-4 py-3">
                  <span className="font-grotesk font-bold text-body-sm text-deep-navy">
                    £{listing.price.toLocaleString()}
                  </span>
                </td>
                {/* Metrics */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] text-on-surface-variant">
                      <span className="font-bold text-deep-navy">{listing.views}</span> views
                    </span>
                    <span className="text-[12px] text-on-surface-variant">
                      <span className="font-bold text-deep-navy">{listing.leads}</span> leads
                    </span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-4 py-3"><StatusBadge status={listing.status} /></td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEditCar(listing)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant text-[12px] font-semibold hover:border-deep-navy hover:text-deep-navy transition-colors">
                      <Edit2 size={13} /> Edit
                    </button>
                    {listing.status?.toLowerCase() !== 'sold' ? (
                      <button onClick={() => onMarkSold(listing.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-[12px] font-semibold transition-all active:scale-[0.98] hover:brightness-110"
                        style={{ background: '#bb0014' }}>
                        <CheckCircle size={13} /> Mark as Sold
                      </button>
                    ) : (
                      <button onClick={() => onMarkActive(listing.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-[12px] font-semibold transition-all active:scale-[0.98] hover:brightness-110"
                        style={{ background: '#10B981' }}>
                        <RefreshCw size={13} /> Mark as Active
                      </button>
                    )}
                    <button onClick={() => onDelete(listing.id)}
                      className="p-1.5 rounded text-outline hover:text-accent-red hover:bg-red-50 transition-colors"
                      aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(listing => (
          <div key={listing.id} className="bg-white rounded-xl border border-outline-variant p-4 shadow-card">
            <div className="flex gap-3 mb-3">
              <img src={listing.image} alt="" className="w-16 h-12 rounded object-cover flex-shrink-0 border border-outline-variant" />
              <div className="min-w-0">
                <p className="font-grotesk font-bold text-body-sm text-deep-navy truncate">
                  {listing.year} {listing.make} {listing.model}
                </p>
                <p className="text-[12px] text-on-surface-variant">{listing.spec}</p>
                <p className="font-grotesk font-bold text-body-sm text-deep-navy mt-0.5">£{listing.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={listing.status} />
              <div className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                <Eye size={12} />{listing.views} · <MessageSquare size={12} />{listing.leads}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onEditCar(listing)}
                className="flex-1 py-2 rounded border border-outline-variant text-on-surface-variant text-[12px] font-semibold hover:border-deep-navy transition-colors flex items-center justify-center gap-1">
                <Edit2 size={13} /> Edit
              </button>
              {listing.status?.toLowerCase() !== 'sold' ? (
                <button onClick={() => onMarkSold(listing.id)}
                  className="flex-1 py-2 rounded text-white text-[12px] font-semibold flex items-center justify-center gap-1"
                  style={{ background: '#bb0014' }}>
                  <CheckCircle size={13} /> Mark as Sold
                </button>
              ) : (
                <button onClick={() => onMarkActive(listing.id)}
                  className="flex-1 py-2 rounded text-white text-[12px] font-semibold flex items-center justify-center gap-1"
                  style={{ background: '#10B981' }}>
                  <RefreshCw size={13} /> Mark as Active
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function LeadsPanel({ leads, onReply }) {
  const AVATAR_COLORS = ['bg-deep-navy', 'bg-slate-500', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600']

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare size={40} className="text-outline mb-3" />
        <p className="font-grotesk font-semibold text-body-md text-deep-navy mb-1">No inquiries yet</p>
        <p className="text-body-sm text-on-surface-variant">
          Once buyers enquire about your listings, they'll appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {leads.map((lead, i) => (
        <div key={lead.id} className="bg-white rounded-xl border border-outline-variant p-4 shadow-card">
          <div className="flex items-start gap-3">
            <Avatar initials={lead.avatar} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-body-sm text-deep-navy">{lead.name}</span>
                {lead.isNew && (
                  <span className="px-1.5 py-0.5 rounded bg-accent-red text-white text-[10px] font-bold uppercase tracking-wide">New</span>
                )}
                <span className="text-[11px] text-outline ml-auto">{lead.time}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant italic">{lead.message}</p>
              {lead.replied ? (
                <div className="flex items-center gap-1 mt-2 text-[12px] text-[#10B981] font-semibold">
                  <CheckCircle size={12} fill="currentColor" /> Reply Sent
                </div>
              ) : (
                <QuickReply lead={lead} onReply={onReply} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE TAB
// ─────────────────────────────────────────────────────────────────────────────
function PerformancePanel({ listings }) {
  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0)
  const totalLeads = listings.reduce((s, l) => s + (l.leads || 0), 0)
  const convRate   = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0'

  const maxViews = Math.max(...listings.map(l => l.views || 0), 1)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Views (30d)', value: totalViews.toLocaleString(), icon: <Eye size={18}/> },
          { label: 'Total Leads (30d)', value: String(totalLeads),           icon: <MessageSquare size={18}/> },
          { label: 'Conversion Rate',   value: `${convRate}%`,               icon: <TrendingUp size={18}/> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-outline-variant p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2 text-on-surface-variant">{s.icon}
              <span className="text-[11px] font-bold uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="font-grotesk font-bold text-[28px] text-deep-navy">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-card">
        <h3 className="font-grotesk font-bold text-body-md text-deep-navy mb-4">Views by Listing</h3>
        {listings.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant text-center py-6">
            No listings yet — add your first car to see performance data.
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map(l => {
              const pct = Math.round(((l.views || 0) / maxViews) * 100)
              return (
                <div key={l.id}>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface truncate max-w-[60%]">{l.year} {l.make} {l.model}</span>
                    <span className="text-on-surface-variant flex-shrink-0">{l.views || 0} views · {l.leads || 0} leads</span>
                  </div>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-deep-navy rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AccountSettings({ dealer, user, onLogout }) {
  const { updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  const [companyName, setCompanyName] = useState(user?.company_name ?? user?.name ?? dealer?.company ?? '')
  const [email,       setEmail]       = useState(user?.email ?? dealer?.email ?? '')
  const [phone,       setPhone]       = useState(user?.phone ?? '')
  const [location,    setLocation]    = useState(user?.location ?? user?.address ?? '')

  useEffect(() => {
    setCompanyName(user?.company_name ?? user?.name ?? dealer?.company ?? '')
    setEmail(user?.email ?? dealer?.email ?? '')
    setPhone(user?.phone ?? '')
    setLocation(user?.location ?? user?.address ?? '')
  }, [user, dealer])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      await api.auth.updateProfile({
        id: user?.id,
        email: email.trim(),
        company_name: companyName.trim(),
        name: companyName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      })

      updateUser({
        company_name: companyName.trim(),
        name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        address: location.trim(),
      })

      setSuccessMsg('Profile updated successfully!')
      setIsEditing(false)
    } catch (err) {
      updateUser({
        company_name: companyName.trim(),
        name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
      })
      setSuccessMsg('Profile updated locally!')
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-grotesk font-bold text-body-md text-deep-navy">Dealer Profile</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant text-[12px] font-semibold hover:border-deep-navy hover:text-deep-navy transition-colors"
            >
              <Edit2 size={13} /> Edit Profile
            </button>
          )}
        </div>

        {successMsg && (
          <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-body-sm flex items-center gap-2">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-body-sm flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
                Business Name / Dealership
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. +44 20 7946 0912"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
                Location / Address
              </label>
              <input
                type="text"
                placeholder="e.g. London, UK"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setCompanyName(user?.company_name ?? user?.name ?? dealer?.company ?? '')
                  setEmail(user?.email ?? dealer?.email ?? '')
                  setPhone(user?.phone ?? '')
                  setLocation(user?.location ?? user?.address ?? '')
                }}
                className="px-4 py-2.5 rounded border border-outline-variant text-on-surface-variant font-semibold text-body-sm hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              ['Dealership Name', companyName || 'Not set'],
              ['Contact Email', email || 'Not set'],
              ['Phone', phone || 'Not set'],
              ['Location', location || 'Not set'],
            ].map(([label, val]) => (
              <div key={label} className="border-b border-outline-variant/50 pb-2.5 last:border-b-0">
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">
                  {label}
                </span>
                <span className="text-body-sm text-deep-navy font-medium">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-card">
        <h3 className="font-grotesk font-bold text-body-md text-deep-navy mb-1">Danger Zone</h3>
        <p className="text-body-sm text-on-surface-variant mb-4">Log out of your dealer account.</p>
        <button onClick={onLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded border-2 border-accent-red text-accent-red font-semibold text-body-sm hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT CAR MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditCarModal({ car, onClose, onSave }) {
  const [make,        setMake]        = useState(car.make || '')
  const [model,       setModel]       = useState(car.model || '')
  const [year,        setYear]        = useState(car.year || 2024)
  const [price,       setPrice]       = useState(car.price || 0)
  const [mileage,     setMileage]     = useState(car.mileage || 0)
  const [status,      setStatus]      = useState(car.status || 'active')
  const [description, setDescription] = useState(car.description || '')
  const [saving,      setSaving]      = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(car.id, {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        price: Number(price),
        mileage: Number(mileage),
        status,
        description: description.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-outline-variant shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h3 className="font-grotesk font-bold text-body-md text-deep-navy flex items-center gap-2">
            <Edit2 size={16} /> Edit Vehicle Listing
          </h3>
          <button onClick={onClose} className="p-1 rounded text-outline hover:text-deep-navy transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Make</label>
              <input type="text" value={make} onChange={e => setMake(e.target.value)} required
                className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Model</label>
              <input type="text" value={model} onChange={e => setModel(e.target.value)} required
                className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Year</label>
              <input type="number" min="1990" max="2026" value={year} onChange={e => setYear(e.target.value)} required
                className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Price (£)</label>
              <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required
                className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Mileage</label>
              <input type="number" min="0" value={mileage} onChange={e => setMileage(e.target.value)} required
                className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Listing Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy bg-white">
              <option value="Active">Active</option>
              <option value="Sold">Sold</option>
              <option value="Pending">Pending Approval</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">Description</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Provide key details about this vehicle…"
              className="w-full border border-outline-variant rounded px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded border border-outline-variant text-body-sm font-semibold text-on-surface-variant hover:bg-surface-container">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded text-white font-semibold text-body-sm hover:brightness-110 disabled:opacity-50 transition-all"
              style={{ background: '#bb0014' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT INQUIRIES SIDEBAR (desktop right panel)
// ─────────────────────────────────────────────────────────────────────────────
function InquiriesSidebar({ leads, onReply }) {
  const AVATAR_COLORS = ['bg-deep-navy', 'bg-slate-500', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600']
  const shown = leads.slice(0, 3)
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <span className="font-grotesk font-bold text-body-sm text-deep-navy">Recent Inquiries</span>
        {leads.some(l => l.isNew) && (
          <span className="px-2 py-0.5 rounded bg-accent-red text-white text-[10px] font-bold uppercase tracking-wide">New</span>
        )}
      </div>
      <div className="divide-y divide-outline-variant">
        {shown.map((lead, i) => (
          <div key={lead.id} className="px-4 py-3">
            <div className="flex items-start gap-2.5">
              <Avatar initials={lead.avatar} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13px] text-deep-navy">{lead.name}</p>
                <p className="text-[12px] text-on-surface-variant italic mt-0.5 line-clamp-2">{lead.message}</p>
                {lead.replied ? (
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#10B981] font-semibold">
                    <CheckCircle size={11} fill="currentColor" /> Reply Sent
                  </div>
                ) : (
                  <QuickReply lead={lead} onReply={onReply} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-outline-variant">
        <button onClick={() => onReply && onReply()} className="flex items-center gap-1 text-[12px] font-semibold text-deep-navy hover:text-accent-red transition-colors">
          View All Inquiries <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DealerDashboard({ onCreateListing, onLogout, initialPortalTab = 'Inventory', initialTab = 'active' }) {
  // ── Session from context ──────────────────────────────────────────────────
  const { user, refreshSession } = useAuth()
  const dealerId   = user?.id           ?? ''
  const listingIds = Array.isArray(user?.listing_ids) ? user.listing_ids : []
  const company    = user?.company_name ?? user?.name ?? 'My Dealership'
  const initials   = company.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'CF'
  const emailHash  = (user?.email ?? '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  const DEALER = {
    name:     company,
    company,
    dealerId: `#CF-${Math.abs(emailHash % 9000 + 1000)}`,
    avatar:   initials,
    plan:     'Verified Dealer',
  }

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activePortalTab, setActivePortalTab] = useState(initialPortalTab)
  const [activeTab,       setActiveTab]       = useState(initialTab)
  const [notifOpen,       setNotifOpen]       = useState(false)
  const [editingCar,      setEditingCar]      = useState(null)
  const [toastMsg,        setToastMsg]        = useState(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  useEffect(() => {
    if (initialPortalTab) setActivePortalTab(initialPortalTab)
    if (initialTab) setActiveTab(initialTab)
  }, [initialPortalTab, initialTab])

  // ── Remote data state ─────────────────────────────────────────────────────
  const [listings,      setListings]      = useState([])
  const [leads,         setLeads]         = useState([])
  const [loadingData,   setLoadingData]   = useState(true)
  const [dataError,     setDataError]     = useState(null)

  // ── Fetch listings for this dealer ────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    try {
      refreshSession()
      const freshSession = JSON.parse(localStorage.getItem('cf_session') || '{}')
      const ids = Array.isArray(freshSession.listing_ids) ? freshSession.listing_ids : []

      let all = []

      if (dealerId) {
        const res = await api.vehicles.getAll({
          dealer_id: dealerId, status: 'all', limit: 100, sort: 'newest',
        })
        all = (res.data || []).map(normaliseListing)
      }

      if (all.length === 0 && ids.length > 0) {
        const fetched = await Promise.allSettled(
          ids.map(id => api.vehicles.getById(id).then(r => r.data))
        )
        all = fetched
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => normaliseListing(r.value))
      }

      setListings(all)
    } catch (err) {
      setDataError(err.message)
    }
  }, [dealerId, refreshSession])

  // ── Fetch leads for this dealer ────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    try {
      let allLeads = []

      if (dealerId) {
        const res = await api.leads.getByDealer(dealerId, { limit: 50 })
        allLeads = (res.data || []).map(normaliseLead)
      }

      setLeads(allLeads)
    } catch {
      // leads failing silently is acceptable
    }
  }, [dealerId])

  useEffect(() => {
    setLoadingData(true)
    Promise.all([fetchListings(), fetchLeads()]).finally(() => setLoadingData(false))
  }, [fetchListings, fetchLeads])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const handleMarkSold = async (id) => {
    try {
      const res = await api.vehicles.update(id, { status: 'Sold' })
      if (!res || res.success === false) {
        throw new Error(res?.error || 'Server returned failure for status update')
      }
      // Confirmed 200 OK — now update local state
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l))
      showToast('Vehicle marked as Sold!')
      // Re-fetch in background to sync DB state — silently if it fails
      fetchListings().catch(e => console.warn('[REFETCH WARN]', e))
    } catch (err) {
      console.error('[handleMarkSold ERROR]', err)
      showToast(`Error: ${err.message}`)
    }
  }

  const handleMarkActive = async (id) => {
    try {
      const res = await api.vehicles.update(id, { status: 'Active' })
      if (!res || res.success === false) {
        throw new Error(res?.error || 'Server returned failure for status update')
      }
      // Confirmed 200 OK — now update local state
      setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l))
      showToast('Vehicle marked as Active!')
      // Re-fetch in background to sync DB state — silently if it fails
      fetchListings().catch(e => console.warn('[REFETCH WARN]', e))
    } catch (err) {
      console.error('[handleMarkActive ERROR]', err)
      showToast(`Error: ${err.message}`)
    }
  }

  const handleSaveCar = async (id, updatedFields) => {
    try {
      await api.vehicles.update(id, updatedFields)
      setListings(prev => prev.map(l => l.id === id ? {
        ...l,
        ...updatedFields,
        status: (updatedFields.status || l.status).toLowerCase(),
        spec: [l.spec.split(' · ')[0], updatedFields.mileage ? `${Number(updatedFields.mileage).toLocaleString()} miles` : ''].filter(Boolean).join(' · '),
      } : l))
      showToast('Vehicle listing updated successfully!')
      setEditingCar(null)
    } catch (err) {
      console.error('[UPDATE CAR ERROR]', err)
      setListings(prev => prev.map(l => l.id === id ? {
        ...l,
        ...updatedFields,
        status: (updatedFields.status || l.status).toLowerCase(),
      } : l))
      showToast('Vehicle listing updated!')
      setEditingCar(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return
    try {
      await api.vehicles.remove(id)
      setListings(prev => prev.filter(l => l.id !== id))
      try {
        const session = JSON.parse(localStorage.getItem('cf_session') || '{}')
        const ids = (session.listing_ids || []).filter(x => x !== id)
        localStorage.setItem('cf_session', JSON.stringify({ ...session, listing_ids: ids }))
      } catch { /* non-critical */ }
      showToast('Listing deleted!')
    } catch (err) {
      alert(`Could not delete: ${err.message}`)
    }
  }

  const handleReply = async (id) => {
    try {
      await api.leads.markReplied(id)
      setLeads(prev => prev.map(l => l.id === id ? { ...l, replied: true, isNew: false } : l))
    } catch {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, replied: true, isNew: false } : l))
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activeCount   = listings.filter(l => l.status?.toLowerCase() === 'active').length
  const soldCount     = listings.filter(l => l.status?.toLowerCase() === 'sold').length
  const totalViews    = listings.reduce((s, l) => s + (l.views || 0), 0)
  const newLeadsCount = leads.filter(l => l.isNew).length

  const tabListings = {
    active: listings.filter(l => l.status?.toLowerCase() === 'active'),
    sold:   listings.filter(l => l.status?.toLowerCase() === 'sold'),
    leads:  [],
  }

  const dynamicTabs = [
    { key: 'active', label: 'Active Listings',  count: activeCount  },
    { key: 'sold',   label: 'Sold Cars',         count: soldCount    },
    { key: 'leads',  label: 'Leads & Inquiries', count: leads.length },
  ]

  return (
    <div className="min-h-screen bg-[#f1f5f9] pt-16 flex flex-col">

      {/* ── Portal sub-navbar ── */}
      <div className="bg-white border-b border-outline-variant sticky top-16 z-30">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 flex items-center gap-1 h-12 overflow-x-auto scrollbar-hide">
          {PORTAL_TABS.map(tab => (
            <button key={tab} onClick={() => setActivePortalTab(tab)}
              className={`relative px-4 h-full text-body-sm font-medium flex-shrink-0 transition-colors
                ${activePortalTab === tab ? 'text-deep-navy font-semibold' : 'text-on-surface-variant hover:text-deep-navy'}`}>
              {tab}
              {activePortalTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-red rounded-full" />}
            </button>
          ))}
          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-4">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => { setActivePortalTab('Leads'); setActiveTab('leads'); setNotifOpen(o => !o) }}
                aria-label="Notification bell - go to Leads"
                className="relative p-2 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
                <Bell size={18} />
                {newLeadsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center">
                    {newLeadsCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-outline-variant shadow-xl z-50 p-3">
                  <p className="font-grotesk font-bold text-body-sm text-deep-navy mb-2">Notifications</p>
                  {leads.filter(l => l.isNew).map(l => (
                    <div key={l.id}
                      onClick={() => { setActivePortalTab('Leads'); setNotifOpen(false) }}
                      className="flex items-start gap-2 py-2 border-t border-outline-variant cursor-pointer hover:bg-surface-container-low px-1 rounded transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent-red mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-[12px] font-semibold text-deep-navy">{l.name}</p>
                        <p className="text-[11px] text-on-surface-variant italic line-clamp-1">{l.message}</p>
                      </div>
                    </div>
                  ))}
                  {newLeadsCount === 0 && <p className="text-[12px] text-on-surface-variant text-center py-2">No new notifications</p>}
                </div>
              )}
            </div>
            <button onClick={() => setActivePortalTab('Settings')}
              className="p-2 rounded text-on-surface-variant hover:bg-surface-container transition-colors">
              <Settings size={18} />
            </button>
            {/* Dealer avatar */}
            <div className="w-8 h-8 rounded-full bg-deep-navy text-white flex items-center justify-center text-[12px] font-bold cursor-pointer select-none">
              {DEALER.avatar}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-5 lg:px-8 py-7">

        {/* ── INVENTORY TAB ── */}
        {activePortalTab === 'Inventory' && (
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Left: main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Welcome + CTA */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-grotesk font-bold text-[26px] text-deep-navy leading-tight">
                      Welcome Back, {DEALER.name}
                    </h1>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-[#10B981]/30 text-[#10B981] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> ONLINE
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Manage your high-performance inventory and respond to leads.</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield size={13} className="text-[#10B981]" />
                    <span className="text-[12px] text-on-surface-variant">{DEALER.plan} · Dealer ID: {DEALER.dealerId}</span>
                  </div>
                </div>
                <button onClick={onCreateListing}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-grotesk font-bold text-body-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg whitespace-nowrap"
                  style={{ background: '#bb0014' }}>
                  <Plus size={18} /> CREATE NEW LISTING
                </button>
              </div>

              {/* Stats row */}
              {loadingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-outline-variant p-5 shadow-card animate-pulse">
                      <div className="h-3 bg-surface-container-highest rounded w-24 mb-3" />
                      <div className="h-9 bg-surface-container-highest rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Active Listings" value={activeCount}
                  sub={<span className="flex items-center gap-1 text-[#10B981]"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Online</span>}
                  icon={<Car size={20} />} />
                <StatCard label="Total Views" value={totalViews.toLocaleString()}
                  sub={<span className="flex items-center gap-1"><TrendingUp size={12} /> All time</span>}
                  icon={<BarChart2 size={20} />} />
                <StatCard label="Leads / Inquiries" value={leads.length}
                  sub={newLeadsCount > 0 ? <span className="text-accent-red font-semibold">{newLeadsCount} new</span> : 'All replied'}
                  icon={<MessageSquare size={20} />} />
              </div>
              )}

              {/* Inventory tabs */}
              <div>
                <div className="flex border-b border-outline-variant overflow-x-auto scrollbar-hide -mb-px">
                  {dynamicTabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-body-sm font-medium border-b-2 flex-shrink-0 transition-all duration-150
                        ${activeTab === tab.key ? 'border-accent-red text-deep-navy font-semibold' : 'border-transparent text-on-surface-variant hover:text-deep-navy'}`}>
                      {tab.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors
                        ${activeTab === tab.key ? 'bg-accent-red text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  {activeTab === 'leads' ? (
                    <LeadsPanel leads={leads} onReply={handleReply} />
                  ) : (
                    <ListingsTable
                      listings={tabListings[activeTab]}
                      onMarkSold={handleMarkSold}
                      onMarkActive={handleMarkActive}
                      onDelete={handleDelete}
                      onEditCar={setEditingCar}
                      onCreateListing={onCreateListing}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right: inquiries sidebar */}
            <div className="w-full xl:w-[280px] flex-shrink-0 xl:sticky xl:top-[112px]">
              <InquiriesSidebar leads={leads} onReply={handleReply} />
            </div>
          </div>
        )}

        {activePortalTab === 'Leads'       && <LeadsPanel leads={leads} onReply={handleReply} />}
        {activePortalTab === 'Performance' && <PerformancePanel listings={listings} />}
        {activePortalTab === 'Settings'    && <AccountSettings dealer={{ ...DEALER, email: user?.email }} user={user} onLogout={onLogout} />}
      </div>

      {/* ── Portal footer ── */}
      <footer className="border-t border-outline-variant bg-white">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 h-12 flex items-center justify-between gap-4 text-[12px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="font-grotesk font-bold text-deep-navy">CarFever</span>
            <span className="text-outline">Verified Portal</span>
            <span className="w-1 h-1 rounded-full bg-outline" />
            <span>Dealer ID: {DEALER.dealerId}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-deep-navy transition-colors">Legal</a>
            <a href="#" className="hover:text-deep-navy transition-colors">Help Center</a>
            <button onClick={onLogout} className="hover:text-accent-red transition-colors font-medium">Log Out</button>
          </div>
        </div>
      </footer>
      {/* ── Toast notification banner ── */}
      {toastMsg && (
        <div className="fixed top-20 right-5 z-50 bg-deep-navy text-white px-4 py-3 rounded-lg shadow-xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-right duration-200">
          <CheckCircle size={18} className="text-[#10B981]" />
          <span className="text-body-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* ── Edit Car Modal ── */}
      {editingCar && (
        <EditCarModal
          car={editingCar}
          onClose={() => setEditingCar(null)}
          onSave={handleSaveCar}
        />
      )}
    </div>
  )
}
