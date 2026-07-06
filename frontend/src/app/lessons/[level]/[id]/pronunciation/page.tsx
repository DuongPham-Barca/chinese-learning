"use client"

import { use, useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import styles from "./pronunciation.module.css"

/* ---------- types ---------- */
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

/* ---------- mock data ---------- */
const SENTENCES: Sentence[] = [
  { chinese: "我是学生。", pinyin: "wǒ shì xué shēng", meaning: "Tôi là sinh viên." },
  { chinese: "你叫什么名字？", pinyin: "nǐ jiào shén me míng zì", meaning: "Bạn tên là gì?" },
  { chinese: "我很喜欢中文。", pinyin: "wǒ hěn xǐ huān zhōng wén", meaning: "Tôi rất thích tiếng Trung." },
  { chinese: "今天天气很好。", pinyin: "jīn tiān tiān qì hěn hǎo", meaning: "Hôm nay thời tiết rất đẹp." },
  { chinese: "我要去中国。", pinyin: "wǒ yào qù zhōng guó", meaning: "Tôi muốn đi Trung Quốc." },
]

function mockCheckPronunciation(sentence: Sentence): Promise<PronResult> {
  return new Promise((r) =>
    setTimeout(() => {
      const base = Math.floor(Math.random() * 40) + 50
      const prAcc = Math.min(100, base + Math.floor(Math.random() * 20))
      const toneAcc = Math.min(100, base - 5 + Math.floor(Math.random() * 20))
      const flu = Math.min(100, base + 5 + Math.floor(Math.random() * 20))
      const overall = Math.round((prAcc + toneAcc + flu) / 3)
      const tokens = sentence.chinese.split("")
      const words: WordResult[] = tokens.map((ch) => {
        const s = Math.floor(Math.random() * 60) + 30
        const status: WordResult["status"] = s >= 80 ? "correct" : s >= 60 ? "needs_improvement" : "incorrect"
        return {
          text: ch,
          expectedPinyin: "—",
          detectedPinyin: "—",
          score: s,
          status,
          feedback:
            status === "correct"
              ? "Phát âm chính xác."
              : status === "needs_improvement"
                ? "Cần chú ý thanh điệu."
                : "Cần luyện tập thêm âm này.",
        }
      })
      r({
        overallScore: overall,
        pronunciationAccuracy: prAcc,
        toneAccuracy: toneAcc,
        fluency: flu,
        passed: overall >= 70,
        words,
      })
    }, 1500)
  )
}

/* ---------- helpers ---------- */
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

/* ---------- ScoreRing ---------- */
function ScoreRing({ score }: { score: number }) {
  const tier = getScoreTier(score)
  const color = getScoreColor(tier)
  const r = 58
  const circ = 2 * Math.PI * r
  const pct = score / 100
  return (
    <div className={styles.scoreRing}>
      <svg viewBox="0 0 128 128" width="140" height="140">
        <circle className={styles.scoreRingBg} cx="64" cy="64" r={r} />
        <circle
          className={styles.scoreRingFill}
          cx="64" cy="64" r={r}
          stroke={color}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        />
      </svg>
      <div className={styles.scoreValue}>
        <span className={`${styles.scoreNumber} ${styles[`score${tier === "good" ? "Good" : tier === "excellent" ? "Excellent" : tier === "needs_work" ? "NeedsWork" : "Bad"}`]}`}>
          {score}
        </span>
        <span className={styles.scorePercent}>/ 100</span>
      </div>
    </div>
  )
}

/* ---------- Waveform ---------- */
function Waveform() {
  const bars = Array.from({ length: 24 }, (_, i) => {
    const delay = i * 0.08
    const h = 8 + Math.sin(i * 1.2) * 14 + 14
    return { delay, h }
  })
  return (
    <div className={styles.waveform}>
      {bars.map((b, i) => (
        <span
          key={i}
          className={styles.waveformBar}
          style={{
            height: b.h,
            animationDelay: `${b.delay}s`,
            opacity: 0.5 + Math.sin(i * 0.8) * 0.3,
          }}
        />
      ))}
    </div>
  )
}

/* ---------- Main Page ---------- */
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const hasSpokenRef = useRef(false)

  const sentence = SENTENCES[currentQ]
  const totalQ = SENTENCES.length
  const progressPct = ((currentQ + (recState === "result" ? 1 : 0)) / totalQ) * 100

  /* ---- cleanup ---- */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (playbackRef.current) clearInterval(playbackRef.current)
      if (synthRef.current) speechSynthesis.cancel()
    }
  }, [])

  /* ---- timer ---- */
  const startTimer = useCallback(() => {
    setRecTime(0)
    timerRef.current = setInterval(() => setRecTime((t) => t + 1), 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /* ---- speech ---- */
  const speak = useCallback(
    (text: string, rate = 1) => {
      if (!window.speechSynthesis) return
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "zh-CN"
      u.rate = rate
      u.volume = 1
      synthRef.current = u
      speechSynthesis.speak(u)
    },
    []
  )

  /* ---- record handlers ---- */
  const handleStartRecording = useCallback(() => {
    setMicError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("unsupported")
      return
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        setRecState("recording")
        startTimer()
        hasSpokenRef.current = false
      })
      .catch(() => setMicError("permission"))
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
  }, [stopTimer, recTime])

  const handlePlaybackToggle = useCallback(() => {
    if (isPlaying) {
      if (playbackRef.current) clearInterval(playbackRef.current)
      setIsPlaying(false)
    } else {
      setPlaybackProgress(0)
      setIsPlaying(true)
      speak(sentence.chinese, 1)
      let p = 0
      playbackRef.current = setInterval(() => {
        p += 2
        if (p >= 100) {
          clearInterval(playbackRef.current!)
          setIsPlaying(false)
          setPlaybackProgress(100)
        } else {
          setPlaybackProgress(p)
        }
      }, 80)
    }
  }, [isPlaying, speak, sentence])

  const handleCheck = useCallback(async () => {
    setRecState("processing")
    const res = await mockCheckPronunciation(sentence)
    setResult(res)
    setRecState("result")
    if (res.passed) {
      const exp = 10 + Math.floor(Math.random() * 5)
      setExpEarned((e) => e + exp)
    }
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
    if (result) {
      setCompletedResults((prev) => [...prev, result])
    }
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
      setCurrentQ((q) => q + 1)
    }
  }, [currentQ, result])

  /* ---- playback cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- render helpers ---- */
  const renderProgressDots = () => (
    <div className={styles.progressDots}>
      {Array.from({ length: totalQ }, (_, i) => {
        const isCompleted = completedResults[i] !== undefined && i !== currentQ
        return (
          <span
            key={i}
            className={`${styles.dot} ${i === currentQ && recState !== "idle" ? styles.dotActive : ""} ${isCompleted ? styles.dotCompleted : ""}`}
          />
        )
      })}
    </div>
  )

  const renderTopBar = () => (
    <>
      <div className={styles.topBar}>
        <button className={styles.exitBtn} onClick={() => router.back()} aria-label="Exit">
          ✕
        </button>
        <span className={styles.progressLabel}>Phát âm {currentQ + 1} / {totalQ}</span>
        <span className={styles.expLabel}>
          <span className={styles.expIcon}>⭐</span> {expEarned} EXP
        </span>
      </div>
      <div className={styles.progressTrackOuter}>
        <div className={styles.progressTrackInner} style={{ width: `${progressPct}%` }} />
      </div>
    </>
  )

  const renderSentenceCard = () => (
    <div className={styles.sentenceCard}>
      <div className={styles.sentenceLabel}>Câu cần luyện</div>
      <div className={styles.chineseText}>{sentence.chinese}</div>
      <div className={styles.pinyinText}>{sentence.pinyin}</div>
      <div className={styles.meaningText}>{sentence.meaning}</div>
      <div className={styles.audioActions}>
        <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} onClick={() => speak(sentence.chinese, 1)}>
          🔊 Nghe mẫu
        </button>
        <button className={styles.audioBtn} onClick={() => speak(sentence.chinese, 1)}>
          🔁 Nghe lại
        </button>
        <button className={styles.audioBtn} onClick={() => speak(sentence.chinese, 0.75)}>
          🐢 Nghe chậm 0.75x
        </button>
      </div>
    </div>
  )

  const renderRecordingArea = () => {
    if (recState === "result") return null

    if (recState === "processing") {
      return (
        <div className={`${styles.recordingArea} ${styles.processingArea}`}>
          <div className={styles.spinner} />
          <div className={styles.processingText}>Đang phân tích phát âm...</div>
        </div>
      )
    }

    const isRecorded = recState === "recorded"

    return (
      <div className={styles.recordingArea}>
        <div className={styles.micOuter}>
          {recState === "recording" && <div className={styles.pulseRing} />}
          <button
            className={`${styles.micButton} ${recState === "idle" ? styles.micIdle : recState === "recording" ? styles.micRecording : styles.micRecorded}`}
            onClick={recState === "idle" ? handleStartRecording : recState === "recording" ? handleStopRecording : undefined}
            disabled={isRecorded}
            aria-label={recState === "idle" ? "Bắt đầu ghi âm" : recState === "recording" ? "Dừng ghi âm" : "Đã ghi âm"}
          >
            {recState === "idle" ? "🎤" : recState === "recording" ? "⏹️" : "✅"}
          </button>
        </div>

        {recState === "idle" && (
          <div className={styles.recordingStatus}>Bấm để ghi âm</div>
        )}

        {recState === "recording" && (
          <>
            <Waveform />
            <div className={styles.recordingTimer}>
              {String(Math.floor(recTime / 60)).padStart(2, "0")}:{String(recTime % 60).padStart(2, "0")}
            </div>
            <div className={styles.recordingStatus}>Đang ghi âm... Bấm để dừng</div>
          </>
        )}

        {isRecorded && (
          <>
            <div className={styles.playbackBar}>
              <button className={styles.playbackBtn} onClick={handlePlaybackToggle}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <div className={styles.playbackTimeline}>
                <div className={styles.playbackTimelineFill} style={{ width: `${playbackProgress}%` }} />
              </div>
              <span className={styles.playbackDuration}>00:0{Math.max(1, Math.floor(recTime / 2))}</span>
            </div>
            <div className={styles.actionRow}>
              <button className={`${styles.actionBtn} ${styles.actionBtnOutline}`} onClick={handleRetry}>
                Ghi âm lại
              </button>
              <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleCheck}>
                Chấm điểm
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderError = () => {
    if (!micError) return null
    const messages: Record<string, { title: string; desc: string; btn: string; action: () => void }> = {
      permission: {
        title: "Không thể truy cập micro",
        desc: "Vui lòng cho phép truy cập microphone trong trình duyệt để luyện phát âm.",
        btn: "Cho phép micro",
        action: handleStartRecording,
      },
      unsupported: {
        title: "Trình duyệt chưa hỗ trợ ghi âm",
        desc: "Vui lòng sử dụng trình duyệt Chrome, Edge hoặc Safari mới nhất.",
        btn: "Hướng dẫn khắc phục",
        action: () => window.open("https://support.google.com/chrome", "_blank"),
      },
      noaudio: {
        title: "Không phát hiện giọng nói",
        desc: "Hãy đọc to và rõ ràng hơn.",
        btn: "Ghi âm lại",
        action: handleRetry,
      },
      tooshort: {
        title: "Bản ghi quá ngắn",
        desc: "Hãy đọc đầy đủ câu trước khi dừng.",
        btn: "Ghi âm lại",
        action: handleRetry,
      },
    }
    const err = messages[micError]
    return (
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>{err.title}</div>
        <div className={styles.errorDesc}>{err.desc}</div>
        <button className={styles.errorBtn} onClick={err.action}>
          {err.btn}
        </button>
      </div>
    )
  }

  const renderResult = () => {
    if (!result || recState !== "result") return null
    const tier = getScoreTier(result.overallScore)
    const passed = result.overallScore >= 70

    return (
      <>
        {/* Score Ring */}
        <div className={styles.resultCard}>
          <ScoreRing score={result.overallScore} />
          <div className={`${styles.scoreLabel} ${styles[`score${tier === "excellent" ? "Excellent" : tier === "good" ? "Good" : tier === "needs_work" ? "NeedsWork" : "Bad"}`]}`}>
            {getScoreLabel(tier)}
          </div>
        </div>

        {/* Detail Scores */}
        <div className={styles.detailScores}>
          <div className={styles.detailCard}>
            <div className={styles.detailIcon}>🎯</div>
            <div className={styles.detailLabel}>Độ chính xác</div>
            <div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.pronunciationAccuracy)) }}>
              {result.pronunciationAccuracy}%
            </div>
          </div>
          <div className={styles.detailCard}>
            <div className={styles.detailIcon}>🎵</div>
            <div className={styles.detailLabel}>Thanh điệu</div>
            <div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.toneAccuracy)) }}>
              {result.toneAccuracy}%
            </div>
          </div>
          <div className={styles.detailCard}>
            <div className={styles.detailIcon}>⚡</div>
            <div className={styles.detailLabel}>Lưu loát</div>
            <div className={styles.detailValue} style={{ color: getScoreColor(getScoreTier(result.fluency)) }}>
              {result.fluency}%
            </div>
          </div>
        </div>

        {/* Character Feedback */}
        <div className={styles.sentenceCard}>
          <div className={styles.sentenceLabel}>Phân tích từng từ</div>
          <div className={styles.charFeedback}>
            {result.words.map((w, i) => (
              <span
                key={i}
                className={`${styles.charChip} ${
                  w.status === "correct"
                    ? styles.charCorrect
                    : w.status === "needs_improvement"
                      ? styles.charNeedsWork
                      : styles.charIncorrect
                }`}
                onClick={() => setSelectedWord(selectedWord?.text === w.text && selectedWord?.expectedPinyin === w.expectedPinyin ? null : w)}
              >
                {w.text}
              </span>
            ))}
          </div>

          {selectedWord && (
            <div className={styles.charDetail}>
              <div className={styles.charDetailWord}>{selectedWord.text}</div>
              <div className={styles.charDetailRow}>
                <span className={styles.charDetailLabel}>Mong đợi:</span>
                <span className={styles.charDetailValue}>{selectedWord.expectedPinyin}</span>
              </div>
              <div className={styles.charDetailRow}>
                <span className={styles.charDetailLabel}>Phát hiện:</span>
                <span className={`${styles.charDetailValue} ${styles.charDetailValueWrong}`}>{selectedWord.detectedPinyin}</span>
              </div>
              <div className={styles.charDetailRow}>
                <span className={styles.charDetailLabel}>Điểm:</span>
                <span
                  className={`${styles.charDetailValue} ${selectedWord.score >= 70 ? styles.charDetailValueCorrect : styles.charDetailValueWrong}`}
                >
                  {selectedWord.score}%
                </span>
              </div>
              <div className={styles.charDetailRow}>
                <span className={styles.charDetailLabel}>Trạng thái:</span>
                <span
                  className={styles.charDetailValue}
                  style={{
                    color:
                      selectedWord.status === "correct"
                        ? "#22c55e"
                        : selectedWord.status === "needs_improvement"
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                >
                  {selectedWord.status === "correct"
                    ? "Chính xác"
                    : selectedWord.status === "needs_improvement"
                      ? "Cần cải thiện"
                      : "Chưa đúng"}
                </span>
              </div>
              <div className={styles.charDetailRow}>
                <span className={styles.charDetailLabel}>Gợi ý:</span>
                <span className={styles.charDetailValue}>{selectedWord.feedback}</span>
              </div>
              <button className={styles.charDetailClose} onClick={() => setSelectedWord(null)}>
                Đóng
              </button>
            </div>
          )}
        </div>

        {/* Message Card */}
        <div className={styles.messageCard}>
          <div className={styles.messageEmoji}>{result.overallScore >= 70 ? "🎉" : result.overallScore >= 50 ? "👍" : "💪"}</div>
          <div className={styles.messageTitle}>
            {result.overallScore >= 70
              ? "Tuyệt vời!"
              : result.overallScore >= 50
                ? "Khá tốt!"
                : "Cố lên!"}
          </div>
          <div className={styles.messageDesc}>
            {result.overallScore >= 70
              ? "Bạn phát âm câu này rất tốt."
              : result.overallScore >= 50
                ? "Hãy luyện thêm thanh điệu để tự nhiên hơn."
                : "Hãy nghe mẫu và đọc chậm lại."}
          </div>

          {passed && <div className={styles.expToast}>⭐ +10 EXP</div>}

          <div className={styles.actionRow}>
            {!passed && (
              <>
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => speak(sentence.chinese, 1)}>
                  🔊 Nghe mẫu
                </button>
                <button className={`${styles.actionBtn} ${styles.actionBtnOutline}`} onClick={handleRetry}>
                  Ghi âm lại
                </button>
              </>
            )}
            {passed && (
              <>
                <button className={`${styles.actionBtn} ${styles.actionBtnOutline}`} onClick={handleRetry}>
                  Thử lại
                </button>
                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleContinue}>
                  Tiếp tục
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress Dots */}
        {renderProgressDots()}
      </>
    )
  }

  const renderCompletion = () => {
    const avgScore =
      completedResults.length > 0
        ? Math.round(completedResults.reduce((s, r) => s + r.overallScore, 0) / completedResults.length)
        : 0
    const totalRecs = completedResults.length * 2

    return (
      <div className={styles.completionScreen}>
        <div className={styles.completionEmoji}>🎉</div>
        <h2 className={styles.completionTitle}>Hoàn thành luyện phát âm!</h2>

        <div className={styles.completionStats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Câu đã luyện</span>
            <span className={styles.statValue}>{completedResults.length}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Điểm trung bình</span>
            <span className={styles.statValue}>{avgScore}%</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Số lần ghi âm</span>
            <span className={styles.statValue}>{totalRecs}</span>
          </div>
        </div>

        <div className={styles.expReward}>⭐ +50 EXP</div>

        <div className={styles.actionRow}>
          <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => router.push(`/lessons/${level}/${id}/dictation`)}>
            Tiếp tục bài học
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
            onClick={() => {
              setPageState("practice")
              setCurrentQ(0)
              setCompletedResults([])
              setExpEarned(0)
              setRecState("idle")
              setResult(null)
            }}
          >
            Luyện lại phát âm
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className={styles.page}>
      {renderTopBar()}

      {pageState === "completion" ? (
        renderCompletion()
      ) : (
        <div className={styles.container}>
          {renderSentenceCard()}
          {renderError()}
          {renderRecordingArea()}
          {renderResult()}
        </div>
      )}
    </main>
  )
}
