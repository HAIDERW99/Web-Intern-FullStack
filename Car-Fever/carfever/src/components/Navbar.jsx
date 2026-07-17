import { useState, useEffect } from 'react'
import { Heart, User, Menu, X, ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Buy',  href: '#', key: 'home' },
  { label: 'Sell', href: '#', key: 'sell' },
  { label: 'News', href: '#', key: 'news' },
  { label: 'Help', href: '#', key: 'help' },
]

export default function Navbar({ onLogoClick, onSellClick, onDashboardClick, activePage }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-shadow duration-300 bg-white ${
          scrolled ? 'shadow-[0_2px_16px_rgba(0,26,53,0.10)]' : 'border-b border-outline-variant'
        }`}
      >
        <div className="max-w-container mx-auto px-5 lg:px-10 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <a href="#" onClick={e => { e.preventDefault(); onLogoClick?.() }} className="flex-shrink-0 flex items-center select-none">
            <span className="font-grotesk text-[22px] font-bold tracking-tight text-deep-navy">CAR</span>
            <span className="font-grotesk text-[22px] font-bold tracking-tight" style={{ color: '#bb0014' }}>FEVER</span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href, key }) => {
              const active = key === 'sell' ? activePage === 'sell' : key === 'home' ? (activePage === 'home' || activePage === 'search' || activePage === 'details') : false
              return (
                <a key={label} href={href}
                  onClick={e => { e.preventDefault(); if (key === 'sell') onSellClick?.() }}
                  className={`relative px-3 py-1.5 text-body-sm font-medium rounded transition-colors ${
                    active ? 'text-accent-red font-semibold' : 'text-on-surface-variant hover:text-deep-navy'
                  }`}
                >
                  {label}
                  {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent-red" />}
                </a>
              )
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              aria-label="Saved cars"
              className="p-2 rounded text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
            >
              <Heart size={20} />
            </button>
            <button
              onClick={() => onDashboardClick?.()}
              aria-label="Dealer Dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-body-sm text-on-surface-variant hover:text-deep-navy hover:bg-surface-container transition-colors"
            >
              <User size={18} />
              <span>Dashboard</span>
            </button>
            <a
              href="#"
              onClick={e => { e.preventDefault(); onSellClick?.() }}
              className="ml-2 px-5 py-2 rounded bg-deep-navy text-white text-body-sm font-semibold hover:bg-navy-mid active:scale-95 transition-all duration-150"
            >
              Sell My Car
            </a>
          </div>

          {/* Mobile right actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              aria-label="Saved cars"
              className="p-2 rounded text-on-surface-variant hover:text-deep-navy transition-colors"
            >
              <Heart size={20} />
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded text-deep-navy hover:bg-surface-container transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-[60] flex transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`relative ml-auto w-[80vw] max-w-xs h-full bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-outline-variant">
            <span className="font-grotesk text-[20px] font-bold">
              <span className="text-deep-navy">CAR</span>
              <span style={{ color: '#bb0014' }}>FEVER</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer nav */}
          <nav className="flex-1 overflow-y-auto py-4 px-4">
            {NAV_LINKS.map(({ label, href, active }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between w-full px-4 py-3.5 rounded-lg mb-1 text-body-md font-medium transition-colors ${
                  active
                    ? 'bg-surface-container-low text-accent-red font-semibold'
                    : 'text-on-surface hover:bg-surface-container'
                }`}
              >
                {label}
                {active && <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />}
              </a>
            ))}
          </nav>

          {/* Drawer footer */}
          <div className="px-4 py-6 border-t border-outline-variant space-y-3">
            <button
              onClick={() => { onDashboardClick?.(); setMobileOpen(false) }}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors">
              <User size={18} />
              <span>Dealer Dashboard</span>
            </button>
            <a
              href="#"
              onClick={e => { e.preventDefault(); onSellClick?.(); setMobileOpen(false) }}
              className="block w-full px-4 py-3 text-center rounded bg-deep-navy text-white text-body-md font-semibold hover:bg-navy-mid transition-colors"
            >
              Sell My Car
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
