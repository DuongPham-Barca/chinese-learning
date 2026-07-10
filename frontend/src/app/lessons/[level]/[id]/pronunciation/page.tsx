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

type RecState = "idle" | "recording" | "processing" | "recorded" | "result"
type PageState = "practice" | "completion"
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
  pinyin: string
  meaning: string
}

const EMPTY_SENTENCE: Sentence = { chinese: "", pinyin: "", meaning: "" }

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
          feedback: status === "correct" ? "Pronunciation is clear." : status === "needs_improvement" ? "Pay attention to tone shape." : "Listen once more and slow down.",
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
    case "excellent": return "Excellent pronunciation"
    case "good": return "Good pronunciation"
    case "needs_work": return "Needs refinement"
    case "bad": return "Try again"
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

export default function PronunciationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>("practice")
  const [recState, setRecState] = useState<RecState>("idle")
  const [currentQ, setCurrentQ] = useState(0)
  const [micError, setMicError] = useState<MicError>(null)
  const [recTime, setRecTime] = useState(0)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [result, setResult] = useState<PronResult | null>(null)
  const [selectedWord, setSelectedWord] = useState<WordResult | null>(null)
  const [expEarned, setExpEarned] = useState(0)
  const [completedResults, setCompletedResults] = useState<PronResult[]>([])
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const returnHref = `/lessons/${level}/${id}`

  useEffect(() => {
    let active = true
    api.get(`/sentences/${id}`)
      .then((res) => {
        if (!active) return
        setSentences((res.data.sentences as APISentence[]).map((s) => ({ chinese: s.sentenceZh, pinyin: "", meaning: s.sentenceVi })))
      })
      .catch(() => {
        if (active) setLoadError("Khong the tai du lieu luyen phat am.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const sentence = sentences[currentQ] ?? EMPTY_SENTENCE
  const totalQ = sentences.length
  const progressPct = totalQ ? ((currentQ + (recState === "result" ? 1 : 0)) / totalQ) * 100 : 0

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (playbackRef.current) clearInterval(playbackRef.current)
      if (synthRef.current) speechSynthesis.cancel()
    }
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
    if (checked.passed) setExpEarned((exp) => exp + 10 + Math.floor(Math.random() * 5))
  }, [sentence])

  const handleRetry = useCallback(() => {
    stopTimer()
    setResult(null)
    setSelectedWord(null)
    setRecState("idle")
    setRecTime(0)
    setPlaybackProgress(0)
    setIsPlaying(false)
    if (playbackRef.current) clearInterval(playbackRef.current)
  }, [stopTimer])

  const handleContinue = useCallback(() => {
    if (result) setCompletedResults((prev) => [...prev, result])
    setResult(null)
    setSelectedWord(null)
    setRecState("idle")
    setRecTime(0)
    setPlaybackProgress(0)
    setIsPlaying(false)
    if (playbackRef.current) clearInterval(playbackRef.current)
    if (currentQ + 1 >= totalQ) {
      setPageState("completion")
    } else {
      setCurrentQ((question) => question + 1)
    }
  }, [currentQ, result, totalQ])

  const renderProgressDots = () => <div className={styles.progressDots}>{Array.from({ length: totalQ }, (_, i) => <span key={i} className={`${styles.dot} ${i === currentQ && recState !== "idle" ? styles.dotActive : ""} ${completedResults[i] !== undefined && i !== currentQ ? styles.dotCompleted : ""}`} />)}</div>

  const renderTopBar = () => (
    <header className={styles.studyHeader}>
      <div className={styles.studyHeaderInner}>
        <button className={styles.iconButton} type="button" onClick={() => router.push(returnHref)} aria-label="Exit"><SharedIcon name="close" size={18} /></button>
        <div className={styles.studyHeaderTitle}><strong>Pronunciation {currentQ + 1} / {totalQ}</strong><span>{expEarned} EXP</span></div>
        <button className={styles.iconButton} type="button" onClick={() => speak(sentence.chinese, 1)} aria-label="Play sample"><SharedIcon name="volume2" size={18} /></button>
      </div>
      <div className={styles.studyProgress} style={{ "--progress": `${progressPct}%` } as CSSProperties}><i /></div>
    </header>
  )

  const renderSentenceCard = () => (
    <motion.div className={styles.sentenceCard} variants={cardVariants}>
      <div className={styles.sentenceLabel}>Sentence practice</div>
      <div className={styles.chineseText}>{sentence.chinese}</div>
      {sentence.pinyin && <div className={styles.pinyinText}>{sentence.pinyin}</div>}
      <div className={styles.meaningText}>{sentence.meaning}</div>
      <div className={styles.audioActions}>
        <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} type="button" onClick={() => speak(sentence.chinese, 1)}><SharedIcon name="volume2" size={15} />Sample</button>
        <button className={styles.audioBtn} type="button" onClick={() => speak(sentence.chinese, 1)}><SharedIcon name="repeat" size={15} />Repeat</button>
        <button className={styles.audioBtn} type="button" onClick={() => speak(sentence.chinese, 0.75)}><SharedIcon name="clock" size={15} />0.75x</button>
      </div>
    </motion.div>
  )

  const renderRecordingArea = () => {
    if (recState === "result") return null
    if (recState === "processing") return <div className={`${styles.recordingArea} ${styles.processingArea}`}><div className={styles.spinner} /><div>Analyzing pronunciation...</div></div>
    const isRecorded = recState === "recorded"
    return (
      <motion.div className={styles.recordingArea} variants={cardVariants}>
        <div className={styles.micOuter}>
          {recState === "recording" && <div className={styles.pulseRing} />}
          <button className={`${styles.micButton} ${recState === "recording" ? styles.micRecording : isRecorded ? styles.micRecorded : ""}`} onClick={recState === "idle" ? handleStartRecording : recState === "recording" ? handleStopRecording : undefined} disabled={isRecorded} type="button" aria-label={recState === "idle" ? "Start recording" : recState === "recording" ? "Stop recording" : "Recorded"}>
            <SharedIcon name={recState === "recording" ? "pause" : isRecorded ? "check" : "mic"} size={36} />
          </button>
        </div>
        {recState === "idle" && <div className={styles.recordingStatus}>Press to record</div>}
        {recState === "recording" && <><Waveform /><div className={styles.recordingTimer}>{String(Math.floor(recTime / 60)).padStart(2, "0")}:{String(recTime % 60).padStart(2, "0")}</div><div className={styles.recordingStatus}>Recording. Press again to stop.</div></>}
        {isRecorded && <><div className={styles.playbackBar}><button className={styles.playbackBtn} type="button" onClick={handlePlaybackToggle}><SharedIcon name={isPlaying ? "pause" : "play"} size={17} /></button><div className={styles.playbackTimeline}><div className={styles.playbackTimelineFill} style={{ "--progress": `${playbackProgress}%` } as CSSProperties} /></div><span>00:0{Math.max(1, Math.floor(recTime / 2))}</span></div><div className={styles.actionRow}><button className={styles.secondaryButton} type="button" onClick={handleRetry}>Record Again</button><button className={styles.primaryButton} type="button" onClick={handleCheck}>Score</button></div></>}
      </motion.div>
    )
  }

  const renderError = () => {
    if (!micError) return null
    const messages: Record<Exclude<MicError, null>, { title: string; desc: string; action: () => void; button: string }> = {
      permission: { title: "Microphone permission needed", desc: "Allow microphone access in your browser to practice pronunciation.", action: handleStartRecording, button: "Allow Microphone" },
      unsupported: { title: "Recording is not supported", desc: "Use a modern Chrome, Edge, or Safari browser for recording.", action: () => window.open("https://support.google.com/chrome", "_blank"), button: "Open Help" },
      noaudio: { title: "No voice detected", desc: "Read louder and more clearly.", action: handleRetry, button: "Record Again" },
      tooshort: { title: "Recording too short", desc: "Read the full sentence before stopping.", action: handleRetry, button: "Record Again" },
    }
    const errorInfo = messages[micError]
    return <div className={styles.errorCard}><div className={styles.errorIcon}><SharedIcon name="mic" size={24} /></div><div className={styles.errorTitle}>{errorInfo.title}</div><div className={styles.errorDesc}>{errorInfo.desc}</div><div className={styles.actionRow}><button className={styles.primaryButton} type="button" onClick={errorInfo.action}>{errorInfo.button}</button></div></div>
  }

  const renderResult = () => {
    if (!result || recState !== "result") return null
    const tier = getScoreTier(result.overallScore)
    const passed = result.overallScore >= 70
    return (
      <>
        <motion.div className={styles.resultCard} variants={cardVariants}><ScoreRing score={result.overallScore} /><div className={`${styles.scoreLabel} ${styles[`score${tier === "excellent" ? "Excellent" : tier === "good" ? "Good" : tier === "needs_work" ? "NeedsWork" : "Bad"}`]}`}>{getScoreLabel(tier)}</div></motion.div>
        <div className={styles.detailScores}>
          <div className={styles.detailCard}><div className={styles.detailIcon}><SharedIcon name="target" size={18} /></div><div className={styles.detailLabel}>Accuracy</div><div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.pronunciationAccuracy)) }}>{result.pronunciationAccuracy}%</div></div>
          <div className={styles.detailCard}><div className={styles.detailIcon}><SharedIcon name="headphones" size={18} /></div><div className={styles.detailLabel}>Tone</div><div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.toneAccuracy)) }}>{result.toneAccuracy}%</div></div>
          <div className={styles.detailCard}><div className={styles.detailIcon}><SharedIcon name="zap" size={18} /></div><div className={styles.detailLabel}>Fluency</div><div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.fluency)) }}>{result.fluency}%</div></div>
        </div>
        <div className={styles.sentenceCard}>
          <div className={styles.sentenceLabel}>Character feedback</div>
          <div className={styles.charFeedback}>{result.words.map((word, index) => <span key={`${word.text}-${index}`} className={`${styles.charChip} ${word.status === "correct" ? styles.charCorrect : word.status === "needs_improvement" ? styles.charNeedsWork : styles.charIncorrect}`} onClick={() => setSelectedWord(selectedWord?.text === word.text && selectedWord?.score === word.score ? null : word)}>{word.text}</span>)}</div>
          {selectedWord && <div className={styles.charDetail}><div className={styles.charDetailWord}>{selectedWord.text}</div><div className={styles.charDetailRow}><span className={styles.charDetailLabel}>Expected:</span><span>{selectedWord.expectedPinyin}</span></div><div className={styles.charDetailRow}><span className={styles.charDetailLabel}>Detected:</span><span>{selectedWord.detectedPinyin}</span></div><div className={styles.charDetailRow}><span className={styles.charDetailLabel}>Score:</span><span>{selectedWord.score}%</span></div><div className={styles.charDetailRow}><span className={styles.charDetailLabel}>Hint:</span><span>{selectedWord.feedback}</span></div><button className={styles.secondaryButton} type="button" onClick={() => setSelectedWord(null)}>Close</button></div>}
        </div>
        <div className={styles.messageCard}><div className={styles.messageTitle}>{passed ? "Passed" : "Keep practicing"}</div><div className={styles.messageDesc}>{passed ? "Your pronunciation is clear enough to continue." : "Listen to the sample and record the sentence again."}</div>{passed && <div className={styles.expToast}><SharedIcon name="star" size={15} />+10 EXP</div>}<div className={styles.actionRow}>{!passed && <><button className={styles.primaryButton} type="button" onClick={() => speak(sentence.chinese, 1)}>Sample</button><button className={styles.secondaryButton} type="button" onClick={handleRetry}>Record Again</button></>} {passed && <><button className={styles.secondaryButton} type="button" onClick={handleRetry}>Try Again</button><button className={styles.primaryButton} type="button" onClick={handleContinue}>Continue</button></>}</div></div>
        {renderProgressDots()}
      </>
    )
  }

  const renderCompletion = () => {
    const avgScore = completedResults.length > 0 ? Math.round(completedResults.reduce((sum, item) => sum + item.overallScore, 0) / completedResults.length) : 0
    return (
      <div className={styles.completionCard}>
        <h2 className={styles.completionTitle}>Pronunciation complete</h2>
        <div className={styles.completionStats}><div className={styles.statRow}><span className={styles.statLabel}>Sentences practiced</span><span className={styles.statValue}>{completedResults.length}</span></div><div className={styles.statRow}><span className={styles.statLabel}>Average score</span><span className={styles.statValue}>{avgScore}%</span></div><div className={styles.statRow}><span className={styles.statLabel}>Recordings</span><span className={styles.statValue}>{completedResults.length * 2}</span></div></div>
        <div className={styles.expReward}><SharedIcon name="star" size={16} />+50 EXP</div>
        <div className={styles.actionRow}><button className={styles.primaryButton} type="button" onClick={() => router.push(`/lessons/${level}/${id}/dictation`)}>Continue</button><button className={styles.secondaryButton} type="button" onClick={() => { setPageState("practice"); setCurrentQ(0); setCompletedResults([]); setExpEarned(0); setRecState("idle"); setResult(null) }}>Practice Again</button></div>
      </div>
    )
  }

  if (loading) return <LessonLayout><div className={styles.pronunciationContainer}><div className={styles.stateCard}><p>Dang tai du lieu luyen phat am...</p></div></div></LessonLayout>
  if (loadError || sentences.length === 0) return <LessonLayout><div className={styles.pronunciationContainer}><div className={styles.stateCard}><p>{loadError || "Bai hoc chua co cau luyen tap nao."}</p><button className={styles.secondaryButton} type="button" onClick={() => router.push(returnHref)}>Back to lesson</button></div></div></LessonLayout>

  return (
    <LessonLayout>
      <section className={styles.pronunciationContainer}>
        {renderTopBar()}
        {pageState === "completion" ? renderCompletion() : <motion.div variants={containerVariants} initial="hidden" animate="visible">{renderSentenceCard()}{renderError()}{renderRecordingArea()}{renderResult()}</motion.div>}
      </section>
    </LessonLayout>
  )
}
