"use client"

import { useState } from "react"
import { AdminButton } from "@/components/admin/admin-ui"
import type { AdminLevel } from "@/services/admin-level.service"
import { DEFAULT_TOPIC_DRAFT, getHskMeta } from "./lesson-model"
import { Field, LessonModal, UploadDropzone } from "./LessonShared"
import type { LessonTopic, TopicDraft } from "./types"
import styles from "../lessons.module.css"

export function TopicFormModal({
  levels,
  topic,
  defaultLevelId,
  onClose,
  onSubmit,
}: {
  levels: AdminLevel[]
  topic: LessonTopic | null
  defaultLevelId: string
  onClose: () => void
  onSubmit: (draft: TopicDraft) => void
}) {
  const [form, setForm] = useState<TopicDraft>(() => topic ? {
    title: topic.title,
    levelId: topic.levelId,
    description: topic.description,
    coverUrl: topic.coverUrl || "",
    icon: topic.icon,
    order: topic.order,
    status: topic.status,
    color: topic.color,
  } : { ...DEFAULT_TOPIC_DRAFT, levelId: defaultLevelId, color: getHskMeta(levels.find((level) => level.id === defaultLevelId) || levels[0] || { name: "HSK1", order: 1 }).accent })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof TopicDraft>(key: K, value: TopicDraft[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  function submit() {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) nextErrors.title = "Nhập tên chủ đề"
    if (!form.levelId) nextErrors.levelId = "Chon HSK level"
    if (form.order < 0) nextErrors.order = "Thứ tự không được âm"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    onSubmit(form)
  }

  return (
    <LessonModal title={topic ? "Sửa chủ đề" : "Tạo chủ đề"} onClose={onClose}>
      <div className={styles.formGrid}>
        <Field label="Tên chủ đề" error={errors.title}><input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="VD: Gia đình" /></Field>
        <Field label="HSK level" error={errors.levelId}>
          <select value={form.levelId} onChange={(event) => set("levelId", event.target.value)}>
            <option value="">Chọn cấp độ</option>
            {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
        </Field>
        <Field label="Mô tả" wide><textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Mô tả ngắn giúp admin nhận diện nội dung chủ đề." /></Field>
        <Field label="Thứ tự hiển thị" error={errors.order}><input type="number" min={0} value={form.order} onChange={(event) => set("order", Number(event.target.value))} /></Field>
        <Field label="Trạng thái">
          <select value={form.status} onChange={(event) => set("status", event.target.value as TopicDraft["status"])}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </Field>
        <Field label="Icon đại diện"><select value={form.icon} onChange={(event) => set("icon", event.target.value)}><option value="book">Sách</option><option value="language">Ngôn ngữ</option><option value="list">Danh sách</option></select></Field>
        <Field label="Màu accent"><input type="color" value={form.color} onChange={(event) => set("color", event.target.value)} /></Field>
        <div className={styles.wideField}>
          <UploadDropzone title="Ảnh cover chủ đề" helper="Kéo thả hoặc click để chọn ảnh. Không cần nhập URL thủ công." previewUrl={form.coverUrl} />
        </div>
      </div>
      <div className={styles.modalActions}>
        <AdminButton secondary onClick={onClose}>Hủy</AdminButton>
        <AdminButton icon="check" onClick={submit}>{topic ? "Lưu thay đổi" : "Tạo chủ đề"}</AdminButton>
      </div>
    </LessonModal>
  )
}
