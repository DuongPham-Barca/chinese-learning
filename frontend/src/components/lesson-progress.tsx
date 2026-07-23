"use client"

import type { CSSProperties } from "react"
import { motion } from "framer-motion"
import { fadeInVariants, sectionViewport } from "@/app/animations"
import SharedIcon from "@/components/shared-icon"
import styles from "@/app/lessons/lesson-flow.module.css"

export default function LessonProgress({
  steps,
  progress = 0,
  stepProgress = [],
}: {
  steps: string[]
  progress?: number
  stepProgress?: number[]
}) {
  return (
    <motion.section className={styles.progressCard} variants={fadeInVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
      <div className={styles.progressHead}>
        <div>
          <h1>Tiến độ bài học</h1>
          <p>Tiến độ được cập nhật theo từng chế độ học của chính bài này, dựa trên số từ và số câu thật.</p>
        </div>
        <div className={styles.percentPill} style={{ "--progress": `${progress}%` } as CSSProperties}><span>{progress}%</span></div>
      </div>
      <div className={styles.largeTrack} style={{ "--progress": `${progress}%` } as CSSProperties}><i data-motion-progress style={{ "--motion-progress": progress / 100 } as CSSProperties} /></div>
      <div className={styles.timeline}>
        {steps.map((label, index) => {
          const percent = stepProgress[index] ?? 0
          const done = percent >= 100
          const active = percent > 0 && !done
          return (
            <div className={`${styles.timelineStep} ${done ? styles.timelineStepDone : active ? styles.timelineStepActive : ""}`} key={label}>
              <i><SharedIcon name={done ? "check" : "circle"} size={13} /></i>
              <span>{label}</span>
              {active && <b>{percent}%</b>}
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}
