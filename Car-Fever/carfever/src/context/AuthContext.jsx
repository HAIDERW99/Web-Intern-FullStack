/**
 * AuthContext — global session state with localStorage persistence.
 *
 * Stored in localStorage key: 'cf_session'
 * Shape: { id, email, name, company_name, phone, loggedInAt }
 *
 * Usage:
 *   const { user, login, logout, isLoggedIn } = useAuth()
 */

import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'cf_session'

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession())

  const login = useCallback((userData) => {
    const session = { ...userData, loggedInAt: Date.now(), listing_ids: [] }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('cf_registered_user')
    setUser(null)
  }, [])

  /** Sync listing_ids from localStorage into state (called by dashboard) */
  const refreshSession = useCallback(() => {
    const fresh = loadSession()
    setUser(fresh)
  }, [])

  const updateUser = useCallback((updatedFields) => {
    setUser(prev => {
      const next = { ...(prev || {}), ...updatedFields }
      localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isLoggedIn = !!user

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, refreshSession, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
