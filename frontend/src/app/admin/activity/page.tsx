"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, PageHeader } from "@/components/admin/admin-ui"
import { getActivities, type Activity } from "@/services/admin-dashboard.service"
import styles from "./activity.module.css"

const typeLabels: Record<string, string> = { user: "Người dùng", payment: "Thanh toán", lesson: "Bài học" }

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadActivities = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getActivities({ page, limit: 20, search, type })
      setActivities(response.data)
      setTotal(response.pagination.total)
      setTotalPages(response.pagination.totalPages)
    } catch {
      setError("Không thể tải nhật ký hoạt động")
    } finally {
      setLoading(false)
    }
  }, [page, search, type])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void loadActivities() })
    return () => { active = false }
  }, [loadActivities])

  function exportCsv() {
    const rows = [["Thời gian", "Loại", "Hoạt động", "Chi tiết"], ...activities.map((item) => [new Date(item.timestamp).toLocaleString("vi-VN"), typeLabels[item.type] || item.type, item.title, item.text])]
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `nhat-ky-admin-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader title="Nhật ký hoạt động" subtitle={`${total} sự kiện người dùng, thanh toán và bài học gần nhất`} actions={<AdminButton icon="download" onClick={exportCsv} disabled={!activities.length}>Xuất CSV</AdminButton>} />
      <section className={styles.filters}>
        <label><AdminIcon name="search" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm người dùng hoặc bài học..." /></label>
        <select value={type} onChange={(event) => { setType(event.target.value); setPage(1) }}><option value="">Tất cả hoạt động</option><option value="user">Người dùng</option><option value="payment">Thanh toán</option><option value="lesson">Bài học</option></select>
        <AdminButton secondary onClick={() => void loadActivities()}>Tải lại</AdminButton>
      </section>
      <section className={styles.timeline}>
        {loading && <div className={styles.state}>Đang tải hoạt động...</div>}
        {!loading && error && <div className={styles.state}><strong>{error}</strong><button type="button" onClick={() => void loadActivities()}>Thử lại</button></div>}
        {!loading && !error && !activities.length && <div className={styles.state}>Không có hoạt động phù hợp.</div>}
        {!loading && !error && activities.map((item) => <article key={item.id}><i className={styles[item.type]}>{item.type === "payment" ? "✓" : item.type === "lesson" ? "▣" : "●"}</i><div><header><strong>{item.title}</strong><span>{typeLabels[item.type] || item.type}</span></header><p>{item.text}</p></div><time dateTime={item.timestamp}><strong>{item.time}</strong><span>{new Date(item.timestamp).toLocaleString("vi-VN")}</span></time></article>)}
        {!loading && !error && activities.length > 0 && <footer><span>Trang {page}/{totalPages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Sau</button></div></footer>}
      </section>
    </motion.div>
  )
}
