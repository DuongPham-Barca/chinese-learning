"use client"

import Link from "next/link"
import ProUpgradeTrigger from "@/components/pro-upgrade/pro-upgrade-trigger"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./site-navbar.module.css"

export default function SiteNavbar({ active = "home" }: { active?: "home" | "leaderboard" }) {
  const { user } = useProUpgrade()
  const initials = user.name.split(" ").map((part) => part[0]).slice(-2).join("").toUpperCase()
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
        <div className={styles.navActions}>{user.isLoggedIn ? <><span className={styles.userChip}><i>{initials}</i>{user.name}</span>{user.isPro ? <span className={styles.proBadge}>Pro</span> : <ProUpgradeTrigger className={styles.primaryButton} />}</> : <><Link href="/login">Đăng nhập</Link><Link href="/login" className={styles.primaryButton}>Bắt đầu học <b>→</b></Link></>}</div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Mở menu"><span /><span /><span /></summary>
          <div><Link href="/#home">Trang chủ</Link><Link href="/#roadmap">Giáo trình</Link><Link href="/#features">Flashcard</Link><Link href="/#features">Dictation</Link><Link href="/leaderboard">Bảng xếp hạng</Link>{user.isLoggedIn ? user.isPro ? <span className={styles.mobilePro}>ChineseDict Pro</span> : <ProUpgradeTrigger className={styles.mobileUpgrade} /> : <Link href="/login">Đăng nhập</Link>}</div>
        </details>
      </div>
    </nav>
  )
}
