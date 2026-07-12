"use client"

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react"
import { useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton } from "@/components/admin/admin-ui"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import { LessonGrid, LessonTable, NoLessons } from "./LessonGrid"
import { getHskMeta } from "./lesson-model"
import { HskBadge, IconButton, StatusBadge } from "./LessonShared"
import type { LessonTopic, ViewMode } from "./types"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function TopicCard({
  topic,
  level,
  view,
  onEditTopic,
  onDeleteTopic,
  onAddLesson,
  onImport,
  onViewLesson,
  onEditLesson,
  onDuplicateLesson,
  onDeleteLesson,
}: {
  topic: LessonTopic
  level: AdminLevel
  view: ViewMode
  onEditTopic: (topic: LessonTopic) => void
  onDeleteTopic: (topic: LessonTopic) => void
  onAddLesson: (topic: LessonTopic) => void
  onImport: () => void
  onViewLesson: (lesson: AdminLesson) => void
  onEditLesson: (lesson: AdminLesson) => void
  onDuplicateLesson: (lesson: AdminLesson) => void
  onDeleteLesson: (lesson: AdminLesson) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const meta = getHskMeta(level)
  const vocabCount = topic.lessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0)
  const sentenceCount = topic.lessons.reduce((sum, lesson) => sum + lesson.sentenceCount, 0)
  const canManageTopic = !topic.id.startsWith("unassigned-")

  return (
    <article className={`${styles.topicCard} ${syncStyles.clientCard} ${syncStyles.clientTopic}`} style={{ "--accent": meta.accent, "--soft": meta.soft } as CSSProperties}>
      <header className={styles.topicHeader}>
        <button className={styles.expandButton} type="button" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Thu gon" : "Mo rong"}>
          <AdminIcon name={expanded ? "chevronDown" : "chevronRight"} />
        </button>
        <div className={styles.topicCover}>
          {topic.coverUrl ? <img src={topic.coverUrl} alt="" /> : <AdminIcon name={topic.icon === "language" ? "language" : "book"} />}
        </div>
        <div className={styles.topicInfo}>
          <div className={styles.badgeRow}><HskBadge level={level} /><StatusBadge published={topic.status === "published"} /></div>
          <h3>{topic.title}</h3>
          <p>{topic.description}</p>
        </div>
        <div className={styles.topicStats}>
          <span><strong>{topic.lessons.length}</strong>bai hoc</span>
          <span><strong>{vocabCount}</strong>tu vung</span>
          <span><strong>{sentenceCount}</strong>cau</span>
        </div>
        <div className={styles.topicActions}>
          <AdminButton secondary icon="eye" onClick={() => setExpanded(true)}>Xem bai hoc</AdminButton>
          <AdminButton secondary icon="plus" onClick={() => onAddLesson(topic)}>Them bai hoc</AdminButton>
          {canManageTopic && <IconButton icon="edit" label="Sua chu de" onClick={() => onEditTopic(topic)} />}
          {canManageTopic && <IconButton icon="sort" label="Sap xep" />}
          {canManageTopic && <IconButton icon="trash" label="Xoa chu de" danger onClick={() => onDeleteTopic(topic)} />}
        </div>
      </header>
      {expanded && (
        <div className={styles.topicLessons}>
          {topic.lessons.length ? (
            view === "grid" ? (
              <LessonGrid lessons={topic.lessons} level={level} topicTitle={topic.title} onView={onViewLesson} onEdit={onEditLesson} onDuplicate={onDuplicateLesson} onDelete={onDeleteLesson} />
            ) : (
              <LessonTable lessons={topic.lessons} level={level} topicTitle={topic.title} onView={onViewLesson} onEdit={onEditLesson} onDuplicate={onDuplicateLesson} onDelete={onDeleteLesson} />
            )
          ) : <NoLessons onCreate={() => onAddLesson(topic)} onImport={onImport} />}
        </div>
      )}
    </article>
  )
}

export function TopicList(props: Omit<Parameters<typeof TopicCard>[0], "topic"> & { topics: LessonTopic[]; onCreateTopic: () => void }) {
  if (!props.topics.length) {
    return (
      <div className={styles.emptyState}>
        <h3>{props.level.name} chua co chu de nao</h3>
        <p>Hay tao chu de dau tien de bat dau xay dung noi dung theo cau truc HSK - Chu de - Bai hoc.</p>
        <div><AdminButton icon="plus" onClick={props.onCreateTopic}>Tao chu de</AdminButton></div>
      </div>
    )
  }
  return <div className={styles.topicList}>{props.topics.map((topic) => <TopicCard key={topic.id} {...props} topic={topic} />)}</div>
}
