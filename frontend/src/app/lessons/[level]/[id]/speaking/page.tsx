"use client"

import { use, useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type SpeechRecognitionResultEvent = {
  results: {
    length: number
    [index: number]: {
      [index: number]: { transcript: string }
    }
  }
}

type SpeechRecognitionErrorEvent = {
  error: string
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

const SpeechRecognitionAPI: SpeechRecognitionConstructor | undefined = typeof window !== "undefined"
  ? (window as WindowWithSpeechRecognition).SpeechRecognition || (window as WindowWithSpeechRecognition).webkitSpeechRecognition
  : undefined

type RecordState = "idle" | "listening" | "processing" | "done"
type MicError = "unsupported" | "no-speech" | "permission" | null

type CharResult = {
  actual: string
  expected: string
  correct: boolean
}

function normalizeChinese(value: string) {
  return value.replace(/[\s.，。！？、；：""''（）《》]/g, "").trim()
}

function compareCharacters(answer: string, expected: string): CharResult[] {
  const inputChars = Array.from(normalizeChinese(answer))
  const expectedChars = Array.from(normalizeChinese(expected))
  const maxLength = Math.max(inputChars.length, expectedChars.length)

  return Array.from({ length: maxLength }, (_, index) => ({
    actual: inputChars[index] ?? "",
    expected: expectedChars[index] ?? "",
    correct: inputChars[index] === expectedChars[index],
  }))
}

function calculateAccuracy(comparison: CharResult[]): number {
  if (comparison.length === 0) return 0
  const correct = comparison.filter((c) => c.correct).length
  return Math.round((correct / comparison.length) * 100)
}

export default function SpeakingPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [items, setItems] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [current, setCurrent] = useState(() => readLessonProgress(id).speaking?.completed ?? 0)
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [micError, setMicError] = useState<MicError>(null)
  const [transcript, setTranscript] = useState("")
  const [comparison, setComparison] = useState<CharResult[]>([])
  const [accuracy, setAccuracy] = useState(0)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const manualStopRef = useRef(false)
  const transcriptRef = useRef("")

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setItems(response.data.vocabulary.filter((item) => item.example))
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu luyện nói.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  const item = items[current]
  const totalItems = items.length
  const progress = totalItems ? Math.round(((current + (recordState === "done" ? 1 : 0)) / totalItems) * 100) : 0

  const speak = useCallback((rate = 0.85) => {
    if (!item) return
    if (item.audioUrl) {
      void new Audio(item.audioUrl).play()
      return
    }
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(item.example!)
    utterance.lang = "zh-CN"
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
  }, [item])

  const stopListening = useCallback(() => {
    manualStopRef.current = true
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecordState("processing")
  }, [])

  const startListening = useCallback(() => {
    if (!item) return
    setMicError(null)
    setTranscript("")
    setComparison([])
    setAccuracy(0)
    setRecordState("processing")
    setTranscript("")
    transcriptRef.current = ""

    if (!SpeechRecognitionAPI) {
      setMicError("unsupported")
      setRecordState("idle")
      return
    }

    manualStopRef.current = false
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = "zh-CN"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      const currentText = event.results[event.results.length - 1][0].transcript
      transcriptRef.current = currentText
      setTranscript(currentText)
    }

    recognition.onerror = (event) => {
      if (manualStopRef.current) return
      if (event.error === "not-allowed") {
        setMicError("permission")
      } else if (event.error === "no-speech") {
        setMicError("no-speech")
      } else {
        setMicError("unsupported")
      }
      setRecordState("idle")
      recognitionRef.current = null
    }

    recognition.onend = () => {
      const finalTranscript = transcriptRef.current
      if (!finalTranscript.trim()) {
        setMicError("no-speech")
        setRecordState("idle")
        recognitionRef.current = null
        return
      }
      const result = compareCharacters(finalTranscript, item.example!)
      const score = calculateAccuracy(result)
      setTranscript(finalTranscript)
      setComparison(result)
      setAccuracy(score)
      setRecordState("done")
      updateLessonModuleProgress(id, "speaking", current + 1, totalItems)
      recognitionRef.current = null
    }

    recognition.start()
    recognitionRef.current = recognition
    setRecordState("listening")
  }, [current, id, item, totalItems])

  const nextSentence = useCallback(() => {
    setTranscript("")
    setComparison([])
    setAccuracy(0)
    setRecordState("idle")
    setMicError(null)
    setCurrent((value) => value + 1)
    window.speechSynthesis?.cancel()
  }, [])

  const retry = useCallback(() => {
    setTranscript("")
    setComparison([])
    setAccuracy(0)
    setRecordState("idle")
    setMicError(null)
  }, [])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải luyện nói...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện nói."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) {
    return (
      <LessonLayout>
        <div className={styles.studyWrap}>
          <div className={styles.completionCard}>
            <h2 className={styles.completionTitle}>Hoàn thành Luyện nói</h2>
            <div className={styles.completionStats}>
              <div className={styles.statRow}><span className={styles.statLabel}>Câu đã luyện</span><span className={styles.statValue}>{totalItems}</span></div>
            </div>
            <div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Quay lại bài học</Link></div>
          </div>
        </div>
      </LessonLayout>
    )
  }

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng luyện nói"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Luyện nói {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <button className={styles.iconButton} type="button" onClick={() => speak()} aria-label="Nghe mẫu"><SharedIcon name="volume2" size={18} /></button>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={styles.sentenceCard} variants={cardVariants}>
            <div className={styles.sentenceLabel}>LUYỆN NÓI CÂU</div>
            <div className={styles.chineseText}>{item.example}</div>
            <div className={styles.pinyinText}>{item.examplePinyin}</div>
            <div className={styles.meaningText}>{item.exampleMeaning || item.meaningVi}</div>
            <div className={styles.audioActions}>
              <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} type="button" onClick={() => speak()}><SharedIcon name="volume2" size={15} />Nghe câu mẫu</button>
              <button className={styles.audioBtn} type="button" onClick={() => speak(0.7)}><SharedIcon name="clock" size={15} />0.75x</button>
            </div>
          </motion.section>

          <motion.section className={styles.recordingArea} variants={cardVariants}>
            <div className={styles.micOuter}>
              {recordState === "listening" && <div className={styles.pulseRing} />}
              <button className={`${styles.micButton} ${recordState === "listening" ? styles.micRecording : recordState === "done" ? styles.micRecorded : ""}`} type="button" onClick={recordState === "listening" ? stopListening : startListening} disabled={recordState === "processing"} aria-label="Ghi âm câu tiếng Trung">
                <SharedIcon name={recordState === "listening" ? "pause" : recordState === "done" ? "check" : "mic"} size={36} />
              </button>
            </div>
            {recordState === "idle" && <div className={styles.recordingStatus}>Bấm để nói câu tiếng Trung</div>}
            {recordState === "listening" && (
              <>
                <div className={`${styles.waveform} ${styles.wavePlaying}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
                <div className={styles.recordingStatus}>Đang nghe...</div>
                {transcript && <p className={styles.transcriptText}>{transcript}</p>}
                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} type="button" onClick={stopListening}>Dừng <SharedIcon name="pause" size={15} /></button>
                </div>
              </>
            )}
            {recordState === "processing" && <div className={styles.processingArea}><div className={styles.spinner} /><div>Đang nhận diện giọng nói...</div></div>}
            {micError === "unsupported" && <strong className={styles.feedbackError}>Trình duyệt chưa hỗ trợ nhận diện giọng nói. Dùng Chrome hoặc Edge mới nhất.</strong>}
            {micError === "permission" && <strong className={styles.feedbackError}>Cần quyền truy cập micro.</strong>}
            {micError === "no-speech" && <strong className={styles.feedbackError}>Không nghe thấy giọng nói. Hãy thử lại.</strong>}
          </motion.section>

          {recordState === "done" && (
            <motion.section className={styles.resultCard} variants={cardVariants}>
              <div className={styles.inlineScore}><strong>{accuracy}%</strong><span>Độ chính xác</span></div>
              {transcript && (
                <div className={styles.answerReview}>
                  <div className={styles.sentenceLabel}>Bạn đã nói</div>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 0" }}>{transcript}</p>
                </div>
              )}
              {comparison.length > 0 && (
                <div className={styles.charFeedback}>
                  {comparison.map((char, index) => (
                    <span className={`${styles.charChip} ${char.correct ? styles.charCorrect : styles.charIncorrect}`} key={`${char.expected}-${index}`}>
                      {char.actual || "∅"}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.answerReview}>
                <p>Đáp án chuẩn: <strong>{item.example}</strong></p>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={retry}>Nói lại</button>
                <button className={styles.primaryButton} type="button" onClick={nextSentence}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button>
              </div>
            </motion.section>
          )}
        </motion.div>
      </section>
    </LessonLayout>
  )
}
