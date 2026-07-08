"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type DragEvent } from "react"
import api from "@/lib/api"
import type { Sentence as APISentence } from "@/types/api"
import styles from "./word-arrangement.module.css"

type CheckStatus = "idle" | "success" | "error"

type Question = { meaning: string; answer: string[]; tokens: string[] }

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function tokenizeSentence(sentenceZh: string): string[] {
  const tokens: string[] = []
  let buf = ""
  for (const ch of sentenceZh) {
    if (/[，。！？、；：""''（）《》\s]/.test(ch)) {
      if (buf) { tokens.push(buf); buf = "" }
      continue
    }
    buf += ch
  }
  if (buf) tokens.push(buf)
  return tokens
}

function Icon({ name }: { name: "close" | "bulb" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{name === "close" ? <path d="m6 6 12 12M18 6 6 18" /> : <><path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.3-1.3 2.5h-4.4c-.1-1.2-.5-1.9-1.3-2.5Z"/></>}</svg>
}

function WordArrangementHeader({ current, total }: { current: number; total: number }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/courses/hsk1/lesson-1/dictation" aria-label="Đóng bài sắp xếp từ"><Icon name="close" /></Link>
        <div className={styles.headerTitle}><strong>Sắp xếp từ {current} / {total}</strong><span>{Array.from({ length: total }, (_, i) => <i key={i} className={i < current ? "dotDone" : ""} />)}</span></div>
        <b>⚡ {40} EXP</b>
      </div>
      <div className={styles.topProgress}><i style={{ width: `${(current / total) * 100}%` }} /></div>
    </header>
  )
}

function MeaningCard({ meaning }: { meaning: string }) {
  return (
    <section className={styles.meaningCard}>
      <i><Icon name="bulb" /></i>
      <div><span>NGHĨA TIẾNG VIỆT</span><h1>{meaning}</h1></div>
    </section>
  )
}

function WordToken({ token, selected, onClick, onDragStart }: { token: string; selected?: boolean; onClick: () => void; onDragStart?: (event: DragEvent<HTMLButtonElement>) => void }) {
  return <button type="button" className={`${styles.token} ${selected ? styles.selectedToken : ""}`} onClick={onClick} draggable onDragStart={onDragStart}>{token}</button>
}

function DropZone({ selected, status, dragging, onRemove, onDrop, onDragState }: { selected: string[]; status: CheckStatus; dragging: boolean; onRemove: (token: string) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void; onDragState: (value: boolean) => void }) {
  return (
    <section className={`${styles.dropZone} ${dragging ? styles.dragOver : ""} ${status === "success" ? styles.correctZone : status === "error" ? styles.wrongZone : ""}`}
      onDragOver={(event) => { event.preventDefault(); onDragState(true) }}
      onDragLeave={() => onDragState(false)}
      onDrop={onDrop}
    >
      {selected.length === 0 ? <p>Chạm hoặc kéo các từ vào đây</p> : <div className={styles.selectedWords}>{selected.map((token) => <WordToken token={token} selected onClick={() => onRemove(token)} key={token} />)}</div>}
      {status === "success" && <strong className={styles.correctMessage}>Chính xác!</strong>}
      {status === "error" && <strong className={styles.errorMessage}>Đáp án đúng: {selected.join(" ")}</strong>}
    </section>
  )
}

function StatsRow({ correct, total }: { correct: number; total: number }) {
  return (
    <section className={styles.stats}>
      <div><span>Chuỗi đúng</span><strong>{correct}</strong></div>
      <div><span>EXP</span><strong>40</strong></div>
      <div><span>Độ chính xác</span><strong>{total > 0 ? Math.round((correct / total) * 100) : 0}%</strong></div>
    </section>
  )
}

function StickyCheckBar({ status, onCheck, onNext, isLast }: { status: CheckStatus; onCheck: () => void; onNext: () => void; isLast: boolean }) {
  return (
    <aside className={styles.stickyBar}>
      {status === "success" ? (
        <button type="button" onClick={onNext}>{isLast ? "Hoàn thành" : "Tiếp tục"} <b>›</b></button>
      ) : (
        <button type="button" onClick={onCheck}>Kiểm tra <b>›</b></button>
      )}
    </aside>
  )
}

export default function WordArrangementPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [dragging, setDragging] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAttempted, setTotalAttempted] = useState(0)

  useEffect(() => {
    api.get("/lessons?level=HSK1").then((res) => {
      const found = res.data.lessons.find((l: { lessonOrder: number }) => l.lessonOrder === 1)
      if (found) {
        api.get(`/sentences/${found.id}`).then((r) => {
          const items: Question[] = (r.data.sentences as APISentence[]).map((s) => {
            const tokens = tokenizeSentence(s.sentenceZh)
            return { meaning: s.sentenceVi, answer: tokens, tokens: shuffleArray(tokens) }
          })
          setQuestions(items)
        })
      }
    })
  }, [])

  const question = questions[current]
  const totalQ = questions.length
  const available = question ? question.tokens.filter((token) => !selected.includes(token)) : []

  const addToken = useCallback((token: string) => {
    setSelected((current) => current.includes(token) ? current : [...current, token])
    setStatus("idle")
  }, [])

  const removeToken = useCallback((token: string) => {
    setSelected((current) => current.filter((item) => item !== token))
    setStatus("idle")
  }, [])

  const checkAnswer = useCallback(() => {
    if (status === "success" || !question) return
    const isCorrect = selected.join("") === question.answer.join("")
    setStatus(isCorrect ? "success" : "error")
    setTotalAttempted((v) => v + 1)
    if (isCorrect) setCorrectCount((v) => v + 1)
  }, [selected, status, question])

  const nextQuestion = useCallback(() => {
    if (current + 1 < totalQ) {
      setCurrent(current + 1)
      setSelected([])
      setStatus("idle")
    }
  }, [current, totalQ])

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const token = event.dataTransfer.getData("text/plain")
    if (question && question.tokens.includes(token)) addToken(token)
    setDragging(false)
  }, [addToken, question])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!question) return
      if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(event.key)) {
        const idx = Number(event.key) - 1
        if (idx < available.length) addToken(available[idx])
        return
      }
      if (event.key === "Backspace") { event.preventDefault(); setSelected((current) => current.slice(0, -1)); setStatus("idle"); return }
      if (event.key === "Enter") { event.preventDefault(); if (status === "success") nextQuestion(); else checkAnswer() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [addToken, checkAnswer, nextQuestion, available, question, status])

  if (questions.length === 0) {
    return <main className={styles.page}><section className={styles.arrangementShell}><div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Đang tải...</div></section></main>
  }
  if (current >= totalQ) {
    return (
      <main className={styles.page}>
        <section className={styles.arrangementShell}>
          <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6">
            <h2 className="text-2xl font-bold mb-4">Hoàn thành! 🎉</h2>
            <p className="mb-4">Đúng: {correctCount}/{totalAttempted}</p>
            <Link href="/courses/hsk1/lesson-1" className="text-[#3B82F6] hover:underline">← Quay lại bài học</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.arrangementShell}>
        <WordArrangementHeader current={current + 1} total={totalQ} />
        <div className={styles.content}>
          <MeaningCard meaning={question.meaning} />
          <DropZone selected={selected} status={status} dragging={dragging} onRemove={removeToken} onDrop={handleDrop} onDragState={setDragging} />
          <div className={styles.tokenBank}>
            {available.map((token) => (
              <WordToken token={token} onClick={() => addToken(token)} onDragStart={(event) => event.dataTransfer.setData("text/plain", token)} key={token} />
            ))}
          </div>
          {status === "error" && (
            <div style={{ textAlign: "center", color: "#ef4444", fontWeight: 500, marginTop: "0.5rem" }}>
              Đáp án đúng: {question.answer.join(" ")}
            </div>
          )}
          <StatsRow correct={correctCount} total={totalAttempted} />
        </div>
        <StickyCheckBar status={status} onCheck={checkAnswer} onNext={nextQuestion} isLast={current + 1 >= totalQ} />
      </section>
    </main>
  )
}
