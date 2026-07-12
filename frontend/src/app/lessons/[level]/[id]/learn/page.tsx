"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { LessonDetail, Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type Phase = "flashcard" | "pronunciation"
type RecordState = "idle" | "recording" | "processing" | "scored"

type SavedLearnProgress = {
  index: number
  phase: Phase
}

function stageProgressKey(lessonId: string) {
  return `lesson-stage-progress:${lessonId}`
}

function learnProgressKey(lessonId: string) {
  return `lesson-learn-progress:${lessonId}`
}

function saveStageComplete(lessonId: string) {
  const current = JSON.parse(window.localStorage.getItem(stageProgressKey(lessonId)) || "{}")
  window.localStorage.setItem(stageProgressKey(lessonId), JSON.stringify({ ...current, learn: true }))
}

function readSavedProgress(lessonId: string): SavedLearnProgress {
  if (typeof window === "undefined") return { index: 0, phase: "flashcard" }
  try {
    const saved = JSON.parse(window.localStorage.getItem(learnProgressKey(lessonId)) || "{}")
    if (typeof saved.index === "number" && (saved.phase === "flashcard" || saved.phase === "pronunciation")) return saved
  } catch {}
  return { index: 0, phase: "flashcard" }
}

function mockPronunciationScore(word: Vocabulary) {
  const seed = Array.from(word.hanzi).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const score = 68 + (seed % 28)
  return Math.min(score, 98)
}

export default function LearnNewWordsPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<Phase>("flashcard")
  const [flipped, setFlipped] = useState(false)
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [score, setScore] = useState<number | null>(null)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedProgress(id)
      setCurrent(saved.index)
      setPhase(saved.phase)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [id])

  useEffect(() => {
    let active = true
    Promise.all([
      api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`),
      api.get<{ lesson: LessonDetail }>(`/lessons/${id}`),
    ])
      .then(([vocabResponse, lessonResponse]) => {
        if (!active) return
        setVocabulary(vocabResponse.data.vocabulary)
        setLesson(lessonResponse.data.lesson)
      })
      .catch(() => {
        if (active) setError("Không thể tải dữ liệu học từ mới.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    window.localStorage.setItem(learnProgressKey(id), JSON.stringify({ index: current, phase }))
  }, [current, id, phase])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    window.speechSynthesis?.cancel()
  }, [])

  const total = vocabulary.length
  const word = vocabulary[current]
  const completedUnits = Math.min(current * 2 + (phase === "pronunciation" ? 1 : 0), total * 2)
  const progress = total ? Math.round((completedUnits / (total * 2)) * 100) : 0
  const fallbackSentence = lesson?.sentences[current % Math.max(lesson.sentences.length, 1)]
  const example = word?.example || fallbackSentence?.sentenceZh || `${word?.hanzi || ""}。`
  const exampleMeaning = word?.exampleMeaning || fallbackSentence?.sentenceVi || "Ví dụ sử dụng từ trong ngữ cảnh."

  const speak = useCallback((text: string, rate = 0.85) => {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = rate
    window.speechSynthesis.speak(utterance)
  }, [])

  const goPronunciation = useCallback(() => {
    setPhase("pronunciation")
    setFlipped(false)
    setRecordState("idle")
    setScore(null)
    setRecordSeconds(0)
  }, [])

  const goNextWord = useCallback(() => {
    if (current + 1 >= total) {
      saveStageComplete(id)
      window.localStorage.removeItem(learnProgressKey(id))
      setCurrent(total)
      return
    }
    setCurrent((value) => value + 1)
    setPhase("flashcard")
    setFlipped(false)
    setRecordState("idle")
    setScore(null)
    setRecordSeconds(0)
  }, [current, id, total])

  const startRecording = useCallback(() => {
    setRecordState("recording")
    setRecordSeconds(0)
    timerRef.current = setInterval(() => setRecordSeconds((value) => value + 1), 1000)
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setRecordState("processing")
    window.setTimeout(() => {
      setScore(word ? mockPronunciationScore(word) : 0)
      setRecordState("scored")
    }, 900)
  }, [word])

  const retry = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setRecordState("idle")
    setRecordSeconds(0)
    setScore(null)
  }, [])

  const averageScore = useMemo(() => score ?? 0, [score])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải từ mới...</p></div></div></LessonLayout>
  if (error || total === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa có từ vựng."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= total) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.completionCard}>
          <div className={styles.completionMark}><SharedIcon name="check" size={34} /></div>
          <h2 className={styles.completionTitle}>Bạn đã hoàn thành phần Học từ mới.</h2>
          <p>Đã học {total} từ và luyện phát âm ngay sau từng từ.</p>
          <div className={styles.actionRow}><Link className={styles.primaryButton} href={`/lessons/${level}/${id}/practice`}>Tiếp tục luyện tập <SharedIcon name="arrowRight" size={16} /></Link></div>
        </div>
      </div>
    </LessonLayout>
  )

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng học từ mới"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Học từ mới {current + 1} / {total}</strong><span>{phase === "flashcard" ? "Ghi nhớ nghĩa và ngữ cảnh" : "Luyện phát âm ngay"}</span></div>
            <button className={styles.iconButton} type="button" onClick={() => speak(word.hanzi)} aria-label="Nghe phát âm"><SharedIcon name="volume2" size={18} /></button>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <AnimatePresence mode="wait">
          {phase === "flashcard" ? (
            <motion.section key={`card-${word.id}`} className={`${styles.learningStageCard} ${styles.vocabLearnCard}`} variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
              <div className={styles.wordEyebrow}>Từ {current + 1}</div>
              <button
                type="button"
                className={`${styles.learnFlipScene} ${flipped ? styles.flipped : ""}`}
                onClick={() => setFlipped((value) => !value)}
                aria-label={flipped ? "Lật về mặt chữ Hán" : "Lật thẻ để xem nghĩa"}
              >
                <span className={styles.learnFlipCard}>
                  <span className={`${styles.learnFace} ${styles.learnFaceFront} ${word.imageUrl ? styles.learnFaceWithImage : ""}`}>
                    {word.imageUrl && (
                      <span className={styles.learnImageWrap}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className={styles.learnImage} src={word.imageUrl} alt="" />
                      </span>
                    )}
                    <strong className={styles.learnHanzi}>{word.hanzi}</strong>
                    <span className={styles.learnPinyin}>{word.pinyin}</span>
                    <small>Chạm để lật thẻ</small>
                  </span>
                  <span className={`${styles.learnFace} ${styles.learnFaceBack}`}>
                    <small>Nghĩa tiếng Việt</small>
                    <strong>{word.meaningVi}</strong>
                    <span>{word.hanzi} - {word.pinyin}</span>
                  </span>
                </span>
              </button>
              <div className={styles.examplePanel}>
                <span>Ví dụ</span>
                <p>{example}</p>
                <small>{exampleMeaning}</small>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={() => speak(example)}><SharedIcon name="volume2" size={16} />Nghe ví dụ</button>
                <button className={styles.secondaryButton} type="button" onClick={() => setFlipped((value) => !value)}><SharedIcon name="rotateCcw" size={16} />Lật thẻ</button>
                <button className={styles.primaryButton} type="button" onClick={goPronunciation}>Tiếp tục <SharedIcon name="arrowRight" size={16} /></button>
              </div>
            </motion.section>
          ) : (
            <motion.section key={`pron-${word.id}`} className={`${styles.learningStageCard} ${styles.wordPronCard}`} variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
              <div className={styles.wordEyebrow}>Phát âm</div>
              <strong className={styles.learnHanzi}>{word.hanzi}</strong>
              <span className={styles.learnPinyin}>{word.pinyin}</span>
              <div className={styles.audioActions}>
                <button className={`${styles.audioBtn} ${styles.audioBtnPrimary}`} type="button" onClick={() => speak(word.hanzi)}><SharedIcon name="volume2" size={15} />Play pronunciation</button>
                <button className={styles.audioBtn} type="button" onClick={() => speak(word.hanzi, 0.7)}><SharedIcon name="clock" size={15} />0.75x</button>
              </div>

              <div className={styles.recordingArea}>
                <div className={styles.micOuter}>
                  {recordState === "recording" && <div className={styles.pulseRing} />}
                  <button className={`${styles.micButton} ${recordState === "recording" ? styles.micRecording : recordState === "scored" ? styles.micRecorded : ""}`} type="button" onClick={recordState === "recording" ? stopRecording : startRecording} disabled={recordState === "processing"} aria-label="Record pronunciation">
                    <SharedIcon name={recordState === "recording" ? "pause" : recordState === "scored" ? "check" : "mic"} size={36} />
                  </button>
                </div>
                {recordState === "idle" && <div className={styles.recordingStatus}>Bấm để ghi âm từ này</div>}
                {recordState === "recording" && <><div className={styles.recordingTimer}>00:{String(recordSeconds).padStart(2, "0")}</div><div className={styles.recordingStatus}>Đang ghi âm. Bấm lần nữa để chấm điểm.</div></>}
                {recordState === "processing" && <div className={styles.processingArea}><div className={styles.spinner} /><div>AI đang chấm phát âm...</div></div>}
                {recordState === "scored" && (
                  <div className={styles.inlineScore}>
                    <strong>{averageScore}</strong>
                    <span>AI pronunciation score</span>
                  </div>
                )}
              </div>

              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={retry} disabled={recordState === "processing"}><SharedIcon name="rotateCcw" size={16} />Retry</button>
                <button className={styles.primaryButton} type="button" onClick={goNextWord} disabled={recordState !== "scored"}>Continue <SharedIcon name="arrowRight" size={16} /></button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </section>
    </LessonLayout>
  )
}
