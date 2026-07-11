"use client"

import type { CSSProperties } from "react"
import { motion } from "framer-motion"
import { fadeInVariants, sectionViewport } from "@/app/animations"
import SharedIcon from "@/components/shared-icon"
import styles from "@/app/lessons/lesson-flow.module.css"

export default function LessonProgress({ steps, progress = 0 }: { steps: string[]; progress?: number }) {
  return (
    <motion.section className={styles.progressCard} variants={fadeInVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
      <div className={styles.progressHead}>
        <div>
          <h1>Tiến độ bài học</h1>
          <p>Hoàn thành từng phần theo luồng học mới: ghi nhớ từ, nghe chép, dựng câu, phản xạ nói và ôn tập.</p>
        </div>
        <div className={styles.percentPill} style={{ "--progress": `${progress}%` } as CSSProperties}><span>{progress}%</span></div>
      </div>
      <div className={styles.largeTrack} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
      <div className={styles.timeline}>
        {steps.map((label) => <div className={styles.timelineStep} key={label}><i><SharedIcon name="circle" size={13} /></i>{label}</div>)}
      </div>
    </motion.section>
  )
}
