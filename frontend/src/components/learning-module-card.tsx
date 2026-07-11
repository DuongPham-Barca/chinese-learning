"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import type { LearningModule } from "@/app/lessons/[level]/[id]/learning-modules"
import SharedIcon from "@/components/shared-icon"
import styles from "@/app/lessons/lesson-flow.module.css"

export default function LearningModuleCard({ module }: { module: LearningModule }) {
  const disabled = module.status === "coming_soon"

  return (
    <motion.article className={styles.moduleCard} variants={cardVariants}>
      <div className={styles.moduleArt}>
        <Image src={module.image} width={180} height={118} alt="" />
        <span className={styles.moduleIcon}><SharedIcon name={module.icon} size={28} /></span>
      </div>
      <div className={styles.moduleHeading}>
        <h2>{module.title}</h2>
        {disabled && <span className={styles.soonBadge}>Sắp ra mắt</span>}
      </div>
      <p>{module.description}</p>
      <ul className={styles.checklist}>
        {module.checklist.map((item) => <li key={item}><SharedIcon name="check" size={14} />{item}</li>)}
      </ul>
      <footer className={styles.moduleFooter}>
        <span className={styles.duration}><SharedIcon name="clock" size={14} />{module.duration}</span>
        {disabled ? (
          <span className={styles.disabledAction}>Sắp ra mắt</span>
        ) : (
          <Link className={styles.moduleAction} href={module.href}>Bắt đầu</Link>
        )}
      </footer>
    </motion.article>
  )
}
