"use client"

import { use, useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { Sentence as APISentence } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type Phase = "pronunciation" | "dictation"
type RecState = "idle" | "recording" | "processing" | "recorded" | "result"
type DictStatus = "idle" | "success" | "error"
type MicError = "permission" | "unsupported" | "noaudio" | "tooshort" | null
type ScoreTier = "excellent" | "good" | "needs_work" | "bad"

interface WordResult {
  text: string
  expectedPinyin: string
  detectedPinyin: string
  score: number
  status: "correct" | "needs_improvement" | "incorrect"
  feedback: string
}

interface PronResult {
  overallScore: number
  pronunciationAccuracy: number
  toneAccuracy: number
  fluency: number
  passed: boolean
  words: WordResult[]
}

interface Sentence {
  chinese: string
  meaning: string
}

const EMPTY_SENTENCE: Sentence = { chinese: "", meaning: "" }

function mockCheckPronunciation(sentence: Sentence): Promise<PronResult> {
  return new Promise((resolve) =>
    setTimeout(() => {
      const base = Math.floor(Math.random() * 40) + 50
      const pronunciationAccuracy = Math.min(100, base + Math.floor(Math.random() * 20))
      const toneAccuracy = Math.min(100, base - 5 + Math.floor(Math.random() * 20))
      const fluency = Math.min(100, base + 5 + Math.floor(Math.random() * 20))
      const overallScore = Math.round((pronunciationAccuracy + toneAccuracy + fluency) / 3)
      const words = sentence.chinese.split("").map((text) => {
        const score = Math.floor(Math.random() * 60) + 30
        const status: WordResult["status"] = score >= 80 ? "correct" : score >= 60 ? "needs_improvement" : "incorrect"
        return {
          text,
          expectedPinyin: "-",
          detectedPinyin: "-",
          score,
          status,
          feedback: status === "correct" ? "Phát âm rõ ràng." : status === "needs_improvement" ? "Chú ý thêm đến thanh điệu." : "Nghe lại mẫu và đọc chậm hơn.",
        }
      })
      resolve({ overallScore, pronunciationAccuracy, toneAccuracy, fluency, passed: overallScore >= 70, words })
    }, 1500)
  )
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 90) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "needs_work"
  return "bad"
}

function getScoreColor(tier: ScoreTier): string {
  switch (tier) {
    case "excellent": return "#22c55e"
    case "good": return "#2563eb"
    case "needs_work": return "#f59e0b"
    case "bad": return "#ef4444"
  }
}

function getScoreLabel(tier: ScoreTier): string {
  switch (tier) {
    case "excellent": return "Phát âm xuất sắc"
    case "good": return "Phát âm tốt"
    case "needs_work": return "Cần cải thiện"
    case "bad": return "Thử lại"
  }
}

function ScoreRing({ score }: { score: number }) {
  const tier = getScoreTier(score)
  const color = getScoreColor(tier)
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const filled = circumference * (score / 100)
  return (
    <div className={styles.scoreRing}>
      <svg viewBox="0 0 128 128" width="150" height="150">
        <circle className={styles.scoreRingBg} cx="64" cy="64" r={radius} />
        <circle className={styles.scoreRingFill} cx="64" cy="64" r={radius} stroke={color} strokeDasharray={`${filled} ${circumference - filled}`} />
      </svg>
      <div className={styles.scoreValue}><span className={`${styles.scoreNumber} ${styles[`score${tier === "good" ? "Good" : tier === "excellent" ? "Excellent" : tier === "needs_work" ? "NeedsWork" : "Bad"}`]}`}>{score}</span><span className={styles.scorePercent}>/ 100</span></div>
    </div>
  )
}

function Waveform() {
  return <div className={`${styles.waveform} ${styles.wavePlaying}`}>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ height: 12 + Math.abs(Math.sin(i * 1.2)) * 40, animationDelay: `${i * 0.04}s` }} />)}</div>
}

function MicErrorCard({ micError, onStart, onRetry }: { micError: MicError; onStart: () => void; onRetry: () => void }) {
  if (!micError) return null
  const messages: Record<Exclude<MicError, null>, { title: string; desc: string; action: () => void; button: string }> = {
    permission: { title: "Cần quyền truy cập micro", desc: "Cho phép trình duyệt dùng micro.", action: onStart, button: "Cho phép micro" },
    unsupported: { title: "Trình duyệt chưa hỗ trợ", desc: "Dùng Chrome, Edge hoặc Safari.", action: () => window.open("https://support.google.com/chrome", "_blank"), button: "Hướng dẫn" },
    noaudio: { title: "Không phát hiện giọng nói", desc: "Đọc to hơn.", action: onRetry, button: "Ghi âm lại" },
    tooshort: { title: "Quá ngắn", desc: "Đọc đầy đủ câu.", action: onRetry, button: "Ghi âm lại" },
  }
  const info = messages[micError]
  return <div className={styles.errorCard}><div className={styles.errorIcon}><SharedIcon name="mic" size={24} /></div><div className={styles.errorTitle}>{info.title}</div><div className={styles.errorDesc}>{info.desc}</div><div className={styles.actionRow}><button className={styles.primaryButton} type="button" onClick={info.action}>{info.button}</button></div></div>
}

export default function PronunciationDictationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const router = useRouter()
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [phase, setPhase] = useState<Phase>("pronunciation")
  const [completedQ, setCompletedQ] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [recState, setRecState] = useState<RecState>("idle")
  const [micError, setMicError] = useState<MicError>(null)
  const [recTime, setRecTime] = useState(0)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<PronResult | null>(null)
  const [selectedWord, setSelectedWord] = useState<WordResult | null>(null)
  const [expEarned, setExpEarned] = useState(0)

  const [dictAnswer, setDictAnswer] = useState("")
  const [dictStatus, setDictStatus] = useState<DictStatus>("idle")
  const [dictPlaying, setDictPlaying] = useState(false)
  const [dictTime, setDictTime] = useState(0)
  const [dictSpeed, setDictSpeed] = useState(1)
  const [dictErrors, setDictErrors] = useState(0)
  const [dictAccuracy, setDictAccuracy] = useState(100)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const returnHref = `/lessons/${level}/${id}`

  useEffect(() => {
    let active = true
    api.get(`/sentences/${id}`)
      .then((res) => {
        if (!active) return
        setSentences((res.data.sentences as APISentence[]).map((s) => ({ chinese: s.sentenceZh, meaning: s.sentenceVi })))
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const sentence = sentences[currentQ] ?? EMPTY_SENTENCE
  const totalQ = sentences.length
  const totalItems = totalQ * 2
  const itemsDone = currentQ * 2 + (phase === "dictation" ? 1 : 0) + (phase === "pronunciation" && recState === "result" ? 1 : 0)
  const progressPct = totalItems ? (itemsDone / totalItems) * 100 : 0

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (playbackRef.current) clearInterval(playbackRef.current)
      if (synthRef.current) speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback((text: string, rate = 1) => {
    if (!window.speechSynthesis) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = rate
    utterance.volume = 1
    synthRef.current = utterance
    speechSynthesis.speak(utterance)
  }, [])

  const startTimer = useCallback(() => {
    setRecTime(0)
    timerRef.current = setInterval(() => setRecTime((time) => time + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleStartRecording = useCallback(() => {
    setMicError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("unsupported")
      return
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
      setRecState("recording")
      startTimer()
    }).catch(() => setMicError("permission"))
  }, [startTimer])

  const handleStopRecording = useCallback(() => {
    stopTimer()
    if (recTime < 2) {
      setMicError("tooshort")
      setRecState("idle")
      return
    }
    setRecState("processing")
    setTimeout(() => {
      setRecState("recorded")
      setPlaybackProgress(0)
      setIsPlaying(false)
    }, 600)
  }, [recTime, stopTimer])

  const handlePlaybackToggle = useCallback(() => {
    if (isPlaying) {
      if (playbackRef.current) clearInterval(playbackRef.current)
      setIsPlaying(false)
      return
    }
    setPlaybackProgress(0)
    setIsPlaying(true)
    speak(sentence.chinese, 1)
    let progress = 0
    playbackRef.current = setInterval(() => {
      progress += 2
      if (progress >= 100) {
        clearInterval(playbackRef.current!)
        setIsPlaying(false)
        setPlaybackProgress(100)
      } else {
        setPlaybackProgress(progress)
      }
    }, 80)
  }, [isPlaying, sentence.chinese, speak])

  const handleCheck = useCallback(async () => {
    setRecState("processing")
    const checked = await mockCheckPronunciation(sentence)
    setResult(checked)
    setRecState("result")
    if (checked.passed) setExpEarned((exp) => exp + 10)
  }, [sentence])

  const handlePronRetry = useCallback(() => {
    stopTimer()
    setResult(null)
    setSelectedWord(null)
    setRecState("idle")
    setRecTime(0)
    setPlaybackProgress(0)
    setIsPlaying(false)
    if (playbackRef.current) clearInterval(playbackRef.current)
  }, [stopTimer])

  const handlePronContinue = useCallback(() => {
    setResult(null)
    setSelectedWord(null)
    setRecState("idle")
    setRecTime(0)
    setPlaybackProgress(0)
    setIsPlaying(false)
    setPhase("dictation")
  }, [])

  const toggleDictPlay = useCallback(() => {
    if (!sentence || !("speechSynthesis" in window)) return
    if (dictPlaying) {
      window.speechSynthesis.cancel()
      setDictPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(sentence.chinese)
    utterance.lang = "zh-CN"
    utterance.rate = dictSpeed
    utterance.onend = () => setDictPlaying(false)
    utterance.onerror = () => setDictPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setDictTime(0)
    setDictPlaying(true)
  }, [dictPlaying, sentence, dictSpeed])

  const checkDictAnswer = useCallback(() => {
    if (!sentence || !dictAnswer.trim()) return
    const normalized = dictAnswer.trim().replace(/\s/g, "")
    const expected = sentence.chinese.replace(/\s/g, "")
    if (normalized === expected) {
      setDictStatus("success")
    } else {
      setDictStatus("error")
      setDictErrors((value) => value + 1)
      setDictAccuracy((value) => Math.max(value - 5, 0))
    }
  }, [dictAnswer, sentence])

  const nextSentence = useCallback(() => {
    setDictAnswer("")
    setDictStatus("idle")
    setDictPlaying(false)
    setDictTime(0)
    setPhase("pronunciation")
    window.speechSynthesis?.cancel()
    setCompletedQ((v) => v + 1)
    setCurrentQ((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!dictPlaying) return
    const timer = window.setInterval(() => {
      setDictTime((value) => Math.min(value + 0.1 * dictSpeed, 3))
    }, 100)
    return () => window.clearInterval(timer)
  }, [dictPlaying, dictSpeed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase === "dictation") {
        if (event.key === "Enter" && event.ctrlKey) { event.preventDefault(); toggleDictPlay(); return }
        if (event.key === "Enter" && dictStatus !== "success") { event.preventDefault(); checkDictAnswer() }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [phase, dictStatus, toggleDictPlay, checkDictAnswer])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (loading) return <LessonLayout><div className={styles.pronunciationContainer}><div className={styles.stateCard}><p>Đang tải...</p></div></div></LessonLayout>
  if (loadError || sentences.length === 0) return <LessonLayout><div className={styles.pronunciationContainer}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện tập."}</p><button className={styles.secondaryButton} type="button" onClick={() => router.push(returnHref)}>Quay lại bài học</button></div></div></LessonLayout>

  if (currentQ >= totalQ) {
    return (
      <LessonLayout>
        <section className={styles.pronunciationContainer}>
          <div className={styles.completionCard}>
            <h2 className={styles.completionTitle}>Hoàn thành luyện tập</h2>
            <div className={styles.completionStats}>
              <div className={styles.statRow}><span className={styles.statLabel}>Câu đã luyện</span><span className={styles.statValue}>{completedQ}</span></div>
              <div className={styles.statRow}><span className={styles.statLabel}>Độ chính xác</span><span className={styles.statValue}>{dictAccuracy}%</span></div>
            </div>
            <div className={styles.expReward}><SharedIcon name="star" size={16} />+50 EXP</div>
            <div className={styles.actionRow}><button className={styles.primaryButton} type="button" onClick={() => router.push(returnHref)}>Quay lại bài học</button></div>
          </div>
        </section>
      </LessonLayout>
    )
  }

  const currentItem = currentQ * 2 + (phase === "dictation" ? 1 : 0) + 1
  const phaseLabel = phase === "pronunciation" ? "Phát âm" : "Nghe chép"

  return (
    <LessonLayout>
      <section className={styles.pronunciationContainer}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <button className={styles.iconButton} type="button" onClick={() => router.push(returnHref)} aria-label="Thoát"><SharedIcon name="close" size={18} /></button>
            <div className={styles.studyHeaderTitle}><strong>{phaseLabel} {currentQ + 1} / {totalQ}</strong><span>{expEarned} EXP</span></div>
            {phase === "pronunciation" && <button className={styles.iconButton} type="button" onClick={() => speak(sentence.chinese, 1)} aria-label="Nghe mẫu"><SharedIcon name="volume2" size={18} /></button>}
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progressPct}%` } as CSSProperties}><i /></div>
        </header>

        {phase === "pronunciation" ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div className={styles.sentenceCard} variants={cardVariants}>
              <div className={styles.sentenceLabel}>Câu cần luyện phát âm</div>
              <div className={styles.chineseText}>{sentence.chinese}</div>
              <div className={styles.meaningText}>{sentence.meaning}</div>
              <div className={styles.audioActions}>
                <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} type="button" onClick={() => speak(sentence.chinese, 1)}><SharedIcon name="volume2" size={15} />Nghe mẫu</button>
                <button className={styles.audioBtn} type="button" onClick={() => speak(sentence.chinese, 0.75)}><SharedIcon name="clock" size={15} />0.75x</button>
              </div>
            </motion.div>

            <MicErrorCard micError={micError} onStart={handleStartRecording} onRetry={handlePronRetry} />

            {recState !== "result" && recState !== "processing" && (
              <motion.div className={styles.recordingArea} variants={cardVariants}>
                <div className={styles.micOuter}>
                  {recState === "recording" && <div className={styles.pulseRing} />}
                  <button className={`${styles.micButton} ${recState === "recording" ? styles.micRecording : recState === "recorded" ? styles.micRecorded : ""}`} onClick={recState === "idle" ? handleStartRecording : recState === "recording" ? handleStopRecording : undefined} disabled={recState === "recorded"} type="button" aria-label="Ghi âm">
                    <SharedIcon name={recState === "recording" ? "pause" : recState === "recorded" ? "check" : "mic"} size={36} />
                  </button>
                </div>
                {recState === "idle" && <div className={styles.recordingStatus}>Bấm để ghi âm</div>}
                {recState === "recording" && <><Waveform /><div className={styles.recordingTimer}>{String(Math.floor(recTime / 60)).padStart(2, "0")}:{String(recTime % 60).padStart(2, "0")}</div><div className={styles.recordingStatus}>Đang ghi âm</div></>}
                {recState === "recorded" && <><div className={styles.playbackBar}><button className={styles.playbackBtn} type="button" onClick={handlePlaybackToggle}><SharedIcon name={isPlaying ? "pause" : "play"} size={17} /></button><div className={styles.playbackTimeline}><div className={styles.playbackTimelineFill} style={{ "--progress": `${playbackProgress}%` } as CSSProperties} /></div><span>00:0{Math.max(1, Math.floor(recTime / 2))}</span></div><div className={styles.actionRow}><button className={styles.secondaryButton} type="button" onClick={handlePronRetry}>Ghi âm lại</button><button className={styles.primaryButton} type="button" onClick={handleCheck}>Chấm điểm</button></div></>}
              </motion.div>
            )}

            {recState === "processing" && <div className={`${styles.recordingArea} ${styles.processingArea}`}><div className={styles.spinner} /><div>Đang phân tích phát âm...</div></div>}

            {result && recState === "result" && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div className={styles.resultCard} variants={cardVariants}><ScoreRing score={result.overallScore} /><div className={`${styles.scoreLabel} ${styles[`score${getScoreTier(result.overallScore) === "excellent" ? "Excellent" : getScoreTier(result.overallScore) === "good" ? "Good" : getScoreTier(result.overallScore) === "needs_work" ? "NeedsWork" : "Bad"}`]}`}>{getScoreLabel(getScoreTier(result.overallScore))}</div></motion.div>
                <div className={styles.messageCard}>
                  <div className={styles.messageTitle}>{result.passed ? "Đạt yêu cầu" : "Tiếp tục luyện nhé"}</div>
                  <div className={styles.messageDesc}>{result.passed ? "Chuyển sang nghe chép." : "Nghe mẫu và ghi âm lại."}</div>
                  <div className={styles.actionRow}>
                    {!result.passed && <><button className={styles.primaryButton} type="button" onClick={() => speak(sentence.chinese, 1)}>Nghe mẫu</button><button className={styles.secondaryButton} type="button" onClick={handlePronRetry}>Ghi âm lại</button></>}
                    {result.passed && <><button className={styles.secondaryButton} type="button" onClick={handlePronRetry}>Thử lại</button><button className={styles.primaryButton} type="button" onClick={handlePronContinue}>Nghe chép →</button></>}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}><i><SharedIcon name="sparkles" size={22} /></i><div><span>NGHĨA TIẾNG VIỆT</span><h1>{sentence.meaning}</h1><p>Nghe và nhập lại câu tiếng Trung.</p></div></motion.section>

            <motion.section className={`${styles.practiceCard} ${styles.audioCard}`} variants={cardVariants}>
              <div className={`${styles.waveform} ${dictPlaying ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
              <button type="button" className={styles.playButton} onClick={toggleDictPlay} aria-label={dictPlaying ? "Tạm dừng" : "Phát"}><SharedIcon name={dictPlaying ? "pause" : "play"} size={28} /></button>
              <div className={styles.timeRow}><span>00:0{Math.floor(dictTime)}</span><span>00:03</span></div>
              <div className={styles.studyProgress} style={{ "--progress": `${(dictTime / 3) * 100}%` } as CSSProperties}><i /></div>
              <div className={styles.speedRow}><SharedIcon name="repeat" size={14} />{[0.75, 1, 1.25].map((value) => <button type="button" className={dictSpeed === value ? styles.activeSpeed : ""} onClick={() => setDictSpeed(value)} key={value}>{value}x</button>)}</div>
            </motion.section>

            <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${dictStatus === "success" ? styles.inputSuccess : dictStatus === "error" ? styles.inputError : ""}`} variants={cardVariants} initial="hidden" animate="visible">
              <label htmlFor="hanzi-answer-dict">NHẬP CHỮ HÁN</label>
              <textarea id="hanzi-answer-dict" value={dictAnswer} onChange={(event) => { setDictAnswer(event.target.value); setDictStatus("idle") }} placeholder="Gõ chữ Hán tại đây..." autoFocus />
              <p className={styles.inputHelp}><SharedIcon name="translate" size={14} />Nhập câu tiếng Trung bạn vừa nghe</p>
              {dictStatus === "success" && <strong className={styles.feedbackSuccess}>Chính xác.</strong>}
              {dictStatus === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {sentence.chinese}</strong>}
            </motion.section>

            <aside className={styles.stickyStudyBar}>
              <div className={styles.stickyStudyInner}>
                <span>{dictStatus === "success" ? "Sẵn sàng sang câu tiếp theo" : "Kiểm tra phần nhập tiếng Trung"}</span>
                {dictStatus === "success" ? <button className={styles.primaryButton} type="button" onClick={nextSentence}>{currentQ + 1 < totalQ ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={checkDictAnswer} disabled={!dictAnswer.trim()}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>}
              </div>
            </aside>

            <div className={styles.practiceStatus}>
              <div className={styles.dots}>{Array.from({ length: totalQ }, (_, index) => <i key={index} className={index < currentQ || (index === currentQ && dictStatus === "success") ? styles.dotDone : ""} />)}</div>
              <div className={styles.accuracyRow}><span><b>{dictErrors}</b> lỗi</span><span><strong>{dictAccuracy}%</strong> chính xác</span></div>
            </div>
          </motion.div>
        )}
      </section>
    </LessonLayout>
  )
}
