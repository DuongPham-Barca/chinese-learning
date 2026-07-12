"use client"

import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import { IconButton } from "./LessonShared"
import { SAMPLE_SENTENCES } from "./lesson-model"
import type { PracticeMode, PracticeSentence } from "./types"
import styles from "../lessons.module.css"

const modeLabels: Record<PracticeMode, string> = {
  pronunciation: "Phat am",
  dictation: "Nghe chep",
  arrange: "Sap xep cau",
  reaction: "Phan xa",
}

export function SentenceManager({ onImport }: { onImport: () => void }) {
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState("")
  const [sentences, setSentences] = useState<PracticeSentence[]>(SAMPLE_SENTENCES)
  const filtered = useMemo(() => sentences.filter((item) => {
    const matchesSearch = `${item.sentenceVi} ${item.sentenceZh}`.toLowerCase().includes(search.toLowerCase())
    const matchesMode = !mode || item.modes.includes(mode as PracticeMode)
    return matchesSearch && matchesMode
  }), [mode, search, sentences])

  return (
    <section className={styles.managerPanel}>
      <header className={styles.managerHeader}>
        <div><span>Tong so cau luyen tap</span><strong>{sentences.length}</strong></div>
        <label className={styles.searchBox}><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim cau tieng Viet hoac tieng Trung..." /></label>
        <select value={mode} onChange={(event) => setMode(event.target.value)}><option value="">Tat ca che do</option><option value="pronunciation">Phat am</option><option value="dictation">Nghe chep</option><option value="arrange">Sap xep cau</option><option value="reaction">Phan xa</option></select>
        <AdminButton icon="plus" onClick={() => setSentences((current) => [...current, { id: `sen-${Date.now()}`, order: current.length + 1, sentenceVi: "Cau moi", sentenceZh: "新句子", modes: ["pronunciation"] }])}>Them cau</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
      </header>
      <AdminTable className={styles.sentenceTable}>
        <thead><tr><th>Order</th><th>Cau tieng Viet</th><th>Cau tieng Trung</th><th>Audio</th><th>Che do luyen tap</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map((sentence) => (
            <tr key={sentence.id}>
              <td>{sentence.order}</td>
              <td>{sentence.sentenceVi}</td>
              <td><strong>{sentence.sentenceZh}</strong></td>
              <td>{sentence.audioUrl ? <button className={styles.playButton} type="button"><AdminIcon name="play" />Play</button> : "Chua co"}</td>
              <td><div className={styles.badgeRow}>{sentence.modes.map((item) => <span key={item} className={styles.practiceBadge}>{modeLabels[item]}</span>)}</div></td>
              <td><div className={styles.actions}><IconButton icon="edit" label="Sua" /><IconButton icon="copy" label="Nhan ban" /><IconButton icon="trash" label="Xoa" danger onClick={() => setSentences((current) => current.filter((row) => row.id !== sentence.id))} /></div></td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </section>
  )
}
