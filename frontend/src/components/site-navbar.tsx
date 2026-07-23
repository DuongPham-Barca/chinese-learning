"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import AccountDropdown from "@/components/account-dropdown"
import ProUpgradeTrigger from "@/components/pro-upgrade/pro-upgrade-trigger"
import SharedIcon, { type SharedIconName } from "@/components/shared-icon"
import { useAuth } from "@/lib/auth-provider"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./site-navbar.module.css"

type ModeLink = {
  href: string
  label: string
  mobileLabel?: string
  icon: SharedIconName
  active: boolean
}

function getContextLabel(pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard"
  if (pathname === "/beginner") return "Người mới bắt đầu"
  if (pathname.startsWith("/lessons")) return "Giáo trình"
  if (pathname === "/progress") return "Tiến độ"
  if (pathname === "/leaderboard") return "Bảng xếp hạng"
  if (pathname === "/pricing") return "Gói học"
  if (pathname === "/profile") return "Hồ sơ"
  if (pathname === "/settings") return "Cài đặt"
  return "Không gian học"
}

export default function SiteNavbar({}: { active?: string }) {
  const { user: upgradeUser } = useProUpgrade()
  const { user: authUser } = useAuth()
  const pathname = usePathname()
  const levelHref = `/lessons/${(authUser?.level || "HSK1").toLowerCase()}`

  const modeLinks: ModeLink[] = [
    { href: "/dashboard", label: "Dashboard", icon: "layers", active: pathname === "/" || pathname === "/dashboard" },
    { href: "/beginner", label: "Người mới bắt đầu", mobileLabel: "Người mới", icon: "sparkles", active: pathname === "/beginner" },
    { href: levelHref, label: "Giáo trình", icon: "bookOpen", active: pathname.startsWith("/lessons") },
    { href: "/progress", label: "Tiến độ", icon: "target", active: pathname === "/progress" },
    { href: "/pricing", label: "Gói học", icon: "star", active: pathname === "/pricing" },
  ]

  return (
    <div className={styles.nav} data-client-shell>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>中</span>
          <span>
            <strong>ChineseDict</strong>
            <small>Học tiếng Trung chủ động</small>
          </span>
        </Link>

        <span className={styles.sideLabel}>Không gian học</span>
        <nav className={styles.modeRail} aria-label="Điều hướng học tập">
          <div className={styles.modes}>
            {modeLinks.map((item) => (
              <Link
                className={`${styles.modeLink} ${item.active ? styles.modeActive : ""}`}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                key={item.href}
              >
                <SharedIcon name={item.icon} size={18} />
                <span className={styles.desktopLabel}>{item.label}</span>
                <span className={styles.mobileLabel}>{item.mobileLabel || item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className={styles.studyPrompt}>
          <span><SharedIcon name="fire" size={17} /> Nhịp học hôm nay</span>
          <strong>{authUser?.dailyTarget ?? 20} phút</strong>
          <small>Học một chút, nhớ lâu hơn.</small>
        </div>

        <div className={styles.sidebarFooter}>
          <Link className={pathname === "/profile" ? styles.modeActive : ""} href="/profile">
            <SharedIcon name="user" size={18} />
            <span>Hồ sơ</span>
          </Link>
          <Link className={pathname === "/settings" ? styles.modeActive : ""} href="/settings">
            <SharedIcon name="moreHorizontal" size={18} />
            <span>Cài đặt</span>
          </Link>
        </div>
      </aside>

      <header className={styles.topbar}>
        <Link href="/" className={styles.mobileBrand} aria-label="ChineseDict">
          <span className={styles.brandMark}>中</span>
        </Link>

        <div className={styles.topbarLead}>
          <span className={styles.context}>{getContextLabel(pathname)}</span>
          <small>Sẵn sàng cho phiên học tiếp theo</small>
        </div>

        {authUser && (
          <div className={styles.statusRail} aria-label="Tóm tắt tài khoản">
            <span><SharedIcon name="bookOpen" size={15} />{authUser.level}</span>
            <span><SharedIcon name="target" size={15} />{authUser.dailyTarget} phút</span>
            <span><SharedIcon name="zap" size={15} />{authUser.expPoints.toLocaleString("vi-VN")} EXP</span>
          </div>
        )}

        <div className={styles.actions}>
          {authUser ? (
            <>
              {upgradeUser.isPro
                ? <span className={styles.proBadge}>Pro</span>
                : <ProUpgradeTrigger className={styles.primaryButton} />}
              <AccountDropdown />
            </>
          ) : (
            <>
              <Link className={styles.signIn} href="/login">Đăng nhập</Link>
              <Link className={styles.primaryButton} href="/login">Bắt đầu học</Link>
            </>
          )}
        </div>

        <details className={styles.mobileMenu}>
          <summary aria-label="Mở menu tài khoản">
            <SharedIcon name="user" size={19} />
          </summary>
          <div>
            {authUser ? (
              <>
                <Link href="/profile">Hồ sơ</Link>
                <Link href="/settings">Cài đặt</Link>
                {upgradeUser.isPro
                  ? <span className={styles.mobilePro}>ChineseDict Pro</span>
                  : <ProUpgradeTrigger className={styles.mobileUpgrade} />}
              </>
            ) : (
              <Link href="/login">Đăng nhập</Link>
            )}
          </div>
        </details>
      </header>
    </div>
  )
}
