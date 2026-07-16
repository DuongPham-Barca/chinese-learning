"use client"

/* eslint-disable @next/next/no-img-element */
import AdminIcon from "@/components/admin/admin-icons"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import { formatDate } from "./lesson-model"
import { HskBadge, IconButton, StatusBadge } from "./LessonShared"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function LessonCard({
  lesson,
  level,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lesson: AdminLesson
  level: AdminLevel
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <article className={`${styles.lessonCard} ${syncStyles.clientCard} ${syncStyles.clientLesson}`}>
      <div className={`${styles.lessonThumb} ${syncStyles.clientThumb}`}>
        {lesson.imageUrl ? <img src={lesson.imageUrl} alt="" /> : <AdminIcon name="book" />}
        <span>Bài {String(lesson.order).padStart(2, "0")}</span>
      </div>
      <div className={styles.lessonBody}>
        <div className={styles.lessonHeaderLine}>
          <h4>{lesson.title}</h4>
          <button type="button" className={styles.mobileMenu} title="Sửa bài học" aria-label="Sửa bài học" onClick={onEdit}><AdminIcon name="menu" /></button>
        </div>
        <div className={styles.badgeRow}><HskBadge level={level} /><StatusBadge published={lesson.isPublished} /></div>
        <p>{lesson.description || lesson.slug || "Chưa có mô tả ngắn cho bài học."}</p>
        <div className={styles.lessonMetrics}>
          <span><AdminIcon name="language" />{lesson.vocabularyCount} từ</span>
          <span><AdminIcon name="quiz" />{lesson.sentenceCount} câu</span>
        </div>
        <footer>
          <span>Cập nhật {formatDate(lesson.updatedAt)}</span>
          <div className={styles.actions}>
            <IconButton icon="eye" label="Xem chi tiết" onClick={onView} />
            <IconButton icon="edit" label="Sửa" onClick={onEdit} />
            <IconButton icon="copy" label="Nhân bản" onClick={onDuplicate} />
            <IconButton icon="trash" label="Xóa" danger onClick={onDelete} />
          </div>
        </footer>
      </div>
    </article>
  )
}
