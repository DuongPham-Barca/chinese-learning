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
import { getLessonPercent, getModulePercent, lessonModuleOrder, useLessonProgress, type LessonModuleId } from "@/services/lesson-progress.service"
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
          <span>{level.toUpperCase()} - {lesson.vocabulary.length} từ vựng - {lesson.totalSentences} câu luyện tập</span>
        </div>
        <div className={styles.headerProgress}>
      <span className={styles.miniTrack} style={{ "--progress": `${progress}%` } as CSSProperties}><i data-motion-progress style={{ "--motion-progress": progress / 100 } as CSSProperties} /></span>
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
  const recommendedModule = modules.find((module) => (
    module.status !== "coming_soon"
    && module.totalItems > 0
    && getModulePercent(savedProgress[module.id]) < 100
  ))
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
        {recommendedModule && (
          <section className={styles.nextStepCard} aria-labelledby="next-step-title">
            <div className={styles.nextStepIcon}><SharedIcon name={recommendedModule.icon} size={25} /></div>
            <div className={styles.nextStepCopy}>
              <span>NÊN HỌC TIẾP</span>
              <h2 id="next-step-title">{recommendedModule.title}</h2>
              <p>{recommendedModule.description}</p>
            </div>
            <div className={styles.nextStepMeta}>
              <small>{getModulePercent(savedProgress[recommendedModule.id])}% hoàn thành</small>
              <Link href={recommendedModule.href}>
                {getModulePercent(savedProgress[recommendedModule.id]) > 0 ? "Tiếp tục" : "Bắt đầu"}
                <SharedIcon name="arrowRight" size={16} />
              </Link>
            </div>
          </section>
        )}
        <motion.section className={styles.infoCard} variants={itemVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <div className={styles.infoIllustration}><SharedIcon name="bookOpen" size={32} /></div>
          <div>
            <h2>Bạn sẽ học gì</h2>
            <p>Bài học gồm <strong>{lesson.vocabulary.length} từ vựng</strong> và <strong>{lesson.totalSentences} câu luyện tập</strong>, các chế độ học tự bật/tắt theo dữ liệu thật của bài.</p>
          </div>
        </motion.section>
        <motion.section className={styles.moduleGrid} variants={containerVariants} initial="hidden" animate="visible">
          {modules.map((module) => (
            <LearningModuleCard
              key={module.id}
              module={module}
              progress={savedProgress[module.id]}
              recommended={module.id === recommendedModule?.id}
            />
          ))}
        </motion.section>
      </div>
    </LessonLayout>
  )
}
