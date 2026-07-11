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
import { getLessonPercent, lessonModuleOrder, useLessonProgress, type LessonModuleId } from "@/services/lesson-progress.service"
import type { LessonDetail } from "@/types/api"
import styles from "../../lesson-flow.module.css"
import { getLearningModules, lessonProgressSteps } from "./learning-modules"

function LessonHeader({ lesson, level, progress }: { lesson: LessonDetail; level: string; progress: number }) {
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
          <span className={styles.miniTrack} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></span>
          <b>{progress}%</b>
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
  const savedProgress = useLessonProgress(id)

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
  const totals = modules.reduce((acc, module) => {
    acc[module.id] = module.totalItems
    return acc
  }, {} as Record<LessonModuleId, number>)
  const progress = getLessonPercent(savedProgress, totals)
  const stepProgress = lessonModuleOrder.map((moduleId) => {
    const total = totals[moduleId] || 0
    const completed = Math.min(savedProgress[moduleId]?.completed ?? 0, total)
    return total ? Math.round((completed / total) * 100) : 0
  })

  return (
    <LessonLayout>
      <LessonHeader lesson={lesson} level={level} progress={progress} />
      <div className={styles.detailStack}>
        <LessonProgress steps={lessonProgressSteps} progress={progress} stepProgress={stepProgress} />
        <motion.section className={styles.infoCard} variants={itemVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <div className={styles.infoIllustration}><SharedIcon name="bookOpen" size={32} /></div>
          <div>
            <h2>Bạn sẽ học gì</h2>
            <p>Bài học gồm <strong>{lesson.vocabulary.length} từ vựng</strong> và <strong>{lesson.sentences.length} câu luyện tập</strong>, các chế độ học tự bật/tắt theo dữ liệu thật của bài.</p>
          </div>
        </motion.section>
        <motion.section className={styles.moduleGrid} variants={containerVariants} initial="hidden" animate="visible">
          {modules.map((module) => <LearningModuleCard key={module.id} module={module} progress={savedProgress[module.id]} />)}
        </motion.section>
      </div>
    </LessonLayout>
  )
}
