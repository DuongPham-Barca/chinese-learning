"use client"

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import api from "@/lib/api"
import type { AuthUser } from "@/types/api"

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await api.get<{ user: AuthUser }>("/auth/me")
      setUser(response.data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    api.get<{ user: AuthUser }>("/auth/me")
      .then((response) => {
        if (active) setUser(response.data.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const logout = useCallback(async () => {
    await api.post("/auth/logout")
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
