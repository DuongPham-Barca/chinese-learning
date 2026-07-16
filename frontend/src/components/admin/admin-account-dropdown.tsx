"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { getAdminSession } from "@/services/admin-user.service"
import styles from "./admin-account-dropdown.module.css"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

type AdminDropdownItem = {
  icon: string
  label: string
  desc: string
  href: string
}

const items: AdminDropdownItem[] = [
  { icon: "profile", label: "Hồ sơ cá nhân", desc: "Xem và chỉnh sửa thông tin quản trị", href: "/admin/profile" },
  { icon: "settings", label: "Cài đặt", desc: "Tùy chỉnh hệ thống", href: "/admin/settings" },
  { icon: "activity", label: "Nhật ký hoạt động", desc: "Xem lịch sử đăng nhập và thao tác", href: "/admin/activity" },
]

function MenuIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    profile: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    activity: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6" />
        <path d="M10 16l2 2 4-4" />
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
      <motion.div className={styles.confirmBox} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }}>
        <h3>Đăng xuất</h3>
        <p>Bạn có chắc chắn muốn đăng xuất?</p>
        <div className={styles.confirmActions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>Hủy</button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>Đăng xuất</button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

export default function AdminAccountDropdown() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [adminName, setAdminName] = useState("Admin")
  const adminInitials = adminName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    getAdminSession().then((session) => setAdminName(session.user.username)).catch(() => undefined)
  }, [])

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
    sessionStorage.removeItem("admin-route-session")
    try {
      await fetch(`${API_BASE_URL}/auth/admin/logout`, {
        method: "POST",
        credentials: "include",
      })
    } finally {
      window.location.replace("/admin/login")
    }
  }

  return (
    <>
      <button type="button" ref={triggerRef} className={styles.trigger} onClick={() => setOpen((v) => !v)} aria-label="Menu tài khoản" aria-expanded={open}>
        <div className={styles.adminUser}>
          <span>
            <strong>{adminName}</strong>
            <small>Super Administrator</small>
          </span>
          <i>{adminInitials}</i>
        </div>
        <span className={`${styles.chevron} ${open ? styles.chevronUp : ""}`}><MenuIcon name="chevron" /></span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            className={styles.dropdown}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className={styles.header}>
              <span className={styles.headerAvatar}>{adminInitials}</span>
              <div>
                <strong>{adminName}</strong>
                <span>Super Administrator</span>
                <span className={styles.badge}>Administrator</span>
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
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog open={confirmOpen} onConfirm={logout} onCancel={() => setConfirmOpen(false)} />
    </>
  )
}
