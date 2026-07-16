"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SiteNavbar from "@/components/site-navbar"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import { syncLocalLessonProgress } from "@/services/lesson-progress.service"
import styles from "./progress.module.css"

type ProgressEntry = {
  id: string
  status: string
  expGained: number
  createdAt: string
  lesson: { id: string; title: string; levelType: string; lessonOrder: number }
}

const moduleLabels: Record<string, string> = {
  flashcard: "Thẻ từ vựng",
  dictation: "Nghe chép",
  "word-arrangement": "Sắp xếp câu",
  reflex: "Phản xạ",
  speaking: "Luyện nói",
  quiz: "Trắc nghiệm",
}

function moduleName(status: string) {
  const moduleId = status.startsWith("module:") ? status.slice(7) : status
  return moduleLabels[moduleId] || "Hoàn thành bài học"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function calculateStreak(entries: ProgressEntry[]) {
  const days = new Set(entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function ProgressPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadProgress = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      await syncLocalLessonProgress()
      const response = await api.get<{ progress: ProgressEntry[] }>("/progress/me")
      setEntries(response.data.progress)
    } catch {
      setError("Không thể tải tiến độ học tập. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?next=/progress")
      return
    }
    const timer = window.setTimeout(() => void loadProgress(), 0)
    return () => window.clearTimeout(timer)
  }, [authLoading, loadProgress, router, user])

  const lessons = useMemo(() => new Set(entries.map((entry) => entry.lesson.id)).size, [entries])
  const earnedExp = useMemo(() => entries.reduce((total, entry) => total + entry.expGained, 0), [entries])
  const streak = useMemo(() => calculateStreak(entries), [entries])

  return (
    <main className={styles.page}>
      <SiteNavbar />
      <div className={styles.container}>
        <header className={styles.heading}>
          <div><span>HỒ SƠ HỌC TẬP</span><h1>Tiến độ của bạn</h1><p>Theo dõi các phần đã hoàn thành và EXP đã nhận.</p></div>
          <Link className={styles.primaryAction} href="/#roadmap"><SharedIcon name="bookOpen" size={18} />Tiếp tục học</Link>
        </header>

        <section className={styles.stats} aria-label="Tổng quan tiến độ">
          <article><i><SharedIcon name="check" size={22} /></i><span>Phần đã hoàn thành</span><strong>{entries.length}</strong></article>
          <article><i><SharedIcon name="bookOpen" size={22} /></i><span>Bài học đã tham gia</span><strong>{lessons}</strong></article>
          <article><i><SharedIcon name="sparkles" size={22} /></i><span>EXP từ bài học</span><strong>{earnedExp}</strong></article>
          <article><i><SharedIcon name="clock" size={22} /></i><span>Chuỗi ngày học</span><strong>{streak} ngày</strong></article>
        </section>

        <section className={styles.history}>
          <div className={styles.sectionHeading}><div><h2>Hoạt động gần đây</h2><p>Lịch sử được đồng bộ với tài khoản của bạn.</p></div><button type="button" onClick={() => void loadProgress()} disabled={loading}><SharedIcon name="rotateCcw" size={16} />Làm mới</button></div>

          {loading && <div className={styles.state}><span className={styles.spinner} />Đang đồng bộ tiến độ...</div>}
          {!loading && error && <div className={styles.state}><strong>{error}</strong><button type="button" onClick={() => void loadProgress()}>Thử lại</button></div>}
          {!loading && !error && entries.length === 0 && <div className={styles.empty}><i><SharedIcon name="bookOpen" size={30} /></i><h3>Chưa có hoạt động học tập</h3><p>Hoàn thành một phần trong bài học để bắt đầu ghi nhận tiến độ.</p><Link href="/#roadmap">Chọn bài học</Link></div>}
          {!loading && !error && entries.length > 0 && (
            <div className={styles.timeline}>
              {entries.map((entry) => (
                <article key={entry.id}>
                  <span className={styles.timelineIcon}><SharedIcon name="check" size={16} /></span>
                  <div><strong>{moduleName(entry.status)}</strong><p>{entry.lesson.levelType} · Bài {entry.lesson.lessonOrder}: {entry.lesson.title}</p></div>
                  <span className={styles.exp}>+{entry.expGained} EXP</span>
                  <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
