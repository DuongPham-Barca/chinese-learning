"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"

export type MockUpgradeUser = {
  id: string
  name: string
  isLoggedIn: boolean
  isPro: boolean
}

type ProUpgradeContextValue = {
  user: MockUpgradeUser
  openUpgrade: (unlockedHref?: string) => void
}

const mockUser: MockUpgradeUser = {
  id: "u123456",
  name: "Dương Hải",
  isLoggedIn: true,
  isPro: false,
}

const ProUpgradeContext = createContext<ProUpgradeContextValue | null>(null)

export function ProUpgradeProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const value = useMemo<ProUpgradeContextValue>(() => ({
    user: mockUser,
    openUpgrade: (unlockedHref?: string) => {
      if (!mockUser.isLoggedIn) {
        router.push("/auth/login?next=upgrade")
        return
      }
      if (mockUser.isPro) {
        if (unlockedHref) router.push(unlockedHref)
        return
      }
      router.push("/pricing")
    },
  }), [router])

  return <ProUpgradeContext.Provider value={value}>{children}</ProUpgradeContext.Provider>
}

export function useProUpgrade() {
  const context = useContext(ProUpgradeContext)
  if (!context) throw new Error("useProUpgrade must be used inside ProUpgradeProvider")
  return context
}
