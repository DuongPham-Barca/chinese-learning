"use client"

import { useProUpgrade } from "@/lib/pro-upgrade-provider"

type ProUpgradeTriggerProps = {
  className?: string
  unlockedHref?: string
  loggedOutLabel?: string
  upgradeLabel?: string
  proLabel?: string
}

export default function ProUpgradeTrigger({ className, unlockedHref, loggedOutLabel = "Đăng nhập để nâng cấp", upgradeLabel = "Nâng cấp Pro", proLabel = "Đã mở khóa Pro" }: ProUpgradeTriggerProps) {
  const { user, openUpgrade } = useProUpgrade()
  const label = !user.isLoggedIn ? loggedOutLabel : user.isPro ? proLabel : upgradeLabel
  return <button type="button" className={className} onClick={() => openUpgrade(unlockedHref)} disabled={user.isPro && !unlockedHref}>{label}</button>
}
