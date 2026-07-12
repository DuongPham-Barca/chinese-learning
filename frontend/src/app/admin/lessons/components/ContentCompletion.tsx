"use client"

import type { AdminLesson } from "@/services/admin-lesson.service"
import { completionPercent } from "./lesson-model"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function ContentCompletion({ lesson }: { lesson: AdminLesson }) {
  const percent = completionPercent(lesson)
  const imageDone = lesson.imageUrl ? 1 : 0
  return (
    <div className={`${styles.completion} ${syncStyles.clientProgress}`}>
      <div className={styles.completionTop}><span>Hoàn thiện nội dung</span><strong>{percent}%</strong></div>
      <i><em style={{ width: `${percent}%` }} /></i>
      <ul>
        <li>Thông tin: {lesson.title && lesson.description ? "Hoàn thành" : "Thiếu mô tả"}</li>
        <li>Từ vựng: {lesson.vocabularyCount}/{Math.max(lesson.vocabularyCount, 15)}</li>
        <li>Anh: {imageDone}/{Math.max(lesson.vocabularyCount, 1)}</li>
        <li>Câu luyện tập: {lesson.sentenceCount}/{Math.max(lesson.sentenceCount, 8)}</li>
      </ul>
    </div>
  )
}
