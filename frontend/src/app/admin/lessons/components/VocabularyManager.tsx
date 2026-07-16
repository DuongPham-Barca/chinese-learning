"use client"

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminVocabulary } from "@/services/admin-lesson.service"
import type { VocabularyPayload } from "@/services/admin-vocabulary.service"
import { fetchVocabularyImage, fetchBulkVocabularyImages } from "@/services/admin-vocabulary.service"
import { uploadImage } from "@/services/upload.service"
import { Field, IconButton, LessonModal, UploadDropzone } from "./LessonShared"
import styles from "../lessons.module.css"

export function VocabularyManager({
  vocabularies,
  lessonId,
  saving,
  onAdd,
  onUpdate,
  onDelete,
  onSort,
  onRefresh,
  onImport,
}: {
  vocabularies: AdminVocabulary[]
  lessonId: string
  saving: boolean
  onAdd: (payload: VocabularyPayload) => Promise<Record<string, string> | null>
  onUpdate: (id: string, payload: Partial<VocabularyPayload>) => Promise<Record<string, string> | null>
  onDelete: (id: string) => void
  onSort: () => Promise<void>
  onRefresh: () => Promise<void>
  onImport: () => void
}) {
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVocab, setEditingVocab] = useState<AdminVocabulary | null>(null)
  const [bulkFetching, setBulkFetching] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ updated: number; total: number } | null>(null)
  const filtered = useMemo(() => vocabularies.filter((item) => `${item.chinese} ${item.pinyin} ${item.vietnamese}`.toLowerCase().includes(search.toLowerCase())), [search, vocabularies])

  function openCreate() { setEditingVocab(null); setModalOpen(true) }
  function openEdit(vocab: AdminVocabulary) { setEditingVocab(vocab); setModalOpen(true) }

  async function handleBulkFetch() {
    setBulkFetching(true)
    setBulkResult(null)
    try {
      const result = await fetchBulkVocabularyImages(lessonId)
      setBulkResult({ updated: result.updated, total: result.total })
      await onRefresh()
    } catch {
      setBulkResult({ updated: 0, total: 0 })
    } finally {
      setBulkFetching(false)
    }
  }

  async function duplicate(vocab: AdminVocabulary) {
    const nextOrder = Math.max(0, ...vocabularies.map((item) => item.order)) + 1
    await onAdd({ chinese: vocab.chinese, pinyin: vocab.pinyin, vietnamese: vocab.vietnamese, example: vocab.example, examplePinyin: vocab.examplePinyin, exampleMeaning: vocab.exampleMeaning, audioUrl: vocab.audioUrl, imageUrl: vocab.imageUrl, order: nextOrder })
  }

  return (
    <section className={styles.managerPanel}>
      <header className={styles.managerHeader}>
        <div><span>Tổng số từ vựng</span><strong>{vocabularies.length}</strong></div>
        <label className={styles.searchBox}><AdminIcon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm chữ Hán, pinyin, nghĩa..." /></label>
        <AdminButton icon="plus" onClick={openCreate}>Thêm từ vựng</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
        <AdminButton secondary icon="image" onClick={handleBulkFetch} disabled={bulkFetching}>{bulkFetching ? "Đang tìm..." : "Tìm ảnh cho tất cả"}</AdminButton>
        <AdminButton secondary icon="sort" onClick={() => void onSort()} disabled={saving}>Sắp xếp</AdminButton>
      </header>
      {bulkResult && (
        <div className={styles.stateBox}>
          {bulkResult.updated > 0
            ? `Đã tìm và gán ảnh cho ${bulkResult.updated}/${bulkResult.total} từ vựng`
            : "Không tìm thấy ảnh mới cho từ vựng nào"}
        </div>
      )}
      {!filtered.length ? (
        <div className={styles.emptyState}><h3>Bài học chưa có từ vựng</h3><p>Bạn có thể thêm từng từ hoặc import nhiều từ bằng Excel.</p><div><AdminButton icon="plus" onClick={openCreate}>Thêm từ vựng</AdminButton><AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton></div></div>
      ) : (
        <AdminTable className={styles.vocabularyTable}>
          <thead><tr><th></th><th>Thứ tự</th><th>Ảnh</th><th>Chữ Hán</th><th>Pinyin</th><th>Nghĩa tiếng Việt</th><th>Ví dụ</th><th>Thao tác</th></tr></thead>
          <tbody>
            {filtered.map((vocab) => (
              <tr key={vocab.id}>
                <td><span className={styles.dragHandle}>::</span></td>
                <td>{vocab.order}</td>
                <td><div className={styles.vocabThumb}>{vocab.imageUrl ? <img src={vocab.imageUrl} alt="" /> : <AdminIcon name="image" />}</div></td>
                <td><strong>{vocab.chinese}</strong></td>
                <td>{vocab.pinyin}</td>
                <td>{vocab.vietnamese}</td>
                <td>{vocab.example || "Chưa có"}</td>
                <td><div className={styles.actions}><IconButton icon="edit" label="Sửa" onClick={() => openEdit(vocab)} /><IconButton icon="copy" label="Nhân bản" onClick={() => void duplicate(vocab)} /><IconButton icon="trash" label="Xóa" danger onClick={() => onDelete(vocab.id)} /></div></td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      {modalOpen && <VocabularyFormModal vocab={editingVocab} saving={saving} onClose={() => { setModalOpen(false); setEditingVocab(null) }} onSubmit={async (payload) => { const result = editingVocab ? await onUpdate(editingVocab.id, payload) : await onAdd(payload); if (!result) { setModalOpen(false); setEditingVocab(null) }; return result }} />}
    </section>
  )
}

export function VocabularyFormModal({ vocab, saving, onClose, onSubmit }: { vocab: AdminVocabulary | null; saving: boolean; onClose: () => void; onSubmit: (payload: VocabularyPayload) => Promise<Record<string, string> | null> }) {
  const [form, setForm] = useState<VocabularyPayload>(() => vocab ? { chinese: vocab.chinese, pinyin: vocab.pinyin, vietnamese: vocab.vietnamese, example: vocab.example || "", examplePinyin: vocab.examplePinyin || "", exampleMeaning: vocab.exampleMeaning || "", imageUrl: vocab.imageUrl || "", audioUrl: vocab.audioUrl || "", order: vocab.order } : { chinese: "", pinyin: "", vietnamese: "", example: "", examplePinyin: "", exampleMeaning: "", imageUrl: "", audioUrl: "", order: 1 })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [fetchingImage, setFetchingImage] = useState(false)
  function set<K extends keyof VocabularyPayload>(key: K, value: VocabularyPayload[K]) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: "" })) }
  async function handleFile(file: File | null) {
    if (file === null) { set("imageUrl", ""); return }
    setUploading(true)
    try {
      const url = await uploadImage(file)
      set("imageUrl", url)
    } catch {
      setErrors((current) => ({ ...current, imageUrl: "Upload ảnh thất bại" }))
    } finally {
      setUploading(false)
    }
  }
  async function handleAutoFetch() {
    if (!form.chinese.trim()) { setErrors((current) => ({ ...current, chinese: "Nhập chữ Hán trước khi tìm ảnh" })); return }
    setFetchingImage(true)
    try {
      const result = await fetchVocabularyImage(form.chinese.trim())
      set("imageUrl", result.url)
    } catch {
      setErrors((current) => ({ ...current, imageUrl: "Không tìm thấy ảnh phù hợp" }))
    } finally {
      setFetchingImage(false)
    }
  }
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
    <LessonModal title={vocab ? "Sửa từ vựng" : "Thêm từ vựng"} size="lg" onClose={onClose}>
      <div className={styles.vocabFormLayout}>
        <div className={styles.formGrid}>
          <Field label="Chữ Hán" error={errors.chinese}><input value={form.chinese} onChange={(event) => set("chinese", event.target.value)} /></Field>
          <Field label="Pinyin" error={errors.pinyin}><input value={form.pinyin} onChange={(event) => set("pinyin", event.target.value)} /></Field>
          <Field label="Nghĩa tiếng Việt" error={errors.vietnamese}><input value={form.vietnamese} onChange={(event) => set("vietnamese", event.target.value)} /></Field>
          <Field label="Ví dụ tiếng Trung" wide><textarea value={form.example || ""} onChange={(event) => set("example", event.target.value)} /></Field>
          <Field label="Pinyin câu ví dụ"><input value={form.examplePinyin || ""} onChange={(event) => set("examplePinyin", event.target.value)} /></Field>
          <Field label="Nghĩa câu ví dụ"><input value={form.exampleMeaning || ""} onChange={(event) => set("exampleMeaning", event.target.value)} /></Field>
          <Field label="Thứ tự"><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
        </div>
        <aside className={styles.mediaColumn}>
          <UploadDropzone title="Ảnh từ vựng" helper="PNG, JPG, JPEG, WEBP. Ảnh nên vuông hoặc tỉ lệ 4:3 để hiển thị đẹp trên flashcard." previewUrl={form.imageUrl || undefined} onFile={handleFile} />
          <AdminButton secondary icon="image" onClick={handleAutoFetch} disabled={fetchingImage} style={{ width: "100%", marginTop: 8 }}>{fetchingImage ? "Đang tìm ảnh..." : "🔍 Tìm ảnh tự động"}</AdminButton>
        </aside>
      </div>
      <div className={styles.modalActions}><AdminButton secondary onClick={onClose} disabled={saving || uploading || fetchingImage}>Hủy</AdminButton><AdminButton icon="check" onClick={submit} disabled={saving || uploading || fetchingImage}>{fetchingImage ? "Đang tìm ảnh..." : uploading ? "Đang upload ảnh..." : saving ? "Đang lưu..." : vocab ? "Lưu thay đổi" : "Lưu từ vựng"}</AdminButton></div>
    </LessonModal>
  )
}
