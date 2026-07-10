"use client"

import { use, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants, itemVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { LessonSummary } from "@/types/api"
import styles from "../lesson-flow.module.css"

export default function LessonListPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params)
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    api.get<{ lessons: LessonSummary[] }>(`/lessons?level=${level.toUpperCase()}`)
      .then((response) => {
        if (active) setLessons(response.data.lessons)
      })
      .catch(() => {
        if (active) setError("Không thể tải danh sách bài học.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [level])

  const totalVocabulary = lessons.reduce((sum, lesson) => sum + lesson._count.vocabulary, 0)
  const totalSentences = lessons.reduce((sum, lesson) => sum + lesson._count.sentences, 0)
  const unlockedLessons = lessons.filter((lesson) => !lesson.isLocked).length
  const progress = lessons.length ? Math.round((unlockedLessons / lessons.length) * 100) : 0

  return (
    <LessonLayout>
      <motion.section className={styles.levelHero} variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <span className={styles.levelBadge}><SharedIcon name="sparkles" size={14} />{level.toUpperCase()}</span>
          <h1>Lộ trình {level.toUpperCase()}</h1>
          <p>Xây nền tảng từ vựng, khả năng nghe và phản xạ câu qua luồng học tập trung của ChineseDict.</p>
          <div className={styles.heroStats}>
            <span><SharedIcon name="bookOpen" size={15} />{lessons.length} bài học</span>
            <span><SharedIcon name="layers" size={15} />{totalVocabulary} từ vựng</span>
            <span><SharedIcon name="headphones" size={15} />{totalSentences} câu luyện tập</span>
          </div>
        </motion.div>
        <motion.aside className={styles.progressPanel} variants={cardVariants}>
          <strong>{progress}%</strong>
          <span>{unlockedLessons} / {lessons.length || 0} bài học có thể học</span>
          <div className={styles.progressTrack} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </motion.aside>
      </motion.section>

      {loading && <div className={styles.stateCard}><p>Đang tải danh sách bài học...</p></div>}
      {error && <div className={styles.stateCard}><p>{error}</p></div>}
      {!loading && !error && lessons.length === 0 && <div className={styles.stateCard}><p>Cấp độ này chưa có bài học.</p></div>}

      {!loading && !error && lessons.length > 0 && (
        <motion.section className={styles.lessonGrid} variants={containerVariants} initial="hidden" animate="visible">
          {lessons.map((lesson) => {
            const cardContent = (
              <>
                <div className={styles.cardTop}>
                  <span className={styles.lessonNumber}>{lesson.lessonOrder}</span>
                  <span className={styles.badgeRow}>
                    {lesson.isFree ? <span className={styles.freeBadge}>Miễn phí</span> : <span className={styles.proBadge}><SharedIcon name="crown" size={12} />Pro</span>}
                    <span className={styles.statusBadge}>{lesson.isLocked ? "Đã khóa" : "Sẵn sàng"}</span>
                  </span>
                </div>
                <h2>{lesson.title}</h2>
                <div className={styles.lessonMeta}>
                  <span><SharedIcon name="bookOpen" size={14} />{lesson._count.vocabulary} từ vựng</span>
                  <span><SharedIcon name="headphones" size={14} />{lesson._count.sentences} câu</span>
                </div>
                <footer>
                  <span className={styles.statusBadge}>{lesson.isLocked ? "Cần Pro" : "Chưa bắt đầu"}</span>
                  {lesson.isLocked
                    ? <button className={`${styles.startButton} ${styles.lockedStartButton}`} type="button" disabled>Đã khóa <SharedIcon name="lock" size={14} /></button>
                    : <span className={styles.startButton}>Bắt đầu học <SharedIcon name="arrowRight" size={14} /></span>}
                </footer>
              </>
            )

            return (
              <motion.div key={lesson.id} variants={cardVariants}>
                {lesson.isLocked
                  ? <article className={`${styles.lessonCard} ${styles.lessonCardLocked}`}>{cardContent}</article>
                  : <Link className={styles.lessonCard} href={`/lessons/${level}/${lesson.id}`}>{cardContent}</Link>}
              </motion.div>
            )
          })}
        </motion.section>
      )}
    </LessonLayout>
  )
}
