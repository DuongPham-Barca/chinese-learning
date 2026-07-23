import type { ReactNode } from "react"
import SharedIcon from "@/components/shared-icon"
import styles from "./study-session-workspace.module.css"

type MetricTone = "neutral" | "good" | "warn"

export type StudySessionMetric = {
  label: string
  value: ReactNode
  tone?: MetricTone
}

type StudySessionWorkspaceProps = {
  current: number
  total: number
  progress: number
  metrics: StudySessionMetric[]
  stateLabel: string
  stateTone?: MetricTone
  children: ReactNode
}

export default function StudySessionWorkspace({ current, total, progress, metrics, stateLabel, stateTone = "neutral", children }: StudySessionWorkspaceProps) {
  const safeProgress = Math.max(0, Math.min(progress, 100))
  const completed = Math.min(total, Math.floor((safeProgress / 100) * total))

  return (
    <div className={styles.workspace}>
      <section className={styles.mobileSummary} aria-label="Tóm tắt phiên học">
        <div>
          <span>Câu {current}/{total}</span>
          <strong>{Math.round(safeProgress)}%</strong>
        </div>
        <div className={styles.mobileTrack} style={{ "--session-progress": `${safeProgress}%` } as React.CSSProperties}><i data-motion-progress style={{ "--motion-progress": safeProgress / 100 } as React.CSSProperties} /></div>
        <span className={`${styles.mobileState} ${styles[stateTone]}`}><i />{stateLabel}</span>
      </section>

      <aside className={styles.sidePanel} aria-label="Tiến độ phiên học">
        <div className={styles.sideHeading}><span>Tiến độ phiên</span><strong>{Math.round(safeProgress)}%</strong></div>
        <div className={styles.progressTrack} style={{ "--session-progress": `${safeProgress}%` } as React.CSSProperties}><i data-motion-progress style={{ "--motion-progress": safeProgress / 100 } as React.CSSProperties} /></div>
        <div className={styles.sessionSummary}>
          <span><small>Hiện tại</small><b>{current}/{total}</b></span>
          <span><small>Đã hoàn thành</small><b>{completed}</b></span>
        </div>
        <div className={styles.itemMap} aria-label="Vị trí các câu trong phiên">
          {Array.from({ length: total }, (_, index) => (
            <span
              aria-current={index === current - 1 ? "step" : undefined}
              className={`${index < completed ? styles.itemDone : ""} ${index === current - 1 ? styles.itemCurrent : ""}`}
              key={index}
            >
              {index + 1}
            </span>
          ))}
        </div>
      </aside>

      <main className={styles.main}>{children}</main>

      <aside className={`${styles.sidePanel} ${styles.resultPanel}`} aria-label="Kết quả phiên học">
        <div className={styles.resultHeading}><span><SharedIcon name="target" size={18} />Kết quả</span></div>
        <div className={`${styles.stateBadge} ${styles[stateTone]}`}><i />{stateLabel}</div>
        <dl className={styles.metrics}>
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className={styles[metric.tone || "neutral"]}>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
