"use client"

import { use, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import api from "@/lib/api"
import type { LessonDetail } from "@/types/api"
import styles from "../../../courses/hsk1/lesson-1/lesson.module.css"

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

function LessonHeader({ lesson, level }: { lesson: LessonDetail; level: string }) {
  return (
    <nav className={styles.lessonHeader}>
      <div className={styles.headerInner}>
        <Link href={`/courses/${level}`} className={styles.back} aria-label={`Quay lại ${level.toUpperCase()}`}><Icon name="arrow" /></Link>
        <div className={styles.lessonTitle}><strong>{lesson.title}</strong><span>{level.toUpperCase()} • {lesson.vocabulary.length} từ vựng • {lesson.sentences.length} câu luyện tập</span></div>
        <div className={styles.progressCircle}><span>0%</span></div>
      </div>
    </nav>
  )
}

function LessonProgressCard() {
  const steps = ["Flashcard", "Phát âm", "Dictation"]
  return (
    <section className={styles.progressCard}>
      <div className={styles.progressHeading}><h1>Tiến độ bài học</h1><div><strong>0%</strong><span>Chưa bắt đầu</span></div></div>
      <div className={styles.progressTrack}><span /></div>
      <div className={styles.stepNavigation}>{steps.map((label) => <div key={label}><i><Icon name="circle" /></i><span>{label}</span></div>)}</div>
    </section>
  )
}

function LearningModuleCard({ type, lesson, level }: { type: "flashcard" | "pronunciation" | "dictation"; lesson: LessonDetail; level: string }) {
  const isFlashcard = type === "flashcard"
  const isPronunciation = type === "pronunciation"
  const labels = {
    flashcard: { title: "Flashcard", description: `Học ${lesson.vocabulary.length} từ vựng cốt lõi qua flashcard.`, duration: `${Math.max(5, lesson.vocabulary.length)} phút` },
    pronunciation: { title: "Luyện phát âm", description: "Đọc câu tiếng Trung và nhận phản hồi phát âm.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút` },
    dictation: { title: "Dictation", description: "Luyện nghe và nhập lại các câu tiếng Trung trong bài.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút` },
  }
  const item = labels[type]
  const href = `/lessons/${level}/${lesson.id}/${type}`

  return (
    <article className={styles.moduleCard}>
      <div className={styles.moduleImage}><Image src={isFlashcard ? "/lesson-flashcard.png" : "/lesson-dictation.png"} fill sizes="260px" alt={`Minh họa ${item.title}`} /></div>
      <div className={styles.moduleHeading}><h2>{item.title}</h2><span className={styles.pendingBadge}>Mới</span></div>
      <p className={styles.moduleDescription}>{item.description}</p>
      {isFlashcard ? (
        <ul className={styles.checklist}><li><Icon name="check" />{lesson.vocabulary.slice(0, 3).map((word) => word.hanzi).join(", ") || "Chưa có từ vựng"}</li><li><Icon name="check" />Kèm phát âm tiếng Trung</li></ul>
      ) : (
        <div className={styles.warning}><Icon name="warning" /><span>{isPronunciation ? "Nên hoàn thành Flashcard trước khi luyện phát âm." : "Nên học từ vựng trước khi luyện nghe."}</span></div>
      )}
      <footer className={styles.moduleFooter}><span><Icon name="clock" />{item.duration}</span><Link className={isFlashcard || isPronunciation ? styles.primaryButton : styles.outlineButton} href={href}>{isFlashcard ? "Bắt đầu học" : "Bắt đầu luyện"}</Link></footer>
    </article>
  )
}

export default function LessonDetailPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const requestKey = `${level}:${id}`
  const [loadState, setLoadState] = useState<{ key: string; lesson: LessonDetail | null; error: string }>({
    key: "",
    lesson: null,
    error: "",
  })

  useEffect(() => {
    let active = true

    api.get<{ lesson: LessonDetail }>(`/lessons/${id}`)
      .then((response) => {
        if (!active) return
        if (response.data.lesson.levelType.toLowerCase() !== level.toLowerCase()) {
          setLoadState({ key: requestKey, lesson: null, error: "Bài học không thuộc cấp độ này." })
          return
        }
        setLoadState({ key: requestKey, lesson: response.data.lesson, error: "" })
      })
      .catch(() => {
        if (active) setLoadState({ key: requestKey, lesson: null, error: "Không tìm thấy bài học hoặc máy chủ đang tạm gián đoạn." })
      })

    return () => { active = false }
  }, [id, level, requestKey])

  const loading = loadState.key !== requestKey
  const lesson = loading ? null : loadState.lesson
  const error = loading ? "" : loadState.error

  if (loading) return <main className={styles.page}><div className={styles.container}><p>Đang tải bài học...</p></div></main>
  if (error || !lesson) return <main className={styles.page}><div className={styles.container}><p>{error || "Không tìm thấy bài học."}</p><Link href={`/courses/${level}`}>← Quay lại danh sách bài học</Link></div></main>

  return (
    <main className={styles.page}>
      <LessonHeader lesson={lesson} level={level} />
      <div className={styles.container}>
        <LessonProgressCard />
        <section className={styles.infoCard}><i><Icon name="book" /></i><p>Bạn sẽ học <strong>{lesson.vocabulary.length} từ vựng</strong> và <strong>{lesson.sentences.length} câu luyện tập</strong>.</p></section>
        <section className={styles.contentGrid}>
          <LearningModuleCard type="flashcard" lesson={lesson} level={level} />
          <LearningModuleCard type="pronunciation" lesson={lesson} level={level} />
          <LearningModuleCard type="dictation" lesson={lesson} level={level} />
        </section>
      </div>
      <aside className={styles.stickyBar}><div className={styles.stickyInner}><div><span>Trạng thái hiện tại</span><strong>Chưa bắt đầu</strong></div><Link href={`/lessons/${level}/${id}/flashcard`}>Bắt đầu học <b>→</b></Link></div></aside>
    </main>
  )
}
