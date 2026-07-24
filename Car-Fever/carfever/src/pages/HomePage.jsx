import HeroSection from '../components/HeroSection'
import CategoryLinks from '../components/CategoryLinks'
import FeaturedVehicles from '../components/FeaturedVehicles'
import SellSection from '../components/SellSection'

export default function HomePage({ onSearch, onViewDetails, onSell }) {
  // "View all" on the featured section → go to search with no filters
  const handleViewAll = () => onSearch({})

  return (
    <main>
      <HeroSection onSearch={onSearch} />
      <CategoryLinks />
      <FeaturedVehicles onViewDetails={onViewDetails} onViewAll={handleViewAll} />
      <SellSection onSell={onSell} />
    </main>
  )
}
