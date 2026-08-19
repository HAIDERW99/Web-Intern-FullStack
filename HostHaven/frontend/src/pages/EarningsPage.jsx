import { useState } from 'react';
import Navbar from '../components/Navbar';

// ─── Mock data ────────────────────────────────────────────────────────────
const MONTHLY_DATA = [
  { month: 'Jan', revenue: 8200,  bookings: 22 },
  { month: 'Feb', revenue: 7100,  bookings: 18 },
  { month: 'Mar', revenue: 9400,  bookings: 26 },
  { month: 'Apr', revenue: 11200, bookings: 31 },
  { month: 'May', revenue: 13800, bookings: 38 },
  { month: 'Jun', revenue: 15600, bookings: 44 },
  { month: 'Jul', revenue: 18200, bookings: 51 },
  { month: 'Aug', revenue: 16900, bookings: 47 },
];

const TRANSACTIONS = [
  { id: 'TXN-001', hotel: 'The Azure Resort & Spa',   guest: 'Emily Johnson',   checkIn: '2026-08-01', amount: 1750,  status: 'paid'    },
  { id: 'TXN-002', hotel: 'Desert Bloom Resort',       guest: 'Carlos Rivera',   checkIn: '2026-08-05', amount: 690,   status: 'paid'    },
  { id: 'TXN-003', hotel: 'The Azure Resort & Spa',   guest: 'Sarah Mitchell',  checkIn: '2026-08-10', amount: 2100,  status: 'pending' },
  { id: 'TXN-004', hotel: 'Desert Bloom Resort',       guest: 'James Park',      checkIn: '2026-07-28', amount: 920,   status: 'paid'    },
  { id: 'TXN-005', hotel: 'The Azure Resort & Spa',   guest: 'Aisha Williams',  checkIn: '2026-07-20', amount: 3500,  status: 'paid'    },
  { id: 'TXN-006', hotel: 'Desert Bloom Resort',       guest: 'David Chen',      checkIn: '2026-08-12', amount: 460,   status: 'refunded'},
];

const RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'This year'];

const TX_STATUS_CONFIG = {
  paid:     { label: 'Paid',     bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending:  { label: 'Pending',  bg: 'bg-amber-50',   text: 'text-amber-700'   },
  refunded: { label: 'Refunded', bg: 'bg-gray-50',    text: 'text-gray-600'    },
};

// ─── Mini Bar Chart ───────────────────────────────────────────────────────
function BarChart({ data }) {
  const maxRev = Math.max(...data.map((d) => d.revenue));
  return (
    <div className="flex items-end gap-2 h-36 w-full">
      {data.map((d) => {
        const pct = (d.revenue / maxRev) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: '112px' }}>
              <div
                title={`$${d.revenue.toLocaleString()}`}
                style={{ height: `${pct}%` }}
                className="w-full max-w-[36px] bg-[#fea619] rounded-t-md group-hover:bg-[#e89600] transition-colors cursor-pointer"
              />
              {/* Tooltip */}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[#191c1e] opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity bg-white border border-[#e0e3e5] rounded px-1.5 py-0.5 shadow-sm pointer-events-none z-10">
                ${d.revenue.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-[#76777d] font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function EarningsPage() {
  const [range, setRange] = useState('Last 30 days');

  const totalRevenue  = MONTHLY_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = MONTHLY_DATA.reduce((s, d) => s + d.bookings, 0);
  const avgPerBooking = Math.round(totalRevenue / totalBookings);
  const paidTotal     = TRANSACTIONS.filter(t => t.status === 'paid').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Earnings</h1>
            <p className="text-sm text-[#45464d] mt-1">Revenue overview and transaction history.</p>
          </div>
          <div className="relative self-start sm:self-auto">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none bg-white border border-[#e0e3e5] rounded-lg px-3 py-2 pr-8 text-sm font-medium text-[#191c1e] outline-none focus:border-[#131b2e] cursor-pointer"
            >
              {RANGE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Revenue',    value: `$${totalRevenue.toLocaleString()}`,  change: '+12.4%', up: true,  icon: '💰' },
            { label: 'Total Bookings',   value: totalBookings,                         change: '+8.1%',  up: true,  icon: '📋' },
            { label: 'Avg per Booking',  value: `$${avgPerBooking}`,                   change: '+3.7%',  up: true,  icon: '📊' },
            { label: 'Paid Out',         value: `$${paidTotal.toLocaleString()}`,      change: '-2.1%',  up: false, icon: '🏦' },
          ].map(({ label, value, change, up, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-[#e0e3e5] px-4 py-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{icon}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {change}
                </span>
              </div>
              <div className="text-xl font-bold text-[#191c1e]">{value}</div>
              <div className="text-xs text-[#76777d] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {/* ── Revenue Chart ── */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#191c1e] text-sm">Revenue Over Time</h2>
              <span className="text-xs text-[#76777d]">Jan – Aug 2026</span>
            </div>
            <BarChart data={MONTHLY_DATA} />
          </div>

          {/* ── Property Breakdown ── */}
          <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
            <h2 className="font-semibold text-[#191c1e] text-sm mb-4">Revenue by Property</h2>
            <div className="space-y-4">
              {[
                { name: 'The Azure Resort & Spa', pct: 67, amount: '$110,200', color: 'bg-[#fea619]' },
                { name: 'Desert Bloom Resort',    pct: 33, amount: '$54,200',  color: 'bg-[#131b2e]' },
              ].map(({ name, pct, amount, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-[#191c1e] truncate max-w-[70%]">{name}</p>
                    <p className="text-xs font-bold text-[#191c1e]">{amount}</p>
                  </div>
                  <div className="h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-[#76777d] mt-1">{pct}% of total</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#f2f4f6]">
              <h3 className="text-xs font-semibold text-[#45464d] mb-3 uppercase tracking-wide">Quick Stats</h3>
              <div className="space-y-2">
                {[
                  { label: 'Occupancy Rate', value: '74%' },
                  { label: 'Avg Stay Length', value: '3.2 nights' },
                  { label: 'Return Guests', value: '28%' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-[#76777d]">{label}</span>
                    <span className="text-xs font-semibold text-[#191c1e]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Transactions Table ── */}
        <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f4f6]">
            <h2 className="font-semibold text-[#191c1e] text-sm">Recent Transactions</h2>
            <button className="text-xs font-medium text-[#fea619] hover:text-[#e89600] transition-colors">
              Export CSV
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f2f4f6]">
                  {['Transaction ID', 'Property', 'Guest', 'Check-in', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#76777d] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t, i) => {
                  const cfg = TX_STATUS_CONFIG[t.status] ?? TX_STATUS_CONFIG.paid;
                  return (
                    <tr key={t.id} className={`border-b border-[#f7f9fb] hover:bg-[#f7f9fb] transition-colors ${i === TRANSACTIONS.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-5 py-3.5 text-xs font-mono text-[#76777d]">{t.id}</td>
                      <td className="px-5 py-3.5 text-xs font-medium text-[#191c1e] max-w-[160px] truncate">{t.hotel}</td>
                      <td className="px-5 py-3.5 text-xs text-[#45464d]">{t.guest}</td>
                      <td className="px-5 py-3.5 text-xs text-[#45464d]">
                        {new Date(t.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#191c1e]">${t.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-[#f2f4f6]">
            {TRANSACTIONS.map((t) => {
              const cfg = TX_STATUS_CONFIG[t.status] ?? TX_STATUS_CONFIG.paid;
              return (
                <div key={t.id} className="px-4 py-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-semibold text-[#191c1e] truncate max-w-[65%]">{t.hotel}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <p className="text-[11px] text-[#76777d]">{t.guest} · {new Date(t.checkIn).toLocaleDateString()}</p>
                  <p className="text-sm font-bold text-[#191c1e] mt-1">${t.amount.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
