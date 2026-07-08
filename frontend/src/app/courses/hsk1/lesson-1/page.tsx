"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import api from "@/lib/api"
import type { LessonDetail } from "@/types/api"
import styles from "./lesson.module.css"

type IconName = "arrow" | "check" | "circle" | "book" | "clock" | "warning"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    circle: <circle cx="12" cy="12" r="8" />,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"/><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    warning: <><path d="M10.3 3.7 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function LessonHeader({ lesson }: { lesson: LessonDetail }) {
  return (
    <nav className={styles.lessonHeader}>
      <div className={styles.headerInner}>
        <Link href="/courses/hsk1" className={styles.back} aria-label="Quay lại HSK1"><Icon name="arrow" /></Link>
        <div className={styles.lessonTitle}><strong>{lesson.title}</strong><span>HSK1 • {lesson.vocabulary.length} từ vựng • {lesson.sentences.length} câu luyện tập</span></div>
        <div className={styles.progressCircle}><span>0%</span></div>
      </div>
    </nav>
  )
}

function LessonProgressCard() {
  const steps: Array<[string, boolean]> = [["Flashcard", false], ["Dictation", false], ["Trắc nghiệm", false]]
  return (
    <section className={styles.progressCard}>
      <div className={styles.progressHeading}><h1>Tiến độ bài học</h1><div><strong>0%</strong><span>Chưa bắt đầu</span></div></div>
      <div className={styles.progressTrack}><span /></div>
      <div className={styles.stepNavigation}>{steps.map(([label, active]) => <div className={active ? styles.activeStep : ""} key={label}><i><Icon name={active ? "check" : "circle"} /></i><span>{label}</span></div>)}</div>
    </section>
  )
}

function LearningInfoCard({ lesson }: { lesson: LessonDetail }) {
  return (
    <section className={styles.infoCard}>
      <i><Icon name="book" /></i>
      <p>Bạn sẽ học: <strong>{lesson.vocabulary.length} từ vựng</strong>, <strong>{lesson.sentences.length} câu luyện tập</strong>. <span>Thời gian ước tính: <b>~{lesson.vocabulary.length + lesson.sentences.length} phút</b>.</span></p>
    </section>
  )
}

function LearningModuleCard({ type, lesson, level, lessonOrder }: { type: "flashcard" | "pronunciation" | "dictation"; lesson: LessonDetail; level: string; lessonOrder: number }) {
  const isFlashcard = type === "flashcard"
  const isPronunciation = type === "pronunciation"
  const href = type === "pronunciation"
    ? `/lessons/${level}/${lesson.id}/pronunciation`
    : `/courses/${level}/lesson-${lessonOrder}/${type}`
  const labels = {
    flashcard: { title: "Flashcard", badge: "Mới", description: `Học ${lesson.vocabulary.length} từ vựng cốt lõi thông qua hệ thống lặp lại ngắt quãng thông minh.`, duration: `${Math.max(5, lesson.vocabulary.length)} phút` },
    pronunciation: { title: "Luyện phát âm", badge: "Mới", description: "Đọc câu tiếng Trung và nhận điểm phát âm theo AI.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút` },
    dictation: { title: "Dictation & Sắp xếp", badge: "Mới", description: "Luyện nghe và ghép câu hoàn chỉnh từ các đoạn hội thoại thực tế.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút` },
  }
  const { title, badge, description, duration } = labels[type]
  const imgSrc = type === "flashcard" ? "/lesson-flashcard.png" : "/lesson-dictation.png"

  return (
    <article className={styles.moduleCard}>
      <div className={styles.moduleImage}><Image src={imgSrc} fill sizes="260px" alt={`Minh họa ${title}`} /></div>
      <div className={styles.moduleHeading}><h2>{title}</h2><span className={styles.pendingBadge}>{badge}</span></div>
      <p className={styles.moduleDescription}>{description}</p>
      {isFlashcard ? (
        <ul className={styles.checklist}><li><Icon name="check" />{lesson.vocabulary.slice(0, 3).map(v => v.hanzi).join(", ")}{lesson.vocabulary.length > 3 ? "..." : ""}</li><li><Icon name="check" />Kèm âm thanh bản xứ</li></ul>
      ) : (
        <div className={styles.warning}><Icon name="warning" /><span>{isPronunciation ? "Nên hoàn thành Flashcard trước khi luyện phát âm." : "Nên hoàn thành phần Flashcard để có kết quả luyện tập tốt nhất."}</span></div>
      )}
      <footer className={styles.moduleFooter}><span><Icon name="clock" />{duration}</span><Link className={isFlashcard || isPronunciation ? styles.primaryButton : styles.outlineButton} href={href}>{isFlashcard ? "Bắt đầu học" : "Bắt đầu luyện"}</Link></footer>
    </article>
  )
}

function StickyContinueBar() {
  return (
    <aside className={styles.stickyBar}>
      <div className={styles.stickyInner}><div><span>Trạng thái hiện tại</span><strong>Chưa bắt đầu</strong></div><Link href="/courses/hsk1/lesson-1/dictation">Bắt đầu luyện tập <b>→</b></Link></div>
    </aside>
  )
}

export default function LessonOverviewPage() {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/lessons?level=HSK1").then((res) => {
      const found = res.data.lessons.find((l: { lessonOrder: number }) => l.lessonOrder === 1)
      if (found) {
        api.get(`/lessons/${found.id}`).then((r) => setLesson(r.data.lesson))
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <main className={styles.page}><div className={styles.container}><p>Đang tải...</p></div></main>
  if (!lesson) return <main className={styles.page}><div className={styles.container}><p>Không tìm thấy bài học.</p></div></main>

  return (
    <main className={styles.page}>
      <LessonHeader lesson={lesson} />
      <div className={styles.container}>
        <LessonProgressCard />
        <LearningInfoCard lesson={lesson} />
        <section className={styles.contentGrid}>
          <LearningModuleCard type="flashcard" lesson={lesson} level="hsk1" lessonOrder={1} />
          <LearningModuleCard type="pronunciation" lesson={lesson} level="hsk1" lessonOrder={1} />
          <LearningModuleCard type="dictation" lesson={lesson} level="hsk1" lessonOrder={1} />
        </section>
      </div>
      <StickyContinueBar />
    </main>
  )
}
