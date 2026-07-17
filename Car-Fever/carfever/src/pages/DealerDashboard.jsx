import { useState } from 'react'
import {
  Plus, Bell, Settings, LogOut, BarChart2, MessageSquare,
  Edit2, Trash2, CheckCircle, Clock, Archive, Eye,
  TrendingUp, Send, ChevronRight, Shield, Car,
  AlertCircle, Search, Filter, MoreVertical, X,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
const DEALER = {
  name:     'Premium Dealer',
  company:  'City Motors London',
  dealerId: '#CF-9942',
  avatar:   'PM',
  plan:     'Verified Premium',
}

const MOCK_LISTINGS = [
  { id: 1, year: 2021, make: 'Ford',       model: 'Fiesta ST-Line',   spec: 'Manual · 12,500 miles',  price: 14450, views: 342, leads: 12, status: 'active',   image: 'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=200&q=70&auto=format&fit=crop' },
  { id: 2, year: 2019, make: 'Volkswagen', model: 'Golf GTI',         spec: 'DSG Auto · 34,000 miles', price: 18200, views: 215, leads: 5,  status: 'active',   image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=70&auto=format&fit=crop' },
  { id: 3, year: 2018, make: 'BMW',        model: '3 Series M Sport',  spec: 'Automatic · 48,000 miles',price: 21500, views: 0,   leads: 0,  status: 'pending',  image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=70&auto=format&fit=crop' },
  { id: 4, year: 2020, make: 'Audi',       model: 'A4 S Line',        spec: 'Automatic · 29,000 miles', price: 26900, views: 0,   leads: 0,  status: 'pending',  image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=200&q=70&auto=format&fit=crop' },
  { id: 5, year: 2017, make: 'Mercedes',   model: 'C-Class AMG',      spec: 'Auto · 61,000 miles',     price: 19800, views: 891, leads: 34, status: 'sold',     image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&q=70&auto=format&fit=crop' },
  { id: 6, year: 2016, make: 'Porsche',    model: '911 Carrera',      spec: 'PDK · 44,000 miles',      price: 62000, views: 1240,leads: 51, status: 'sold',     image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&q=70&auto=format&fit=crop' },
]

const MOCK_LEADS = [
  { id: 1, avatar: 'JD', name: 'John D.',   message: '"Is the Ford Fiesta still available?"',        time: '2m ago',   replied: false, isNew: true  },
  { id: 2, avatar: 'SK', name: 'Sarah K.',  message: '"Would you accept £14,000 cash?"',             time: '18m ago',  replied: false, isNew: true  },
  { id: 3, avatar: 'MR', name: 'Mike R.',   message: '"Can I book a test drive for Friday?"',        time: '1h ago',   replied: true,  isNew: false },
  { id: 4, avatar: 'AL', name: 'Amy L.',    message: '"What is the service history like?"',          time: '3h ago',   replied: true,  isNew: false },
  { id: 5, avatar: 'TC', name: 'Tom C.',    message: '"Does it come with a warranty?"',              time: '5h ago',   replied: false, isNew: false },
]

const TABS = [
  { key: 'active',   label: 'Active Listings',    count: MOCK_LISTINGS.filter(l => l.status === 'active').length  },
  { key: 'pending',  label: 'Pending Approval',   count: MOCK_LISTINGS.filter(l => l.status === 'pending').length },
  { key: 'sold',     label: 'Sold / Archived',    count: MOCK_LISTINGS.filter(l => l.status === 'sold').length    },
  { key: 'leads',    label: 'Leads & Inquiries',  count: MOCK_LEADS.length },
]

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
function ListingsTable({ listings, onMarkSold, onDelete, onCreateListing }) {
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
                    {listing.status !== 'sold' && (
                      <>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant text-[12px] font-semibold hover:border-deep-navy hover:text-deep-navy transition-colors">
                          <Edit2 size={13} /> Edit
                        </button>
                        <button onClick={() => onMarkSold(listing.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-[12px] font-semibold transition-all active:scale-[0.98] hover:brightness-110"
                          style={{ background: '#bb0014' }}>
                          <CheckCircle size={13} /> Mark as Sold
                        </button>
                      </>
                    )}
                    {listing.status === 'sold' && (
                      <span className="flex items-center gap-1 text-[12px] text-on-surface-variant italic">
                        <Archive size={13} /> Archived
                      </span>
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
            {listing.status !== 'sold' && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-2 rounded border border-outline-variant text-on-surface-variant text-[12px] font-semibold hover:border-deep-navy transition-colors">
                  Edit
                </button>
                <button onClick={() => onMarkSold(listing.id)}
                  className="flex-1 py-2 rounded text-white text-[12px] font-semibold"
                  style={{ background: '#bb0014' }}>
                  Mark as Sold
                </button>
              </div>
            )}
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
function PerformancePanel() {
  const bars = [
    { label: 'Ford Fiesta ST-Line',    views: 342, leads: 12, pct: 88 },
    { label: 'VW Golf GTI',            views: 215, leads: 5,  pct: 55 },
    { label: 'BMW 3 Series',           views: 0,   leads: 0,  pct: 2  },
    { label: 'Mercedes C-Class (Sold)',views: 891, leads: 34, pct: 100 },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Views (30d)', value: '1,448', icon: <Eye size={18}/> },
          { label: 'Total Leads (30d)', value: '51',    icon: <MessageSquare size={18}/> },
          { label: 'Conversion Rate',   value: '3.5%',  icon: <TrendingUp size={18}/> },
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
        <div className="space-y-3">
          {bars.map(b => (
            <div key={b.label}>
              <div className="flex justify-between text-body-sm mb-1">
                <span className="text-on-surface">{b.label}</span>
                <span className="text-on-surface-variant">{b.views} views · {b.leads} leads</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-deep-navy rounded-full transition-all duration-700" style={{ width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AccountSettings({ onLogout }) {
  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-card space-y-4">
        <h3 className="font-grotesk font-bold text-body-md text-deep-navy">Dealer Profile</h3>
        {[['Dealership Name', 'City Motors London'],['Contact Email','citymotors@example.com'],['Phone','020 7946 0900'],['Address','142 Kensington High St, London, W8 6AB']].map(([label, val]) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1">{label}</label>
            <input defaultValue={val} className="w-full border border-outline-variant rounded px-3 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy transition-colors" />
          </div>
        ))}
        <button className="px-5 py-2.5 rounded bg-deep-navy text-white font-semibold text-body-sm hover:bg-navy-mid transition-colors">Save Changes</button>
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
        <button className="flex items-center gap-1 text-[12px] font-semibold text-deep-navy hover:text-accent-red transition-colors">
          View All Inquiries <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function DealerDashboard({ onCreateListing, onLogout }) {
  const [activePortalTab, setActivePortalTab] = useState('Inventory')
  const [activeTab,       setActiveTab]       = useState('active')
  const [listings,        setListings]        = useState(MOCK_LISTINGS)
  const [leads,           setLeads]           = useState(MOCK_LEADS)
  const [notifOpen,       setNotifOpen]       = useState(false)

  // Mark a listing as sold
  const handleMarkSold = id =>
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold', views: l.views, leads: l.leads } : l))

  // Delete a listing
  const handleDelete = id =>
    setListings(prev => prev.filter(l => l.id !== id))

  // Reply to a lead
  const handleReply = (id) =>
    setLeads(prev => prev.map(l => l.id === id ? { ...l, replied: true, isNew: false } : l))

  // Derived stats
  const activeCount   = listings.filter(l => l.status === 'active').length
  const pendingCount  = listings.filter(l => l.status === 'pending').length
  const soldCount     = listings.filter(l => l.status === 'sold').length
  const totalViews    = listings.reduce((s, l) => s + l.views, 0)
  const newLeadsCount = leads.filter(l => l.isNew).length

  const tabListings = {
    active:  listings.filter(l => l.status === 'active'),
    pending: listings.filter(l => l.status === 'pending'),
    sold:    listings.filter(l => l.status === 'sold'),
    leads:   [],
  }

  const dynamicTabs = [
    { key: 'active',  label: `Active Listings`,   count: activeCount  },
    { key: 'pending', label: `Pending Approval`,   count: pendingCount },
    { key: 'sold',    label: `Sold Cars`,          count: soldCount    },
    { key: 'leads',   label: `Leads & Inquiries`,  count: leads.length },
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
              <button onClick={() => setNotifOpen(o => !o)}
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
                    <div key={l.id} className="flex items-start gap-2 py-2 border-t border-outline-variant">
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
                      onDelete={handleDelete}
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
        {activePortalTab === 'Performance' && <PerformancePanel />}
        {activePortalTab === 'Settings'    && <AccountSettings onLogout={onLogout} />}
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
    </div>
  )
}
