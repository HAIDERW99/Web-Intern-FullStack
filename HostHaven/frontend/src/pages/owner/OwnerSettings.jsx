import { useState } from 'react';
import OwnerLayout from './OwnerLayout';
import { useAuth } from '../../context/AuthContext';

export default function OwnerSettings() {
  const { profile } = useAuth();
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Property Settings</h1>
          <p className="text-xs text-[#76777d]">Configure payout accounts, policies, and notifications.</p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700">
            Settings updated successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-[#e0e3e5] space-y-4 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Payout Method</label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none bg-white"
            >
              <option value="bank">Direct Bank Transfer (ACH)</option>
              <option value="stripe">Stripe Connect Account</option>
              <option value="paypal">PayPal Business</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Account Number / IBAN</label>
            <input
              type="text"
              placeholder="**** **** **** 4892"
              defaultValue="US893700000129384"
              className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Cancellation Policy</label>
            <select className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none bg-white">
              <option value="flexible">Flexible (100% refund up to 24h before check-in)</option>
              <option value="moderate">Moderate (100% refund up to 5 days before check-in)</option>
              <option value="strict">Strict (50% refund up to 7 days before check-in)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#131b2e] text-white text-xs font-semibold rounded-xl hover:bg-[#1e2d47] transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>
    </OwnerLayout>
  );
}
