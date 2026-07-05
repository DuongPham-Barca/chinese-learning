"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import styles from "./dictation.module.css"

type IconName = "close" | "bulb" | "play" | "pause" | "repeat" | "translate" | "fire"
type CheckStatus = "idle" | "success" | "error"

const exercise = {
  audio: "lesson1.mp3",
  meaning: "Tôi là sinh viên.",
  answer: "我是学生。",
  pinyin: "wǒ shì xué shēng",
}

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

function DictationHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}><Link href="/courses/hsk1/lesson-1" aria-label="Đóng Dictation"><Icon name="close" /></Link><strong>Dictation 1 / 5</strong><span><Icon name="fire" />30 EXP</span></div>
      <div className={styles.topProgress}><i /></div>
    </header>
  )
}

function MeaningHintCard() {
  return (
    <section className={styles.hintCard}><i><Icon name="bulb" /></i><div><span>GỢI Ý NGHĨA</span><h1>{exercise.meaning}</h1><p>Nghe và nhập đúng câu tiếng Trung.</p></div></section>
  )
}

function PlaybackSpeedSelector({ speed, onChange }: { speed: number; onChange: (speed: number) => void }) {
  return <div className={styles.speedSelector}><Icon name="repeat" />{[0.75, 1, 1.25].map((value) => <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => onChange(value)} key={value}>{value}x</button>)}</div>
}

function AudioPlayerCard({ playing, time, speed, onToggle, onSpeed }: { playing: boolean; time: number; speed: number; onToggle: () => void; onSpeed: (speed: number) => void }) {
  return (
    <section className={styles.audioCard}>
      <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height,index) => <i style={{ height }} key={index} />)}</div>
      <button type="button" className={styles.playButton} onClick={onToggle} aria-label={playing ? "Tạm dừng" : "Phát audio"}><Icon name={playing ? "pause" : "play"} /></button>
      <div className={styles.timelineLabels}><span>00:0{Math.floor(time)}</span><span>00:03</span></div>
      <div className={styles.timeline}><span style={{ width: `${(time / 3) * 100}%` }} /></div>
      <PlaybackSpeedSelector speed={speed} onChange={onSpeed} />
    </section>
  )
}

function ChineseInputCard({ value, status, onChange }: { value: string; status: CheckStatus; onChange: (value: string) => void }) {
  return (
    <section className={`${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`}>
      <label htmlFor="hanzi-answer">NHẬP CHỮ HÁN</label>
      <textarea id="hanzi-answer" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Gõ chữ Hán tại đây..." autoFocus />
      <p><Icon name="translate" />{exercise.pinyin}</p>
      {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác!</strong>}
      {status === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {exercise.answer}</strong>}
    </section>
  )
}

function ProgressDots({ errors, accuracy }: { errors: number; accuracy: number }) {
  return <div className={styles.statusRow}><div className={styles.dots}><i /><i /><i /><i /><i /></div><div><span><b>{errors}</b> lỗi</span><span><strong>{accuracy}%</strong> độ chính xác</span></div></div>
}

function StickyCheckBar({ status, onCheck }: { status: CheckStatus; onCheck: () => void }) {
  return <aside className={styles.stickyBar}>{status === "success" ? <Link href="/courses/hsk1/lesson-1/word-arrangement">Tiếp tục <b>→</b></Link> : <button type="button" onClick={onCheck}>Kiểm tra <b>→</b></button>}</aside>
}

export default function DictationPracticePage() {
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [errors, setErrors] = useState(3)
  const [accuracy, setAccuracy] = useState(95)

  const togglePlay = useCallback(() => {
    setTime((value) => value >= 3 ? 0 : value)
    setPlaying((value) => !value)
  }, [])

  const checkAnswer = useCallback(() => {
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
  }, [answer])

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
      if (event.key === "Enter") { event.preventDefault(); checkAnswer(); return }
      if (event.code === "Space") { event.preventDefault(); togglePlay() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [checkAnswer, togglePlay])

  return (
    <main className={styles.page}>
      <section className={styles.practiceShell}>
        <DictationHeader />
        <div className={styles.content}>
          <MeaningHintCard />
          <AudioPlayerCard playing={playing} time={time} speed={speed} onToggle={togglePlay} onSpeed={setSpeed} />
          <ChineseInputCard value={answer} status={status} onChange={(value) => { setAnswer(value); setStatus("idle") }} />
          <ProgressDots errors={errors} accuracy={accuracy} />
        </div>
        <StickyCheckBar status={status} onCheck={checkAnswer} />
      </section>
    </main>
  )
}
