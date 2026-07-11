"use client"

import { use, useCallback, useEffect, useMemo, useState, type CSSProperties, type DragEvent } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants, containerVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
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
  return items.filter((v) => v.example).map((item) => {
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
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<Token[]>([])
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [dragging, setDragging] = useState(false)

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
  const progress = totalItems ? Math.round(((current + (status === "success" ? 1 : 0)) / totalItems) * 100) : 0
  const available = useMemo(() => {
    const selectedIds = new Set(selected.map((token) => token.id))
    return question ? question.tokens.filter((token) => !selectedIds.has(token.id)) : []
  }, [question, selected])

  const addToken = useCallback((token: Token) => {
    setSelected((items) => items.some((item) => item.id === token.id) ? items : [...items, token])
    setStatus("idle")
  }, [])

  const removeToken = useCallback((tokenId: string) => {
    setSelected((items) => items.filter((item) => item.id !== tokenId))
    setStatus("idle")
  }, [])

  const checkAnswer = useCallback(() => {
    if (!question || selected.length === 0 || status === "success") return
    const isCorrect = selected.map((token) => token.text).join("") === question.answerText
    setStatus(isCorrect ? "success" : "error")
    setAttempts((value) => value + 1)
    if (isCorrect) setCorrect((value) => value + 1)
  }, [question, selected, status])

  const nextSentence = useCallback(() => {
    setSelected([])
    setStatus("idle")
    setDragging(false)
    setCurrent((value) => value + 1)
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
        if (status === "success") nextSentence()
        else checkAnswer()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [checkAnswer, nextSentence, question, status])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải bài sắp xếp câu...</p></div></div></LessonLayout>
  if (loadError || totalItems === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{loadError || "Bài học chưa có câu để sắp xếp."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= totalItems) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.completionCard}>
          <h2 className={styles.completionTitle}>Hoàn thành Sắp xếp câu</h2>
          <div className={styles.completionStats}>
            <div className={styles.statRow}><span className={styles.statLabel}>Câu đúng</span><span className={styles.statValue}>{correct}/{attempts || totalItems}</span></div>
          </div>
          <div className={styles.actionRow}><Link className={styles.primaryButton} href={returnHref}>Quay lại bài học</Link></div>
        </div>
      </div>
    </LessonLayout>
  )

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng sắp xếp câu"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Sắp xếp câu {current + 1} / {totalItems}</strong><span>Hoàn thành {progress}%</span></div>
            <span className={styles.iconButton}><SharedIcon name="keyboard" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

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
            {status === "error" && (
              <div className={styles.answerReview}>
                <strong className={styles.feedbackError}>Chưa đúng.</strong>
                <p>Đáp án chuẩn: <strong>{question.answerText}</strong></p>
                <p>Giải thích: đối chiếu lại thứ tự chữ Hán với nghĩa tiếng Việt phía trên.</p>
              </div>
            )}
          </motion.section>
        </motion.div>

        <div className={styles.practiceStatus}>
          <div className={styles.dots}>{Array.from({ length: totalItems }, (_, index) => <i key={index} className={index < current || (index === current && status === "success") ? styles.dotDone : ""} />)}</div>
          <div className={styles.accuracyRow}><span><b>{correct}/{attempts}</b> đúng</span></div>
        </div>
      </section>

      <aside className={styles.stickyStudyBar}>
        <div className={styles.stickyStudyInner}>
          <span>{status === "success" ? "Sẵn sàng sang câu tiếp theo" : "Kiểm tra trật tự câu"}</span>
          {status === "success" ? (
            <button className={styles.primaryButton} type="button" onClick={nextSentence}>{current + 1 < totalItems ? "Câu tiếp theo" : "Hoàn thành"} <SharedIcon name="arrowRight" size={15} /></button>
          ) : (
            <button className={styles.primaryButton} type="button" onClick={checkAnswer} disabled={selected.length === 0}>Kiểm tra <SharedIcon name="arrowRight" size={15} /></button>
          )}
        </div>
      </aside>
    </LessonLayout>
  )
}
