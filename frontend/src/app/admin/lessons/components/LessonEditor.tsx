"use client"

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react"
import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton } from "@/components/admin/admin-ui"
import type { AdminLesson, AdminLessonDetail } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import type { LessonPayload } from "@/services/admin-lesson.service"
import type { VocabularyPayload } from "@/services/admin-vocabulary.service"
import { SentenceManager } from "./SentenceManager"
import { VocabularyManager } from "./VocabularyManager"
import { Field, HskBadge, LessonModal, StatusBadge, UploadDropzone } from "./LessonShared"
import { getHskMeta, slugify } from "./lesson-model"
import type { EditorTab, LessonTopic } from "./types"
import styles from "../lessons.module.css"

const tabs: Array<{ id: EditorTab; label: string; icon: "book" | "language" | "quiz" | "settings" | "eye" }> = [
  { id: "basic", label: "Thông tin bài học", icon: "book" },
  { id: "vocabulary", label: "Từ vựng", icon: "language" },
  { id: "sentences", label: "Câu luyện tập", icon: "quiz" },
  { id: "settings", label: "Cài đặt", icon: "settings" },
  { id: "preview", label: "Xem trước", icon: "eye" },
]

export function LessonEditor({
  levels,
  topics,
  lesson,
  detail,
  defaultLevelId,
  defaultTopicId,
  saving,
  onClose,
  onSaveLesson,
  onAddVocabulary,
  onDeleteVocabulary,
  onImport,
  onCreateTopic,
}: {
  levels: AdminLevel[]
  topics: LessonTopic[]
  lesson: AdminLesson | null
  detail: AdminLessonDetail | null
  defaultLevelId: string
  defaultTopicId: string
  saving: boolean
  onClose: () => void
  onSaveLesson: (payload: LessonPayload) => Promise<Record<string, string> | null>
  onAddVocabulary: (payload: VocabularyPayload) => Promise<Record<string, string> | null>
  onDeleteVocabulary: (id: string) => void
  onImport: () => void
  onCreateTopic: () => void
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>("basic")
  const [form, setForm] = useState<LessonPayload>(() => lesson ? {
    levelId: lesson.levelId,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description || "",
    imageUrl: lesson.imageUrl || "",
    order: lesson.order,
    isFree: lesson.isFree,
    isPublished: lesson.isPublished,
    expReward: lesson.expReward,
  } : { levelId: defaultLevelId, title: "", slug: "", description: "", imageUrl: "", order: 1, isFree: false, isPublished: false, expReward: 10 })
  const [topicId, setTopicId] = useState(defaultTopicId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const selectedLevel = levels.find((level) => level.id === form.levelId) || levels[0]
  const filteredTopics = useMemo(() => topics.filter((topic) => topic.levelId === form.levelId), [form.levelId, topics])

  function set<K extends keyof LessonPayload>(key: K, value: LessonPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  async function submit() {
    const nextErrors: Record<string, string> = {}
    if (!form.levelId) nextErrors.levelId = "Chọn HSK level"
    if (!form.title.trim()) nextErrors.title = "Nhập tên bài học"
    if (form.order < 0) nextErrors.order = "Thu tu khong duoc am"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    const result = await onSaveLesson({ ...form, slug: form.slug?.trim() || slugify(form.title) })
    if (result) setErrors(result)
  }

  return (
    <LessonModal title={lesson ? "Sửa bài học" : "Tạo bài học"} size="xl" onClose={onClose}>
      <div className={styles.editorLayout}>
        <nav className={styles.editorTabs}>{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? styles.activeEditorTab : ""} onClick={() => setActiveTab(tab.id)}><AdminIcon name={tab.icon} />{tab.label}</button>)}</nav>
        <section className={styles.editorContent}>
          {activeTab === "basic" && (
            <div className={styles.editorSection}>
              <div className={styles.formGrid}>
                <Field label="Tên bài học" error={errors.title}><input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="VD: Giới thiệu gia đình" /></Field>
                <Field label="HSK level" error={errors.levelId}><select value={form.levelId} onChange={(event) => { set("levelId", event.target.value); setTopicId("") }}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></Field>
                <Field label="Chủ đề" helper={!filteredTopics.length ? "Chưa có chủ đề phù hợp cho HSK đã chọn." : undefined}>
                  <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                    <option value="">Chọn chủ đề</option>
                    {filteredTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                  </select>
                </Field>
                <Field label="Lesson Order" error={errors.order}><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
                <Field label="Mô tả" wide><textarea value={form.description || ""} onChange={(event) => set("description", event.target.value)} /></Field>
                <Field label="Trạng thái"><select value={form.isPublished ? "published" : "draft"} onChange={(event) => set("isPublished", event.target.value === "published")}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
                <Field label="EXP Reward"><input type="number" min={0} value={form.expReward} onChange={(event) => set("expReward", Number(event.target.value))} /></Field>
                <label className={styles.checkField}><input type="checkbox" checked={form.isFree} onChange={(event) => set("isFree", event.target.checked)} /> Bài học miễn phí</label>
                {!filteredTopics.length && <div className={styles.wideField}><AdminButton secondary icon="plus" onClick={onCreateTopic}>Tạo chủ đề mới</AdminButton></div>}
                <div className={styles.wideField}><UploadDropzone title="Thumbnail bài học" helper="Kéo thả hoặc click để chọn ảnh. UI kiểm tra định dạng PNG/JPG/WEBP và dung lượng trước khi gửi." previewUrl={form.imageUrl || undefined} /></div>
              </div>
            </div>
          )}
          {activeTab === "vocabulary" && <VocabularyManager vocabularies={detail?.vocabulary || []} saving={saving} onAdd={onAddVocabulary} onDelete={onDeleteVocabulary} onImport={onImport} />}
          {activeTab === "sentences" && <SentenceManager vocabularies={detail?.vocabulary || []} saving={saving} onAdd={onAddVocabulary} onDelete={onDeleteVocabulary} onImport={onImport} />}
          {activeTab === "settings" && <div className={styles.settingsPanel}><h3>Cài đặt bài học</h3><label><input type="checkbox" checked={form.isFree} onChange={(event) => set("isFree", event.target.checked)} /> Miễn phí cho người học mới</label><label><input type="checkbox" checked={form.isPublished} onChange={(event) => set("isPublished", event.target.checked)} /> Xuất bản trên ứng dụng học</label><label><input type="checkbox" defaultChecked /> Cho phép hiển thị trong lesson path</label></div>}
          {activeTab === "preview" && selectedLevel && <div className={styles.previewPanel} style={{ "--accent": getHskMeta(selectedLevel).accent, "--soft": getHskMeta(selectedLevel).soft } as CSSProperties}><div className={styles.previewHero}>{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <AdminIcon name="book" />}</div><div><div className={styles.badgeRow}><HskBadge level={selectedLevel} /><StatusBadge published={form.isPublished} /></div><h3>{form.title || "Tên bài học"}</h3><p>{form.description || "Mô tả ngắn của bài học sẽ hiển thị tại đây."}</p><span>{detail?.vocabulary.length || 0} từ vựng</span><span>{detail?.sentences.length || detail?.sentenceCount || 0} câu luyện tập</span></div></div>}
        </section>
      </div>
      <div className={styles.modalActions}><AdminButton secondary onClick={onClose} disabled={saving}>Đóng</AdminButton><AdminButton icon="check" onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : "Lưu bài học"}</AdminButton></div>
    </LessonModal>
  )
}
