"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AdminButton, PageHeader } from "@/components/admin/admin-ui"
import styles from "./settings.module.css"

export type AdminPreferences = {
  darkMode: boolean
  compactMode: boolean
  notifications: boolean
}

export const ADMIN_PREFERENCES_KEY = "admin-preferences"
const defaults: AdminPreferences = { darkMode: false, compactMode: false, notifications: true }

function applyPreferences(preferences: AdminPreferences) {
  document.documentElement.dataset.adminTheme = preferences.darkMode ? "dark" : "light"
  document.documentElement.dataset.adminDensity = preferences.compactMode ? "compact" : "comfortable"
  window.dispatchEvent(new CustomEvent("admin-preferences-change", { detail: preferences }))
}

export default function AdminSettingsPage() {
  const [preferences, setPreferences] = useState<AdminPreferences>(defaults)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      const stored = localStorage.getItem(ADMIN_PREFERENCES_KEY)
      if (!stored) return
      try { setPreferences({ ...defaults, ...JSON.parse(stored) as Partial<AdminPreferences> }) } catch { localStorage.removeItem(ADMIN_PREFERENCES_KEY) }
    })
  }, [])

  function set<K extends keyof AdminPreferences>(key: K, value: AdminPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function save() {
    localStorage.setItem(ADMIN_PREFERENCES_KEY, JSON.stringify(preferences))
    applyPreferences(preferences)
    setSaved(true)
  }

  function reset() {
    setPreferences(defaults)
    localStorage.removeItem(ADMIN_PREFERENCES_KEY)
    applyPreferences(defaults)
    setSaved(true)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader title="Cài đặt" subtitle="Tùy chỉnh trải nghiệm bảng quản trị" />
      <section className={styles.panel}>
        <header><div><h2>Giao diện và thông báo</h2><p>Các thiết lập được lưu riêng trên trình duyệt này.</p></div>{saved && <span>Đã lưu</span>}</header>
        <div className={styles.options}>
          <label><span><strong>Giao diện tối</strong><small>Giảm độ sáng khi làm việc vào ban đêm.</small></span><input type="checkbox" checked={preferences.darkMode} onChange={(event) => set("darkMode", event.target.checked)} /></label>
          <label><span><strong>Chế độ thu gọn</strong><small>Giảm khoảng cách để xem được nhiều dữ liệu hơn.</small></span><input type="checkbox" checked={preferences.compactMode} onChange={(event) => set("compactMode", event.target.checked)} /></label>
          <label><span><strong>Thông báo trên thanh công cụ</strong><small>Hiện chấm báo và danh sách hoạt động mới.</small></span><input type="checkbox" checked={preferences.notifications} onChange={(event) => set("notifications", event.target.checked)} /></label>
        </div>
        <footer><AdminButton secondary onClick={reset}>Khôi phục mặc định</AdminButton><AdminButton icon="check" onClick={save}>Lưu cài đặt</AdminButton></footer>
      </section>
    </motion.div>
  )
}
