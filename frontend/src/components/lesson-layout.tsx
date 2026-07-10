"use client"

import type { ReactNode } from "react"
import SiteNavbar from "@/components/site-navbar"
import styles from "@/app/lessons/lesson-flow.module.css"

export default function LessonLayout({ children, className = "", fullscreen = false }: { children: ReactNode; className?: string; fullscreen?: boolean }) {
  return <main className={`${styles.lessonPage} ${className}`}>{!fullscreen && <SiteNavbar active="lessons" />}<div className={fullscreen ? styles.fullscreenShell : styles.lessonShell}>{children}</div></main>
}
