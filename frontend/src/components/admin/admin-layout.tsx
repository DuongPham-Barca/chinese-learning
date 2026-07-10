"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import AdminIcon, { type AdminIconName } from "./admin-icons"
import AdminAccountDropdown from "./admin-account-dropdown"
import styles from "./admin-layout.module.css"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
const ADMIN_ROUTE_SESSION_KEY = "admin-route-session"

const mainMenu: Array<[string, string, AdminIconName]> = [
  ["/admin", "Tổng quan", "grid"], ["/admin/lessons", "Bài học", "book"], ["/admin/users", "Người dùng", "users"], ["/admin/vocabulary", "Từ vựng", "language"], ["/admin/practice", "Câu luyện tập", "headphones"], ["/admin/dictation", "Dictation", "mic"], ["/admin/arrange", "Sắp xếp câu", "list"], ["/leaderboard", "Bảng xếp hạng", "chart"],
]

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  return <><motion.aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.45, ease: "easeOut" }}><Link href="/admin" className={styles.logo}><strong>ChineseDict</strong><span>ADMIN DASHBOARD</span></Link><nav>{mainMenu.map(([href,label,icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link href={href} className={active ? styles.activeItem : ""} onClick={onClose} key={label}><AdminIcon name={icon} /><span>{label}</span></Link> })}</nav></motion.aside>{open && <button className={styles.scrim} onClick={onClose} aria-label="Đóng menu" />}</>
}

function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  return <motion.header className={styles.topbar} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}><button type="button" className={styles.menuButton} onClick={onMenu} aria-label="Mở menu"><AdminIcon name="menu" /></button><strong>ChineseDict Admin</strong><label className={styles.search}><AdminIcon name="search" /><input placeholder="Tìm kiếm nhanh..." /></label><button type="button" className={styles.toolButton} aria-label="Thông báo"><AdminIcon name="bell" /><i /></button><button type="button" className={styles.toolButton} aria-label="Giao diện tối"><AdminIcon name="moon" /></button><span className={styles.dropdownWrap}><AdminAccountDropdown /></span></motion.header>
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
    window.addEventListener("pagehide", endAdminSession)

    return () => {
      document.removeEventListener("click", handleLinkClick, true)
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("pagehide", endAdminSession)
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

  return <div className={styles.adminPage}><div className={styles.adminShell}><AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><section className={styles.workspace}><AdminTopbar onMenu={() => setSidebarOpen(true)} /><div className={styles.content}>{children}</div></section></div></div>
}
