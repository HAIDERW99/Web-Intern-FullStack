import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#131b2e] text-white border-t border-[#1e2d47] mt-auto">
      {/* ── Main Footer Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fea619] text-3xl select-none">
                hotel_class
              </span>
              <span className="font-bold text-2xl tracking-tight text-white">HostHaven</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Elevate your hospitality experience. Discover world-class stays, book verified luxury properties, or list and manage your own hotel effortlessly.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-amber-300 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Verified Properties Platform
              </span>
            </div>
          </div>

          {/* Column 2: Explore & Book */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-gray-300 hover:text-amber-400 transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Luxury Resorts
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Private Villas
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Boutique Hotels
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Owners */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              For Hotel Owners
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register" className="text-gray-300 hover:text-amber-400 transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Owner Portal
                </Link>
              </li>
              <li>
                <Link to="/owner/dashboard" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Earnings & Analytics
                </Link>
              </li>
              <li>
                <Link to="/owner/inventory" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Manage Inventory
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Management & Portals */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Management
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 font-medium transition-all"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-amber-400 transition-colors">
                  Account Settings
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="text-gray-300 hover:text-amber-400 transition-colors">
                  My Reservations
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ── Bottom Divider & Bar ── */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} HostHaven Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/admin/login"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center gap-1"
            >
              <span>🔒</span> Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
