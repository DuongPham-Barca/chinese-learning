import Link from "next/link"
import ProUpgradeTrigger from "@/components/pro-upgrade/pro-upgrade-trigger"
import styles from "./hsk1/hsk1.module.css"

type IconName = "arrow" | "bell" | "user" | "book" | "translate" | "fire" | "check" | "play" | "lock" | "layers" | "shield" | "devices"
type LessonState = "completed" | "current" | "pro" | "locked"

type Lesson = {
  title: string
  state: LessonState
  tag?: string
  subtitle?: string
}

export type HSKLevel = "hsk1" | "hsk2" | "hsk3" | "hsk4" | "hsk5" | "hsk6"

type LevelConfig = {
  name: string
  band: string
  description: string
  totalLessons: number
  vocabulary: number
  titles: string[]
}

const levelConfigs: Record<HSKLevel, LevelConfig> = {
  hsk1: { name: "HSK1 — Cơ bản", band: "CẤP ĐỘ SƠ CẤP", totalLessons: 10, vocabulary: 120, description: "Làm quen với phát âm, từ vựng và các mẫu câu tiếng Trung cơ bản. Nền tảng vững chắc cho hành trình chinh phục tiếng Trung của bạn.", titles: ["Chào hỏi cơ bản", "Số đếm và tuổi", "Giới thiệu bản thân", "Thời gian và ngày tháng", "Đồ ăn và thức uống", "Mua sắm cơ bản", "Gia đình và phương hướng", "Hoạt động hằng ngày", "Sở thích cá nhân", "Ôn tập HSK1"] },
  hsk2: { name: "HSK2 — Sơ cấp", band: "CẤP ĐỘ SƠ CẤP", totalLessons: 20, vocabulary: 300, description: "Mở rộng vốn từ và làm chủ các mẫu câu giao tiếp quen thuộc trong cuộc sống hằng ngày.", titles: ["Chào hỏi nâng cao", "Lịch trình hằng ngày", "Hỏi đường và phương tiện", "Thời tiết và mùa", "Ăn uống tại nhà hàng", "Mua sắm và giá cả", "Sức khỏe cơ bản", "Trường học và công việc", "Du lịch ngắn ngày", "Ôn tập HSK2"] },
  hsk3: { name: "HSK3 — Trung cấp", band: "CẤP ĐỘ TRUNG CẤP", totalLessons: 35, vocabulary: 650, description: "Phát triển khả năng giao tiếp độc lập, đọc hiểu và diễn đạt trong nhiều tình huống thực tế.", titles: ["Kinh nghiệm cá nhân", "Kế hoạch tương lai", "Môi trường công sở", "Du lịch và văn hóa", "Sức khỏe và thể thao", "Cảm xúc và quan điểm", "Các mối quan hệ", "Công nghệ đời sống", "Đọc hiểu trung cấp", "Ôn tập HSK3"] },
  hsk4: { name: "HSK4 — Trung cao cấp", band: "CẤP ĐỘ TRUNG CAO", totalLessons: 45, vocabulary: 1200, description: "Củng cố ngữ pháp trung cấp, tăng tốc độ đọc hiểu và giao tiếp tự nhiên, mạch lạc hơn.", titles: ["Giao tiếp nơi làm việc", "Giáo dục và phát triển", "Văn hóa và truyền thống", "Kinh tế đời sống", "Môi trường và xã hội", "Sức khỏe tinh thần", "Truyền thông hiện đại", "Phân tích quan điểm", "Đọc hiểu chuyên sâu", "Ôn tập HSK4"] },
  hsk5: { name: "HSK5 — Cao cấp", band: "CẤP ĐỘ CAO CẤP", totalLessons: 55, vocabulary: 2500, description: "Đọc hiểu văn bản dài, trình bày quan điểm rõ ràng và sử dụng tiếng Trung linh hoạt trong học tập, công việc.", titles: ["Ngôn ngữ báo chí", "Văn học hiện đại", "Kinh doanh và quản lý", "Khoa học và khám phá", "Lịch sử Trung Hoa", "Nghệ thuật và thẩm mỹ", "Tranh luận xã hội", "Thành ngữ thông dụng", "Đọc hiểu học thuật", "Ôn tập HSK5"] },
  hsk6: { name: "HSK6 — Thành thạo", band: "CẤP ĐỘ THÀNH THẠO", totalLessons: 70, vocabulary: 5000, description: "Hoàn thiện năng lực ngôn ngữ cao cấp, xử lý văn bản phức tạp và diễn đạt chính xác, tự nhiên.", titles: ["Phân tích văn học", "Ngôn ngữ học thuật", "Kinh tế vĩ mô", "Triết học phương Đông", "Ngoại giao và quốc tế", "Khoa học chuyên sâu", "Văn hóa đương đại", "Biên tập và tóm tắt", "Đọc hiểu nâng cao", "Ôn tập HSK6"] },
}

function getLessons(config: LevelConfig): Lesson[] {
  return config.titles.map((title, index) => {
    if (index < 2) return { title, state: "completed", tag: "Miễn phí", subtitle: "100% hoàn thành" }
    if (index === 2) return { title, state: "current", tag: "Miễn phí", subtitle: "Đang học · 40%" }
    if (index === 3) return { title, state: "pro", tag: "Pro", subtitle: "Mở khóa bằng nâng cấp" }
    return { title, state: "locked" }
  })
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="m15 18-6-6 6-6" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"/><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z"/></>,
    translate: <><path d="M3 5h12M9 3v2M5 9c1.5 3 4 5 7 6M13 9c-1.5 3-4 5-7 6"/><path d="m14 21 4-9 4 9M15.5 18h5"/></>,
    fire: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    devices: <><rect x="2" y="4" width="14" height="11" rx="2"/><path d="M7 20h4M9 15v5"/><rect x="18" y="8" width="4" height="10" rx="1"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function AppNavbar({ level }: { level: HSKLevel }) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.back} aria-label="Về trang chủ"><Icon name="arrow" /></Link>
        <Link href="/" className={styles.brand}><span>中</span><strong>ChineseDict</strong></Link>
        <div className={styles.menu}><Link className={styles.active} href={`/courses/${level}`}>Học tập</Link><a href="#dictionary">Từ điển</a><a href="#community">Cộng đồng</a></div>
        <div className={styles.navTools}><button type="button" aria-label="Thông báo"><Icon name="bell" /></button><button type="button" aria-label="Tài khoản"><Icon name="user" /></button></div>
      </div>
    </nav>
  )
}

function ProgressCard({ config }: { config: LevelConfig }) {
  const progress = Math.round((3 / config.totalLessons) * 100)
  const stats: Array<[IconName, string, string]> = [["book", "ĐÃ HỌC", "3 bài"], ["translate", "TỪ VỰNG", `${config.vocabulary} từ`], ["fire", "CHUỖI HỌC", "5 ngày"]]
  return (
    <section className={styles.progressCard}>
      <div className={styles.progressTop}><div><h2>Tiến độ học tập</h2><p>3/{config.totalLessons} bài đã hoàn thành ({progress}%)</p></div><Link href="#current">Tiếp tục: Bài 3</Link></div>
      <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
      <div className={styles.progressStats}>{stats.map(([icon,label,value]) => <div key={label}><i><Icon name={icon} /></i><span><small>{label}</small><strong>{value}</strong></span></div>)}</div>
    </section>
  )
}

function LessonItem({ lesson, index, level }: { lesson: Lesson; index: number; level: HSKLevel }) {
  const icon: IconName = lesson.state === "completed" ? "check" : lesson.state === "current" ? "play" : "lock"
  return (
    <article id={lesson.state === "current" ? "current" : undefined} className={`${styles.lessonItem} ${styles[lesson.state]}`}>
      <div className={styles.lessonIcon}><Icon name={icon} /></div>
      <div className={styles.lessonInfo}>
        <div className={styles.lessonTitle}><h3>{lesson.title}</h3>{lesson.tag && <span className={lesson.tag === "Pro" ? styles.proBadge : ""}>{lesson.tag}</span>}{lesson.state === "current" && <span>Từ vựng</span>}</div>
        {lesson.subtitle && <p>{lesson.subtitle}</p>}
      </div>
      {lesson.state === "completed" && <span className={styles.chevron}>›</span>}
      {lesson.state === "current" && <Link className={styles.continueButton} href={level === "hsk1" ? "/courses/hsk1/lesson-1" : `/lessons/${level}/${index + 1}`}>Tiếp tục học →</Link>}
      {lesson.state === "pro" && <ProUpgradeTrigger className={styles.unlockText} unlockedHref={`/lessons/${level}/${index + 1}`} loggedOutLabel="Đăng nhập để học" upgradeLabel="Nâng cấp để mở khóa" proLabel="Bắt đầu học" />}
      {lesson.state === "locked" && <ProUpgradeTrigger className={styles.lockedUpgrade} unlockedHref={`/lessons/${level}/${index + 1}`} loggedOutLabel="Đăng nhập để học" upgradeLabel="Nâng cấp để mở khóa" proLabel="Bắt đầu học" />}
    </article>
  )
}

function ProCtaCard({ config }: { config: LevelConfig }) {
  const levelName = config.name.split(" — ")[0]
  return (
    <section id="upgrade" className={styles.proCta}>
      <div className={styles.cube}><Icon name="layers" /></div>
      <h2>Mở khóa toàn bộ {levelName}</h2>
      <p>Truy cập đầy đủ {config.totalLessons} bài học, flashcard thông minh, luyện nghe dictation và theo dõi tiến trình không giới hạn.</p>
      <div className={styles.ctaButtons}><ProUpgradeTrigger /><Link href="#upgrade">Xem bảng giá</Link></div>
      <div className={styles.benefits}><span><Icon name="shield" />Bảo hành 7 ngày</span><span><Icon name="devices" />Học trên mọi thiết bị</span></div>
    </section>
  )
}

export default function HSKLevelPage({ level }: { level: HSKLevel }) {
  const config = levelConfigs[level]
  const lessons = getLessons(config)
  return (
    <main className={styles.page}>
      <AppNavbar level={level} />
      <div className={styles.container}>
        <header className={styles.header}><span>{config.band}</span><h1>{config.name}</h1><strong>{config.totalLessons} bài học</strong><p>{config.description}</p></header>
        <ProgressCard config={config} />
        <section className={styles.lessonSection}>
          <div className={styles.listHeading}><h2>Danh sách bài học</h2><span>Đang cập nhật...</span></div>
          <div className={styles.lessonList}>{lessons.map((lesson,index) => <LessonItem lesson={lesson} index={index} level={level} key={lesson.title} />)}</div>
        </section>
        <ProCtaCard config={config} />
      </div>
    </main>
  )
}
