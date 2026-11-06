import { useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { setUnauthorizedHandler } from '../services/api'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => authService.hasSession())

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!authService.hasSession()) return () => setUnauthorizedHandler(null)

    let active = true
    authService.me()
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => authService.logout())
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      setUnauthorizedHandler(null)
    }
  }, [logout])

  const login = useCallback(async (email, password, role) => {
    const authenticatedUser = await authService.login({ email, password }, role)
    setUser(authenticatedUser)
    return authenticatedUser
  }, [])

  const updateProfile = useCallback(async (data) => {
    const updatedUser = await authService.updateProfile(data)
    setUser(updatedUser)
    return updatedUser
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, updateProfile }), [user, loading, login, logout, updateProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}