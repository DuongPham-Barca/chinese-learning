"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import ProUpgradeTrigger from "@/components/pro-upgrade/pro-upgrade-trigger"
import AccountDropdown from "@/components/account-dropdown"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./site-navbar.module.css"

const SECTION_IDS = ["home", "features", "roadmap", "footer"]

export default function SiteNavbar({ active: initialActive = "home" }: { active?: string }) {
  const { user } = useProUpgrade()
  const pathname = usePathname()
  const router = useRouter()
  const isPricing = pathname === "/pricing"
  const [activeSection, setActiveSection] = useState(initialActive)

  useEffect(() => {
    if (!document.getElementById("home") || isPricing) return

    const handleScroll = () => {
      const scrollY = window.scrollY + 100
      let current = SECTION_IDS[0]

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) {
          current = id
        }
      }

      setActiveSection(current)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isPricing])

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    const target = document.getElementById(sectionId)
    if (!target) {
      router.push(`/#${sectionId}`)
      return
    }
    e.preventDefault()
    target.scrollIntoView({ behavior: "smooth" })
    setActiveSection(sectionId)
  }, [router])

  const isActive = (id: string) => activeSection === id ? styles.active : ""

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand}><span>中</span><strong>ChineseDict</strong></Link>
        <div className={styles.navLinks}>
          <a className={isActive("home")} href="#home" onClick={(e) => handleNavClick(e, "home")}>Trang chủ</a>
          <a className={isActive("roadmap")} href="#roadmap" onClick={(e) => handleNavClick(e, "roadmap")}>Giáo trình</a>
          <a className={isActive("features")} href="#features" onClick={(e) => handleNavClick(e, "features")}>Flashcard</a>
          <Link className={isActive("leaderboard")} href="/leaderboard">Bảng xếp hạng</Link>
          <Link className={isPricing ? styles.active : ""} href="/pricing">Thanh toán</Link>
        </div>
        <div className={styles.navActions}>{user.isLoggedIn ? <><AccountDropdown />{user.isPro ? <span className={styles.proBadge}>Pro</span> : <ProUpgradeTrigger className={styles.primaryButton} />}</> : <><Link href="/login">Đăng nhập</Link><Link href="/login" className={styles.primaryButton}>Bắt đầu học <b>→</b></Link></>}</div>
        <details className={styles.mobileMenu}>
          <summary aria-label="Mở menu"><span /><span /><span /></summary>
          <div>
            <a className={isActive("home")} href="#home" onClick={(e) => handleNavClick(e, "home")}>Trang chủ</a>
            <a className={isActive("roadmap")} href="#roadmap" onClick={(e) => handleNavClick(e, "roadmap")}>Giáo trình</a>
            <a className={isActive("features")} href="#features" onClick={(e) => handleNavClick(e, "features")}>Flashcard</a>
            <Link className={isActive("leaderboard")} href="/leaderboard">Bảng xếp hạng</Link>
            <Link className={isPricing ? styles.active : ""} href="/pricing">Thanh toán</Link>
            {user.isLoggedIn ? (
              user.isPro ? <span className={styles.mobilePro}>ChineseDict Pro</span> : <ProUpgradeTrigger className={styles.mobileUpgrade} />
            ) : (
              <Link href="/login">Đăng nhập</Link>
            )}
          </div>
        </details>
      </div>
    </nav>
  )
}
