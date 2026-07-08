"use client"

import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./account-dropdown.module.css"

type DropdownItem = {
  icon: string
  label: string
  desc: string
  href: string
}

const items: DropdownItem[] = [
  { icon: "profile", label: "Hồ sơ cá nhân", desc: "Xem và chỉnh sửa thông tin cá nhân", href: "/profile" },
  { icon: "payment", label: "Thanh toán", desc: "Gia hạn hoặc nâng cấp tài khoản", href: "/pricing" },
  { icon: "progress", label: "Tiến độ học tập", desc: "Xem thống kê học tập", href: "/progress" },
  { icon: "settings", label: "Cài đặt", desc: "Tùy chỉnh tài khoản", href: "/settings" },
]

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    profile: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    payment: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
    progress: (
      <>
        <path d="m16 2 4 4-4 4" />
        <path d="M18 6H8a5 5 0 0 0 0 10h8" />
        <path d="M14 18 2 18" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function ConfirmDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null
  return createPortal(
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3>Đăng xuất</h3>
        <p>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Hủy</button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function AccountDropdown() {
  const { user: upgradeUser } = useProUpgrade()
  const { user: authUser, logout: logoutAuth } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const displayName = authUser?.username || upgradeUser.name
  const displayEmail = authUser?.email || upgradeUser.email
  const initials = displayName.split(" ").map((part) => part[0]).slice(-2).join("").toUpperCase()
  const avatarStyle: CSSProperties | undefined = authUser?.avatarUrl
    ? { backgroundImage: `url(${authUser.avatarUrl})`, backgroundPosition: "center", backgroundSize: "cover" }
    : undefined

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("keydown", handleKey)
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [open, close])

  async function logout() {
    setConfirmOpen(false)
    close()
    try {
      await logoutAuth()
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <>
      <button type="button" ref={triggerRef} className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-label="Menu tài khoản" aria-expanded={open}>
        <span className={styles.avatar} style={avatarStyle}><i>{authUser?.avatarUrl ? "" : initials}</i></span>
        <span className={styles.name}>{displayName}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronUp : ""}`}><MenuIcon name="chevron" /></span>
      </button>
      {open && (
        <div ref={dropdownRef} className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.headerAvatar} style={avatarStyle}>{authUser?.avatarUrl ? "" : initials}</span>
            <div>
              <strong>{displayName}</strong>
              <span>{displayEmail}</span>
              <span className={`${styles.badge} ${upgradeUser.isPro ? styles.proBadge : styles.freeBadge}`}>{upgradeUser.isPro ? "Pro Member" : "Free Member"}</span>
            </div>
          </div>
          <div className={styles.menu}>
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={styles.menuItem} onClick={close}>
                <span className={styles.menuIcon}><MenuIcon name={item.icon} /></span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.divider} />
          <button type="button" className={styles.logoutItem} onClick={() => { close(); setConfirmOpen(true) }}>
            <span className={styles.menuIcon}><MenuIcon name="logout" /></span>
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
      <ConfirmDialog open={confirmOpen} onConfirm={logout} onCancel={() => setConfirmOpen(false)} />
    </>
  )
}
