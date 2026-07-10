"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { Sentence } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type CheckStatus = "idle" | "success" | "error"

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
        if (active) setLoadError("Khong the tai du lieu Dictation.")
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
  const progress = totalItems ? ((current + (status === "success" ? 1 : 0)) / totalItems) * 100 : 0

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Dang tai Dictation...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bai hoc chua co cau luyen tap."}</p><Link className={styles.secondaryButton} href={returnHref}>Back to lesson</Link></div></div></LessonLayout>
  if (current >= totalItems) return <LessonLayout><div className={styles.studyWrap}><div className={styles.completionCard}><h2 className={styles.completionTitle}>Dictation complete</h2><p>{errors} mistakes - {accuracy}% accuracy</p><div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Back to lesson</Link></div></div></div></LessonLayout>

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Close Dictation"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Dictation {current + 1} / {totalItems}</strong><span>{Math.round(progress)}% complete</span></div>
            <span className={styles.iconButton}><SharedIcon name="fire" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div className={styles.dictationGrid} variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}><i><SharedIcon name="sparkles" size={22} /></i><div><span>VIETNAMESE MEANING</span><h1>{sentence.sentenceVi}</h1><p>Listen and type the Chinese sentence.</p></div></motion.section>

          <motion.section className={`${styles.practiceCard} ${styles.audioCard}`} variants={cardVariants}>
            <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
            <button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}><SharedIcon name={playing ? "pause" : "play"} size={28} /></button>
            <div className={styles.timeRow}><span>00:0{Math.floor(time)}</span><span>00:03</span></div>
            <div className={styles.studyProgress} style={{ "--progress": `${(time / 3) * 100}%` } as CSSProperties}><i /></div>
            <div className={styles.speedRow}><SharedIcon name="repeat" size={14} />{[0.75, 1, 1.25].map((value) => <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => setSpeed(value)} key={value}>{value}x</button>)}</div>
          </motion.section>
        </motion.div>

        <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`} variants={cardVariants} initial="hidden" animate="visible">
          <label htmlFor="hanzi-answer">CHINESE INPUT</label>
          <textarea id="hanzi-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setStatus("idle") }} placeholder="Type Hanzi here..." autoFocus />
          <p className={styles.inputHelp}><SharedIcon name="translate" size={14} />Type the Chinese sentence you heard</p>
          {status === "success" && <strong className={styles.feedbackSuccess}>Correct.</strong>}
          {status === "error" && <strong className={styles.feedbackError}>Correct answer: {sentence.sentenceZh}</strong>}
        </motion.section>

        <div className={styles.practiceStatus}>
          <div className={styles.dots}>{Array.from({ length: totalItems }, (_, index) => <i key={index} className={index < current || (index === current && status === "success") ? styles.dotDone : ""} />)}</div>
          <div className={styles.accuracyRow}><span><b>{errors}</b> mistakes</span><span><strong>{accuracy}%</strong> accuracy</span></div>
        </div>
      </section>

      <aside className={styles.stickyStudyBar}>
        <div className={styles.stickyStudyInner}>
          <span>{status === "success" ? "Ready for the next sentence" : "Check your Chinese input"}</span>
          {status === "success" ? <button className={styles.primaryButton} type="button" onClick={nextExercise}>{current + 1 < totalItems ? "Next Question" : "Finish"} <SharedIcon name="arrowRight" size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={checkAnswer} disabled={!answer.trim()}>Check <SharedIcon name="arrowRight" size={15} /></button>}
        </div>
      </aside>
    </LessonLayout>
  )
}
