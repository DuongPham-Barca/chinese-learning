"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

export default function FlashcardPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [vocab, setVocab] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(0)
  const [known, setKnown] = useState(0)
  const [review, setReview] = useState(0)
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

  const moveNext = useCallback(() => {
    setCurrent((value) => value + 1)
    setFlipped(false)
  }, [])

  const markKnown = useCallback(() => {
    setKnown((value) => value + 1)
    moveNext()
  }, [moveNext])

  const markReview = useCallback(() => {
    setReview((value) => value + 1)
    moveNext()
  }, [moveNext])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (current >= vocab.length) return
      if (event.key === "ArrowRight") markKnown()
      if (event.key === "ArrowLeft") markReview()
      if (event.code === "Space") {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [current, markKnown, markReview, vocab.length])

  const returnHref = `/lessons/${level}/${id}`

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải thẻ từ vựng...</p></div></div></LessonLayout>
  if (error || vocab.length === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa có từ vựng."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= vocab.length) return <LessonLayout><div className={styles.studyWrap}><div className={styles.completionCard}><h2 className={styles.completionTitle}>Hoàn thành thẻ từ vựng</h2><p>Đã thuộc: {known} - Cần ôn: {review}</p><div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Quay lại bài học</Link></div></div></div></LessonLayout>

  const card = vocab[current]
  const progress = Math.round(((current + 1) / vocab.length) * 100)
  const accuracy = Math.round((known / (known + review || 1)) * 100)

  const speak = () => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.hanzi)
    utterance.lang = "zh-CN"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng thẻ từ vựng"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Từ vựng {current + 1} / {vocab.length}</strong><span>Hoàn thành {progress}%</span></div>
            <button className={styles.iconButton} type="button" aria-label="Tùy chọn"><SharedIcon name="moreHorizontal" size={18} /></button>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div key={card.id} className={`${styles.flashScene} ${flipped ? styles.flipped : ""}`} variants={cardVariants} initial="hidden" animate="visible" onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter") setFlipped((value) => !value) }} role="button" tabIndex={0} aria-label="Lật thẻ">
          <div className={styles.flashCard}>
            <div className={`${styles.cardFace} ${styles.cardFront}`}><strong>{card.hanzi}</strong><small>{card.pinyin}</small><button type="button" className={styles.audioButton} onClick={(event) => { event.stopPropagation(); speak() }} aria-label={`Phát âm ${card.hanzi}`}><SharedIcon name="volume2" size={29} /></button></div>
            <div className={`${styles.cardFace} ${styles.cardBack}`}><small>Nghĩa tiếng Việt</small><strong>{card.meaningVi}</strong><p>{card.hanzi} - {card.pinyin}</p><em>Nhấn để xem lại mặt trước</em></div>
          </div>
        </motion.div>

        <div className={styles.studyActions}>
          <button type="button" className={`${styles.choiceButton} ${styles.reviewChoice}`} onClick={markReview}><SharedIcon name="rotateCcw" size={22} /><span><strong>Cần ôn lại</strong><small>Từ này sẽ xuất hiện thường xuyên hơn</small></span></button>
          <button type="button" className={`${styles.choiceButton} ${styles.knownChoice}`} onClick={markKnown}><SharedIcon name="check" size={22} /><span><strong>Đã thuộc</strong><small>Chuyển sang từ tiếp theo</small></span></button>
        </div>
        <div className={styles.statStrip}><span><b>{known}</b>Đã thuộc</span><span><b>{review}</b>Cần ôn</span><span><b>{vocab.length - current}</b>Còn lại</span></div>
      </section>
      <aside className={styles.stickyStudyBar}><div className={styles.stickyStudyInner}><span>Độ chính xác {accuracy}%</span><Link className={styles.secondaryButton} href={returnHref}>Tổng quan bài học</Link></div></aside>
    </LessonLayout>
  )
}
