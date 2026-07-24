"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SiteNavbar from "@/components/site-navbar"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import { clearLocalLessonProgress } from "@/services/lesson-progress.service"
import styles from "./settings.module.css"

const levels = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]
const goals = ["Giao tiếp", "Thi HSK", "Công việc", "Du lịch"]
const targets = [10, 20, 30, 60]

type ConfirmAction = "reset" | "delete" | null

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, refresh, logout } = useAuth()
  const [levelDraft, setLevelDraft] = useState<string | null>(null)
  const [goalDraft, setGoalDraft] = useState<string | null>(null)
  const [dailyTargetDraft, setDailyTargetDraft] = useState<number | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [deleteText, setDeleteText] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?next=/settings")
      return
    }
  }, [authLoading, router, user])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 3500)
    return () => window.clearTimeout(timer)
  }, [message])

  async function savePreferences() {
    setSaving(true)
    try {
      await api.put("/auth/me", {
        level: levelDraft ?? user?.level,
        goal: goalDraft ?? user?.learningGoal,
        dailyTarget: dailyTargetDraft ?? user?.dailyTarget,
      })
      await refresh()
      setLevelDraft(null)
      setGoalDraft(null)
      setDailyTargetDraft(null)
      setMessage({ text: "Đã lưu cài đặt học tập." })
    } catch {
      setMessage({ text: "Không thể lưu cài đặt. Vui lòng thử lại.", error: true })
    } finally {
      setSaving(false)
    }
  }

  async function resetProgress() {
    setSaving(true)
    try {
      await api.delete("/progress")
      clearLocalLessonProgress()
      await refresh()
      setConfirmAction(null)
      setMessage({ text: "Đã đặt lại toàn bộ tiến độ học tập." })
    } catch {
      setMessage({ text: "Không thể đặt lại tiến độ.", error: true })
    } finally {
      setSaving(false)
    }
  }

  async function deleteAccount() {
    if (deleteText !== "XÓA") return
    setSaving(true)
    try {
      await api.delete("/auth/me")
      clearLocalLessonProgress()
      await refresh()
      router.replace("/")
      router.refresh()
    } catch {
      setMessage({ text: "Không thể xóa tài khoản.", error: true })
      setSaving(false)
    }
  }

  if (authLoading || !user) return <main className={styles.page}><SiteNavbar /><div className={styles.loading}>Đang tải cài đặt...</div></main>

  return (
    <main className={styles.page}>
      <SiteNavbar />
      <div className={styles.container} data-motion-page>
        <header className={styles.heading}><span>TÀI KHOẢN</span><h1>Cài đặt</h1><p>Điều chỉnh mục tiêu học và quản lý dữ liệu tài khoản.</p></header>

        <div className={styles.layout}>
          <nav className={styles.sideNav} aria-label="Mục cài đặt">
            <a href="#learning"><SharedIcon name="target" size={18} />Học tập</a>
            <a href="#account"><SharedIcon name="user" size={18} />Tài khoản</a>
            <a href="#data"><SharedIcon name="alert" size={18} />Dữ liệu</a>
          </nav>

          <div className={styles.content}>
            <section id="learning" className={styles.section}>
              <div className={styles.sectionTitle}><i><SharedIcon name="target" size={21} /></i><div><h2>Cài đặt học tập</h2><p>Cá nhân hóa lộ trình và nhịp độ học mỗi ngày.</p></div></div>
              <div className={styles.formGrid}>
                <label><span>Trình độ hiện tại</span><select value={levelDraft ?? user.level} onChange={(event) => setLevelDraft(event.target.value)}>{levels.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Mục tiêu chính</span><select value={goalDraft ?? user.learningGoal} onChange={(event) => setGoalDraft(event.target.value)}>{goals.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span>Mục tiêu mỗi ngày</span><select value={dailyTargetDraft ?? user.dailyTarget} onChange={(event) => setDailyTargetDraft(Number(event.target.value))}>{targets.map((item) => <option value={item} key={item}>{item} phút</option>)}</select></label>
              </div>
              <div className={styles.sectionActions}><button className={styles.primaryButton} type="button" onClick={() => void savePreferences()} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
            </section>

            <section id="account" className={styles.section}>
              <div className={styles.sectionTitle}><i><SharedIcon name="user" size={21} /></i><div><h2>Tài khoản</h2><p>Phiên đăng nhập và thông tin nhận diện hiện tại.</p></div></div>
              <dl className={styles.accountInfo}><div><dt>Tên hiển thị</dt><dd>{user.username}</dd></div><div><dt>Email</dt><dd>{user.email || "Chưa có email"}</dd></div><div><dt>Gói tài khoản</dt><dd>{user.isPremium ? "Hana Pro" : "Free"}</dd></div></dl>
              <div className={styles.sectionActions}><button className={styles.secondaryButton} type="button" onClick={() => router.push("/profile")}>Chỉnh sửa hồ sơ</button><button className={styles.secondaryButton} type="button" onClick={() => void logout().finally(() => router.replace("/login"))}>Đăng xuất</button></div>
            </section>

            <section id="data" className={`${styles.section} ${styles.dangerSection}`}>
              <div className={styles.sectionTitle}><i><SharedIcon name="alert" size={21} /></i><div><h2>Dữ liệu tài khoản</h2><p>Các thao tác này ảnh hưởng trực tiếp đến dữ liệu đã lưu.</p></div></div>
              <div className={styles.dangerRow}><div><strong>Đặt lại tiến độ</strong><p>Xóa lịch sử hoàn thành và EXP nhận từ bài học.</p></div><button type="button" onClick={() => setConfirmAction("reset")}>Đặt lại</button></div>
              <div className={styles.dangerRow}><div><strong>Xóa tài khoản</strong><p>Xóa vĩnh viễn hồ sơ, tiến độ và lịch sử gia hạn.</p></div><button type="button" onClick={() => setConfirmAction("delete")}>Xóa tài khoản</button></div>
            </section>
          </div>
        </div>
      </div>

      {confirmAction && <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setConfirmAction(null) }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title"><i><SharedIcon name="alert" size={26} /></i><h2 id="confirm-title">{confirmAction === "reset" ? "Đặt lại tiến độ?" : "Xóa tài khoản?"}</h2><p>{confirmAction === "reset" ? "Toàn bộ lịch sử học và EXP đã nhận từ bài học sẽ bị xóa." : "Thao tác này không thể hoàn tác. Nhập XÓA để xác nhận."}</p>{confirmAction === "delete" && <input value={deleteText} onChange={(event) => setDeleteText(event.target.value.toUpperCase())} placeholder="Nhập XÓA" autoFocus />}<div><button type="button" onClick={() => { setConfirmAction(null); setDeleteText("") }} disabled={saving}>Hủy</button><button className={styles.dangerButton} type="button" onClick={() => void (confirmAction === "reset" ? resetProgress() : deleteAccount())} disabled={saving || (confirmAction === "delete" && deleteText !== "XÓA")}>{saving ? "Đang xử lý..." : "Xác nhận"}</button></div></section></div>}
      {message && <div className={`${styles.toast} ${message.error ? styles.toastError : ""}`} role="status">{message.text}</div>}
    </main>
  )
}
