"use client"

/* eslint-disable @next/next/no-img-element */
import AdminIcon from "@/components/admin/admin-icons"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import { formatDate } from "./lesson-model"
import { ContentCompletion } from "./ContentCompletion"
import { HskBadge, IconButton, StatusBadge } from "./LessonShared"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function LessonCard({
  lesson,
  level,
  topicTitle,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  lesson: AdminLesson
  level: AdminLevel
  topicTitle: string
  onView: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <article className={`${styles.lessonCard} ${syncStyles.clientCard} ${syncStyles.clientLesson}`} draggable>
      <div className={`${styles.lessonThumb} ${syncStyles.clientThumb}`}>
        {lesson.imageUrl ? <img src={lesson.imageUrl} alt="" /> : <AdminIcon name="book" />}
        <span>Bai {String(lesson.order).padStart(2, "0")}</span>
      </div>
      <div className={styles.lessonBody}>
        <div className={styles.lessonHeaderLine}>
          <h4>{lesson.title}</h4>
          <button type="button" className={styles.mobileMenu} title="Actions" aria-label="Actions"><AdminIcon name="menu" /></button>
        </div>
        <div className={styles.badgeRow}><HskBadge level={level} /><span className={styles.topicBadge}>{topicTitle}</span><StatusBadge published={lesson.isPublished} /></div>
        <p>{lesson.description || lesson.slug || "Chưa có mô tả ngắn cho bài học."}</p>
        <div className={styles.lessonMetrics}>
          <span><AdminIcon name="language" />{lesson.vocabularyCount} tu</span>
          <span><AdminIcon name="quiz" />{lesson.sentenceCount} cau</span>
          <span><AdminIcon name="clock" />15 phut</span>
        </div>
        <ContentCompletion lesson={lesson} />
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
