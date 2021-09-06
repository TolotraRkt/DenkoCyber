import { useEffect, useMemo, useState } from 'react'
import { authApi, clearToken, getToken, setToken } from '../services/api.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Only "loading" when there is a token to validate on mount.
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) return

    let active = true
    authApi
      .me()
      .then((data) => {
        if (active) setUser(data)
      })
      .catch(() => {
        if (active) clearToken()
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(username, password) {
        const { access_token } = await authApi.login(username, password)
        setToken(access_token)
        setUser(await authApi.me())
      },
      async register(payload) {
        return authApi.register(payload)
      },
      logout() {
        clearToken()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
