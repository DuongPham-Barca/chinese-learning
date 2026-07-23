"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import type { LearningModule } from "@/app/lessons/[level]/[id]/learning-modules"
import SharedIcon from "@/components/shared-icon"
import type { LessonModuleProgress } from "@/services/lesson-progress.service"
import styles from "@/app/lessons/lesson-flow.module.css"

export default function LearningModuleCard({ module, progress, recommended = false }: { module: LearningModule; progress?: LessonModuleProgress; recommended?: boolean }) {
  const disabled = module.status === "coming_soon" || module.totalItems === 0
  const completedItems = Math.min(progress?.completed ?? 0, module.totalItems)
  const percent = module.totalItems ? Math.round((completedItems / module.totalItems) * 100) : 0
  const started = percent > 0
  const completed = percent >= 100
  const actionLabel = completed ? "Học lại" : started ? "Tiếp tục" : "Bắt đầu"

  return (
    <motion.article className={`${styles.moduleCard} ${recommended ? styles.moduleCardRecommended : ""}`} variants={cardVariants}>
      <div className={styles.moduleArt}>
        <Image src={module.image} width={180} height={118} alt="" />
        <span className={styles.moduleIcon}><SharedIcon name={module.icon} size={28} /></span>
      </div>
      <div className={styles.moduleHeading}>
        <h2>{module.title}</h2>
        {recommended && !disabled && <span className={styles.recommendedBadge}>Học tiếp</span>}
        {module.totalItems === 0 && <span className={styles.soonBadge}>Chưa có dữ liệu</span>}
        {module.totalItems > 0 && module.status === "coming_soon" && <span className={styles.soonBadge}>Sắp ra mắt</span>}
        {!disabled && completed && <span className={styles.doneBadge}>Hoàn thành</span>}
        {!disabled && started && !completed && !recommended && <span className={styles.newBadge}>{percent}%</span>}
      </div>
      <p>{module.description}</p>
      <ul className={styles.checklist}>
        {module.checklist.map((item) => <li key={item}><SharedIcon name="check" size={14} />{item}</li>)}
      </ul>
      <div className={styles.moduleProgress}>
        <span><b>{completedItems}</b>/{module.totalItems} mục</span>
        <i><em data-motion-progress style={{ "--motion-progress": percent / 100 } as React.CSSProperties} /></i>
      </div>
      <footer className={styles.moduleFooter}>
        {disabled ? (
          <span className={styles.disabledAction}>{module.totalItems === 0 ? "Chưa có dữ liệu" : "Sắp ra mắt"}</span>
        ) : (
          <Link className={styles.moduleAction} href={module.href}>{actionLabel}</Link>
        )}
      </footer>
    </motion.article>
  )
}
