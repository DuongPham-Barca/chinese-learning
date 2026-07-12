"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import api from "@/lib/api"
import type { Vocabulary } from "@/types/api"
import styles from "./flashcards.module.css"

type IconName = "close" | "more" | "volume" | "rotate" | "check" | "clock"
type Flashcard = { hanzi: string; pinyin: string; meaning: string; example: string }

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a4 4 0 0 1 0 6M17.8 6.2a8 8 0 0 1 0 11.6"/></>,
    rotate: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function FlashcardHeader({ current, total }: { current: number; total: number }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}><Link href="/courses/hsk1/lesson-1" aria-label="Đóng Flashcard"><Icon name="close" /></Link><strong>Từ vựng {current} / {total}</strong><button type="button" aria-label="Tùy chọn"><Icon name="more" /></button></div>
    </header>
  )
}

function FlashcardProgress({ value }: { value: number }) {
  return <div className={styles.progress} aria-label={`Tiến độ ${value}%`}><span style={{ width: `${value}%` }} /></div>
}

function FlashcardCard({ card, flipped, onFlip, onSpeak }: { card: Flashcard; flipped: boolean; onFlip: () => void; onSpeak: () => void }) {
  return (
    <div className={`${styles.cardScene} ${flipped ? styles.flipped : ""}`} onClick={onFlip} onKeyDown={(event) => { if (event.key === "Enter") onFlip() }} role="button" tabIndex={0} aria-label="Lật thẻ">
      <span className={styles.cardInner}>
        <span className={`${styles.cardFace} ${styles.cardFront}`}><strong>{card.hanzi}</strong><small>{card.pinyin}</small><button type="button" className={styles.audioButton} onClick={(event) => { event.stopPropagation(); onSpeak() }} aria-label={`Phát âm ${card.hanzi}`}><Icon name="volume" /></button></span>
        <span className={`${styles.cardFace} ${styles.cardBack}`}><small>Nghĩa tiếng Việt</small><strong>{card.meaning}</strong><span>{card.hanzi}！</span><p>{card.example}</p><em>Nhấn để xem lại từ</em></span>
      </span>
    </div>
  )
}

function FlashcardActions({ onReview, onKnown }: { onReview: () => void; onKnown: () => void }) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.reviewButton} onClick={onReview}><Icon name="rotate" /><span><strong>CẦN ÔN LẠI</strong><small>Từ này sẽ xuất hiện<br /> thường xuyên hơn</small></span></button>
      <button type="button" className={styles.knownButton} onClick={onKnown}><Icon name="check" /><span><strong>ĐÃ THUỘC</strong><small>Đưa vào hệ thống<br /> Spaced Repetition</small></span></button>
    </div>
  )
}

function FlashcardStats({ known, review, remaining }: { known: number; review: number; remaining: number }) {
  return <div className={styles.stats}><span>● Đã thuộc: {known}</span><span>● Cần ôn: {review}</span><span>● Còn lại: {remaining}</span></div>
}

export default function FlashcardStudyPage() {
  const [vocab, setVocab] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [known, setKnown] = useState(0)
  const [review, setReview] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    api.get("/lessons?level=HSK1").then((res) => {
      const found = res.data.lessons.find((l: { lessonOrder: number }) => l.lessonOrder === 1)
      if (found) {
        api.get(`/vocabulary/${found.id}`).then((r) => setVocab(r.data.vocabulary))
      }
    }).finally(() => setLoading(false))
  }, [])

  const flashcards: Flashcard[] = vocab.map((v) => ({
    hanzi: v.hanzi,
    pinyin: v.pinyin,
    meaning: v.meaningVi,
    example: v.hanzi + "。",
  }))

  const card = flashcards[current] ?? flashcards[0]
  const progress = flashcards.length > 0 ? Math.round(((current + 1) / flashcards.length) * 100) : 0
  const remaining = Math.max(flashcards.length - known - review, 0)

  const moveNext = useCallback(() => {
    setCurrent((value) => Math.min(value + 1, flashcards.length - 1))
    setFlipped(false)
  }, [flashcards.length])

  const markKnown = useCallback(() => {
    setKnown((value) => Math.min(value + 1, flashcards.length))
    moveNext()
  }, [moveNext, flashcards.length])

  const markReview = useCallback(() => {
    setReview((value) => Math.min(value + 1, flashcards.length))
    moveNext()
  }, [moveNext, flashcards.length])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") markKnown()
      if (event.key === "ArrowLeft") markReview()
      if (event.code === "Space") { event.preventDefault(); setFlipped((value) => !value) }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [markKnown, markReview])

  function speak() {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.hanzi)
    utterance.lang = "zh-CN"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }

  if (loading) return <main className={styles.page}><div className={styles.studyShell}><div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Đang tải...</div></div></main>
  if (flashcards.length === 0) return <main className={styles.page}><div className={styles.studyShell}><div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Chưa có từ vựng nào.</div></div></main>
  if (current >= flashcards.length) {
    return (
      <main className={styles.page}>
        <section className={styles.studyShell}>
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
            <h2 className="text-2xl font-bold mb-4">Hoàn thành! 🎉</h2>
            <p className="mb-4">Đã thuộc: {known} | Cần ôn: {review}</p>
            <Link href="/courses/hsk1/lesson-1" className="text-[#3B82F6] hover:underline">← Quay lại bài học</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.studyShell}>
        <FlashcardHeader current={current + 1} total={flashcards.length} />
        <FlashcardProgress value={progress} />
        <div className={styles.studyContent}>
          <FlashcardCard card={card} flipped={flipped} onFlip={() => setFlipped((value) => !value)} onSpeak={speak} />
          <div className={styles.bottomArea}>
            <FlashcardActions onReview={markReview} onKnown={markKnown} />
            <FlashcardStats known={known} review={review} remaining={remaining} />
            <footer className={styles.footerInfo}><span>▣ Độ chính xác: {flashcards.length > 0 ? Math.round((known / (known + review || 1)) * 100) : 0}%</span></footer>
          </div>
        </div>
      </section>
    </main>
  )
}
