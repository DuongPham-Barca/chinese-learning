"use client"

import { createContext, type ReactNode, useContext, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"

export type MockUpgradeUser = {
  id: string
  name: string
  email: string
  isLoggedIn: boolean
  isPro: boolean
}

type ProUpgradeContextValue = {
  user: MockUpgradeUser
  openUpgrade: (unlockedHref?: string) => void
}

const ProUpgradeContext = createContext<ProUpgradeContextValue | null>(null)

export function ProUpgradeProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const isPro = Boolean(
    authUser?.isPremium
    && (!authUser.subscriptionUntil || new Date(authUser.subscriptionUntil) > new Date()),
  )
  const user = useMemo<MockUpgradeUser>(() => ({
    id: authUser?.id ?? "",
    name: authUser?.username ?? "",
    email: authUser?.email ?? "",
    isLoggedIn: Boolean(authUser),
    isPro,
  }), [authUser, isPro])

  const value = useMemo<ProUpgradeContextValue>(() => ({
    user,
    openUpgrade: (unlockedHref?: string) => {
      if (!user.isLoggedIn) {
        router.push("/login?next=/pricing")
        return
      }
      if (user.isPro) {
        if (unlockedHref) router.push(unlockedHref)
        return
      }
      router.push("/pricing")
    },
  }), [router, user])

  return <ProUpgradeContext.Provider value={value}>{children}</ProUpgradeContext.Provider>
}

export function useProUpgrade() {
  const context = useContext(ProUpgradeContext)
  if (!context) throw new Error("useProUpgrade must be used inside ProUpgradeProvider")
  return context
}
