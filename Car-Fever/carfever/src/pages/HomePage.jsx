import HeroSection from '../components/HeroSection'
import CategoryLinks from '../components/CategoryLinks'
import FeaturedVehicles from '../components/FeaturedVehicles'
import SellSection from '../components/SellSection'

export default function HomePage({ onSearch, onViewDetails }) {
  return (
    <main>
      <HeroSection onSearch={onSearch} />
      <CategoryLinks />
      <FeaturedVehicles onViewDetails={onViewDetails} />
      <SellSection />
    </main>
  )
}
