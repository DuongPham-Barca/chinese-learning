"use client"

import { use, useCallback, useEffect, useMemo, useState, type CSSProperties, type DragEvent } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import StudyCompletion from "@/components/study-completion"
import StudySessionWorkspace from "@/components/study-session-workspace"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type CheckStatus = "idle" | "success" | "error"
type Token = { id: string; text: string }
type SentenceQuestion = { id: string; meaning: string; answer: Token[]; tokens: Token[]; answerText: string }

function shuffleArray<T>(items: T[]): T[] {
  const output = [...items]
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[output[i], output[j]] = [output[j], output[i]]
  }
  return output
}

function tokenizeSentence(sentenceZh: string): Token[] {
  return Array.from(sentenceZh.replace(/[，。！？、；：“”‘’（）《》\s]/g, "")).map((text, index) => ({
    id: `${index}-${text}`,
    text,
  }))
}

function buildQuestions(items: Vocabulary[]): SentenceQuestion[] {
  return items.filter((item) => item.example).map((item) => {
    const answer = tokenizeSentence(item.example!)
    return {
      id: item.id,
      meaning: item.exampleMeaning || item.meaningVi,
      answer,
      tokens: shuffleArray(answer),
      answerText: answer.map((token) => token.text).join(""),
    }
  }).filter((question) => question.answer.length > 1)
}

export default function SentenceSortingPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [items, setItems] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [current, setCurrent] = useState(() => readLessonProgress(id)["word-arrangement"]?.completed ?? 0)
  const [selected, setSelected] = useState<Token[]>([])
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setItems(response.data.vocabulary)
      })
      .catch(() => {
        if (active) setLoadError("Không thể tải dữ liệu sắp xếp câu.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const questions = useMemo(() => buildQuestions(items), [items])
  const question = questions[current]
  const totalItems = questions.length
  const progress = totalItems ? Math.round(((current + (status === "success" || showAnswer ? 1 : 0)) / totalItems) * 100) : 0
  const available = useMemo(() => {
    const selectedIds = new Set(selected.map((token) => token.id))
    return question ? question.tokens.filter((token) => !selectedIds.has(token.id)) : []
  }, [question, selected])

  const addToken = useCallback((token: Token) => {
    setSelected((items) => items.some((item) => item.id === token.id) ? items : [...items, token])
    setStatus("idle")
    setShowAnswer(false)
  }, [])

  const removeToken = useCallback((tokenId: string) => {
    setSelected((items) => items.filter((item) => item.id !== tokenId))
    setStatus("idle")
    setShowAnswer(false)
  }, [])

  const checkAnswer = useCallback(() => {
    if (!question || selected.length === 0 || status === "success") return
    const isCorrect = selected.map((token) => token.text).join("") === question.answerText
    setShowAnswer(false)
    setStatus(isCorrect ? "success" : "error")
    setAttempts((value) => value + 1)
    if (isCorrect) {
      setCorrect((value) => value + 1)
      updateLessonModuleProgress(id, "word-arrangement", current + 1, totalItems)
    }
  }, [current, id, question, selected, status, totalItems])

  const revealAnswer = useCallback(() => {
    setShowAnswer(true)
    updateLessonModuleProgress(id, "word-arrangement", current + 1, totalItems)
  }, [current, id, totalItems])

  const nextSentence = useCallback(() => {
    setSelected([])
    setStatus("idle")
    setDragging(false)
    setShowAnswer(false)
    setCurrent((value) => value + 1)
  }, [])

  const restartSession = useCallback(() => {
    setCurrent(0)
    setSelected([])
    setStatus("idle")
    setCorrect(0)
    setAttempts(0)
    setDragging(false)
    setShowAnswer(false)
  }, [])

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const tokenId = event.dataTransfer.getData("text/plain")
    const token = available.find((item) => item.id === tokenId)
    if (token) addToken(token)
    setDragging(false)
  }, [addToken, available])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!question) return
      if (event.key === "Backspace") {
        event.preventDefault()
        setSelected((items) => items.slice(0, -1))
        setStatus("idle")
      }
      if (event.key === "Enter") {
        event.preventDefault()
        if (status === "success" || showAnswer) nextSentence()
        else checkAnswer()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [checkAnswer, nextSentence, question, showAnswer, status])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải bài sắp xếp câu...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu để sắp xếp."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) return (
    <LessonLayout>
      <StudyCompletion title="Sắp xếp câu" description="Bạn đã hoàn thành toàn bộ câu sắp xếp trong bài học." stats={[{ label: "Câu đã học", value: totalItems }, { label: "Câu đúng", value: correct }, { label: "Lượt kiểm tra", value: attempts }]}>
        <button className={styles.primaryButton} type="button" onClick={restartSession}><SharedIcon name="rotateCcw" size={17} />Học lại</button>
        <Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link>
      </StudyCompletion>
    </LessonLayout>
  )

  return (
    <LessonLayout>
      <section className={`${styles.studyWrap} ${styles.enhancedStudyWrap}`}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng sắp xếp câu"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Sắp xếp câu {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <span className={styles.iconButton}><SharedIcon name="keyboard" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <StudySessionWorkspace
          current={current + 1}
          total={totalItems}
          progress={progress}
          stateLabel={status === "success" ? "Sắp xếp đúng" : showAnswer ? "Đã xem đáp án" : status === "error" ? "Chưa đúng" : "Đang sắp xếp"}
          stateTone={status === "success" ? "good" : status === "error" ? "warn" : "neutral"}
          metrics={[
            { label: "Câu đúng", value: correct, tone: correct > 0 ? "good" : "neutral" },
            { label: "Lượt kiểm tra", value: attempts },
            { label: "Đã chọn", value: `${selected.length}/${question.answer.length}` },
          ]}
        >
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.section className={`${styles.practiceCard} ${styles.hintCard}`} variants={cardVariants}>
            <i><SharedIcon name="sparkles" size={22} /></i>
            <div>
              <span>CÂU TIẾNG VIỆT</span>
              <h1>{question.meaning}</h1>
              <p>Sắp xếp các token tiếng Trung bị đảo thứ tự thành câu hoàn chỉnh.</p>
            </div>
          </motion.section>

          <motion.section className={`${styles.sentenceBuilder} ${dragging ? styles.dragOver : ""} ${status === "success" ? styles.inputSuccess : status === "error" ? styles.inputError : ""}`} variants={cardVariants}>
            <div
              className={styles.dropSentence}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {selected.length === 0 ? (
                <p>Bấm hoặc kéo token vào đây để tạo câu</p>
              ) : (
                selected.map((token) => <button type="button" className={styles.tokenChipSelected} key={token.id} onClick={() => removeToken(token.id)}>{token.text}</button>)
              )}
            </div>
            <div className={styles.tokenBank}>
              {available.map((token) => (
                <button
                  type="button"
                  className={styles.tokenChip}
                  draggable
                  key={token.id}
                  onClick={() => addToken(token)}
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", token.id)}
                >
                  {token.text}
                </button>
              ))}
            </div>
            {status === "success" && <strong className={styles.feedbackSuccess}>Chính xác.</strong>}
            {status === "error" && !showAnswer && (
              <div className={styles.answerReview}>
                <strong className={styles.feedbackError}>Chưa đúng.</strong>
                <p>Bạn có thể đổi thứ tự các chữ và kiểm tra lại.</p>
              </div>
            )}
            {showAnswer && <div className={styles.answerReview}><p>Đáp án chuẩn: <strong>{question.answerText}</strong></p></div>}
            <div className={styles.actionRow}>
              {status === "success" || showAnswer ? (
                <button className={styles.primaryButton} type="button" onClick={nextSentence}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button>
              ) : (
                <>
                  {status === "error" && <button className={styles.secondaryButton} type="button" onClick={revealAnswer}>Xem đáp án</button>}
                  <button className={styles.primaryButton} type="button" onClick={checkAnswer} disabled={selected.length === 0}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>
                </>
              )}
            </div>
          </motion.section>
          </motion.div>
        </StudySessionWorkspace>
      </section>
    </LessonLayout>
  )
}
