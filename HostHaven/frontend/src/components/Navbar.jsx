import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Explore' },
    { to: '/properties', label: 'Properties' },
    { to: '/reservations', label: 'Reservations' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e0e3e5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ── */}
          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="font-bold text-xl text-[#131b2e] tracking-tight">HostHaven</span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[#191c1e] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-[#fea619] after:rounded-full'
                      : 'text-[#45464d] hover:text-[#191c1e]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* ── Right Actions ── */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notification bell */}
            <button
              aria-label="Notifications"
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#45464d] hover:bg-[#f2f4f6] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Help */}
            <button
              aria-label="Help"
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#45464d] hover:bg-[#f2f4f6] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-[#e0e3e5] hover:bg-[#f2f4f6] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#131b2e] text-white text-xs font-semibold flex items-center justify-center uppercase select-none">
                    {profile?.full_name?.[0] ?? user.email?.[0] ?? 'U'}
                  </div>
                  <svg className="w-4 h-4 text-[#45464d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-[#e0e3e5] shadow-float py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-[#e0e3e5]">
                      <p className="text-sm font-semibold text-[#191c1e] truncate">{profile?.full_name ?? 'User'}</p>
                      <p className="text-xs text-[#76777d] truncate">{user.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#45464d] hover:bg-[#f2f4f6] transition-colors">
                      Profile
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="ml-1 px-4 py-2 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors">
                Sign In
              </Link>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[#45464d] hover:bg-[#f2f4f6]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e0e3e5] bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#f2f4f6] text-[#191c1e]' : 'text-[#45464d] hover:bg-[#f2f4f6]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[#e0e3e5]">
            {user ? (
              <button onClick={handleSignOut}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Sign Out
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-white bg-[#131b2e] rounded-lg text-center">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
