"use client"

import { use, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { Sentence, Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type PracticePart = "dictation" | "sentence"
type CheckStatus = "idle" | "success" | "error"
type SentenceQuestion = { meaning: string; answer: string[]; tokens: string[] }
type PracticeSentence = Pick<Sentence, "id" | "lessonId" | "sentenceVi" | "sentenceZh" | "audioUrl"> & { pinyin?: string }

function stageProgressKey(lessonId: string) {
  return `lesson-stage-progress:${lessonId}`
}

function practiceProgressKey(lessonId: string) {
  return `lesson-practice-progress:${lessonId}`
}

function hasLearnAccess(lessonId: string) {
  if (typeof window === "undefined") return false
  try {
    const progress = JSON.parse(window.localStorage.getItem(stageProgressKey(lessonId)) || "{}")
    return Boolean(progress.learn)
  } catch {
    return false
  }
}

function saveStageComplete(lessonId: string) {
  if (typeof window === "undefined") return
  const current = JSON.parse(window.localStorage.getItem(stageProgressKey(lessonId)) || "{}")
  window.localStorage.setItem(stageProgressKey(lessonId), JSON.stringify({ ...current, practice: true }))
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tokenizeSentence(sentenceZh: string): string[] {
  const clean = sentenceZh.replace(/[，。！？、；：""''（）《》\s]/g, "")
  return Array.from(clean)
}

export default function PracticeStagePage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [allowed, setAllowed] = useState(false)
  const [sentences, setSentences] = useState<PracticeSentence[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [part, setPart] = useState<PracticePart>("dictation")
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [errors, setErrors] = useState(0)
  const [sentenceSelected, setSentenceSelected] = useState<string[]>([])
  const [sentenceStatus, setSentenceStatus] = useState<CheckStatus>("idle")
  const [sentenceCorrect, setSentenceCorrect] = useState(0)
  const [sentenceAttempts, setSentenceAttempts] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setAllowed(hasLearnAccess(id)), 0)
    return () => window.clearTimeout(timer)
  }, [id])

  useEffect(() => {
    let active = true
    Promise.all([
      api.get<{ sentences: Sentence[] }>(`/sentences/${id}`),
      api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`),
    ])
      .then(([sentenceResponse, vocabResponse]) => {
        if (!active) return
        const sentenceItems = sentenceResponse.data.sentences
        if (sentenceItems.length > 0) {
          setSentences(sentenceItems)
          return
        }
        setSentences(vocabResponse.data.vocabulary.map((word) => ({
          id: word.id,
          lessonId: word.lessonId,
          sentenceZh: word.hanzi,
          sentenceVi: word.meaningVi,
          pinyin: word.pinyin,
          audioUrl: word.audioUrl,
        })))
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu luyện tập.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    window.localStorage.setItem(practiceProgressKey(id), JSON.stringify({ part, current }))
  }, [current, id, part])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const sentence = sentences[current]
  const sentenceQuestions = useMemo<SentenceQuestion[]>(() => sentences.map((item) => {
    const answerTokens = tokenizeSentence(item.sentenceZh)
    return { meaning: item.sentenceVi, answer: answerTokens, tokens: shuffleArray(answerTokens) }
  }), [sentences])
  const sentenceQuestion = sentenceQuestions[current]
  const totalItems = sentences.length
  const partIndex = part === "dictation" ? 0 : 1
  const progress = totalItems ? Math.round(((partIndex * totalItems + current + (status === "success" || sentenceStatus === "success" ? 1 : 0)) / (totalItems * 2)) * 100) : 0

  const speak = useCallback((text: string, rate = speed) => {
    if (!("speechSynthesis" in window)) return
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = rate
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }, [playing, speed])

  const checkDictation = useCallback(() => {
    if (!sentence || !answer.trim()) return
    const normalized = answer.trim().replace(/\s/g, "")
    const expected = sentence.sentenceZh.replace(/\s/g, "")
    const expectedPinyin = sentence.pinyin?.toLowerCase().replace(/\s/g, "") || ""
    if (normalized === expected || normalized.toLowerCase() === expectedPinyin) {
      setStatus("success")
    } else {
      setStatus("error")
      setErrors((value) => value + 1)
    }
  }, [answer, sentence])

  const nextDictation = useCallback(() => {
    window.speechSynthesis?.cancel()
    setPlaying(false)
    setAnswer("")
    setStatus("idle")
    if (current + 1 >= totalItems) {
      setPart("sentence")
      setCurrent(0)
      setSentenceSelected([])
      setSentenceStatus("idle")
      return
    }
    setCurrent((value) => value + 1)
  }, [current, totalItems])

  const addToken = useCallback((token: string) => {
    setSentenceSelected((items) => items.includes(token) ? items : [...items, token])
    setSentenceStatus("idle")
  }, [])

  const removeToken = useCallback((token: string) => {
    setSentenceSelected((items) => items.filter((item) => item !== token))
    setSentenceStatus("idle")
  }, [])

  const checkSentence = useCallback(() => {
    if (!sentenceQuestion || sentenceStatus === "success") return
    const isCorrect = sentenceSelected.join("") === sentenceQuestion.answer.join("")
    setSentenceStatus(isCorrect ? "success" : "error")
    setSentenceAttempts((value) => value + 1)
    if (isCorrect) setSentenceCorrect((value) => value + 1)
  }, [sentenceQuestion, sentenceSelected, sentenceStatus])

  const nextSentence = useCallback(() => {
    setSentenceSelected([])
    setSentenceStatus("idle")
    if (current + 1 >= totalItems) {
      saveStageComplete(id)
      window.localStorage.removeItem(practiceProgressKey(id))
      setCurrent(totalItems)
      return
    }
    setCurrent((value) => value + 1)
  }, [current, id, totalItems])

  if (!allowed) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.stateCard}>
          <p>Hãy hoàn thành phần Học từ mới trước khi vào Luyện tập.</p>
          <Link className={styles.primaryButton} href={`/lessons/${level}/${id}/learn`}>Học từ mới</Link>
        </div>
      </div>
    </LessonLayout>
  )

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải bài luyện tập...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu luyện tập."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (part === "sentence" && current >= totalItems) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.completionCard}>
          <div className={styles.completionMark}><SharedIcon name="check" size={34} /></div>
          <h2 className={styles.completionTitle}>Hoàn thành Luyện tập</h2>
          <div className={styles.completionStats}>
            <div className={styles.statRow}><span className={styles.statLabel}>Nghe chép</span><span className={styles.statValue}>{Math.max(0, totalItems - errors)}/{totalItems}</span></div>
            <div className={styles.statRow}><span className={styles.statLabel}>Luyện câu</span><span className={styles.statValue}>{sentenceCorrect}/{sentenceAttempts || totalItems}</span></div>
          </div>
          <div className={styles.actionRow}><Link className={styles.primaryButton} href={`/lessons/${level}/${id}/quiz`}>Tiếp tục kiểm tra <SharedIcon name="arrowRight" size={16} /></Link></div>
        </div>
      </div>
    </LessonLayout>
  )

  const available = sentenceQuestion ? sentenceQuestion.tokens.filter((token) => !sentenceSelected.includes(token)) : []

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng luyện tập"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>{part === "dictation" ? "Nghe chép" : "Luyện câu"} {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <span className={styles.iconButton}><SharedIcon name={part === "dictation" ? "headphones" : "keyboard"} size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <AnimatePresence mode="wait">
          {part === "dictation" ? (
            <motion.div key="dictation" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
              <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}><i><SharedIcon name="sparkles" size={22} /></i><div><span>NGHĨA TIẾNG VIỆT</span><h1>{sentence.sentenceVi}</h1><p>Listen, then type Hanzi or Pinyin to check recall.</p></div></motion.section>
              <motion.section className={`${styles.practiceCard} ${styles.audioCard}`} variants={cardVariants}>
                <div className={`${styles.waveform} ${playing ? styles.wavePlaying : ""}`}>{[14,24,38,51,35,58,43,30,18].map((height, index) => <i style={{ height }} key={index} />)}</div>
                <button type="button" className={styles.playButton} onClick={() => speak(sentence.sentenceZh)} aria-label={playing ? "Tạm dừng" : "Phát"}><SharedIcon name={playing ? "pause" : "play"} size={28} /></button>
                <div className={styles.speedRow}><SharedIcon name="repeat" size={14} />{[0.75, 1, 1.25].map((value) => <button type="button" className={speed === value ? styles.activeSpeed : ""} onClick={() => setSpeed(value)} key={value}>{value}x</button>)}</div>
              </motion.section>
              <motion.section className={`${styles.practiceCard} ${styles.inputCard} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`} variants={cardVariants}>
                <label htmlFor="dictation-answer">NHẬP HANZI/PINYIN</label>
                <textarea id="dictation-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setStatus("idle") }} placeholder="Gõ câu bạn vừa nghe..." autoFocus />
                {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác.</strong>}
                {status === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {sentence.sentenceZh}</strong>}
                <div className={styles.actionRow}>
                  {status === "success" ? <button className={styles.primaryButton} type="button" onClick={nextDictation}>{current + 1 < totalItems ? "Câu tiếp theo" : "Sang Luyện câu"} <SharedIcon name="arrowRight" size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={checkDictation} disabled={!answer.trim()}>Check answer <SharedIcon name="arrowRight" size={15} /></button>}
                </div>
              </motion.section>
            </motion.div>
          ) : (
            <motion.div key="sentence" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
              <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}><i><SharedIcon name="keyboard" size={22} /></i><div><span>LUYỆN CÂU</span><h1>{sentenceQuestion.meaning}</h1><p>Word Ordering hôm nay, sẵn sàng mở rộng Fill Missing Word, Sentence Completion và Matching.</p></div></motion.section>
              <motion.section className={`${styles.sentenceBuilder} ${sentenceStatus === "success" ? styles.inputSuccess : sentenceStatus === "error" ? styles.inputError : ""}`} variants={cardVariants}>
                <div className={styles.dropSentence}>
                  {sentenceSelected.length === 0 ? <p>Chạm các từ bên dưới để tạo câu</p> : sentenceSelected.map((token) => <button type="button" className={styles.tokenChipSelected} key={token} onClick={() => removeToken(token)}>{token}</button>)}
                </div>
                <div className={styles.tokenBank}>{available.map((token, index) => <button type="button" className={styles.tokenChip} key={`${token}-${index}`} onClick={() => addToken(token)}>{token}</button>)}</div>
                {sentenceStatus === "success" && <strong className={styles.feedbackSuccess}>Chính xác.</strong>}
                {sentenceStatus === "error" && <strong className={styles.feedbackError}>Đáp án đúng: {sentenceQuestion.answer.join("")}</strong>}
                <div className={styles.actionRow}>
                  {sentenceStatus === "success" ? <button className={styles.primaryButton} type="button" onClick={nextSentence}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button> : <button className={styles.primaryButton} type="button" onClick={checkSentence} disabled={sentenceSelected.length === 0}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>}
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </LessonLayout>
  )
}
