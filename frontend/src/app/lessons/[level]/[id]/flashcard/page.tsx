"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import type { Vocabulary } from "@/types/api"
import styles from "../../../../courses/hsk1/lesson-1/flashcards/flashcards.module.css"

type IconName = "close" | "more" | "volume" | "rotate" | "check" | "clock"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6M17.8 6.2a8 8 0 0 1 0 11.6"/></>,
    rotate: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

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
        if (active) setError("Không thể tải dữ liệu flashcard.")
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

  if (loading) return <main className={styles.page}><section className={styles.studyShell}><div style={{ padding: "2rem", textAlign: "center" }}>Đang tải flashcard...</div></section></main>
  if (error || vocab.length === 0) return <main className={styles.page}><section className={styles.studyShell}><div style={{ padding: "2rem", textAlign: "center" }}><p>{error || "Bài học chưa có từ vựng."}</p><Link href={returnHref}>← Quay lại bài học</Link></div></section></main>
  if (current >= vocab.length) return <main className={styles.page}><section className={styles.studyShell}><div style={{ minHeight: "70vh", display: "grid", placeContent: "center", textAlign: "center", gap: 16 }}><h2>Hoàn thành! 🎉</h2><p>Đã thuộc: {known} | Cần ôn: {review}</p><Link href={returnHref}>← Quay lại bài học</Link></div></section></main>

  const card = vocab[current]
  const progress = Math.round(((current + 1) / vocab.length) * 100)

  const speak = () => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.hanzi)
    utterance.lang = "zh-CN"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  return (
    <main className={styles.page}>
      <section className={styles.studyShell}>
        <header className={styles.header}><div className={styles.headerInner}><Link href={returnHref} aria-label="Đóng Flashcard"><Icon name="close" /></Link><strong>Từ vựng {current + 1} / {vocab.length}</strong><button type="button" aria-label="Tùy chọn"><Icon name="more" /></button></div></header>
        <div className={styles.progress} aria-label={`Tiến độ ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
        <div className={styles.studyContent}>
          <div className={`${styles.cardScene} ${flipped ? styles.flipped : ""}`} onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter") setFlipped((value) => !value) }} role="button" tabIndex={0} aria-label="Lật thẻ">
            <span className={styles.cardInner}>
              <span className={`${styles.cardFace} ${styles.cardFront}`}><strong>{card.hanzi}</strong><small>{card.pinyin}</small><button type="button" className={styles.audioButton} onClick={(event) => { event.stopPropagation(); speak() }} aria-label={`Phát âm ${card.hanzi}`}><Icon name="volume" /></button></span>
              <span className={`${styles.cardFace} ${styles.cardBack}`}><small>Nghĩa tiếng Việt</small><strong>{card.meaningVi}</strong><span>{card.hanzi}！</span><em>Nhấn để xem lại từ</em></span>
            </span>
          </div>
          <div className={styles.bottomArea}>
            <div className={styles.actions}>
              <button type="button" className={styles.reviewButton} onClick={markReview}><Icon name="rotate" /><span><strong>CẦN ÔN LẠI</strong><small>Từ này sẽ xuất hiện<br />thường xuyên hơn</small></span></button>
              <button type="button" className={styles.knownButton} onClick={markKnown}><Icon name="check" /><span><strong>ĐÃ THUỘC</strong><small>Chuyển sang từ<br />tiếp theo</small></span></button>
            </div>
            <div className={styles.stats}><span>● Đã thuộc: {known}</span><span>● Cần ôn: {review}</span><span>● Còn lại: {vocab.length - current}</span></div>
            <footer className={styles.footerInfo}><span>▣ Độ chính xác: {Math.round((known / (known + review || 1)) * 100)}%</span><span><Icon name="clock" />Thời gian còn lại: {Math.max(1, vocab.length - current)} phút</span></footer>
          </div>
        </div>
      </section>
    </main>
  )
}
