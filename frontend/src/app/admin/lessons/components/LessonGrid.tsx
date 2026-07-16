"use client"

import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import { formatDate } from "./lesson-model"
import { HskBadge, IconButton, StatusBadge } from "./LessonShared"
import { LessonCard } from "./LessonCard"
import styles from "../lessons.module.css"

export function LessonGrid({
  lessons,
  level,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lessons: AdminLesson[]
  level: AdminLevel
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
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lessons: AdminLesson[]
  level: AdminLevel
  onView: (lesson: AdminLesson) => void
  onEdit: (lesson: AdminLesson) => void
  onDuplicate: (lesson: AdminLesson) => void
  onDelete: (lesson: AdminLesson) => void
}) {
  return (
    <AdminTable className={styles.lessonTable}>
      <thead>
        <tr><th>Thứ tự</th><th>Bài học</th><th>Cấp độ</th><th>Nội dung</th><th>Trạng thái</th><th>Cập nhật</th><th>Thao tác</th></tr>
      </thead>
      <tbody>
        {lessons.map((lesson) => (
          <tr key={lesson.id}>
            <td><span className={styles.dragHandle}>::</span> Bài {String(lesson.order).padStart(2, "0")}</td>
            <td><strong>{lesson.title}</strong><small>{lesson.description || lesson.slug}</small></td>
            <td><HskBadge level={level} /></td>
            <td>{lesson.vocabularyCount} từ / {lesson.sentenceCount} câu</td>
            <td><StatusBadge published={lesson.isPublished} /></td>
            <td>{formatDate(lesson.updatedAt)}</td>
            <td><div className={styles.actions}><IconButton icon="eye" label="Xem" onClick={() => onView(lesson)} /><IconButton icon="edit" label="Sửa" onClick={() => onEdit(lesson)} /><IconButton icon="copy" label="Nhân bản" onClick={() => onDuplicate(lesson)} /><IconButton icon="trash" label="Xóa" danger onClick={() => onDelete(lesson)} /></div></td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  )
}

export function NoLessons({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className={styles.emptyState}>
      <h3>Chưa có bài học</h3>
      <p>Tạo bài học đầu tiên hoặc import nhiều bài học bằng Excel.</p>
      <div>
        <AdminButton icon="plus" onClick={onCreate}>Tạo bài học</AdminButton>
        <AdminButton secondary icon="download" onClick={onImport}>Import Excel</AdminButton>
      </div>
    </div>
  )
}
