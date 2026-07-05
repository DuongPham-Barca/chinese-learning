import Link from "next/link"
import styles from "./site-navbar.module.css"

export default function SiteNavbar({ active = "home" }: { active?: "home" | "leaderboard" }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}><span>中</span><strong>ChineseDict</strong></Link>
        <div className={styles.navLinks}>
          <Link className={active === "home" ? styles.active : ""} href="/#home">Trang chủ</Link>
          <Link href="/#roadmap">Giáo trình</Link>
          <Link href="/#features">Flashcard</Link>
          <Link href="/#features">Dictation</Link>
          <Link className={active === "leaderboard" ? styles.active : ""} href="/leaderboard">Bảng xếp hạng</Link>
          <Link href="/#footer">Blog</Link>
        </div>
        <div className={styles.navActions}><Link href="/login">Đăng nhập</Link><Link href="/login" className={styles.primaryButton}>Bắt đầu học <b>→</b></Link></div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Mở menu"><span /><span /><span /></summary>
          <div><Link href="/#home">Trang chủ</Link><Link href="/#roadmap">Giáo trình</Link><Link href="/#features">Flashcard</Link><Link href="/#features">Dictation</Link><Link href="/leaderboard">Bảng xếp hạng</Link><Link href="/login">Đăng nhập</Link></div>
        </details>
      </div>
    </nav>
  )
}
