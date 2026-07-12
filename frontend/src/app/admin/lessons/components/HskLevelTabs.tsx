"use client"

import type { CSSProperties } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { getHskMeta } from "./lesson-model"
import type { LevelSummary } from "./types"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function HskLevelTabs({ levels, selectedLevelId, onSelect }: { levels: LevelSummary[]; selectedLevelId: string; onSelect: (levelId: string) => void }) {
  return (
    <aside className={`${styles.levelRail} ${syncStyles.clientCard}`}>
      <div className={styles.levelRailHeader}>
        <span>Cấp độ</span>
        <button type="button" title="Thu gọn" aria-label="Thu gọn"><AdminIcon name="menu" /></button>
      </div>
      <div className={styles.levelCards}>
        {levels.map((item) => {
          const meta = getHskMeta(item.level)
          const active = selectedLevelId === item.level.id
          return (
            <button
              key={item.level.id}
              type="button"
              className={`${styles.levelCard} ${active ? styles.activeLevelCard : ""}`}
              style={{ "--accent": meta.accent, "--soft": meta.soft } as CSSProperties}
              onClick={() => onSelect(item.level.id)}
            >
              <span className={styles.levelDot} />
              <strong>{item.level.name}</strong>
              <small>{item.description}</small>
              <em>{item.topics} chủ đề</em>
              <em>{item.lessons} bài học</em>
              <em>{item.vocabulary} tu</em>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
