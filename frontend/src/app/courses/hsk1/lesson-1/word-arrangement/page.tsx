"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type DragEvent } from "react"
import styles from "./word-arrangement.module.css"

type CheckStatus = "idle" | "success" | "error"
const question = { meaning: "Tôi là sinh viên", answer: ["我", "是", "学生"], tokens: ["是", "学生", "我"] }

function Icon({ name }: { name: "close" | "bulb" }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{name === "close" ? <path d="m6 6 12 12M18 6 6 18" /> : <><path d="M9 18h6M10 22h4"/><path d="M8.5 15.5A7 7 0 1 1 15.5 15.5c-.8.6-1.2 1.3-1.3 2.5h-4.4c-.1-1.2-.5-1.9-1.3-2.5Z"/></>}</svg>
}

function WordArrangementHeader() {
  return <header className={styles.header}><div className={styles.headerInner}><Link href="/courses/hsk1/lesson-1/dictation" aria-label="Đóng bài sắp xếp từ"><Icon name="close" /></Link><div className={styles.headerTitle}><strong>Sắp xếp từ 1 / 5</strong><span><i /><i /><i /><i /><i /></span></div><b>⚡ 40 EXP</b></div><div className={styles.topProgress}><i /></div></header>
}

function MeaningCard() {
  return <section className={styles.meaningCard}><i><Icon name="bulb" /></i><div><span>NGHĨA TIẾNG VIỆT</span><h1>{question.meaning}</h1></div></section>
}

function WordToken({ token, selected, onClick, onDragStart }: { token: string; selected?: boolean; onClick: () => void; onDragStart?: (event: DragEvent<HTMLButtonElement>) => void }) {
  return <button type="button" className={`${styles.token} ${selected ? styles.selectedToken : ""}`} onClick={onClick} draggable onDragStart={onDragStart}>{token}</button>
}

function DropZone({ selected, status, dragging, onRemove, onDrop, onDragState }: { selected: string[]; status: CheckStatus; dragging: boolean; onRemove: (token: string) => void; onDrop: (event: DragEvent<HTMLDivElement>) => void; onDragState: (value: boolean) => void }) {
  return <section className={`${styles.dropZone} ${dragging ? styles.dragOver : ""} ${status === "success" ? styles.correctZone : status === "error" ? styles.wrongZone : ""}`} onDragOver={(event) => { event.preventDefault(); onDragState(true) }} onDragLeave={() => onDragState(false)} onDrop={onDrop}>{selected.length === 0 ? <p>Chạm hoặc kéo các từ vào đây</p> : <div className={styles.selectedWords}>{selected.map((token) => <WordToken token={token} selected onClick={() => onRemove(token)} key={token} />)}</div>}{status === "success" && <strong className={styles.correctMessage}>Chính xác!</strong>}{status === "error" && <strong className={styles.errorMessage}>Đáp án đúng: {question.answer.join(" ")}</strong>}</section>
}

function StatsRow() {
  return <section className={styles.stats}><div><span>Chuỗi đúng</span><strong>3</strong></div><div><span>EXP</span><strong>40</strong></div><div><span>Độ chính xác</span><strong>96%</strong></div></section>
}

function StickyCheckBar({ status, onCheck }: { status: CheckStatus; onCheck: () => void }) {
  return <aside className={styles.stickyBar}><button type="button" onClick={onCheck}>{status === "success" ? "Tiếp tục" : "Kiểm tra"} <b>›</b></button></aside>
}

export default function WordArrangementPage() {
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [dragging, setDragging] = useState(false)
  const available = question.tokens.filter((token) => !selected.includes(token))

  const addToken = useCallback((token: string) => { setSelected((current) => current.includes(token) ? current : [...current, token]); setStatus("idle") }, [])
  const removeToken = useCallback((token: string) => { setSelected((current) => current.filter((item) => item !== token)); setStatus("idle") }, [])
  const checkAnswer = useCallback(() => { if (status !== "success") setStatus(selected.join("") === question.answer.join("") ? "success" : "error") }, [selected, status])
  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const token = event.dataTransfer.getData("text/plain"); if (question.tokens.includes(token)) addToken(token); setDragging(false) }, [addToken])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (["1", "2", "3"].includes(event.key)) { addToken(question.tokens[Number(event.key) - 1]); return }
      if (event.key === "Backspace") { event.preventDefault(); setSelected((current) => current.slice(0, -1)); setStatus("idle"); return }
      if (event.key === "Enter") { event.preventDefault(); checkAnswer() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [addToken, checkAnswer])

  return <main className={styles.page}><section className={styles.arrangementShell}><WordArrangementHeader /><div className={styles.content}><MeaningCard /><DropZone selected={selected} status={status} dragging={dragging} onRemove={removeToken} onDrop={handleDrop} onDragState={setDragging} /><div className={styles.tokenBank}>{available.map((token) => <WordToken token={token} onClick={() => addToken(token)} onDragStart={(event) => event.dataTransfer.setData("text/plain", token)} key={token} />)}</div><StatsRow /></div><StickyCheckBar status={status} onCheck={checkAnswer} /></section></main>
}
