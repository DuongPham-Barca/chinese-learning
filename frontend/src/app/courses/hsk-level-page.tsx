"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import styles from "./hsk1/hsk1.module.css"

type IconName = "arrow" | "bell" | "user" | "book" | "translate" | "fire" | "check" | "play" | "lock" | "layers" | "shield" | "devices"

export type HSKLevel = "hsk1" | "hsk2" | "hsk3" | "hsk4" | "hsk5" | "hsk6"

type LevelConfig = {
  name: string
  band: string
  description: string
  totalLessons: number
  vocabulary: number
}

const levelMeta: Record<HSKLevel, LevelConfig> = {
  hsk1: { name: "HSK1 — Cơ bản", band: "CẤP ĐỘ SƠ CẤP", totalLessons: 0, vocabulary: 150, description: "Làm quen với phát âm, từ vựng và các mẫu câu tiếng Trung cơ bản. Nền tảng vững chắc cho hành trình chinh phục tiếng Trung của bạn." },
  hsk2: { name: "HSK2 — Sơ cấp", band: "CẤP ĐỘ SƠ CẤP", totalLessons: 0, vocabulary: 300, description: "Mở rộng vốn từ và làm chủ các mẫu câu giao tiếp quen thuộc trong cuộc sống hằng ngày." },
  hsk3: { name: "HSK3 — Trung cấp", band: "CẤP ĐỘ TRUNG CẤP", totalLessons: 0, vocabulary: 650, description: "Phát triển khả năng giao tiếp độc lập, đọc hiểu và diễn đạt trong nhiều tình huống thực tế." },
  hsk4: { name: "HSK4 — Trung cao cấp", band: "CẤP ĐỘ TRUNG CAO", totalLessons: 0, vocabulary: 1200, description: "Củng cố ngữ pháp trung cấp, tăng tốc độ đọc hiểu và giao tiếp tự nhiên, mạch lạc hơn." },
  hsk5: { name: "HSK5 — Cao cấp", band: "CẤP ĐỘ CAO CẤP", totalLessons: 0, vocabulary: 2500, description: "Đọc hiểu văn bản dài, trình bày quan điểm rõ ràng và sử dụng tiếng Trung linh hoạt trong học tập, công việc." },
  hsk6: { name: "HSK6 — Thành thạo", band: "CẤP ĐỘ THÀNH THẠO", totalLessons: 0, vocabulary: 5000, description: "Hoàn thiện năng lực ngôn ngữ cao cấp, xử lý văn bản phức tạp và diễn đạt chính xác, tự nhiên." },
}

type LessonFromAPI = {
  id: string
  levelType: string
  lessonOrder: number
  title: string
  isFree: boolean
  _count: { vocabulary: number; sentences: number }
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="m15 18-6-6 6-6" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"/><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z"/></>,
    translate: <><path d="M3 5h12M9 3v2M5 9c1.5 3 4 5 7 6M13 9c-1.5 3-4 5-7 6"/><path d="m14 21 4-9 4 9M15.5 18h5"/></>,
    fire: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    devices: <><rect x="2" y="4" width="14" height="11" rx="2"/><path d="M7 20h4M9 15v5"/><rect x="18" y="8" width="4" height="10" rx="1"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AppNavbar({ level }: { level: HSKLevel }) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.back} aria-label="Về trang chủ"><Icon name="arrow" /></Link>
        <Link href="/" className={styles.brand}><span>中</span><strong>ChineseDict</strong></Link>
        <div className={styles.menu}><Link className={styles.active} href={`/courses/${level}`}>Học tập</Link><a href="#dictionary">Từ điển</a><a href="#community">Cộng đồng</a></div>
        <div className={styles.navTools}><button type="button" aria-label="Thông báo"><Icon name="bell" /></button><button type="button" aria-label="Tài khoản"><Icon name="user" /></button></div>
      </div>
    </nav>
  )
}

function ProgressCard({ lessons }: { lessons: LessonFromAPI[] }) {
  const totalLessons = lessons.length
  const totalVocab = lessons.reduce((s, l) => s + l._count.vocabulary, 0)
  const completedCount = 0
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const stats: Array<[IconName, string, string]> = [["book", "ĐÃ HỌC", `${completedCount} bài`], ["translate", "TỪ VỰNG", `${totalVocab} từ`], ["fire", "CHUỖI HỌC", "5 ngày"]]
  return (
    <section className={styles.progressCard}>
      <div className={styles.progressTop}><div><h2>Tiến độ học tập</h2><p>{completedCount}/{totalLessons} bài đã hoàn thành ({progress}%)</p></div></div>
      <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
      <div className={styles.progressStats}>{stats.map(([icon,label,value]) => <div key={label}><i><Icon name={icon} /></i><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
    </section>
  )
}

function LessonItem({ lesson, level }: { lesson: LessonFromAPI; level: HSKLevel }) {
  const href = `/lessons/${level}/${lesson.id}`
  return (
    <article className={`${styles.lessonItem} ${styles.current}`}>
      <div className={styles.lessonIcon}><Icon name="play" /></div>
      <div className={styles.lessonInfo}>
        <div className={styles.lessonTitle}><h3>Bài {lesson.lessonOrder}: {lesson.title}</h3>{lesson.isFree ? <span>Miễn phí</span> : <span className={styles.proBadge}>Pro</span>}</div>
        <p>{lesson._count.vocabulary} từ vựng · {lesson._count.sentences} câu</p>
      </div>
      <Link className={styles.continueButton} href={href}>Bắt đầu học →</Link>
    </article>
  )
}

export default function HSKLevelPage({ level }: { level: HSKLevel }) {
  const config = levelMeta[level]
  const [lessons, setLessons] = useState<LessonFromAPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/lessons?level=${level.toUpperCase()}`).then((res) => {
      setLessons(res.data.lessons)
    }).finally(() => setLoading(false))
  }, [level])

  return (
    <main className={styles.page}>
      <AppNavbar level={level} />
      <div className={styles.container}>
        <header className={styles.header}><span>{config.band}</span><h1>{config.name}</h1><strong>{lessons.length || '...'} bài học</strong><p>{config.description}</p></header>
        <ProgressCard lessons={lessons} />
        <section className={styles.lessonSection}>
          <div className={styles.listHeading}><h2>Danh sách bài học</h2><span>{loading ? 'Đang tải...' : `${lessons.length} bài`}</span></div>
          <div className={styles.lessonList}>{lessons.map((lesson) => <LessonItem lesson={lesson} level={level} key={lesson.id} />)}</div>
        </section>
      </div>
    </main>
  )
}
