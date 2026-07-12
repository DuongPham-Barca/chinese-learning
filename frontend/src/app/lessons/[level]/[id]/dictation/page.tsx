"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type CheckStatus = "idle" | "success" | "error"

function compareCharacters(answer: string, expected: string) {
  const inputChars = Array.from(answer.trim().replace(/[\s.，。！？、；：""''（）《》]/g, ""))
  const expectedChars = Array.from(expected.replace(/[\s.，。！？、；：""''（）《》]/g, ""))
  const maxLength = Math.max(inputChars.length, expectedChars.length)

  return Array.from({ length: maxLength }, (_, index) => ({
    actual: inputChars[index] ?? "",
    expected: expectedChars[index] ?? "",
    correct: inputChars[index] === expectedChars[index],
  }))
}

export default function DictationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [items, setItems] = useState<Vocabulary[]>([])
  const [current, setCurrent] = useState(() => readLessonProgress(id).dictation?.completed ?? 0)
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
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setItems(response.data.vocabulary.filter((item) => item.example))
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu nghe chép.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const item = items[current]
  const totalItems = items.length

  const togglePlay = useCallback(() => {
    if (!item || !("speechSynthesis" in window)) return
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(item.example!)
    utterance.lang = "zh-CN"
    utterance.rate = speed
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setTime(0)
    setPlaying(true)
  }, [playing, item, speed])

  const checkAnswer = useCallback(() => {
    if (!item || !answer.trim()) return
    const normalized = answer.trim().replace(/[\s.，。！？、；：""''（）《》]/g, "")
    const expected = item.example!.replace(/[\s.，。！？、；：""''（）《》]/g, "")
    if (normalized === expected) {
      setStatus("success")
      updateLessonModuleProgress(id, "dictation", current + 1, totalItems)
    } else {
      setStatus("error")
      setErrors((value) => value + 1)
      setAccuracy((value) => Math.max(value - 5, 0))
    }
  }, [answer, current, id, item, totalItems])

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
  const comparison = item && status !== "idle" ? compareCharacters(answer, item.example!) : []

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải bài nghe chép...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện tập."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) return <LessonLayout><div className={styles.studyWrap}><div className={styles.completionCard}><h2 className={styles.completionTitle}>Hoàn thành nghe chép</h2><p>{errors} lỗi - độ chính xác {accuracy}%</p><div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Quay lại bài học</Link></div></div></div></LessonLayout>

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng bài nghe chép"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Nghe chép {current + 1} / {totalItems}</strong><span>Hoàn thành {Math.round(progress)}%</span></div>
            <span className={styles.iconButton}><SharedIcon name="fire" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div className={styles.dictationGrid} variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={`${styles.practiceCard} ${styles.audioCard}`} variants={cardVariants}>
            <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
            <button type="button" className={styles.playButton} onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"}><SharedIcon name={playing ? "pause" : "play"} size={28} /></button>
            <div className={styles.timeRow}><span>00:0{Math.floor(time)}</span><span>00:03</span></div>
            <div className={styles.studyProgress} style={{ "--progress": `${(time / 3) * 100}%` } as CSSProperties}><i /></div>
            <div className={styles.speedRow}><SharedIcon name="repeat" size={14} />{[0.75, 1, 1.25].map((value) => <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => setSpeed(value)} key={value}>{value}x</button>)}</div>
          </motion.section>

          <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`} variants={cardVariants}>
          <label htmlFor="hanzi-answer">NHẬP CHỮ HÁN</label>
          <textarea id="hanzi-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setStatus("idle") }} placeholder="Gõ chữ Hán tại đây..." autoFocus />
          <p className={styles.inputHelp}><SharedIcon name="translate" size={14} />Nhập câu tiếng Trung bạn vừa nghe</p>
          {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác.</strong>}
          {status === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {item.example}</strong>}
          {status !== "idle" && (
            <div className={styles.answerReview}>
              <div className={styles.sentenceLabel}>So sánh ký tự</div>
              <div className={styles.charFeedback}>
                {comparison.map((item, index) => (
                  <span className={`${styles.charChip} ${item.correct ? styles.charCorrect : styles.charIncorrect}`} key={`${item.expected}-${index}`}>
                    {item.actual || "∅"}
                  </span>
                ))}
              </div>
                  <p>Đáp án chuẩn: <strong>{item.example}</strong></p>
              <button className={styles.audioBtn} type="button" onClick={togglePlay}><SharedIcon name="volume2" size={15} />Nghe lại audio</button>
            </div>
          )}
          <div className={styles.actionRow}>
            {status === "success" ? <button className={styles.primaryButton} type="button" onClick={nextExercise}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={checkAnswer} disabled={!answer.trim()}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>}
          </div>
        </motion.section>
        </motion.div>

        <div className={styles.practiceStatus}>
          <div className={styles.dots}>{Array.from({ length: totalItems }, (_, index) => <i key={index} className={index < current || (index === current && status === "success") ? styles.dotDone : ""} />)}</div>
          <div className={styles.accuracyRow}><span><b>{errors}</b> lỗi</span><span><strong>{accuracy}%</strong> chính xác</span></div>
        </div>
      </section>
    </LessonLayout>
  )
}
