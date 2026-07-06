"use client"

import styles from "./loading-spinner.module.css"

export default function LoadingSpinner() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.dot} style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
