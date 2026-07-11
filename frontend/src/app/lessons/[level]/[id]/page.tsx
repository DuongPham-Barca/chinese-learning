"use client"

import { use, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { containerVariants, itemVariants, sectionViewport } from "@/app/animations"
import LearningModuleCard from "@/components/learning-module-card"
import LessonLayout from "@/components/lesson-layout"
import LessonProgress from "@/components/lesson-progress"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { LessonDetail } from "@/types/api"
import styles from "../../lesson-flow.module.css"
import { getLearningModules, lessonProgressSteps } from "./learning-modules"

function LessonHeader({ lesson, level }: { lesson: LessonDetail; level: string }) {
  return (
    <header className={styles.detailHeader}>
      <div className={styles.detailHeaderInner}>
        <Link href={`/lessons/${level}`} className={styles.backButton} aria-label={`Quay lại ${level.toUpperCase()}`}>
          <SharedIcon name="arrowLeft" size={19} />
        </Link>
        <div className={styles.detailTitle}>
          <strong>{lesson.title}</strong>
          <span>{level.toUpperCase()} - {lesson.vocabulary.length} từ vựng - {lesson.sentences.length} câu luyện tập</span>
        </div>
        <div className={styles.headerProgress}>
          <span className={styles.miniTrack} style={{ "--progress": "0%" } as CSSProperties}><i /></span>
          <b>0%</b>
        </div>
      </div>
    </header>
  )
}

export default function LessonDetailPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const requestKey = `${level}:${id}`
  const [loadState, setLoadState] = useState<{ key: string; lesson: LessonDetail | null; error: string }>({ key: "", lesson: null, error: "" })

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

  if (loading) return <LessonLayout><div className={styles.stateCard}><p>Đang tải bài học...</p></div></LessonLayout>
  if (error || !lesson) {
    return (
      <LessonLayout>
        <div className={styles.stateCard}>
          <p>{error || "Không tìm thấy bài học."}</p>
          <Link className={styles.secondaryButton} href={`/lessons/${level}`}>Quay lại danh sách bài học</Link>
        </div>
      </LessonLayout>
    )
  }

  const modules = getLearningModules(lesson, level)

  return (
    <LessonLayout>
      <LessonHeader lesson={lesson} level={level} />
      <div className={styles.detailStack}>
        <LessonProgress steps={lessonProgressSteps} />
        <motion.section className={styles.infoCard} variants={itemVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <div className={styles.infoIllustration}><SharedIcon name="bookOpen" size={32} /></div>
          <div>
            <h2>Bạn sẽ học gì</h2>
            <p>Bài học gồm <strong>{lesson.vocabulary.length} từ vựng</strong> và <strong>{lesson.sentences.length} câu luyện tập</strong>, được tổ chức theo 5 chế độ học độc lập.</p>
          </div>
        </motion.section>
        <motion.section className={styles.moduleGrid} variants={containerVariants} initial="hidden" animate="visible">
          {modules.map((module) => <LearningModuleCard key={module.id} module={module} />)}
        </motion.section>
      </div>
    </LessonLayout>
  )
}
