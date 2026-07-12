"use client"

import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminVocabulary } from "@/services/admin-lesson.service"
import type { VocabularyPayload } from "@/services/admin-vocabulary.service"
import { Field, IconButton, LessonModal } from "./LessonShared"
import type { PracticeMode } from "./types"
import styles from "../lessons.module.css"

const allModes: PracticeMode[] = ["reaction", "dictation", "arrange", "speaking"]
const modeLabels: Record<PracticeMode, string> = {
  speaking: "Luyện nói",
  dictation: "Nghe chép",
  arrange: "Sắp xếp câu",
  reaction: "Phản xạ",
}

function ExampleFormModal({
  saving,
  onClose,
  onSubmit,
}: {
  saving: boolean
  onClose: () => void
  onSubmit: (payload: VocabularyPayload) => Promise<Record<string, string> | null>
}) {
  const [form, setForm] = useState<VocabularyPayload>({
    chinese: "",
    pinyin: "",
    vietnamese: "",
    example: "",
    examplePinyin: "",
    exampleMeaning: "",
    audioUrl: "",
    imageUrl: "",
    order: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof VocabularyPayload>(key: K, value: VocabularyPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  async function submit() {
    const nextErrors: Record<string, string> = {}
    if (!form.chinese.trim()) nextErrors.chinese = "Nhập chữ Hán/từ khóa"
    if (!form.pinyin.trim()) nextErrors.pinyin = "Nhập pinyin"
    if (!form.vietnamese.trim()) nextErrors.vietnamese = "Nhập nghĩa tiếng Việt"
    if (!form.example?.trim()) nextErrors.example = "Nhập câu example"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    const result = await onSubmit(form)
    if (result) setErrors(result)
    else onClose()
  }

  return (
    <LessonModal title="Thêm câu luyện tập từ example" size="lg" onClose={onClose}>
      <div className={styles.formGrid}>
        <Field label="Chữ Hán / từ khóa" error={errors.chinese}><input value={form.chinese} onChange={(event) => set("chinese", event.target.value)} /></Field>
        <Field label="Pinyin" error={errors.pinyin}><input value={form.pinyin} onChange={(event) => set("pinyin", event.target.value)} /></Field>
        <Field label="Nghĩa từ khóa" error={errors.vietnamese}><input value={form.vietnamese} onChange={(event) => set("vietnamese", event.target.value)} /></Field>
        <Field label="Order"><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
        <Field label="example" error={errors.example} helper="Client Phản xạ, Nghe chép, Sắp xếp câu, Luyện nói sẽ lấy câu này." wide>
          <textarea value={form.example || ""} onChange={(event) => set("example", event.target.value)} placeholder="VD: 你家有几口人？" />
        </Field>
        <Field label="example_pinyin"><input value={form.examplePinyin || ""} onChange={(event) => set("examplePinyin", event.target.value)} /></Field>
        <Field label="example_meaning"><input value={form.exampleMeaning || ""} onChange={(event) => set("exampleMeaning", event.target.value)} /></Field>
        <Field label="Audio URL" wide><input value={form.audioUrl || ""} onChange={(event) => set("audioUrl", event.target.value)} /></Field>
      </div>
      <div className={styles.modalActions}>
        <AdminButton secondary onClick={onClose} disabled={saving}>Hủy</AdminButton>
        <AdminButton icon="check" onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : "Lưu example"}</AdminButton>
      </div>
    </LessonModal>
  )
}

export function SentenceManager({
  vocabularies,
  saving,
  onAdd,
  onDelete,
  onImport,
}: {
  vocabularies: AdminVocabulary[]
  saving: boolean
  onAdd: (payload: VocabularyPayload) => Promise<Record<string, string> | null>
  onDelete: (id: string) => void
  onImport: () => void
}) {
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const examples = useMemo(() => vocabularies.filter((item) => item.example), [vocabularies])
  const filtered = useMemo(() => examples.filter((item) => {
    const matchesSearch = `${item.example || ""} ${item.examplePinyin || ""} ${item.exampleMeaning || ""} ${item.chinese}`.toLowerCase().includes(search.toLowerCase())
    const matchesMode = !mode || allModes.includes(mode as PracticeMode)
    return matchesSearch && matchesMode
  }), [examples, mode, search])

  return (
    <section className={styles.managerPanel}>
      <header className={styles.managerHeader}>
        <div><span>Tổng số câu example</span><strong>{examples.length}</strong></div>
        <label className={styles.searchBox}><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm example, pinyin hoặc nghĩa..." /></label>
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="">Tất cả chế độ</option>
          {allModes.map((item) => <option key={item} value={item}>{modeLabels[item]}</option>)}
        </select>
        <AdminButton icon="plus" onClick={() => setFormOpen(true)} disabled={saving}>Thêm example</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
      </header>
      <AdminTable className={styles.sentenceTable}>
        <thead><tr><th>Order</th><th>Từ khóa</th><th>example</th><th>example_pinyin</th><th>example_meaning</th><th>Client nhận ở</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td>{item.order}</td>
              <td><strong>{item.chinese}</strong><small>{item.pinyin}</small></td>
              <td><strong>{item.example}</strong></td>
              <td>{item.examplePinyin || "Chưa có"}</td>
              <td>{item.exampleMeaning || "Chưa có"}</td>
              <td><div className={styles.badgeRow}>{allModes.map((modeItem) => <span key={modeItem} className={styles.practiceBadge}>{modeLabels[modeItem]}</span>)}</div></td>
              <td><div className={styles.actions}><IconButton icon="edit" label="Sửa trong từ vựng" /><IconButton icon="trash" label="Xóa từ vựng" danger onClick={() => onDelete(item.id)} /></div></td>
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={7}><div className={styles.stateBox}>Bài học chưa có vocabulary nào có cột example. Import Excel với example, example_pinyin, example_meaning để client nhận.</div></td>
            </tr>
          )}
        </tbody>
      </AdminTable>
      {formOpen && <ExampleFormModal saving={saving} onClose={() => setFormOpen(false)} onSubmit={onAdd} />}
    </section>
  )
}
