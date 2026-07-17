import { useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import SearchResults from './pages/SearchResults'
import VehicleDetails from './pages/VehicleDetails'
import SellYourCar from './pages/SellYourCar'
import DealerDashboard from './pages/DealerDashboard'

/**
 * App-level state machine — 5 pages:
 *   'home'      → Page 1: HomePage
 *   'search'    → Page 2: SearchResults
 *   'details'   → Page 3: VehicleDetails (VDP)
 *   'sell'      → Page 4: SellYourCar
 *   'dashboard' → Page 5: DealerDashboard
 *
 * No react-router needed — pure state-driven navigation.
 * Navbar + Footer stay mounted globally, except on 'dashboard'
 * which has its own internal portal nav and footer.
 */
export default function App() {
  const [page,            setPage]            = useState('home')
  const [query,           setQuery]           = useState({})
  const [activeVehicleId, setActiveVehicleId] = useState(null)

  const navigate = (to, opts = {}) => {
    setPage(to)
    if (opts.query)     setQuery(opts.query)
    if (opts.vehicleId) setActiveVehicleId(opts.vehicleId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Dashboard replaces the whole chrome (has its own sub-nav + footer)
  const isDashboard = page === 'dashboard'

  return (
    <div className="min-h-screen bg-surface font-inter antialiased">
      {/* Global navbar — hidden inside dashboard (it has its own) */}
      {!isDashboard && (
        <Navbar
          onLogoClick={() => navigate('home')}
          onSellClick={() => navigate('sell')}
          onDashboardClick={() => navigate('dashboard')}
          activePage={page}
        />
      )}

      {page === 'home' && (
        <HomePage
          onSearch={q => navigate('search', { query: q })}
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
          onLogout={() => navigate('home')}
        />
      )}

      {/* Global footer — hidden inside dashboard */}
      {!isDashboard && <Footer />}
    </div>
  )
}
