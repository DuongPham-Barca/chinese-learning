"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import type { Sentence } from "@/types/api"
import styles from "../../../../courses/hsk1/lesson-1/dictation/dictation.module.css"

type IconName = "close" | "bulb" | "play" | "pause" | "repeat" | "translate" | "fire"
type CheckStatus = "idle" | "success" | "error"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    bulb: <><path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.3-1.3 2.5h-4.4c-.1-1.2-.5-1.9-1.3-2.5Z"/></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    pause: <path d="M9 7v10M15 7v10" />,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
    translate: <><path d="M3 5h12M9 3v2M5 9c1.5 3 4 5 7 6M13 9c-1.5 3-4 5-7 6"/><path d="m14 21 4-9 4 9M15.5 18h5"/></>,
    fire: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z"/>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export default function DictationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [errors, setErrors] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let active = true
    api.get<{ sentences: Sentence[] }>(`/sentences/${id}`)
      .then((response) => {
        if (active) setSentences(response.data.sentences)
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu Dictation.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const sentence = sentences[current]
  const totalItems = sentences.length

  const togglePlay = useCallback(() => {
    if (!sentence || !("speechSynthesis" in window)) return
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(sentence.sentenceZh)
    utterance.lang = "zh-CN"
    utterance.rate = speed
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setTime(0)
    setPlaying(true)
  }, [playing, sentence, speed])

  const checkAnswer = useCallback(() => {
    if (!sentence || !answer.trim()) return
    const normalized = answer.trim().replace(/\s/g, "")
    const expected = sentence.sentenceZh.replace(/\s/g, "")
    if (normalized === expected) {
      setStatus("success")
    } else {
      setStatus("error")
      setErrors((value) => value + 1)
      setAccuracy((value) => Math.max(value - 5, 0))
    }
  }, [answer, sentence])

  const nextExercise = useCallback(() => {
    setCurrent((value) => value + 1)
    setAnswer("")
    setStatus("idle")
    setPlaying(false)
    setTime(0)
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setTime((value) => Math.min(value + 0.1 * speed, 3))
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.ctrlKey) { event.preventDefault(); togglePlay(); return }
      if (event.key === "Enter" && status !== "success") { event.preventDefault(); checkAnswer() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [checkAnswer, status, togglePlay])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const returnHref = `/lessons/${level}/${id}`

  if (loading) return <main className={styles.page}><section className={styles.practiceShell}><div style={{ padding: "2rem", textAlign: "center" }}>Đang tải Dictation...</div></section></main>
  if (loadError || totalItems === 0) return <main className={styles.page}><section className={styles.practiceShell}><div style={{ padding: "2rem", textAlign: "center" }}><p>{loadError || "Bài học chưa có câu luyện tập."}</p><Link href={returnHref}>← Quay lại bài học</Link></div></section></main>
  if (current >= totalItems) return <main className={styles.page}><section className={styles.practiceShell}><div style={{ minHeight: "70vh", display: "grid", placeContent: "center", textAlign: "center", gap: 16 }}><h2>Hoàn thành Dictation! 🎉</h2><p>{errors} lỗi · {accuracy}% độ chính xác</p><Link href={returnHref}>← Quay lại bài học</Link></div></section></main>

  return (
    <main className={styles.page}>
      <section className={styles.practiceShell}>
        <header className={styles.header}>
          <div className={styles.headerInner}><Link href={returnHref} aria-label="Đóng Dictation"><Icon name="close" /></Link><strong>Dictation {current + 1} / {totalItems}</strong><span><Icon name="fire" />{30} EXP</span></div>
          <div className={styles.topProgress}><i style={{ width: `${((current + (status === "success" ? 1 : 0)) / totalItems) * 100}%` }} /></div>
        </header>

        <div className={styles.content}>
          <section className={styles.hintCard}><i><Icon name="bulb" /></i><div><span>GỢI Ý NGHĨA</span><h1>{sentence.sentenceVi}</h1><p>Nghe và nhập đúng câu tiếng Trung.</p></div></section>

          <section className={styles.audioCard}>
            <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
            <button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát câu tiếng Trung"}><Icon name={playing ? "pause" : "play"} /></button>
            <div className={styles.timelineLabels}><span>00:0{Math.floor(time)}</span><span>00:03</span></div>
            <div className={styles.timeline}><span style={{ width: `${(time / 3) * 100}%` }} /></div>
            <div className={styles.speedSelector}><Icon name="repeat" />{[0.75, 1, 1.25].map((value) => <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => setSpeed(value)} key={value}>{value}x</button>)}</div>
          </section>

          <section className={`${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`}>
            <label htmlFor="hanzi-answer">NHẬP CHỮ HÁN</label>
            <textarea id="hanzi-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setStatus("idle") }} placeholder="Gõ chữ Hán tại đây..." autoFocus />
            <p><Icon name="translate" />Nhập câu tiếng Trung bạn vừa nghe</p>
            {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác!</strong>}
            {status === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {sentence.sentenceZh}</strong>}
          </section>

          <div className={styles.statusRow}>
            <div className={styles.dots}>{Array.from({ length: totalItems }, (_, index) => <i key={index} className={index < current || (index === current && status === "success") ? styles.dotDone : ""} />)}</div>
            <div><span><b>{errors}</b> lỗi</span><span><strong>{accuracy}%</strong> độ chính xác</span></div>
          </div>
        </div>

        <aside className={styles.stickyBar}>
          {status === "success" ? <button type="button" onClick={nextExercise}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <b>→</b></button> : <button type="button" onClick={checkAnswer} disabled={!answer.trim()}>Kiểm tra <b>→</b></button>}
        </aside>
      </section>
    </main>
  )
}
