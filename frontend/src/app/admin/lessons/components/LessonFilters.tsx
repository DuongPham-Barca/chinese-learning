"use client"

import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton } from "@/components/admin/admin-ui"
import type { ViewMode } from "./types"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function LessonFilters({
  search,
  status,
  sort,
  view,
  onSearch,
  onStatus,
  onSort,
  onView,
  onRefresh,
}: {
  search: string
  status: string
  sort: string
  view: ViewMode
  onSearch: (value: string) => void
  onStatus: (value: string) => void
  onSort: (value: string) => void
  onView: (value: ViewMode) => void
  onRefresh: () => void
}) {
  return (
    <section className={`${styles.filters} ${syncStyles.clientCard}`}>
      <label className={styles.searchBox}>
        <AdminIcon name="search" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm bài học..." />
      </label>
      <div className={styles.filterControls}>
        <select value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
        </select>
        <select value={sort} onChange={(event) => onSort(event.target.value)}>
          <option value="order">Theo thứ tự</option>
          <option value="updatedAt">Cập nhật gần nhất</option>
          <option value="title">Tên A-Z</option>
        </select>
        <div className={styles.segmentedControl} aria-label="Chế độ xem">
          <button type="button" className={view === "grid" ? styles.segmentActive : ""} onClick={() => onView("grid")} title="Grid view"><AdminIcon name="grid" /></button>
          <button type="button" className={view === "table" ? styles.segmentActive : ""} onClick={() => onView("table")} title="Table view"><AdminIcon name="list" /></button>
        </div>
        <AdminButton secondary icon="filter" onClick={onRefresh}>Tải lại</AdminButton>
      </div>
    </section>
  )
}
