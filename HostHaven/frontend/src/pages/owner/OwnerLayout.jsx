import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function OwnerLayout({ children, onAddRoomClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hotelName = profile?.full_name ? `${profile.full_name}'s Property` : 'Grand Plaza Hotel';

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: 'dashboard' },
    { label: 'Bookings',  path: '/owner/bookings',  icon: 'calendar_month' },
    { label: 'Inventory', path: '/owner/inventory', icon: 'bed' },
    { label: 'Staff',     path: '/owner/staff',     icon: 'groups' },
    { label: 'Analytics', path: '/owner/analytics', icon: 'monitoring' },
  ];

  const BOTTOM_NAV = [
    { label: 'Settings', path: '/owner/settings', icon: 'settings' },
    { label: 'Support',  path: '/owner/support',  icon: 'contact_support' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex flex-col md:flex-row antialiased">

      {/* ── Mobile Top Header ── */}
      <div className="md:hidden bg-[#131b2e] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#fea619]">
            <span className="material-symbols-outlined text-xl select-none">hotel_class</span>
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Property Manager</span>
            <span className="text-[11px] text-white/60 block truncate max-w-[150px]">{hotelName}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="p-2 text-white/80 hover:text-white"
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* ── Sidebar Navigation ── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[260px] lg:w-[280px] bg-[#131b2e] text-white/80 flex flex-col py-6 z-40 flex-shrink-0 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#131b2e] font-bold shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-2xl select-none text-[#131b2e]">domain</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base text-white truncate tracking-tight">Property Manager</h1>
            <p className="text-xs text-white/60 truncate">{hotelName}</p>
          </div>
        </div>

        {/* Add Room Button */}
        <div className="px-4 mb-6">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onAddRoomClick) onAddRoomClick();
            }}
            className="w-full bg-[#855300] hover:bg-[#684000] text-white rounded-lg py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add New Room
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-[#fea619] border-l-4 border-[#fea619] bg-white/5 font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-xl ${isActive ? 'fill' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom Links */}
        <div className="mt-auto pt-4 border-t border-white/10 space-y-1">
          {BOTTOM_NAV.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3.5 px-6 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-[#fea619] border-l-4 border-[#fea619] bg-white/5 font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* User Profile & Logout */}
          <div className="pt-3 px-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#fea619] text-[#2a1700] text-xs font-bold flex items-center justify-center uppercase flex-shrink-0">
                {profile?.full_name?.[0] || user?.email?.[0] || 'O'}
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Owner'}</p>
                <p className="text-[10px] text-white/50 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-white/60 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
