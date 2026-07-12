"use client"

import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton } from "@/components/admin/admin-ui"
import type { LessonTopic, ViewMode } from "./types"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function LessonFilters({
  search,
  status,
  topicId,
  sort,
  view,
  topics,
  onSearch,
  onStatus,
  onTopic,
  onSort,
  onView,
  onRefresh,
}: {
  search: string
  status: string
  topicId: string
  sort: string
  view: ViewMode
  topics: LessonTopic[]
  onSearch: (value: string) => void
  onStatus: (value: string) => void
  onTopic: (value: string) => void
  onSort: (value: string) => void
  onView: (value: ViewMode) => void
  onRefresh: () => void
}) {
  return (
    <section className={`${styles.filters} ${syncStyles.clientCard}`}>
      <label className={styles.searchBox}>
        <AdminIcon name="search" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tim chu de hoac bai hoc..." />
      </label>
      <div className={styles.filterControls}>
        <select value={topicId} onChange={(event) => onTopic(event.target.value)}>
          <option value="">Tat ca chu de</option>
          {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}
        </select>
        <select value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">Tat ca trang thai</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={sort} onChange={(event) => onSort(event.target.value)}>
          <option value="order">Theo thu tu</option>
          <option value="updatedAt">Cap nhat gan nhat</option>
          <option value="title">Ten A-Z</option>
        </select>
        <div className={styles.segmentedControl} aria-label="Che do xem">
          <button type="button" className={view === "grid" ? styles.segmentActive : ""} onClick={() => onView("grid")} title="Grid view"><AdminIcon name="grid" /></button>
          <button type="button" className={view === "table" ? styles.segmentActive : ""} onClick={() => onView("table")} title="Table view"><AdminIcon name="list" /></button>
        </div>
        <AdminButton secondary icon="filter" onClick={onRefresh}>Tai lai</AdminButton>
      </div>
    </section>
  )
}
