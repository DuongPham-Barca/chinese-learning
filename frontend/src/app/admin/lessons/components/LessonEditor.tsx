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
  { id: "basic", label: "Thong tin bai hoc", icon: "book" },
  { id: "vocabulary", label: "Tu vung", icon: "language" },
  { id: "sentences", label: "Cau luyen tap", icon: "quiz" },
  { id: "settings", label: "Cai dat", icon: "settings" },
  { id: "preview", label: "Xem truoc", icon: "eye" },
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
    if (!form.levelId) nextErrors.levelId = "Chon HSK level"
    if (!form.title.trim()) nextErrors.title = "Nhap ten bai hoc"
    if (form.order < 0) nextErrors.order = "Thu tu khong duoc am"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    const result = await onSaveLesson({ ...form, slug: form.slug?.trim() || slugify(form.title) })
    if (result) setErrors(result)
  }

  return (
    <LessonModal title={lesson ? "Sua bai hoc" : "Tao bai hoc"} size="xl" onClose={onClose}>
      <div className={styles.editorLayout}>
        <nav className={styles.editorTabs}>{tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? styles.activeEditorTab : ""} onClick={() => setActiveTab(tab.id)}><AdminIcon name={tab.icon} />{tab.label}</button>)}</nav>
        <section className={styles.editorContent}>
          {activeTab === "basic" && (
            <div className={styles.editorSection}>
              <div className={styles.formGrid}>
                <Field label="Ten bai hoc" error={errors.title}><input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="VD: Gioi thieu gia dinh" /></Field>
                <Field label="HSK level" error={errors.levelId}><select value={form.levelId} onChange={(event) => { set("levelId", event.target.value); setTopicId("") }}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></Field>
                <Field label="Chu de" helper={!filteredTopics.length ? "Chua co chu de phu hop cho HSK da chon." : undefined}>
                  <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                    <option value="">Chon chu de</option>
                    {filteredTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
                  </select>
                </Field>
                <Field label="Lesson Order" error={errors.order}><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
                <Field label="Mo ta" wide><textarea value={form.description || ""} onChange={(event) => set("description", event.target.value)} /></Field>
                <Field label="Thoi luong hoc du kien"><input type="number" min={1} defaultValue={15} /></Field>
                <Field label="Trang thai"><select value={form.isPublished ? "published" : "draft"} onChange={(event) => set("isPublished", event.target.value === "published")}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
                <Field label="EXP Reward"><input type="number" min={0} value={form.expReward} onChange={(event) => set("expReward", Number(event.target.value))} /></Field>
                <label className={styles.checkField}><input type="checkbox" checked={form.isFree} onChange={(event) => set("isFree", event.target.checked)} /> Bai hoc mien phi</label>
                {!filteredTopics.length && <div className={styles.wideField}><AdminButton secondary icon="plus" onClick={onCreateTopic}>Tao chu de moi</AdminButton></div>}
                <div className={styles.wideField}><UploadDropzone title="Thumbnail bai hoc" helper="Keo tha hoac click de chon anh. UI kiem tra dinh dang PNG/JPG/WEBP va dung luong truoc khi gui." previewUrl={form.imageUrl || undefined} /></div>
              </div>
            </div>
          )}
          {activeTab === "vocabulary" && <VocabularyManager vocabularies={detail?.vocabulary || []} saving={saving} onAdd={onAddVocabulary} onDelete={onDeleteVocabulary} onImport={onImport} />}
          {activeTab === "sentences" && <SentenceManager onImport={onImport} />}
          {activeTab === "settings" && <div className={styles.settingsPanel}><h3>Cai dat bai hoc</h3><label><input type="checkbox" checked={form.isFree} onChange={(event) => set("isFree", event.target.checked)} /> Mien phi cho nguoi hoc moi</label><label><input type="checkbox" checked={form.isPublished} onChange={(event) => set("isPublished", event.target.checked)} /> Xuat ban tren ung dung hoc</label><label><input type="checkbox" defaultChecked /> Cho phep hien thi trong lesson path</label></div>}
          {activeTab === "preview" && selectedLevel && <div className={styles.previewPanel} style={{ "--accent": getHskMeta(selectedLevel).accent, "--soft": getHskMeta(selectedLevel).soft } as CSSProperties}><div className={styles.previewHero}>{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <AdminIcon name="book" />}</div><div><div className={styles.badgeRow}><HskBadge level={selectedLevel} /><StatusBadge published={form.isPublished} /></div><h3>{form.title || "Ten bai hoc"}</h3><p>{form.description || "Mo ta ngan cua bai hoc se hien thi tai day."}</p><span>{detail?.vocabulary.length || 0} tu vung</span><span>{detail?.sentenceCount || 0} cau luyen tap</span></div></div>}
        </section>
      </div>
      <div className={styles.modalActions}><AdminButton secondary onClick={onClose} disabled={saving}>Dong</AdminButton><AdminButton icon="check" onClick={submit} disabled={saving}>{saving ? "Dang luu..." : "Luu bai hoc"}</AdminButton></div>
    </LessonModal>
  )
}
