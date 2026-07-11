"use client"

import { use, useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { evaluatePronunciation, type PronunciationEvaluation } from "@/services/pronunciation.service"
import type { Sentence } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type TranslationStatus = "idle" | "correct" | "near" | "wrong" | "revealed"
type RecordState = "idle" | "recording" | "processing" | "recorded"
type MicError = "permission" | "unsupported" | "tooshort" | null

function normalizeChinese(value: string) {
  return value.replace(/[，。！？、；：“”‘’（）《》\s]/g, "").trim()
}

function evaluateTranslation(answer: string, expected: string): TranslationStatus {
  const actual = normalizeChinese(answer)
  const target = normalizeChinese(expected)
  if (!actual) return "idle"
  if (actual === target) return "correct"
  if (actual.includes(target) || target.includes(actual) || Math.abs(actual.length - target.length) <= 2) return "near"
  return "wrong"
}

function statusLabel(status: TranslationStatus) {
  if (status === "correct") return "Đúng"
  if (status === "near") return "Gần đúng"
  if (status === "wrong") return "Sai"
  return ""
}

export default function ReflexSpeakingPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>("idle")
  const [answerVisible, setAnswerVisible] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [recordSeconds, setRecordSeconds] = useState(0)
  const recordSecondsRef = useRef(0)
  const [micError, setMicError] = useState<MicError>(null)
  const [pronunciation, setPronunciation] = useState<PronunciationEvaluation | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let active = true
    api.get<{ sentences: Sentence[] }>(`/sentences/${id}`)
      .then((response) => {
        if (active) setSentences(response.data.sentences)
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu phản xạ.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const resetRecording = useCallback(() => {
    stopTimer()
    stopStream()
    setRecordState("idle")
    setRecordSeconds(0)
    recordSecondsRef.current = 0
    setMicError(null)
    setPronunciation(null)
    chunksRef.current = []
    recorderRef.current = null
  }, [stopStream, stopTimer])

  useEffect(() => () => {
    resetRecording()
    window.speechSynthesis?.cancel()
  }, [resetRecording])

  const sentence = sentences[current]
  const totalItems = sentences.length
  const progress = totalItems ? Math.round(((current + (answerVisible && recordState === "recorded" ? 1 : 0)) / totalItems) * 100) : 0

  const speak = useCallback((rate = 0.85) => {
    if (!sentence) return
    if (sentence.audioUrl) {
      void new Audio(sentence.audioUrl).play()
      return
    }
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(sentence.sentenceZh)
    utterance.lang = "zh-CN"
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
  }, [sentence])

  const checkTranslation = useCallback(() => {
    if (!sentence) return
    const status = evaluateTranslation(answer, sentence.sentenceZh)
    if (status === "idle") return
    setTranslationStatus(status)
    setAnswerVisible(true)
    setAttempts((value) => value + 1)
    if (status === "correct") setCorrect((value) => value + 1)
  }, [answer, sentence])

  const revealAnswer = useCallback(() => {
    setAnswerVisible(true)
    setTranslationStatus("revealed")
  }, [])

  const startRecording = useCallback(async () => {
    if (!sentence) return
    setMicError(null)
    setPronunciation(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicError("unsupported")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stopTimer()
        stopStream()
        if (recordSecondsRef.current < 1) {
          setMicError("tooshort")
          setRecordState("idle")
          return
        }
        setRecordState("processing")
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        try {
          const result = await evaluatePronunciation({
            audio,
            expectedText: sentence.sentenceZh,
            scope: "sentence",
          })
          setPronunciation(result)
        } catch {
          setPronunciation({ status: "unavailable", message: "Chức năng chấm phát âm đang được kết nối." })
        } finally {
          setRecordState("recorded")
        }
      }
      recorder.start()
      setRecordSeconds(0)
      recordSecondsRef.current = 0
      timerRef.current = setInterval(() => {
        recordSecondsRef.current += 1
        setRecordSeconds(recordSecondsRef.current)
      }, 1000)
      setRecordState("recording")
    } catch {
      setMicError("permission")
    }
  }, [sentence, stopStream, stopTimer])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const nextSentence = useCallback(() => {
    resetRecording()
    setAnswer("")
    setTranslationStatus("idle")
    setAnswerVisible(false)
    setCurrent((value) => value + 1)
    window.speechSynthesis?.cancel()
  }, [resetRecording])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải phản xạ & luyện nói...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện phản xạ."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) {
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0
    return (
      <LessonLayout>
        <div className={styles.studyWrap}>
          <div className={styles.completionCard}>
            <h2 className={styles.completionTitle}>Hoàn thành Phản xạ & Luyện nói</h2>
            <div className={styles.completionStats}>
              <div className={styles.statRow}><span className={styles.statLabel}>Câu đã luyện</span><span className={styles.statValue}>{totalItems}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Phản xạ đúng</span><span className={styles.statValue}>{accuracy}%</span></div>
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
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng phản xạ"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Phản xạ {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <button className={styles.iconButton} type="button" onClick={() => speak()} aria-label="Nghe mẫu" disabled={!answerVisible}><SharedIcon name="volume2" size={18} /></button>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}>
            <i><SharedIcon name="translate" size={22} /></i>
            <div>
              <span>BƯỚC 1 - PHẢN XẠ DỊCH CÂU</span>
              <h1>{sentence.sentenceVi}</h1>
              <p>Dịch câu tiếng Việt này sang tiếng Trung. Đáp án tiếng Trung chỉ hiện sau khi kiểm tra hoặc bấm xem đáp án.</p>
            </div>
          </motion.section>

          <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${translationStatus === "correct" ? styles.inputSuccess : translationStatus === "wrong" ? styles.inputError : ""}`} variants={cardVariants}>
            <label htmlFor="reflex-answer">NHẬP CÂU TIẾNG TRUNG</label>
            <textarea id="reflex-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setTranslationStatus("idle") }} placeholder="Gõ câu tiếng Trung tại đây..." autoFocus />
            <p className={styles.inputHelp}><SharedIcon name="keyboard" size={14} />Phản xạ đúng là Việt → Trung, không dịch ngược.</p>
            {translationStatus !== "idle" && translationStatus !== "revealed" && <strong className={translationStatus === "wrong" ? styles.feedbackError : styles.feedbackSuccess}>{statusLabel(translationStatus)}</strong>}
            <div className={styles.actionRow}>
              <button className={styles.secondaryButton} type="button" onClick={revealAnswer}>Xem đáp án</button>
              <button className={styles.primaryButton} type="button" onClick={checkTranslation} disabled={!answer.trim()}>Kiểm tra</button>
            </div>
          </motion.section>

          {answerVisible && (
            <>
              <motion.section className={styles.sentenceCard} variants={cardVariants}>
                <div className={styles.sentenceLabel}>BƯỚC 2 - LUYỆN NÓI CÂU</div>
                <div className={styles.chineseText}>{sentence.sentenceZh}</div>
                <div className={styles.pinyinText}>Pinyin đang được kết nối từ API.</div>
                <div className={styles.meaningText}>{sentence.sentenceVi}</div>
                <div className={styles.audioActions}>
                  <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} type="button" onClick={() => speak()}><SharedIcon name="volume2" size={15} />Nghe câu mẫu</button>
                  <button className={styles.audioBtn} type="button" onClick={() => speak(0.7)}><SharedIcon name="clock" size={15} />0.75x</button>
                </div>
              </motion.section>

              <motion.section className={styles.recordingArea} variants={cardVariants}>
                <div className={styles.micOuter}>
                  {recordState === "recording" && <div className={styles.pulseRing} />}
                  <button className={`${styles.micButton} ${recordState === "recording" ? styles.micRecording : recordState === "recorded" ? styles.micRecorded : ""}`} type="button" onClick={recordState === "recording" ? stopRecording : startRecording} disabled={recordState === "processing"} aria-label="Ghi âm câu tiếng Trung">
                    <SharedIcon name={recordState === "recording" ? "pause" : recordState === "recorded" ? "check" : "mic"} size={36} />
                  </button>
                </div>
                {recordState === "idle" && <div className={styles.recordingStatus}>Bấm để ghi âm toàn bộ câu tiếng Trung</div>}
                {recordState === "recording" && <><div className={styles.recordingTimer}>00:{String(recordSeconds).padStart(2, "0")}</div><div className={styles.recordingStatus}>Đang ghi âm. Bấm lần nữa để chấm.</div></>}
                {recordState === "processing" && <div className={styles.processingArea}><div className={styles.spinner} /><div>Đang gửi audio để chấm phát âm...</div></div>}
                {micError && <strong className={styles.feedbackError}>{micError === "permission" ? "Cần quyền truy cập micro." : micError === "tooshort" ? "Bản ghi quá ngắn, hãy thử lại." : "Trình duyệt chưa hỗ trợ ghi âm."}</strong>}
                {pronunciation?.status === "unavailable" && <strong className={styles.feedbackError}>{pronunciation.message}</strong>}
              </motion.section>

              {pronunciation?.status === "scored" && (
                <motion.section className={styles.resultCard} variants={cardVariants}>
                  <div className={styles.inlineScore}><strong>{pronunciation.result.overallScore}</strong><span>Điểm tổng / 100</span></div>
                  {pronunciation.result.transcript && <p>Transcript: <strong>{pronunciation.result.transcript}</strong></p>}
                  {pronunciation.result.weakUnits.length > 0 && (
                    <div className={styles.charFeedback}>
                      {pronunciation.result.weakUnits.map((unit, index) => <span className={`${styles.charChip} ${unit.status === "correct" ? styles.charCorrect : unit.status === "needs_improvement" ? styles.charNeedsWork : styles.charIncorrect}`} key={`${unit.text}-${index}`}>{unit.text}</span>)}
                    </div>
                  )}
                  {pronunciation.result.suggestion && <p>{pronunciation.result.suggestion}</p>}
                </motion.section>
              )}
            </>
          )}
        </motion.div>
      </section>

      <aside className={styles.stickyStudyBar}>
        <div className={styles.stickyStudyInner}>
          <span>{answerVisible ? "Hoàn tất phát âm rồi chuyển câu tiếp theo" : "Dịch Việt sang Trung trước khi luyện nói"}</span>
          <div className={styles.actionRow}>
            {answerVisible && <button className={styles.secondaryButton} type="button" onClick={resetRecording}>Thử lại</button>}
            <button className={styles.primaryButton} type="button" onClick={answerVisible ? nextSentence : revealAnswer}>{answerVisible ? (current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành") : "Xem đáp án"} <SharedIcon name="arrowRight" size={15} /></button>
          </div>
        </div>
      </aside>
    </LessonLayout>
  )
}
