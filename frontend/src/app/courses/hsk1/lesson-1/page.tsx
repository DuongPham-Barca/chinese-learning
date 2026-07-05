import Image from "next/image"
import Link from "next/link"
import styles from "./lesson.module.css"

type IconName = "arrow" | "check" | "circle" | "book" | "clock" | "warning"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    circle: <circle cx="12" cy="12" r="8" />,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"/><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    warning: <><path d="M10.3 3.7 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function LessonHeader() {
  return (
    <nav className={styles.lessonHeader}>
      <div className={styles.headerInner}>
        <Link href="/courses/hsk1" className={styles.back} aria-label="Quay lại HSK1"><Icon name="arrow" /></Link>
        <div className={styles.lessonTitle}><strong>Bài 1: Chào hỏi cơ bản</strong><span>HSK1 • 10 từ vựng • 5 câu luyện tập</span></div>
        <div className={styles.progressCircle}><span>40%</span></div>
      </div>
    </nav>
  )
}

function LessonProgressCard() {
  const steps: Array<[string, boolean]> = [["Flashcard", true], ["Dictation", false], ["Trắc nghiệm", false]]
  return (
    <section className={styles.progressCard}>
      <div className={styles.progressHeading}><h1>Tiến độ bài học</h1><div><strong>40%</strong><span>Đã hoàn thành</span></div></div>
      <div className={styles.progressTrack}><span /></div>
      <div className={styles.stepNavigation}>{steps.map(([label, active]) => <div className={active ? styles.activeStep : ""} key={label}><i><Icon name={active ? "check" : "circle"} /></i><span>{label}</span></div>)}</div>
    </section>
  )
}

function LearningInfoCard() {
  return (
    <section className={styles.infoCard}>
      <i><Icon name="book" /></i>
      <p>Bạn sẽ học: <strong>10 từ vựng</strong>, <strong>5 câu hội thoại</strong>, <strong>2 mẫu ngữ pháp</strong>. <span>Thời gian ước tính: <b>20 phút</b>.</span></p>
    </section>
  )
}

type ModuleCardProps = {
  type: "flashcard" | "dictation"
  image: string
  title: string
  badge: string
  description: string
  duration: string
  href: string
}

function LearningModuleCard({ type, image, title, badge, description, duration, href }: ModuleCardProps) {
  const isFlashcard = type === "flashcard"
  return (
    <article className={styles.moduleCard}>
      <div className={styles.moduleImage}><Image src={image} fill sizes="260px" alt={`Minh họa ${title}`} /></div>
      <div className={styles.moduleHeading}><h2>{title}</h2><span className={isFlashcard ? styles.completeBadge : styles.pendingBadge}>{badge}</span></div>
      <p className={styles.moduleDescription}>{description}</p>
      {isFlashcard ? (
        <ul className={styles.checklist}><li><Icon name="check" />Chào hỏi, cảm ơn, tạm biệt</li><li><Icon name="check" />Kèm âm thanh bản xứ</li></ul>
      ) : (
        <div className={styles.warning}><Icon name="warning" /><span>Nên hoàn thành phần Flashcard để có kết quả luyện tập tốt nhất.</span></div>
      )}
      <footer className={styles.moduleFooter}><span><Icon name="clock" />{duration}</span><Link className={isFlashcard ? styles.primaryButton : styles.outlineButton} href={href}>{isFlashcard ? "Ôn tập lại" : "Bắt đầu luyện"}</Link></footer>
    </article>
  )
}

function StickyContinueBar() {
  return (
    <aside className={styles.stickyBar}>
      <div className={styles.stickyInner}><div><span>Trạng thái hiện tại</span><strong>Chưa bắt đầu: Dictation &amp; Sắp xếp</strong></div><Link href="/courses/hsk1/lesson-1/dictation">Tiếp tục học <b>→</b></Link></div>
    </aside>
  )
}

export default function LessonOverviewPage() {
  return (
    <main className={styles.page}>
      <LessonHeader />
      <div className={styles.container}>
        <LessonProgressCard />
        <LearningInfoCard />
        <section className={styles.contentGrid}>
          <LearningModuleCard type="flashcard" image="/lesson-flashcard.png" title="Flashcard" badge="Đã hoàn thành" description="Học 10 từ vựng cốt lõi thông qua hệ thống lặp lại ngắt quãng thông minh." duration="8 phút" href="/courses/hsk1/lesson-1/flashcards" />
          <LearningModuleCard type="dictation" image="/lesson-dictation.png" title="Dictation & Sắp xếp" badge="Chưa bắt đầu" description="Luyện nghe và ghép câu hoàn chỉnh từ 5 đoạn hội thoại thực tế." duration="12 phút" href="/courses/hsk1/lesson-1/dictation" />
        </section>
      </div>
      <StickyContinueBar />
    </main>
  )
}
