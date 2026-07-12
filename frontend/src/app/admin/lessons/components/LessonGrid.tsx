"use client"

import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import { formatDate } from "./lesson-model"
import { ContentCompletion } from "./ContentCompletion"
import { HskBadge, IconButton, StatusBadge } from "./LessonShared"
import { LessonCard } from "./LessonCard"
import styles from "../lessons.module.css"

export function LessonGrid({
  lessons,
  level,
  topicTitle,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lessons: AdminLesson[]
  level: AdminLevel
  topicTitle: string
  onView: (lesson: AdminLesson) => void
  onEdit: (lesson: AdminLesson) => void
  onDuplicate: (lesson: AdminLesson) => void
  onDelete: (lesson: AdminLesson) => void
}) {
  return (
    <div className={styles.lessonGrid}>
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          level={level}
          topicTitle={topicTitle}
          onView={() => onView(lesson)}
          onEdit={() => onEdit(lesson)}
          onDuplicate={() => onDuplicate(lesson)}
          onDelete={() => onDelete(lesson)}
        />
      ))}
    </div>
  )
}

export function LessonTable({
  lessons,
  level,
  topicTitle,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lessons: AdminLesson[]
  level: AdminLevel
  topicTitle: string
  onView: (lesson: AdminLesson) => void
  onEdit: (lesson: AdminLesson) => void
  onDuplicate: (lesson: AdminLesson) => void
  onDelete: (lesson: AdminLesson) => void
}) {
  return (
    <AdminTable className={styles.lessonTable}>
      <thead>
        <tr><th>Thu tu</th><th>Bai hoc</th><th>Cap do</th><th>Topic</th><th>Noi dung</th><th>Hoan thien</th><th>Trang thai</th><th>Cap nhat</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {lessons.map((lesson) => (
          <tr key={lesson.id}>
            <td><span className={styles.dragHandle}>::</span> Bai {String(lesson.order).padStart(2, "0")}</td>
            <td><strong>{lesson.title}</strong><small>{lesson.description || lesson.slug}</small></td>
            <td><HskBadge level={level} /></td>
            <td><span className={styles.topicBadge}>{topicTitle}</span></td>
            <td>{lesson.vocabularyCount} tu / {lesson.sentenceCount} cau</td>
            <td><ContentCompletion lesson={lesson} /></td>
            <td><StatusBadge published={lesson.isPublished} /></td>
            <td>{formatDate(lesson.updatedAt)}</td>
            <td><div className={styles.actions}><IconButton icon="eye" label="Xem" onClick={() => onView(lesson)} /><IconButton icon="edit" label="Sua" onClick={() => onEdit(lesson)} /><IconButton icon="copy" label="Nhan ban" onClick={() => onDuplicate(lesson)} /><IconButton icon="trash" label="Xoa" danger onClick={() => onDelete(lesson)} /></div></td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  )
}

export function NoLessons({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className={styles.emptyState}>
      <h3>Chu de nay chua co bai hoc</h3>
      <p>Tao bai hoc dau tien hoac import nhieu bai hoc bang Excel.</p>
      <div>
        <AdminButton icon="plus" onClick={onCreate}>Tao bai hoc</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
      </div>
    </div>
  )
}
