"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import AdminIcon, { type AdminIconName } from "./admin-icons"
import AdminAccountDropdown from "./admin-account-dropdown"
import styles from "./admin-layout.module.css"

const mainMenu: Array<[string, string, AdminIconName]> = [
  ["/admin", "Tổng quan", "grid"], ["/admin/lessons", "Bài học", "book"], ["/admin/users", "Người dùng", "users"], ["#vocabulary", "Từ vựng", "language"], ["#practice", "Câu luyện tập", "headphones"], ["#dictation", "Dictation", "mic"], ["#arrange", "Sắp xếp câu", "list"], ["/leaderboard", "Bảng xếp hạng", "chart"],
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return <div className={styles.adminPage}><div className={styles.adminShell}><AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><section className={styles.workspace}><AdminTopbar onMenu={() => setSidebarOpen(true)} /><div className={styles.content}>{children}</div></section></div></div>
}
