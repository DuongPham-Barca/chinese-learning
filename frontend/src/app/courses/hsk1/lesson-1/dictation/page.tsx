"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import api from "@/lib/api"
import type { Sentence as APISentence } from "@/types/api"
import styles from "./dictation.module.css"

type IconName = "close" | "bulb" | "play" | "pause" | "repeat" | "translate" | "fire"
type CheckStatus = "idle" | "success" | "error"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    bulb: <><path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.3-1.3 2.5h-4.4c-.1-1.2-.5-1.9-1.3-2.5Z"/></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
    translate: <><path d="M3 5h12M9 3v2M5 9c1.5 3 4 5 7 6M13 9c-1.5 3-4 5-7 6"/><path d="m14 21 4-9 4 9M15.5 18h5"/></>,
    fire: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z"/>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

type Exercise = { meaning: string; answer: string; pinyin: string }

export default function DictationPracticePage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [errors, setErrors] = useState(0)
  const [accuracy, setAccuracy] = useState(100)

  useEffect(() => {
    api.get("/lessons?level=HSK1").then((res) => {
      const found = res.data.lessons.find((l: { lessonOrder: number }) => l.lessonOrder === 1)
      if (found) {
        api.get(`/sentences/${found.id}`).then((r) => {
          const items: Exercise[] = (r.data.sentences as APISentence[]).map((s) => ({
            meaning: s.sentenceVi,
            answer: s.sentenceZh,
            pinyin: "",
          }))
          setExercises(items)
        })
      }
    })
  }, [])

  const exercise = exercises[current]
  const totalItems = exercises.length

  const togglePlay = useCallback(() => {
    if (totalItems === 0) return
    setTime((value) => value >= 3 ? 0 : value)
    setPlaying((value) => !value)
  }, [totalItems])

  const checkAnswer = useCallback(() => {
    if (!exercise) return
    const normalized = answer.trim().replace(/\s/g, "")
    const expected = exercise.answer.replace(/\s/g, "")
    if (normalized === expected) {
      setStatus("success")
      setAccuracy(100)
    } else {
      setStatus("error")
      setErrors((value) => value + 1)
      setAccuracy((value) => Math.max(value - 5, 0))
    }
  }, [answer, exercise])

  const nextExercise = useCallback(() => {
    if (current + 1 < totalItems) {
      setCurrent(current + 1)
      setAnswer("")
      setStatus("idle")
      setPlaying(false)
      setTime(0)
    }
  }, [current, totalItems])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setTime((value) => {
        const next = value + 0.1 * speed
        if (next >= 3) { setPlaying(false); return 3 }
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing, speed])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && event.ctrlKey) { event.preventDefault(); togglePlay(); return }
      if (event.key === "Enter" && status !== "success") { event.preventDefault(); checkAnswer(); return }
      if (event.code === "Space") { event.preventDefault(); togglePlay() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [checkAnswer, togglePlay, status])

  if (exercises.length === 0) {
    return <main className={styles.page}><section className={styles.practiceShell}><div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Đang tải...</div></section></main>
  }
  if (current >= totalItems) {
    return (
      <main className={styles.page}>
        <section className={styles.practiceShell}>
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
            <h2 className="text-2xl font-bold mb-4">Hoàn thành bài dictation! 🎉</h2>
            <Link href="/courses/hsk1/lesson-1" className="text-[#3B82F6] hover:underline">← Quay lại bài học</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.practiceShell}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/courses/hsk1/lesson-1" aria-label="Đóng Dictation"><Icon name="close" /></Link>
            <strong>Dictation {current + 1} / {totalItems}</strong>
            <span><Icon name="fire" />{30} EXP</span>
          </div>
          <div className={styles.topProgress}><i style={{ width: `${((current + (status === "success" ? 1 : 0)) / totalItems) * 100}%` }} /></div>
        </header>

        <div className={styles.content}>
          <section className={styles.hintCard}>
            <i><Icon name="bulb" /></i>
            <div><span>GỢI Ý NGHĨA</span><h1>{exercise.meaning}</h1><p>Nghe và nhập đúng câu tiếng Trung.</p></div>
          </section>

          <section className={styles.audioCard}>
            <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>
              {[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}
            </div>
            <button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát audio"}>
              <Icon name={playing ? "pause" : "play"} />
            </button>
            <div className={styles.timelineLabels}>
              <span>00:0{Math.floor(time)}</span><span>00:03</span>
            </div>
            <div className={styles.timeline}>
              <span style={{ width: `${(time / 3) * 100}%` }} />
            </div>
            <div className={styles.speedSelector}>
              <Icon name="repeat" />
              {[0.75, 1, 1.25].map((value) => (
                <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => setSpeed(value)} key={value}>{value}x</button>
              ))}
            </div>
          </section>

          <section className={`${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`}>
            <label htmlFor="hanzi-answer">NHẬP CHỮ HÁN</label>
            <textarea id="hanzi-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setStatus("idle") }} placeholder="Gõ chữ Hán tại đây..." autoFocus />
            <p><Icon name="translate" />{exercise.pinyin || "Nhập câu tiếng Trung"}</p>
            {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác!</strong>}
            {status === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {exercise.answer}</strong>}
          </section>

          <div className={styles.statusRow}>
            <div className={styles.dots}>
              {Array.from({ length: totalItems }, (_, i) => (
                <i key={i} className={i < current ? styles.dotDone : i === current && status === "success" ? styles.dotDone : ""} />
              ))}
            </div>
            <div><span><b>{errors}</b> lỗi</span><span><strong>{accuracy}%</strong> độ chính xác</span></div>
          </div>
        </div>

        <aside className={styles.stickyBar}>
          {status === "success" ? (
            <a href="#" onClick={(e) => { e.preventDefault(); nextExercise() }} style={{ cursor: "pointer" }}>
              {current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <b>→</b>
            </a>
          ) : (
            <button type="button" onClick={checkAnswer}>Kiểm tra <b>→</b></button>
          )}
        </aside>
      </section>
    </main>
  )
}
