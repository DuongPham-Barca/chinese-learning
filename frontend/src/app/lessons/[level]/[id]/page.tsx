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
        <Link href={`/lessons/${level}`} className={styles.backButton} aria-label={`Quay lại ${level.toUpperCase()}`}><SharedIcon name="arrowLeft" size={19} /></Link>
        <div className={styles.detailTitle}><strong>{lesson.title}</strong><span>{level.toUpperCase()} - {lesson.vocabulary.length} từ vựng - {lesson.sentences.length} câu luyện tập</span></div>
        <div className={styles.headerProgress}>
          <span className={styles.miniTrack} style={{ "--progress": "0%" } as CSSProperties}><i /></span>
          <b>0%</b>
        </div>
      </div>
    </header>
  )
}

function LessonProgressCard() {
  const steps = ["Thẻ từ vựng", "Phát âm", "Nghe chép", "Sắp xếp từ", "Trắc nghiệm"]
  return (
    <motion.section className={styles.progressCard} variants={fadeInVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
      <div className={styles.progressHead}>
        <div><h1>Tiến độ bài học</h1><p>Hoàn thành từng phần để biến từ mới thành phản xạ chủ động.</p></div>
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
        <h2>Sắp ra mắt</h2>
        <p><strong>{title}</strong> đang được hoàn thiện cho luồng học này. Bạn có thể bắt đầu với các phần đã mở trước.</p>
        <button className={styles.primaryButton} type="button" onClick={onClose}>Đã hiểu</button>
      </motion.div>
    </motion.div>
  )
}

function LearningModuleCard({ type, lesson, level }: { type: string; lesson: LessonDetail; level: string }) {
  const [showModal, setShowModal] = useState(false)
  const status = MODULE_STATUS[type] ?? "coming_soon"
  const isComingSoon = status === "coming_soon"
  const labels: Record<string, { title: string; description: string; duration: string; checklist: string[] }> = {
    flashcard: { title: "Thẻ từ vựng", description: `Học ${lesson.vocabulary.length} từ vựng trọng tâm bằng ghi nhớ trực quan.`, duration: `${Math.max(5, lesson.vocabulary.length)} phút`, checklist: ["Chữ Hán, pinyin và nghĩa", "Có phát âm mẫu", "Phân loại đã thuộc và cần ôn"] },
    pronunciation: { title: "Phát âm", description: "Đọc câu tiếng Trung và nhận phản hồi phát âm.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút`, checklist: ["Luyện nói theo câu", "Vòng điểm phát âm", "Gợi ý theo từng chữ"] },
    dictation: { title: "Nghe chép", description: "Nghe và nhập lại các câu tiếng Trung trong bài.", duration: `${Math.max(5, lesson.sentences.length * 2)} phút`, checklist: ["Gợi ý nghĩa tiếng Việt", "Điều chỉnh tốc độ nghe", "Hiển thị đáp án đúng"] },
    "word-arrangement": { title: "Sắp xếp từ", description: "Sắp xếp từ thành câu tiếng Trung hoàn chỉnh.", duration: `${Math.max(5, lesson.sentences.length)} phút`, checklist: ["Kéo thả thứ tự", "Luyện cấu trúc câu", "Sửa lỗi tức thì"] },
    quiz: { title: "Trắc nghiệm", description: "Ôn lại từ vựng và khả năng hiểu câu.", duration: "10 phút", checklist: ["Câu hỏi tổng hợp", "Điểm cuối bài", "Tóm tắt thông minh"] },
  }
  const item = labels[type] ?? { title: type, description: "", duration: "5 phút", checklist: [] }
  const imgSrc = type === "dictation" || type === "pronunciation" ? "/lesson-dictation.png" : "/lesson-flashcard.png"

  const body = (
    <>
      <div className={styles.moduleArt}><Image src={imgSrc} width={180} height={118} alt="" /><span className={styles.moduleIcon}><SharedIcon name={MODULE_ICONS[type] ?? "bookOpen"} size={28} /></span></div>
      <div className={styles.moduleHeading}>
        <h2>{item.title}</h2>
        <span className={isComingSoon ? styles.soonBadge : styles.newBadge}>{isComingSoon ? "Sắp ra mắt" : "Mới"}</span>
      </div>
      <p>{item.description}</p>
      <ul className={styles.checklist}>{item.checklist.map((check) => <li key={check}><SharedIcon name="check" size={14} />{check}</li>)}</ul>
      <footer className={styles.moduleFooter}>
        <span className={styles.duration}><SharedIcon name="clock" size={14} />{item.duration}</span>
        {isComingSoon ? <span className={styles.disabledAction}>Xem trước</span> : <Link className={styles.moduleAction} href={`/lessons/${level}/${lesson.id}/${type}`}>Bắt đầu</Link>}
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
          setLoadState({ key: requestKey, lesson: null, error: "Bài học không thuộc cấp độ này." })
          return
        }
        setLoadState({ key: requestKey, lesson: response.data.lesson, error: "" })
      })
      .catch(() => {
        if (active) setLoadState({ key: requestKey, lesson: null, error: "Không tìm thấy bài học hoặc máy chủ đang tạm gián đoạn." })
      })
    return () => { active = false }
  }, [id, level, requestKey])

  const loading = loadState.key !== requestKey
  const lesson = loading ? null : loadState.lesson
  const error = loading ? "" : loadState.error

  if (loading) return <LessonLayout><div className={styles.stateCard}><p>Đang tải bài học...</p></div></LessonLayout>
  if (error || !lesson) return <LessonLayout><div className={styles.stateCard}><p>{error || "Không tìm thấy bài học."}</p><Link className={styles.secondaryButton} href={`/lessons/${level}`}>Quay lại danh sách bài học</Link></div></LessonLayout>

  return (
    <LessonLayout>
      <LessonHeader lesson={lesson} level={level} />
      <div className={styles.detailStack}>
        <LessonProgressCard />
        <motion.section className={styles.infoCard} variants={itemVariants} initial="hidden" whileInView="visible" viewport={sectionViewport}>
          <div className={styles.infoIllustration}><SharedIcon name="bookOpen" size={32} /></div>
          <div><h2>Bạn sẽ học gì</h2><p>Bạn sẽ học <strong>{lesson.vocabulary.length} từ vựng</strong> và <strong>{lesson.sentences.length} câu luyện tập</strong>.</p></div>
        </motion.section>
        <motion.section className={styles.moduleGrid} variants={containerVariants} initial="hidden" animate="visible">
          <LearningModuleCard type="flashcard" lesson={lesson} level={level} />
          <LearningModuleCard type="pronunciation" lesson={lesson} level={level} />
          <LearningModuleCard type="dictation" lesson={lesson} level={level} />
          <LearningModuleCard type="word-arrangement" lesson={lesson} level={level} />
          <LearningModuleCard type="quiz" lesson={lesson} level={level} />
        </motion.section>
      </div>
      <aside className={styles.bottomBar}><div className={styles.bottomInner}><div><span>Trạng thái bài học</span><strong>Chưa bắt đầu</strong></div><Link className={styles.primaryButton} href={`/lessons/${level}/${id}/flashcard`}>Bắt đầu học <SharedIcon name="arrowRight" size={15} /></Link></div></aside>
    </LessonLayout>
  )
}
