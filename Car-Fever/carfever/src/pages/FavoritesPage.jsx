import { Heart, ArrowLeft, Car } from 'lucide-react'
import { useFavorites } from '../context/FavoritesContext'
import CarCard from '../components/CarCard'

export default function FavoritesPage({ onGoHome, onViewDetails }) {
  const { favorites, favoritesCount } = useFavorites()

  return (
    <div className="min-h-screen bg-surface pt-20 pb-16">
      <div className="max-w-container mx-auto px-5 lg:px-10">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-deep-navy font-medium mb-2 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Search
            </button>
            <h1 className="font-grotesk font-bold text-[32px] text-deep-navy leading-tight flex items-center gap-3">
              <Heart className="text-accent-red fill-accent-red" size={28} /> Saved Vehicles ({favoritesCount})
            </h1>
          </div>
        </div>

        {/* Content Body */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant p-12 text-center shadow-card max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-red-50 text-accent-red flex items-center justify-center mx-auto mb-4">
              <Heart size={32} />
            </div>
            <h3 className="font-grotesk font-bold text-headline-sm text-deep-navy mb-2">No Saved Vehicles Yet</h3>
            <p className="text-body-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
              Tap the heart icon on any vehicle card to save cars you like and keep track of them here.
            </p>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-body-sm hover:brightness-110 active:scale-95 transition-all shadow-md"
              style={{ background: '#bb0014' }}
            >
              <Car size={18} /> Browse Available Cars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map(car => (
              <CarCard
                key={car.id}
                car={car}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
