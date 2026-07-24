import { useState, useEffect, useCallback } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import SearchResults from './pages/SearchResults'
import VehicleDetails from './pages/VehicleDetails'
import SellYourCar from './pages/SellYourCar'
import DealerDashboard from './pages/DealerDashboard'
import AuthPage from './pages/AuthPage'
import FavoritesPage from './pages/FavoritesPage'
import { useAuth } from './context/AuthContext'

const VALID_PAGES = ['home', 'auth', 'dashboard', 'search', 'sell', 'details', 'favorites']
const PROTECTED   = ['dashboard', 'sell']

function hashToPage() {
  const raw = window.location.hash.replace('#', '').split('?')[0]
  return VALID_PAGES.includes(raw) ? raw : 'home'
}

export default function App() {
  const { isLoggedIn, login, logout } = useAuth()

  const [page,            setPage]            = useState(() => hashToPage())
  const [query,           setQuery]           = useState({})
  const [activeVehicleId, setActiveVehicleId] = useState(null)

  // ── Core navigation ──────────────────────────────────────────────────────
  const navigate = useCallback((to, opts = {}) => {
    const destination = PROTECTED.includes(to) && !isLoggedIn ? 'auth' : to
    setPage(destination)
    if (opts.query     !== undefined) setQuery(opts.query)
    if (opts.vehicleId !== undefined) setActiveVehicleId(opts.vehicleId)
    const newHash = `#${destination}`
    if (window.location.hash !== newHash) {
      window.history.pushState({ page: destination }, '', newHash)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [isLoggedIn])

  // ── Browser back / forward ────────────────────────────────────────────────
  useEffect(() => {
    const onPop = () => {
      const target = hashToPage()
      const safe   = PROTECTED.includes(target) && !isLoggedIn ? 'auth' : target
      setPage(safe)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isLoggedIn])

  // ── Seed initial hash ─────────────────────────────────────────────────────
  useEffect(() => {
    const initial = hashToPage()
    const safe    = PROTECTED.includes(initial) && !isLoggedIn ? 'auth' : initial
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState({ page: safe }, '', `#${safe}`)
    }
    setPage(safe)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auth callbacks ────────────────────────────────────────────────────────
  const handleLoginSuccess = useCallback((userData) => {
    login(userData)
    // push the hash then flip the state
    window.history.pushState({ page: 'dashboard' }, '', '#dashboard')
    setPage('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [login])

  // ── Handle Google OAuth Redirect ──────────────────────────────────────────
  useEffect(() => {
    const handleOAuthHash = () => {
      const hash = window.location.hash
      const search = window.location.search

      if (hash.startsWith('#auth_success=')) {
        try {
          const jsonStr = decodeURIComponent(hash.substring('#auth_success='.length))
          const userData = JSON.parse(jsonStr)
          console.log('[AUTH] Successful Google OAuth login, user metadata received:', userData)
          handleLoginSuccess(userData)
        } catch (err) {
          console.error('[AUTH] Failed to parse Google OAuth success payload:', err)
        }
      } else if (search.includes('token=')) {
        try {
          const params = new URLSearchParams(search)
          const token = params.get('token')
          const userStr = params.get('user')
          if (userStr) {
            const userData = JSON.parse(decodeURIComponent(userStr))
            if (token) userData.token = token
            handleLoginSuccess(userData)
          }
        } catch (err) {
          console.error('[AUTH] Failed to parse token from URL search params:', err)
        }
      } else if (hash.startsWith('#auth_error=')) {
        const errMsg = decodeURIComponent(hash.substring('#auth_error='.length))
        console.error('[AUTH] Google OAuth error from redirect:', errMsg)
        alert(`Google Sign-In failed: ${errMsg}`)
        navigate('auth')
      }
    }

    // Check hash on mount/load
    handleOAuthHash()

    // Also listen for hashchange events
    window.addEventListener('hashchange', handleOAuthHash)
    return () => window.removeEventListener('hashchange', handleOAuthHash)
  }, [handleLoginSuccess, navigate])

  const handleLogout = useCallback(() => {
    logout()
    window.history.pushState({ page: 'auth' }, '', '#auth')
    setPage('auth')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [logout])

  const [dashboardTab, setDashboardTab] = useState({ portalTab: 'Inventory', tab: 'active' })

  const handleNavigateToLeads = useCallback(() => {
    setDashboardTab({ portalTab: 'Leads', tab: 'leads' })
    navigate(isLoggedIn ? 'dashboard' : 'auth')
  }, [isLoggedIn, navigate])

  const isFullscreen = page === 'dashboard' || page === 'auth'

  return (
    <div className="min-h-screen bg-surface font-inter antialiased">
      {!isFullscreen && (
        <Navbar
          onLogoClick={() => navigate('home')}
          onSellClick={() => navigate('sell')}
          onDashboardClick={() => { setDashboardTab({ portalTab: 'Inventory', tab: 'active' }); navigate(isLoggedIn ? 'dashboard' : 'auth') }}
          onNotificationClick={handleNavigateToLeads}
          onFavoritesClick={() => navigate('favorites')}
          activePage={page}
        />
      )}

      {page === 'home' && (
        <HomePage
          onSearch={q => navigate('search', { query: q ?? {} })}
          onViewDetails={id => navigate('details', { vehicleId: id })}
          onSell={() => navigate('sell')}
        />
      )}

      {page === 'search' && (
        <SearchResults
          initialQuery={query}
          onBack={() => navigate('home')}
          onViewDetails={id => navigate('details', { vehicleId: id })}
        />
      )}

      {page === 'details' && (
        <VehicleDetails
          vehicleId={activeVehicleId}
          onBack={() => navigate('home')}
          onBackToSearch={() => navigate('search', { query })}
        />
      )}

      {page === 'sell' && (
        <SellYourCar onGoHome={() => navigate('home')} />
      )}

      {page === 'dashboard' && (
        <DealerDashboard
          onCreateListing={() => navigate('sell')}
          onLogout={handleLogout}
          initialPortalTab={dashboardTab.portalTab}
          initialTab={dashboardTab.tab}
        />
      )}

      {page === 'auth' && (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onGoHome={() => navigate('home')}
        />
      )}

      {page === 'favorites' && (
        <FavoritesPage
          onGoHome={() => navigate('home')}
          onViewDetails={id => navigate('details', { vehicleId: id })}
        />
      )}

      {!isFullscreen && <Footer />}
    </div>
  )
}
