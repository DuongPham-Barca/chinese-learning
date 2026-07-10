"use client"

import { useEffect, useState } from "react"
import { motion, type Variants } from "framer-motion"
import { AdminButton, PageHeader, StatCard } from "@/components/admin/admin-ui"
import { getDashboard, type DashboardData, type RevenuePoint, type WeeklyNewUser, type Activity } from "@/services/admin-dashboard.service"
import styles from "./dashboard.module.css"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Mđ`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}.000đ`
  return `${n}đ`
}

function RevenueChart({ data }: { data: RevenuePoint[] }) {
  if (!data.length) return null
  const values = data.map((d) => d.total)
  const max = Math.max(...values, 1)
  const points = data.map((d, i) => ({ x: (i / (data.length - 1)) * 620, y: 235 - (d.total / max) * 210 }))
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
  const areaD = `${pathD} L620 235 L0 235 Z`
  const tip = points.length >= 6 ? points[Math.floor(points.length / 2)] : points[points.length - 1]
  const tipVal = data[Math.floor(data.length / 2)]?.total || 0
  const tipDate = data[Math.floor(data.length / 2)]?.date?.slice(5) || ""

  return <section className={styles.chartCard}><header><h2>Biểu đồ Doanh thu (30 ngày)</h2><span><i />Doanh thu</span></header><div className={styles.lineChart}><svg viewBox="0 0 620 250" preserveAspectRatio="none"><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".28"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path className={styles.gridLine} d="M0 50H620M0 100H620M0 150H620M0 200H620"/><path className={styles.area} d={areaD}/><path className={styles.line} d={pathD}/><circle cx={tip.x} cy={tip.y} r="5" /></svg><div className={styles.tooltip}><small>{tipDate}</small><strong>{formatCurrency(tipVal)}</strong></div></div><footer><span>{data[0]?.date?.slice(5)?.replace("-", "/") || ""}</span><span>Giữa tháng</span><span>{data[data.length - 1]?.date?.slice(5)?.replace("-", "/") || ""}</span></footer></section>
}

function BarChart({ data }: { data: WeeklyNewUser[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return <section className={styles.barCard}><header><h2>Người dùng mới (Tuần)</h2></header><div className={styles.bars}>{data.map((d, i) => { const height = (d.count / max) * 94; const isActive = i === new Date().getDay(); return <div key={d.day}><span className={isActive ? styles.activeBar : ""} style={{ height: Math.max(height, 4) }} />{isActive && <b>{d.count}</b>}<small>{d.day}</small></div> })}</div></section>
}

function ActivityCard({ activities }: { activities: Activity[] }) {
  return <section className={styles.activityCard}><header><h2>Hoạt động gần đây</h2></header><div>{activities.map((a, i) => <article key={i}><i>{a.type === "payment" ? "✓" : a.type === "lesson" ? "▣" : "●"}</i><span><strong>{a.title}</strong><small>{a.text}</small></span><time>{a.time}</time></article>)}</div></section>
}

function SystemHealthCard() {
  const metrics = [["Tốc độ phản hồi", 98], ["Tỉ lệ chuyển đổi", 42], ["Lượng bài tập hoàn thành", 76]] as const
  return <section className={styles.healthCard}><h2>Sức khỏe hệ thống</h2><p>Dựa trên dữ liệu 7 ngày qua, hệ thống đang hoạt động ở mức tối ưu.</p><div>{metrics.map(([label, value]) => <article key={label}><header><span>{label}</span><b>{value}%</b></header><i><em style={{ width: `${value}%` }} /></i></article>)}</div></section>
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getDashboard()
      .then((res) => { if (active) setData(res.data) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return <motion.div variants={containerVariants} initial="hidden" animate="visible"><motion.div variants={itemVariants}><PageHeader title="Tổng quan" /></motion.div></motion.div>
  }

  const stats = data?.stats
  const formatStat = (v?: number) => v?.toLocaleString("en-US") || "0"

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader title="Tổng quan" subtitle={<>Xin chào Admin 👋. Chào mừng bạn trở lại bảng điều khiển.</>} actions={<><AdminButton icon="calendar" secondary>30 NGÀY QUA</AdminButton><AdminButton icon="download">XUẤT BÁO CÁO</AdminButton></>} />
      </motion.div>
      <motion.section className={styles.statsGrid} variants={containerVariants}>
        <motion.div variants={cardVariants} whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(37,99,235,0.12)", transition: { duration: 0.25, ease: "easeOut" } }}><StatCard icon="users" label="Người dùng" value={formatStat(stats?.totalUsers)} meta={`${stats?.activeUsers || 0} đang hoạt động`} /></motion.div>
        <motion.div variants={cardVariants} whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(37,99,235,0.12)", transition: { duration: 0.25, ease: "easeOut" } }}><StatCard icon="book" label="Bài học" value={formatStat(stats?.totalLessons)} meta="Đã xuất bản" /></motion.div>
        <motion.div variants={cardVariants} whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(37,99,235,0.12)", transition: { duration: 0.25, ease: "easeOut" } }}><StatCard icon="wallet" label="Doanh thu tháng" value={formatCurrency(stats?.monthlyRevenue || 0)} meta={`+${stats?.newUsersThisMonth || 0} người dùng mới`} /></motion.div>
        <motion.div variants={cardVariants} whileHover={{ y: -3, boxShadow: "0 20px 40px rgba(37,99,235,0.12)", transition: { duration: 0.25, ease: "easeOut" } }}><StatCard icon="alert" label="Chờ duyệt" value={formatStat(stats?.pendingSubscriptions)} meta="Cần xử lý" tone="red" /></motion.div>
      </motion.section>
      <motion.section className={styles.chartsGrid} variants={containerVariants}>
        <motion.div variants={cardVariants}><RevenueChart data={data?.revenueChart || []} /></motion.div>
        <motion.div variants={cardVariants}><BarChart data={data?.weeklyNewUsers || []} /></motion.div>
      </motion.section>
      <motion.section className={styles.bottomGrid} variants={containerVariants}>
        <motion.div variants={cardVariants}><ActivityCard activities={data?.recentActivities || []} /></motion.div>
        <motion.div variants={cardVariants}><SystemHealthCard /></motion.div>
      </motion.section>
    </motion.div>
  )
}
