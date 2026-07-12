"use client"

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminVocabulary } from "@/services/admin-lesson.service"
import type { VocabularyPayload } from "@/services/admin-vocabulary.service"
import { Field, IconButton, LessonModal, UploadDropzone } from "./LessonShared"
import styles from "../lessons.module.css"

function vocabStatus(vocab: AdminVocabulary) {
  if (!vocab.imageUrl) return "Thiếu ảnh"
  if (!vocab.audioUrl) return "Thiếu audio"
  if (!vocab.example) return "Thiếu ví dụ"
  return "Đầy đủ"
}

export function VocabularyManager({
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
  const [modalOpen, setModalOpen] = useState(false)
  const filtered = useMemo(() => vocabularies.filter((item) => `${item.chinese} ${item.pinyin} ${item.vietnamese}`.toLowerCase().includes(search.toLowerCase())), [search, vocabularies])

  return (
    <section className={styles.managerPanel}>
      <header className={styles.managerHeader}>
        <div><span>Tổng số từ vựng</span><strong>{vocabularies.length}</strong></div>
        <label className={styles.searchBox}><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tim chu Han, pinyin, nghia..." /></label>
        <AdminButton icon="plus" onClick={() => setModalOpen(true)}>Thêm từ vựng</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
        <AdminButton secondary icon="sort">Sắp xếp</AdminButton>
      </header>
      {!filtered.length ? (
        <div className={styles.emptyState}><h3>Bài học chưa có từ vựng</h3><p>Bạn có thể thêm từng từ hoặc import nhiều từ bằng Excel.</p><div><AdminButton icon="plus" onClick={() => setModalOpen(true)}>Thêm từ vựng</AdminButton><AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton></div></div>
      ) : (
        <AdminTable className={styles.vocabularyTable}>
          <thead><tr><th></th><th>Order</th><th>Anh</th><th>Chữ Hán</th><th>Pinyin</th><th>Nghĩa tiếng Việt</th><th>Ví dụ</th><th>Audio</th><th>Trạng thái</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((vocab) => (
              <tr key={vocab.id}>
                <td><span className={styles.dragHandle}>::</span></td>
                <td>{vocab.order}</td>
                <td><div className={styles.vocabThumb}>{vocab.imageUrl ? <img src={vocab.imageUrl} alt="" /> : <AdminIcon name="image" />}</div></td>
                <td><strong>{vocab.chinese}</strong></td>
                <td>{vocab.pinyin}</td>
                <td>{vocab.vietnamese}</td>
                <td>{vocab.example || "Chua co"}</td>
                <td>{vocab.audioUrl ? <button className={styles.playButton} type="button"><AdminIcon name="play" />Play</button> : "Chua co"}</td>
                <td><span className={styles.contentStatus}>{vocabStatus(vocab)}</span></td>
                <td><div className={styles.actions}><IconButton icon="edit" label="Sửa" /><IconButton icon="copy" label="Nhân bản" /><IconButton icon="trash" label="Xóa" danger onClick={() => onDelete(vocab.id)} /></div></td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      {modalOpen && <VocabularyFormModal saving={saving} onClose={() => setModalOpen(false)} onSubmit={async (payload) => { const result = await onAdd(payload); if (!result) setModalOpen(false); return result }} />}
    </section>
  )
}

function VocabularyFormModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (payload: VocabularyPayload) => Promise<Record<string, string> | null> }) {
  const [form, setForm] = useState<VocabularyPayload>({ chinese: "", pinyin: "", vietnamese: "", example: "", examplePinyin: "", exampleMeaning: "", imageUrl: "", audioUrl: "", order: 1 })
  const [errors, setErrors] = useState<Record<string, string>>({})
  function set<K extends keyof VocabularyPayload>(key: K, value: VocabularyPayload[K]) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })) }
  async function submit() {
    const nextErrors: Record<string, string> = {}
    if (!form.chinese.trim()) nextErrors.chinese = "Nhập chữ Hán"
    if (!form.pinyin.trim()) nextErrors.pinyin = "Nhập pinyin"
    if (!form.vietnamese.trim()) nextErrors.vietnamese = "Nhập nghĩa tiếng Việt"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    const result = await onSubmit(form)
    if (result) setErrors(result)
  }

  return (
    <LessonModal title="Thêm từ vựng" size="lg" onClose={onClose}>
      <div className={styles.vocabFormLayout}>
        <div className={styles.formGrid}>
          <Field label="Chữ Hán" error={errors.chinese}><input value={form.chinese} onChange={(event) => set("chinese", event.target.value)} /></Field>
          <Field label="Pinyin" error={errors.pinyin}><input value={form.pinyin} onChange={(event) => set("pinyin", event.target.value)} /></Field>
          <Field label="Nghĩa tiếng Việt" error={errors.vietnamese}><input value={form.vietnamese} onChange={(event) => set("vietnamese", event.target.value)} /></Field>
          <Field label="Loai tu"><select><option>Danh từ</option><option>Động từ</option><option>Tính từ</option><option>Cụm từ</option></select></Field>
          <Field label="Ví dụ tiếng Trung" wide><textarea value={form.example || ""} onChange={(event) => set("example", event.target.value)} /></Field>
          <Field label="Pinyin câu ví dụ"><input value={form.examplePinyin || ""} onChange={(event) => set("examplePinyin", event.target.value)} /></Field>
          <Field label="Nghĩa câu ví dụ"><input value={form.exampleMeaning || ""} onChange={(event) => set("exampleMeaning", event.target.value)} /></Field>
          <Field label="Thu tu"><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
        </div>
        <aside className={styles.mediaColumn}>
          <UploadDropzone title="Ảnh từ vựng" helper="PNG, JPG, JPEG, WEBP. Ảnh nên vuông hoặc tỉ lệ 4:3 để hiển thị đẹp trên flashcard." previewUrl={form.imageUrl || undefined} />
          <div className={styles.audioBox}>
            <strong>Audio</strong>
            <p>Hiển thị audio hiện tại, play, replace hoặc remove nếu service hiện tại hỗ trợ.</p>
            <div><button type="button"><AdminIcon name="play" /> Play</button><button type="button">Replace</button><button type="button">Remove</button></div>
          </div>
        </aside>
      </div>
      <div className={styles.modalActions}><AdminButton secondary onClick={onClose} disabled={saving}>Hủy</AdminButton><AdminButton icon="check" onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : "Lưu từ vựng"}</AdminButton></div>
    </LessonModal>
  )
}
