/**
 * useVehicles — shared data-fetching hook
 *
 * Fetches vehicles from GET /api/vehicles with any filter/sort/pagination params.
 * Returns { vehicles, loading, error, pagination, refetch }.
 *
 * Usage:
 *   const { vehicles, loading, error, pagination } = useVehicles({ make: 'BMW', page: 1 })
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { normalizeVehicle } from '../utils/normalizeVehicle'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export function useVehicles(params = {}) {
  const [vehicles,   setVehicles]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, total_pages: 0 })

  // Stable serialised key so useEffect only re-runs when params actually change
  const paramsKey = JSON.stringify(params)
  const abortRef  = useRef(null)

  const fetchVehicles = useCallback(async (queryParams) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      // Build query string — skip empty/undefined/null values
      const qs = new URLSearchParams()
      Object.entries(queryParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'Any Make' && v !== 'Any Model') {
          qs.append(k, v)
        }
      })

      const url = `${BASE_URL}/api/vehicles${qs.toString() ? '?' + qs.toString() : ''}`
      const res  = await fetch(url, { signal: abortRef.current.signal })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }

      const json = await res.json()

      setVehicles((json.data || []).map(normalizeVehicle))
      setPagination(json.pagination ?? { total: 0, page: 1, limit: 12, total_pages: 0 })
    } catch (err) {
      if (err.name === 'AbortError') return   // request was intentionally cancelled
      setError(err.message || 'Failed to load vehicles')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchVehicles(params)
    return () => { if (abortRef.current) abortRef.current.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, fetchVehicles])

  const refetch = () => fetchVehicles(params)

  return { vehicles, loading, error, pagination, refetch }
}
