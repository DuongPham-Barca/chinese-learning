"use client"

import { use, useEffect, useState, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { cardVariants, containerVariants, fadeInVariants, itemVariants, sectionViewport } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon, { type SharedIconName } from "@/components/shared-icon"
import api from "@/lib/api"
import type { LessonDetail } from "@/types/api"
import styles from "../../lesson-flow.module.css"

const MODULE_STATUS: Record<string, "active" | "coming_soon"> = {
  flashcard: "active",
  pronunciation: "active",
  dictation: "active",
  "word-arrangement": "coming_soon",
  quiz: "coming_soon",
}

const MODULE_ICONS: Record<string, SharedIconName> = {
  flashcard: "layers",
  pronunciation: "mic",
  dictation: "headphones",
  "word-arrangement": "keyboard",
  quiz: "target",
}

function LessonHeader({ lesson, level }: { lesson: LessonDetail; level: string }) {
  return (
    <header className={styles.detailHeader}>
      <div className={styles.detailHeaderInner}>
        <Link href={`/lessons/${level}`} className={styles.backButton} aria-label={`Back to ${level.toUpperCase()}`}><SharedIcon name="arrowLeft" size={19} /></Link>
        <div className={styles.detailTitle}><strong>{lesson.title}</strong><span>{level.toUpperCase()} - {lesson.vocabulary.length} vocabulary - {lesson.sentences.length} sentences</span></div>
        <div className={styles.headerProgress}>
          <span className={styles.miniTrack} style={{ "--progress": "0%" } as CSSProperties}><i /></span>
          <b>0%</b>
        </div>
      </div>
    </header>
  )
}

function LessonProgressCard() {
  const steps = ["Flashcard", "Pronunciation", "Dictation", "Word Sorting", "Quiz"]
  return (
    <motion.section className={styles.progressCard} variants={fadeInVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
      <div className={styles.progressHead}>
        <div><h1>Lesson progress</h1><p>Complete each module to turn new words into active recall.</p></div>
        <div className={styles.percentPill} style={{ "--progress": "0%" } as CSSProperties}><span>0%</span></div>
      </div>
      <div className={styles.largeTrack} style={{ "--progress": "0%" } as CSSProperties}><i /></div>
      <div className={styles.timeline}>{steps.map((label) => <div className={styles.timelineStep} key={label}><i><SharedIcon name="circle" size={13} /></i>{label}</div>)}</div>
    </motion.section>
  )
}

function ComingSoonModal({ title, onClose }: { title: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <motion.div className={styles.modalOverlay} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}>
        <div className={styles.modalArt}><SharedIcon name="wand" size={38} /></div>
        <h2>Coming soon</h2>
        <p><strong>{title}</strong> is being polished for this lesson flow. Start with the available modules now.</p>
        <button className={styles.primaryButton} type="button" onClick={onClose}>Got it</button>
      </motion.div>
    </motion.div>
  )
}

function LearningModuleCard({ type, lesson, level }: { type: string; lesson: LessonDetail; level: string }) {
  const [showModal, setShowModal] = useState(false)
  const status = MODULE_STATUS[type] ?? "coming_soon"
  const isComingSoon = status === "coming_soon"
  const labels: Record<string, { title: string; description: string; duration: string; checklist: string[] }> = {
    flashcard: { title: "Flashcard", description: `Learn ${lesson.vocabulary.length} core words with fast visual recall.`, duration: `${Math.max(5, lesson.vocabulary.length)} min`, checklist: ["Hanzi, pinyin, and meaning", "Audio pronunciation", "Known and review sorting"] },
    pronunciation: { title: "Pronunciation", description: "Read Chinese sentences and get pronunciation feedback.", duration: `${Math.max(5, lesson.sentences.length * 2)} min`, checklist: ["Sentence speaking practice", "Score ring feedback", "Word-level hints"] },
    dictation: { title: "Dictation", description: "Listen and type the Chinese sentences from this lesson.", duration: `${Math.max(5, lesson.sentences.length * 2)} min`, checklist: ["Vietnamese hint", "Playback speed control", "Correct answer feedback"] },
    "word-arrangement": { title: "Word Sorting", description: "Arrange words into complete Chinese sentences.", duration: `${Math.max(5, lesson.sentences.length)} min`, checklist: ["Drag and order", "Sentence structure", "Instant correction"] },
    quiz: { title: "Quiz", description: "Review vocabulary and sentence comprehension.", duration: "10 min", checklist: ["Mixed questions", "Final score", "Smart recap"] },
  }
  const item = labels[type] ?? { title: type, description: "", duration: "5 min", checklist: [] }
  const imgSrc = type === "dictation" || type === "pronunciation" ? "/lesson-dictation.png" : "/lesson-flashcard.png"

  const body = (
    <>
      <div className={styles.moduleArt}><Image src={imgSrc} width={180} height={118} alt="" /><span className={styles.moduleIcon}><SharedIcon name={MODULE_ICONS[type] ?? "bookOpen"} size={28} /></span></div>
      <div className={styles.moduleHeading}>
        <h2>{item.title}</h2>
        <span className={isComingSoon ? styles.soonBadge : styles.newBadge}>{isComingSoon ? "Coming Soon" : "New"}</span>
      </div>
      <p>{item.description}</p>
      <ul className={styles.checklist}>{item.checklist.map((check) => <li key={check}><SharedIcon name="check" size={14} />{check}</li>)}</ul>
      <footer className={styles.moduleFooter}>
        <span className={styles.duration}><SharedIcon name="clock" size={14} />{item.duration}</span>
        {isComingSoon ? <span className={styles.disabledAction}>Preview</span> : <Link className={styles.moduleAction} href={`/lessons/${level}/${lesson.id}/${type}`}>Start</Link>}
      </footer>
      <AnimatePresence>{showModal && <ComingSoonModal title={item.title} onClose={() => setShowModal(false)} />}</AnimatePresence>
    </>
  )

  return isComingSoon ? <motion.article className={`${styles.moduleCard} ${styles.moduleCardComing}`} variants={cardVariants} onClick={() => setShowModal(true)}>{body}</motion.article> : <motion.article className={styles.moduleCard} variants={cardVariants}>{body}</motion.article>
}

export default function LessonDetailPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const requestKey = `${level}:${id}`
  const [loadState, setLoadState] = useState<{ key: string; lesson: LessonDetail | null; error: string }>({ key: "", lesson: null, error: "" })

  useEffect(() => {
    let active = true
    api.get<{ lesson: LessonDetail }>(`/lessons/${id}`)
      .then((response) => {
        if (!active) return
        if (response.data.lesson.levelType.toLowerCase() !== level.toLowerCase()) {
          setLoadState({ key: requestKey, lesson: null, error: "Bai hoc khong thuoc cap do nay." })
          return
        }
        setLoadState({ key: requestKey, lesson: response.data.lesson, error: "" })
      })
      .catch(() => {
        if (active) setLoadState({ key: requestKey, lesson: null, error: "Khong tim thay bai hoc hoac may chu dang tam gian doan." })
      })
    return () => { active = false }
  }, [id, level, requestKey])

  const loading = loadState.key !== requestKey
  const lesson = loading ? null : loadState.lesson
  const error = loading ? "" : loadState.error

  if (loading) return <LessonLayout><div className={styles.stateCard}><p>Dang tai bai hoc...</p></div></LessonLayout>
  if (error || !lesson) return <LessonLayout><div className={styles.stateCard}><p>{error || "Khong tim thay bai hoc."}</p><Link className={styles.secondaryButton} href={`/lessons/${level}`}>Back to lessons</Link></div></LessonLayout>

  return (
    <LessonLayout>
      <LessonHeader lesson={lesson} level={level} />
      <div className={styles.detailStack}>
        <LessonProgressCard />
        <motion.section className={styles.infoCard} variants={itemVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <div className={styles.infoIllustration}><SharedIcon name="bookOpen" size={32} /></div>
          <div><h2>What you will learn</h2><p>You will learn <strong>{lesson.vocabulary.length} vocabulary</strong> and <strong>{lesson.sentences.length} practice sentences</strong>.</p></div>
        </motion.section>
        <motion.section className={styles.moduleGrid} variants={containerVariants} initial="hidden" animate="visible">
          <LearningModuleCard type="flashcard" lesson={lesson} level={level} />
          <LearningModuleCard type="pronunciation" lesson={lesson} level={level} />
          <LearningModuleCard type="dictation" lesson={lesson} level={level} />
          <LearningModuleCard type="word-arrangement" lesson={lesson} level={level} />
          <LearningModuleCard type="quiz" lesson={lesson} level={level} />
        </motion.section>
      </div>
      <aside className={styles.bottomBar}><div className={styles.bottomInner}><div><span>Lesson status</span><strong>Not started</strong></div><Link className={styles.primaryButton} href={`/lessons/${level}/${id}/flashcard`}>Start Learning <SharedIcon name="arrowRight" size={15} /></Link></div></aside>
    </LessonLayout>
  )
}
