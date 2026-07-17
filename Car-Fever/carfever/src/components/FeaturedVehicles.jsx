import { ChevronRight } from 'lucide-react'
import CarCard from './CarCard'

// High-quality Unsplash car images (free to use)
const FEATURED_CARS = [
  {
    id: 1,
    make: 'BMW',
    model: 'M3 Competition',
    trim: '3.0 Biturbo xDrive',
    year: 2023,
    mileage: 4200,
    fuelType: 'Petrol',
    gearbox: 'Auto',
    price: 72950,
    badges: ['Great Price', 'New In'],
    priceLabel: 'below market',
    belowMarket: 500,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 2,
    make: 'Tesla',
    model: 'Model Y',
    trim: 'Long Range AWD 5dr',
    year: 2024,
    mileage: 50,
    fuelType: 'Electric',
    gearbox: 'Auto',
    price: 54490,
    badges: ['Electric'],
    priceLabel: 'Popular',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    make: 'Audi',
    model: 'RS3',
    trim: '2.5 TFSI Sportback S Tronic',
    year: 2022,
    mileage: 12500,
    fuelType: 'Petrol',
    gearbox: 'S Tronic',
    price: 58995,
    badges: ['Good Price'],
    priceLabel: 'Fair Price',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 4,
    make: 'Porsche',
    model: '911',
    trim: '3.0T 992 Carrera PDK',
    year: 2021,
    mileage: 18000,
    fuelType: 'Petrol',
    gearbox: 'PDK',
    price: 89000,
    badges: ['Rare Find'],
    priceLabel: 'High Spec',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
  },
]

export default function FeaturedVehicles({ onViewDetails }) {
  return (
    <section className="py-14 bg-surface">
      <div className="max-w-container mx-auto px-5 lg:px-10">
        {/* Section header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="font-grotesk font-bold text-headline-lg-mobile md:text-headline-md text-deep-navy">
              Featured Vehicles
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Curated premium selections for your next journey.
            </p>
          </div>
          <a
            href="#"
            className="flex-shrink-0 flex items-center gap-1 text-body-sm font-semibold text-deep-navy hover:text-accent-red transition-colors mt-1"
          >
            View all deals <ChevronRight size={16} />
          </a>
        </div>

        {/* Cards grid: 1 col mobile → 2 col tablet → 4 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURED_CARS.map(car => (
            <CarCard key={car.id} car={car} onViewDetails={onViewDetails} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center sm:hidden">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 rounded border border-deep-navy text-body-sm text-deep-navy font-semibold hover:bg-deep-navy hover:text-white transition-all duration-150"
          >
            View all vehicles <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}
