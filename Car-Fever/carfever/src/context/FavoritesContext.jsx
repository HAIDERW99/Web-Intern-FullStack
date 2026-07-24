import { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext(null)

const STORAGE_KEY = 'cf_favorites'

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch (err) {
      console.warn('Failed to save favorites to localStorage:', err)
    }
  }, [favorites])

  const isFavorite = (vehicleId) => {
    if (!vehicleId) return false
    return favorites.some(item => String(item.id) === String(vehicleId))
  }

  const toggleFavorite = (vehicle) => {
    if (!vehicle || !vehicle.id) return
    setFavorites(prev => {
      const exists = prev.some(item => String(item.id) === String(vehicle.id))
      if (exists) {
        return prev.filter(item => String(item.id) !== String(vehicle.id))
      } else {
        return [...prev, vehicle]
      }
    })
  }

  const removeFavorite = (vehicleId) => {
    if (!vehicleId) return
    setFavorites(prev => prev.filter(item => String(item.id) !== String(vehicleId)))
  }

  const value = {
    favorites,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
