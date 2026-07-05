"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import styles from "./flashcards.module.css"

type IconName = "close" | "more" | "volume" | "rotate" | "check" | "clock"
type Flashcard = { hanzi: string; pinyin: string; meaning: string; example: string }

const flashcards: Flashcard[] = [
  { hanzi: "谢谢", pinyin: "xiè xie", meaning: "Cảm ơn", example: "谢谢你的帮助！" },
  { hanzi: "再见", pinyin: "zài jiàn", meaning: "Tạm biệt", example: "再见，明天见！" },
  { hanzi: "你好", pinyin: "nǐ hǎo", meaning: "Xin chào", example: "你好，很高兴认识你。" },
  { hanzi: "请", pinyin: "qǐng", meaning: "Xin mời", example: "请坐！" },
  { hanzi: "对不起", pinyin: "duì bu qǐ", meaning: "Xin lỗi", example: "对不起，我来晚了。" },
  { hanzi: "没关系", pinyin: "méi guān xi", meaning: "Không sao", example: "没关系，别担心。" },
  { hanzi: "是", pinyin: "shì", meaning: "Là, phải", example: "我是学生。" },
  { hanzi: "不", pinyin: "bù", meaning: "Không", example: "我不是老师。" },
  { hanzi: "我", pinyin: "wǒ", meaning: "Tôi", example: "我叫明。" },
  { hanzi: "你", pinyin: "nǐ", meaning: "Bạn", example: "你好吗？" },
]

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
  const [current, setCurrent] = useState(2)
  const [known, setKnown] = useState(2)
  const [review, setReview] = useState(1)
  const [flipped, setFlipped] = useState(false)
  const card = flashcards[current]
  const progress = Math.round(((current + 1) / flashcards.length) * 100)
  const remaining = Math.max(flashcards.length - known - review, 0)

  const moveNext = useCallback(() => {
    setCurrent((value) => Math.min(value + 1, flashcards.length - 1))
    setFlipped(false)
  }, [])

  const markKnown = useCallback(() => {
    setKnown((value) => Math.min(value + 1, flashcards.length))
    moveNext()
  }, [moveNext])

  const markReview = useCallback(() => {
    setReview((value) => Math.min(value + 1, flashcards.length))
    moveNext()
  }, [moveNext])

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
            <footer className={styles.footerInfo}><span>▣ Độ chính xác: 67%</span><span><Icon name="clock" />Thời gian còn lại: 4 phút</span></footer>
          </div>
        </div>
      </section>
    </main>
  )
}
