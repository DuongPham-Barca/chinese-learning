import type { ReactNode } from "react"
import SharedIcon from "@/components/shared-icon"
import styles from "./study-completion.module.css"

type CompletionStat = {
  label: string
  value: ReactNode
}

export default function StudyCompletion({ title, description, stats, children }: { title: string; description: string; stats: CompletionStat[]; children: ReactNode }) {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}><SharedIcon name="check" size={28} /></div>
        <span className={styles.label}>Hoàn thành</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.stats}>
          {stats.map((stat) => <span key={stat.label}><b>{stat.value}</b>{stat.label}</span>)}
        </div>
        <div className={styles.actions}>{children}</div>
      </div>
    </section>
  )
}
