"use client"

import type { CSSProperties } from "react"
import { useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { getHskMeta } from "./lesson-model"
import type { LevelSummary } from "./types"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function HskLevelTabs({ levels, selectedLevelId, onSelect }: { levels: LevelSummary[]; selectedLevelId: string; onSelect: (levelId: string) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside className={`${styles.levelRail} ${syncStyles.clientCard}`} style={collapsed ? { alignSelf: "start" } : undefined}>
      <div className={styles.levelRailHeader}>
        <span>{collapsed ? "HSK" : "Cấp độ"}</span>
        <button type="button" title={collapsed ? "Mở rộng" : "Thu gọn"} aria-label={collapsed ? "Mở rộng danh sách cấp độ" : "Thu gọn danh sách cấp độ"} aria-expanded={!collapsed} onClick={() => setCollapsed((current) => !current)}><AdminIcon name="menu" /></button>
      </div>
      {!collapsed && <div className={styles.levelCards}>
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
              <em>{item.lessons} bài học</em>
              <em>{item.vocabulary} từ</em>
            </button>
          )
        })}
      </div>}
    </aside>
  )
}
