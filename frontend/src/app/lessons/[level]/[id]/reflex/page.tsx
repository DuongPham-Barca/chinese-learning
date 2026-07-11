"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type TranslationStatus = "idle" | "correct" | "near" | "wrong" | "revealed"

function normalizeChinese(value: string) {
  return value.replace(/[，。！？、；：“”‘’（）《》\s]/g, "").trim()
}

function evaluateTranslation(answer: string, expected: string): TranslationStatus {
  const actual = normalizeChinese(answer)
  const target = normalizeChinese(expected)
  if (!actual) return "idle"
  if (actual === target) return "correct"
  if (actual.includes(target) || target.includes(actual) || Math.abs(actual.length - target.length) <= 2) return "near"
  return "wrong"
}

function statusLabel(status: TranslationStatus) {
  if (status === "correct") return "Đúng"
  if (status === "near") return "Gần đúng"
  if (status === "wrong") return "Sai"
  return ""
}

export default function ReflexPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const router = useRouter()
  const returnHref = `/lessons/${level}/${id}`
  const [items, setItems] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [current, setCurrent] = useState(() => readLessonProgress(id).reflex?.completed ?? 0)
  const [answer, setAnswer] = useState("")
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>("idle")
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setItems(response.data.vocabulary.filter((v) => v.example))
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu phản xạ.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const item = items[current]
  const totalItems = items.length
  const progress = totalItems ? Math.round(((current + (translationStatus === "correct" || translationStatus === "near" ? 1 : 0)) / totalItems) * 100) : 0

  const checkTranslation = useCallback(() => {
    if (!item) return
    const status = evaluateTranslation(answer, item.example!)
    if (status === "idle") return
    setTranslationStatus(status)
    setAttempts((value) => value + 1)
    if (status === "correct") setCorrect((value) => value + 1)
    if (status === "correct" || status === "near") updateLessonModuleProgress(id, "reflex", current + 1, totalItems)
  }, [answer, current, id, item, totalItems])

  const revealAnswer = useCallback(() => {
    setTranslationStatus("revealed")
    updateLessonModuleProgress(id, "reflex", current + 1, totalItems)
  }, [current, id, totalItems])

  const nextSentence = useCallback(() => {
    setAnswer("")
    setTranslationStatus("idle")
    setCurrent((value) => value + 1)
  }, [])

  const handleFinish = useCallback(() => {
    router.push(`/lessons/${level}/${id}/speaking`)
  }, [level, id, router])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải phản xạ...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện phản xạ."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) {
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0
    return (
      <LessonLayout>
        <div className={styles.studyWrap}>
          <div className={styles.completionCard}>
            <h2 className={styles.completionTitle}>Hoàn thành Phản xạ</h2>
            <div className={styles.completionStats}>
              <div className={styles.statRow}><span className={styles.statLabel}>Câu đã dịch</span><span className={styles.statValue}>{totalItems}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Độ chính xác</span><span className={styles.statValue}>{accuracy}%</span></div>
            </div>
            <div className={styles.actionRow}>
              <Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link>
              <button className={styles.primaryButton} type="button" onClick={handleFinish}>Luyện nói <SharedIcon name="arrowRight" size={16} /></button>
            </div>
          </div>
        </div>
      </LessonLayout>
    )
  }

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng phản xạ"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Phản xạ {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <span className={styles.iconButton}><SharedIcon name="translate" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}>
            <i><SharedIcon name="translate" size={22} /></i>
            <div>
              <span>DỊCH SANG TIẾNG TRUNG</span>
              <h1>{item.exampleMeaning || item.meaningVi}</h1>
              <p>Nhập câu tiếng Trung tương ứng. Bấm Xem đáp án nếu cần.</p>
            </div>
          </motion.section>

          <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${translationStatus === "correct" ? styles.inputSuccess : translationStatus === "wrong" ? styles.inputError : ""}`} variants={cardVariants}>
            <label htmlFor="reflex-answer">NHẬP CÂU TIẾNG TRUNG</label>
            <textarea id="reflex-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setTranslationStatus("idle") }} placeholder="Gõ câu tiếng Trung tại đây..." autoFocus />
            {translationStatus !== "idle" && translationStatus !== "revealed" && <strong className={translationStatus === "wrong" ? styles.feedbackError : styles.feedbackSuccess}>{statusLabel(translationStatus)}</strong>}
            {translationStatus === "revealed" && <div className={styles.answerReview}><p>Đáp án: <strong>{item.example}</strong></p></div>}
            {translationStatus !== "idle" && translationStatus !== "revealed" && <div className={styles.answerReview}><p>Đáp án: <strong>{item.example}</strong></p></div>}
            <div className={styles.actionRow}>
              <button className={styles.secondaryButton} type="button" onClick={revealAnswer}>Xem đáp án</button>
              <button className={styles.primaryButton} type="button" onClick={checkTranslation} disabled={!answer.trim()}>Kiểm tra</button>
            </div>
          </motion.section>
        </motion.div>

        <div className={styles.practiceStatus}>
          <div className={styles.dots}>{Array.from({ length: totalItems }, (_, index) => <i key={index} className={index < current || (index === current && (translationStatus === "correct" || translationStatus === "revealed")) ? styles.dotDone : ""} />)}</div>
          <div className={styles.accuracyRow}><span><b>{correct}/{attempts || totalItems}</b> đúng</span></div>
        </div>
      </section>

      <aside className={styles.stickyStudyBar}>
        <div className={styles.stickyStudyInner}>
          <span>{translationStatus === "correct" || translationStatus === "revealed" ? "Chuyển sang câu tiếp theo" : "Kiểm tra câu dịch của bạn"}</span>
          {(translationStatus === "correct" || translationStatus === "revealed") ? (
            <button className={styles.primaryButton} type="button" onClick={nextSentence}>{current + 1 < totalItems ? "Câu tiếp theo" : "Xem kết quả"} <SharedIcon name="arrowRight" size={15} /></button>
          ) : (
            <button className={styles.primaryButton} type="button" onClick={checkTranslation} disabled={!answer.trim()}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>
          )}
        </div>
      </aside>
    </LessonLayout>
  )
}
