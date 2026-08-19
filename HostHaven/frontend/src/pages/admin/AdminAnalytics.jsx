import AdminLayout from './AdminLayout';

const MONTHLY = [
  { month: 'Jan', bookings: 142, revenue: 38400 },
  { month: 'Feb', bookings: 118, revenue: 31200 },
  { month: 'Mar', bookings: 165, revenue: 44800 },
  { month: 'Apr', bookings: 201, revenue: 56200 },
  { month: 'May', bookings: 234, revenue: 67800 },
  { month: 'Jun', bookings: 278, revenue: 84200 },
  { month: 'Jul', bookings: 312, revenue: 97600 },
  { month: 'Aug', bookings: 289, revenue: 88400 },
];

const TOP_HOTELS = [
  { name: 'The Azure Resort & Spa',   bookings: 312, revenue: 112400, occupancy: 84 },
  { name: 'Desert Bloom Resort',      bookings: 189, revenue: 54200,  occupancy: 71 },
  { name: 'Metropolis Grand Hotel',   bookings: 234, revenue: 78600,  occupancy: 78 },
  { name: 'Oceanview Villas',         bookings: 98,  revenue: 62300,  occupancy: 65 },
];

function BarChart({ data, keyName, label, color }) {
  const max = Math.max(...data.map(d => d[keyName]));
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map((d) => {
        const pct = (d[keyName] / max) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
              <div
                style={{ height: `${pct}%` }}
                className={`w-full max-w-[32px] ${color} rounded-t-md group-hover:opacity-80 transition-opacity cursor-pointer`}
                title={`${d.month}: ${typeof d[keyName] === 'number' && keyName === 'revenue' ? '$' : ''}${d[keyName].toLocaleString()}`}
              />
            </div>
            <span className="text-[10px] text-[#76777d] font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const totalRevenue  = MONTHLY.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = MONTHLY.reduce((s, d) => s + d.bookings, 0);

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#191c1e]">Analytics</h1>
          <p className="text-sm text-[#45464d] mt-1">Platform-wide performance overview.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Revenue',   value: `$${(totalRevenue/1000).toFixed(0)}K`,   change: '+14.2%', up: true,  icon: '💰' },
            { label: 'Total Bookings',  value: totalBookings,                            change: '+9.8%',  up: true,  icon: '📋' },
            { label: 'Active Hotels',   value: 4,                                        change: '+1',     up: true,  icon: '🏨' },
            { label: 'Avg Occupancy',   value: '74.5%',                                  change: '+3.1%',  up: true,  icon: '📊' },
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

        {/* Charts row */}
        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#191c1e] text-sm">Monthly Revenue</h2>
              <span className="text-xs text-[#76777d]">Jan – Aug 2026</span>
            </div>
            <BarChart data={MONTHLY} keyName="revenue" label="Revenue" color="bg-[#fea619]" />
          </div>
          <div className="bg-white rounded-2xl border border-[#e0e3e5] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#191c1e] text-sm">Monthly Bookings</h2>
              <span className="text-xs text-[#76777d]">Jan – Aug 2026</span>
            </div>
            <BarChart data={MONTHLY} keyName="bookings" label="Bookings" color="bg-[#131b2e]" />
          </div>
        </div>

        {/* Top performing hotels */}
        <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f2f4f6]">
            <h2 className="font-semibold text-[#191c1e] text-sm">Top Performing Hotels</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f7f9fb]">
                  {['Hotel', 'Total Bookings', 'Revenue', 'Occupancy Rate'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-[#76777d] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_HOTELS.map((h, i) => (
                  <tr key={h.name} className="border-b border-[#f7f9fb] hover:bg-[#f7f9fb] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${i === 0 ? 'bg-[#fea619] text-[#2a1700]' : 'bg-[#eceef0] text-[#76777d]'}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-[#191c1e] truncate max-w-[180px]">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#45464d]">{h.bookings.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#191c1e]">${h.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#f2f4f6] rounded-full max-w-[80px]">
                          <div className="h-full bg-[#fea619] rounded-full" style={{ width: `${h.occupancy}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#191c1e]">{h.occupancy}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
