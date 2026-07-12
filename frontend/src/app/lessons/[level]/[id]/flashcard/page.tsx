"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

export default function FlashcardPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [vocab, setVocab] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(() => readLessonProgress(id).flashcard?.completed ?? 0)
  const [learned, setLearned] = useState(() => readLessonProgress(id).flashcard?.completed ?? 0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setVocab(response.data.vocabulary)
      })
      .catch(() => {
        if (active) setError("Không thể tải dữ liệu thẻ từ vựng.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const moveNext = useCallback(() => {
    const completed = Math.min(current + 1, vocab.length)
    updateLessonModuleProgress(id, "flashcard", completed, vocab.length)
    setLearned((value) => Math.max(value, completed))
    setCurrent((value) => value + 1)
    setFlipped(false)
  }, [current, id, vocab.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (current >= vocab.length) return
      if (event.key === "ArrowRight") moveNext()
      if (event.code === "Space") {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [current, moveNext, vocab.length])

  const returnHref = `/lessons/${level}/${id}`
  const card = vocab[current]

  const speak = useCallback(() => {
    if (!card) return
    if (card.audioUrl) {
      void new Audio(card.audioUrl).play()
      return
    }
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.hanzi)
    utterance.lang = "zh-CN"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }, [card])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải thẻ từ vựng...</p></div></div></LessonLayout>
  if (error || vocab.length === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa có từ vựng."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= vocab.length) return <LessonLayout><div className={styles.studyWrap}><div className={styles.completionCard}><h2 className={styles.completionTitle}>Hoàn thành Thẻ từ vựng & Phát âm</h2><p>Đã học {vocab.length} từ.</p><div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Quay lại bài học</Link></div></div></div></LessonLayout>

  const progress = Math.round((learned / vocab.length) * 100)

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng thẻ từ vựng"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Từ vựng {current + 1} / {vocab.length}</strong><span>Hoàn thành {progress}%</span></div>
            <button className={styles.iconButton} type="button" aria-label="Nghe phát âm mẫu" onClick={speak}><SharedIcon name="volume2" size={18} /></button>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div key={card.id} className={`${styles.flashScene} ${flipped ? styles.flipped : ""}`} variants={cardVariants} initial="hidden" animate="visible" onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter") setFlipped((value) => !value) }} role="button" tabIndex={0} aria-label="Lật thẻ">
          <div className={styles.flashCard}>
            <div className={`${styles.cardFace} ${styles.cardFront} ${card.imageUrl ? styles.cardFrontWithImage : ""}`}>
              {card.imageUrl && (
                <div className={styles.flashImageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className={styles.flashImage} src={card.imageUrl} alt="" />
                </div>
              )}
              <strong>{card.hanzi}</strong>
              <small>{card.pinyin}</small>
              <button type="button" className={styles.audioButton} onClick={(event) => { event.stopPropagation(); speak() }} aria-label={`Phát âm ${card.hanzi}`}><SharedIcon name="volume2" size={29} /></button>
            </div>
            <div className={`${styles.cardFace} ${styles.cardBack}`}>
              {card.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.flashBackImage} src={card.imageUrl} alt="" />
              )}
              <small>Nghĩa tiếng Việt</small>
              <strong>{card.meaningVi}</strong>
              <p>{card.hanzi} - {card.pinyin}</p>
              {card.example && <em>{card.example}</em>}
            </div>
          </div>
        </motion.div>

        <div className={styles.studyActions}>
          <button type="button" className={`${styles.choiceButton} ${styles.reviewChoice}`} onClick={() => setFlipped((value) => !value)}><SharedIcon name="rotateCcw" size={22} /><span><strong>Lật thẻ</strong><small>Xem nghĩa, pinyin và ví dụ</small></span></button>
          <button type="button" className={`${styles.choiceButton} ${styles.knownChoice}`} onClick={moveNext}><SharedIcon name="arrowRight" size={22} /><span><strong>{current + 1 < vocab.length ? "Từ tiếp theo" : "Hoàn thành"}</strong><small>Giữ tiến độ số từ đã học</small></span></button>
        </div>
        <div className={styles.statStrip}><span><b>{Math.min(current + 1, vocab.length)}</b>Đang học</span><span><b>{learned}</b>Đã qua</span><span><b>{vocab.length - current - 1}</b>Còn lại</span></div>
      </section>
    </LessonLayout>
  )
}
