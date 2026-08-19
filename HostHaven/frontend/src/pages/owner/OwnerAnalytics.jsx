import OwnerLayout from './OwnerLayout';

export default function OwnerAnalytics() {
  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Performance Analytics</h1>
          <p className="text-xs text-[#76777d]">Monthly revenue growth, occupancy rates, and payout insights.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-3">
            <h3 className="font-semibold text-sm text-[#191c1e]">Monthly Revenue breakdown</h3>
            <div className="h-48 bg-[#f7f9fb] rounded-xl flex items-end justify-between p-4 gap-2 border border-[#e0e3e5]">
              {[40, 65, 80, 55, 90, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-[#131b2e] rounded-t-lg hover:bg-[#fea619] transition-colors" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-[#76777d] font-semibold uppercase">
              <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs space-y-4">
            <h3 className="font-semibold text-sm text-[#191c1e]">Occupancy & Performance Metrics</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#45464d] mb-1">
                  <span>Average Daily Rate (ADR)</span>
                  <span className="text-[#191c1e] font-bold">$245.00</span>
                </div>
                <div className="w-full h-2 bg-[#e0e3e5] rounded-full overflow-hidden">
                  <div className="bg-[#fea619] h-full w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#45464d] mb-1">
                  <span>RevPAR (Revenue Per Available Room)</span>
                  <span className="text-[#191c1e] font-bold">$189.50</span>
                </div>
                <div className="w-full h-2 bg-[#e0e3e5] rounded-full overflow-hidden">
                  <div className="bg-[#3980f4] h-full w-[65%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
