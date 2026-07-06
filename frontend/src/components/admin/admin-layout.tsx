"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import AdminIcon, { type AdminIconName } from "./admin-icons"
import styles from "./admin-layout.module.css"

const mainMenu: Array<[string, string, AdminIconName]> = [
  ["/admin", "Tổng quan", "grid"], ["/admin/lessons", "Bài học", "book"], ["#vocabulary", "Từ vựng", "language"], ["#practice", "Câu luyện tập", "headphones"], ["#dictation", "Dictation", "mic"], ["#arrange", "Sắp xếp câu", "list"], ["#quiz", "Quiz", "quiz"], ["#users", "Người dùng", "users"], ["/admin/payments", "Thanh toán", "card"], ["/leaderboard", "Bảng xếp hạng", "chart"],
]

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  return <><aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}><Link href="/admin" className={styles.logo}><strong>ChineseDict</strong><span>ADMIN DASHBOARD</span></Link><nav>{mainMenu.map(([href,label,icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link href={href} className={active ? styles.activeItem : ""} onClick={onClose} key={label}><AdminIcon name={icon} /><span>{label}</span></Link> })}</nav><div className={styles.sidebarBottom}><a href="#settings"><AdminIcon name="settings" /><span>Cài đặt</span></a><Link href="/"><AdminIcon name="logout" /><span>Logout</span></Link></div></aside>{open && <button className={styles.scrim} onClick={onClose} aria-label="Đóng menu" />}</>
}

function AdminTopbar({ onMenu }: { onMenu: () => void }) {
  return <header className={styles.topbar}><button type="button" className={styles.menuButton} onClick={onMenu} aria-label="Mở menu"><AdminIcon name="menu" /></button><strong>ChineseDict Admin</strong><label className={styles.search}><AdminIcon name="search" /><input placeholder="Tìm kiếm nhanh..." /></label><button type="button" className={styles.toolButton} aria-label="Thông báo"><AdminIcon name="bell" /><i /></button><button type="button" className={styles.toolButton} aria-label="Giao diện tối"><AdminIcon name="moon" /></button><div className={styles.adminUser}><span><strong>Admin User</strong><small>Super Administrator</small></span><i>AU</i></div></header>
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className={styles.adminPage}><div className={styles.adminShell}><AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><section className={styles.workspace}><AdminTopbar onMenu={() => setSidebarOpen(true)} /><div className={styles.content}>{children}</div></section></div></div>
}
