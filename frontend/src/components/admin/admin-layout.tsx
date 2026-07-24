"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import AdminIcon, { type AdminIconName } from "./admin-icons"
import AdminAccountDropdown from "./admin-account-dropdown"
import { getDashboard, type Activity } from "@/services/admin-dashboard.service"
import styles from "./admin-layout.module.css"
import topbarStyles from "./admin-topbar.module.css"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
const ADMIN_ROUTE_SESSION_KEY = "admin-route-session"
const ADMIN_PREFERENCES_KEY = "admin-preferences"

const mainMenu: Array<[string, string, AdminIconName]> = [
  ["/admin", "Tổng quan", "grid"], ["/admin/lessons", "Bài học", "book"], ["/admin/users", "Người dùng", "users"], ["/leaderboard", "Bảng xếp hạng", "chart"],
]

const quickLinks = [
  { href: "/admin", label: "Tổng quan", hint: "dashboard thống kê" },
  { href: "/admin/lessons", label: "Bài học", hint: "từ vựng câu luyện tập import" },
  { href: "/admin/users", label: "Người dùng", hint: "tài khoản premium" },
  { href: "/leaderboard", label: "Bảng xếp hạng", hint: "thành tích exp" },
  { href: "/admin/profile", label: "Hồ sơ cá nhân", hint: "thông tin mật khẩu" },
  { href: "/admin/settings", label: "Cài đặt", hint: "giao diện thông báo" },
  { href: "/admin/activity", label: "Nhật ký hoạt động", hint: "lịch sử hệ thống" },
]

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  return <><motion.aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }}><Link href="/admin" className={styles.logo}><strong>Hana</strong><span>ADMIN DASHBOARD</span></Link><nav>{mainMenu.map(([href,label,icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link href={href} className={active ? styles.activeItem : ""} onClick={onClose} key={label}><AdminIcon name={icon} /><span>{label}</span></Link> })}</nav></motion.aside>{open && <button className={styles.scrim} onClick={onClose} aria-label="Đóng menu" />}</>
}

function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return quickLinks.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(normalized)).slice(0, 6)
  }, [query])

  useEffect(() => {
    getDashboard().then((response) => setActivities(response.data.recentActivities)).catch(() => setActivities([]))
    const stored = localStorage.getItem(ADMIN_PREFERENCES_KEY)
    if (stored) {
      try {
        const preferences = JSON.parse(stored) as { darkMode?: boolean; compactMode?: boolean; notifications?: boolean }
        queueMicrotask(() => {
          setDarkMode(Boolean(preferences.darkMode))
          setNotificationsEnabled(preferences.notifications !== false)
        })
        document.documentElement.dataset.adminTheme = preferences.darkMode ? "dark" : "light"
        document.documentElement.dataset.adminDensity = preferences.compactMode ? "compact" : "comfortable"
      } catch { localStorage.removeItem(ADMIN_PREFERENCES_KEY) }
    }
    const handlePreferences = (event: Event) => {
      const preferences = (event as CustomEvent<{ darkMode: boolean; notifications: boolean }>).detail
      setDarkMode(preferences.darkMode)
      setNotificationsEnabled(preferences.notifications)
    }
    window.addEventListener("admin-preferences-change", handlePreferences)
    return () => window.removeEventListener("admin-preferences-change", handlePreferences)
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    const close = (event: MouseEvent) => { if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [notificationsOpen])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.dataset.adminTheme = next ? "dark" : "light"
    const stored = localStorage.getItem(ADMIN_PREFERENCES_KEY)
    let preferences: Record<string, unknown> = {}
    try { preferences = stored ? JSON.parse(stored) as Record<string, unknown> : {} } catch { preferences = {} }
    localStorage.setItem(ADMIN_PREFERENCES_KEY, JSON.stringify({ compactMode: false, notifications: true, ...preferences, darkMode: next }))
  }

  function navigate(href: string) { setQuery(""); router.push(href) }

  return <motion.header className={styles.topbar} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}><button type="button" className={styles.menuButton} onClick={onMenu} aria-label="Mở menu"><AdminIcon name="menu" /></button><strong>Hana Admin</strong><div className={topbarStyles.searchWrap}><label className={styles.search}><AdminIcon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && matches[0]) navigate(matches[0].href); if (event.key === "Escape") setQuery("") }} placeholder="Tìm nhanh trang quản trị..." /></label>{query && <div className={topbarStyles.searchResults}>{matches.length ? matches.map((item) => <button type="button" key={item.href} onClick={() => navigate(item.href)}><strong>{item.label}</strong><span>{item.hint}</span></button>) : <p>Không tìm thấy mục phù hợp</p>}</div>}</div><div className={topbarStyles.notificationWrap} ref={notificationsRef}><button type="button" className={styles.toolButton} aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}><AdminIcon name="bell" />{notificationsEnabled && activities.length > 0 && <i />}</button>{notificationsOpen && <div className={topbarStyles.notifications}><header><strong>Hoạt động mới</strong><Link href="/admin/activity" onClick={() => setNotificationsOpen(false)}>Xem tất cả</Link></header>{!notificationsEnabled ? <p>Thông báo đang tắt trong Cài đặt.</p> : activities.length ? activities.slice(0, 4).map((item) => <Link href="/admin/activity" key={item.id} onClick={() => setNotificationsOpen(false)}><strong>{item.title}</strong><span>{item.text}</span><small>{item.time}</small></Link>) : <p>Chưa có hoạt động mới.</p>}</div>}</div><button type="button" className={`${styles.toolButton} ${darkMode ? topbarStyles.activeTool : ""}`} aria-label={darkMode ? "Giao diện sáng" : "Giao diện tối"} aria-pressed={darkMode} onClick={toggleTheme}><AdminIcon name="moon" /></button><span className={styles.dropdownWrap}><AdminAccountDropdown /></span></motion.header>
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === "/admin/login") return

    let active = true

    if (sessionStorage.getItem(ADMIN_ROUTE_SESSION_KEY) !== "active") {
      void fetch(`${API_BASE_URL}/auth/admin/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      })
      router.replace("/admin/login")
      return
    }

    fetch(`${API_BASE_URL}/auth/admin/session`, {
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => {
        if (!active) return
        if (!response.ok) {
          router.replace("/admin/login")
          return
        }
        setAuthorizedPath(pathname)
      })
      .catch(() => {
        if (active) router.replace("/admin/login")
      })

    return () => {
      active = false
    }
  }, [pathname, router])

  useEffect(() => {
    if (pathname === "/admin/login") return

    const endAdminSession = () => {
      sessionStorage.removeItem(ADMIN_ROUTE_SESSION_KEY)
      void fetch(`${API_BASE_URL}/auth/admin/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      })
    }

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return

      const destination = new URL(anchor.href, window.location.href)
      if (
        destination.origin !== window.location.origin
        || destination.pathname === "/admin/login"
        || !destination.pathname.startsWith("/admin")
      ) {
        endAdminSession()
      }
    }

    const handlePopState = () => {
      if (!window.location.pathname.startsWith("/admin")) endAdminSession()
    }

    document.addEventListener("click", handleLinkClick, true)
    window.addEventListener("popstate", handlePopState)

    return () => {
      document.removeEventListener("click", handleLinkClick, true)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [pathname])

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  if (authorizedPath !== pathname) {
    return (
      <div
        role="status"
        style={{ display: "grid", minHeight: "100vh", placeItems: "center", background: "#fffdf8", color: "#475569", fontWeight: 600 }}
      >
        Đang kiểm tra phiên quản trị...
      </div>
    )
  }

  return <div className={`${styles.adminPage} ${topbarStyles.themeRoot}`}><div className={styles.adminShell}><AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><section className={styles.workspace}><AdminTopbar onMenu={() => setSidebarOpen(true)} /><div className={`${styles.content} ${topbarStyles.contentRoot}`}>{children}</div></section></div></div>
}
