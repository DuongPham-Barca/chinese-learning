"use client"

import { useReducedMotion } from "framer-motion"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import SiteNavbar from "@/components/site-navbar"
import { useAuth } from "@/lib/auth-provider"
import {
  containerVariants,
  sectionVariants,
  itemVariants,
  cardVariants,
  heroContainerVariants,
  heroItemVariants,
  fadeInVariants,
  sectionViewport,
} from "./animations"
import styles from "./home.module.css"

type IconName = "users" | "layers" | "mic" | "star" | "headphones" | "trophy" | "book" | "chart" | "sparkles" | "check"

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></>,
    star: <path d="m12 2.5 2.85 5.78 6.38.93-4.61 4.49 1.09 6.35L12 17.05l-5.71 3 1.09-6.35-4.61-4.49 6.38-.93L12 2.5Z"/>,
    headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19h1a1 1 0 0 0 1-1v-4h-3v4a1 1 0 0 0 1 1ZM6 19H5a1 1 0 0 1-1-1v-4h3v4a1 1 0 0 1-1 1Z"/></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z"/><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    sparkles: <><path d="m12 3-1 3.3a3 3 0 0 1-2 2L5.7 9.4 9 10.5a3 3 0 0 1 2 2l1 3.3 1-3.3a3 3 0 0 1 2-2l3.3-1.1L15 8.3a3 3 0 0 1-2-2L12 3Z"/><path d="m5 15-.5 1.5A2 2 0 0 1 3 18l1.5.5A2 2 0 0 1 6 20l.5-1.5A2 2 0 0 1 8 17l-1.5-.5A2 2 0 0 1 5 15Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

const stats: Array<[IconName, string, string]> = [
  ["users", "10K+", "Người học"],
  ["layers", "1000+", "Flashcards"],
  ["mic", "500+", "Bài Dictation"],
  ["star", "95%", "Tỷ lệ hài lòng"],
]

const features: Array<[IconName, string, string]> = [
  ["layers", "Flashcard thông minh", "Hệ thống lặp lại ngắt quãng (Spaced Repetition) giúp ghi nhớ từ vựng lâu hơn."],
  ["headphones", "Luyện nghe chép chính tả", "Luyện phản xạ nghe với Dictation theo từng cấp độ HSK."],
  ["trophy", "Game hóa học tập", "Điểm kinh nghiệm, chuỗi ngày học và bảng xếp hạng tạo động lực mỗi ngày."],
]

const levels = [
  ["HSK1", "15 bài học", "150 từ vựng", "Nền tảng phát âm & chữ Hán", 1],
  ["HSK2", "20 bài học", "300 từ vựng", "Giao tiếp cơ bản hằng ngày", 2],
  ["HSK3", "35 bài học", "650 từ vựng", "Hoàn thành — mở khóa HSK4", 3],
  ["HSK4", "45 bài học", "1200 từ vựng", "Ngữ pháp trung cấp vững chắc", 4],
  ["HSK5", "55 bài học", "2500 từ vựng", "Đọc hiểu văn bản chuyên sâu", 5],
  ["HSK6", "70 bài học", "5000 từ vựng", "Trình độ thành thạo cao cấp", 5],
] as const

const processSteps: Array<[IconName, string, string]> = [
  ["book", "Học từ vựng", "Tiếp cận từ mới theo chủ đề."],
  ["layers", "Ôn Flashcard", "Ghi nhớ dài hạn với SRS."],
  ["mic", "Luyện Dictation", "Rèn phản xạ nghe chuẩn xác."],
  ["chart", "Kiểm tra & Theo dõi", "Đo tiến độ mỗi tuần."],
]

const reviews = [
  ["“Flashcard giúp mình nhớ từ vựng nhanh hơn hẳn. Sau 3 tháng đã tự tin giao tiếp cơ bản.”", "MA", "Minh Anh", "Sinh viên HSK4"],
  ["“Bài Dictation cực kỳ hữu ích, khả năng nghe của mình tiến bộ rõ rệt chỉ trong vài tuần.”", "QH", "Quang Huy", "Nhân viên văn phòng"],
  ["“Giao diện đẹp, gọn, có chuỗi ngày học nên rất tạo động lực. Mình học đều mỗi ngày.”", "TV", "Thảo Vy", "Đang luyện HSK5"],
]

function SectionHeading({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <motion.div variants={itemVariants} className={styles.sectionHeading}>
      <span>{badge}</span>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </motion.div>
  )
}

function Brand() {
  return <Link href="/" className={styles.brand}><span>中</span><strong>ChineseDict</strong></Link>
}

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion()
  const { user } = useAuth()

  return (
    <main className={styles.page}>
      <SiteNavbar />

      <motion.header
        id="home"
        className={styles.hero}
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={heroItemVariants} className={styles.heroCopy}>
          <motion.span variants={heroItemVariants} className={styles.badge}><Icon name="sparkles" />Nền tảng học tiếng Trung thế hệ mới</motion.span>
          <motion.h1 variants={heroItemVariants}>Học tiếng Trung chủ động — <span>Chinh phục HSK</span> dễ dàng</motion.h1>
          <motion.p variants={heroItemVariants}>Hệ thống học tiếng Trung hiện đại với Flashcard, Dictation, luyện phát âm và giáo trình HSK đầy đủ.</motion.p>
          <motion.div variants={heroItemVariants} className={styles.heroButtons}>{user ? (
  <button onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })} className={styles.primaryButton}>Bắt đầu học miễn phí <b>→</b></button>
) : (
  <Link href="/login" className={styles.primaryButton}>Bắt đầu học miễn phí <b>→</b></Link>
)}<button onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })} className={styles.secondaryButton}>Khám phá giáo trình</button></motion.div>
          <motion.div variants={heroItemVariants} className={styles.bullets}>
            {["Hơn 10,000 học viên", "Luyện Dictation mỗi ngày", "Flashcard thông minh", "Theo dõi tiến độ học tập"].map((item) => <span key={item}><i><Icon name="check" /></i>{item}</span>)}
          </motion.div>
        </motion.div>
        <motion.div variants={heroItemVariants} className={styles.heroVisual}>
          <Image src="/chinesedict-home-hero.png" fill priority sizes="(max-width: 760px) 92vw, 540px" alt="Học viên đang học tiếng Trung với ChineseDict" />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { delay: 1.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            className={styles.streak}
          ><i><Icon name="sparkles" /></i><span><small>Chuỗi học liên tục</small><strong>7 ngày 🔥</strong></span></motion.div>
        </motion.div>
      </motion.header>

      <motion.section
        className={styles.stats}
        aria-label="Thống kê ChineseDict"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        {stats.map(([icon, value, label]) => (
          <motion.div variants={cardVariants} className={styles.statCard} key={label}>
            <i><Icon name={icon} /></i>
            <strong>{value}</strong>
            <span>{label}</span>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        id="features"
        className={styles.section}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <SectionHeading badge="TÍNH NĂNG" title="Tất cả những gì bạn cần để học tiếng Trung" subtitle="Bộ công cụ toàn diện, thiết kế theo phương pháp học ngôn ngữ hiện đại." />
        <motion.div variants={containerVariants} className={styles.featureGrid}>
          {features.map(([icon, title, description]) => (
            <motion.article
              variants={cardVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4, boxShadow: "0 12px 28px rgba(37,99,235,0.12)" }}
              className={styles.featureCard}
              key={title}
              id={title === "Luyện nghe chép chính tả" ? "dictation" : undefined}
            >
              <i><Icon name={icon} /></i>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        id="roadmap"
        className={`${styles.section} ${styles.roadmap}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <SectionHeading badge="LỘ TRÌNH" title="Lộ trình học" subtitle="Đi từ nền tảng đến thành thạo với 7 cấp độ được thiết kế bài bản." />
        <motion.div variants={containerVariants} className={styles.levelGrid}>
          {levels.map(([level, lessons, words, description, dots]) => (
            <motion.article
              variants={cardVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4, boxShadow: "0 12px 28px rgba(37,99,235,0.15)" }}
              className={styles.levelCard}
              key={level}
            >
              <div className={styles.levelTop}><strong>{level}</strong><span>{[1,2,3,4,5].map((dot) => <i className={dot <= dots ? styles.dotActive : ""} key={dot} />)}</span></div>
              <small>{lessons}</small><small>{words}</small>
              <p>{description}</p>
              <Link href={level.startsWith("HSK") ? `/lessons/${level.toLowerCase()}` : "/login"}>Bắt đầu học →</Link>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className={`${styles.section} ${styles.process}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <SectionHeading badge="QUY TRÌNH" title="Học hiệu quả trong 4 bước" subtitle="Một quy trình khép kín, giúp bạn tiến bộ đều mỗi ngày." />
        <motion.div variants={containerVariants} className={styles.timeline}>
          {processSteps.map(([icon, title, description], index) => (
            <motion.article variants={cardVariants} key={title}>
              <div className={styles.stepIcon}><Icon name={icon} /><b>{index + 1}</b></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        id="testimonials"
        className={`${styles.section} ${styles.testimonials}`}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <SectionHeading badge="HỌC VIÊN NÓI GÌ" title="Được tin dùng bởi hàng ngàn người học" subtitle="Câu chuyện thật từ cộng đồng ChineseDict." />
        <motion.div variants={containerVariants} className={styles.reviewGrid}>
          {reviews.map(([review, initials, name, role]) => (
            <motion.article
              variants={cardVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -4, boxShadow: "0 12px 28px rgba(37,99,235,0.12)" }}
              className={styles.reviewCard}
              key={name}
            >
              <div className={styles.stars}>★★★★★</div>
              <p>{review}</p>
              <footer><i>{initials}</i><span><strong>{name}</strong><small>{role}</small></span></footer>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.cta}
        variants={fadeInVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <div><h2>Sẵn sàng bắt đầu hành trình học<br /> tiếng Trung?</h2><p>Tham gia cùng hàng ngàn học viên đang chinh phục HSK mỗi ngày với ChineseDict.</p><span><Link href="/login">Bắt đầu miễn phí <b>→</b></Link><a href="#roadmap">Xem giáo trình</a></span></div>
      </motion.section>

      <motion.footer
        id="footer"
        className={styles.footer}
        variants={fadeInVariants}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}><Brand /><p>Nền tảng học tiếng Trung hiện đại — Flashcard, Dictation, và giáo trình HSK đầy đủ.</p><div className={styles.socials}><span>f</span><span>◎</span><span>▶</span><span>◯</span></div></div>
          <div><h3>ChineseDict</h3><a href="#home">Giới thiệu</a><a href="#footer">Liên hệ</a><Link href="/leaderboard">Bảng xếp hạng</Link></div>
          <div><h3>Sản phẩm</h3><a href="#features">Flashcard</a><a href="#features">Dictation</a><a href="#roadmap">HSK</a></div>
          <div><h3>Hỗ trợ</h3><Link href="/pricing#faq">FAQ</Link><Link href="/privacy">Chính sách</Link><Link href="/terms">Điều khoản</Link></div>
        </div>
        <div className={styles.copyright}><span>© 2026 ChineseDict. All rights reserved.</span><span>Made with care for Chinese learners.</span></div>
      </motion.footer>
    </main>
  )
}
