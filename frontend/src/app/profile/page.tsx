"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SiteNavbar from "@/components/site-navbar"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./profile.module.css"

const levels = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]
const goals = ["Giao tiếp", "Thi HSK", "Công việc", "Du lịch"]
const dailyTargets = [
  { value: "10", label: "10 phút" },
  { value: "20", label: "20 phút" },
  { value: "30", label: "30 phút" },
  { value: "60", label: "60 phút" },
]
const genders = ["Nam", "Nữ", "Khác"]
const countries = ["Việt Nam", "Trung Quốc", "Đài Loan", "Khác"]

type ProfileData = {
  fullName: string
  email: string
  phone: string
  dob: string
  gender: string
  country: string
  level: string
  goal: string
  dailyTarget: string
}

const profileMock: ProfileData = {
  fullName: "Dương Hải",
  email: "duonghai@example.com",
  phone: "",
  dob: "",
  gender: "Nam",
  country: "Việt Nam",
  level: "HSK3",
  goal: "Giao tiếp",
  dailyTarget: "20",
}

export default function ProfilePage() {
  const { user } = useProUpgrade()
  const router = useRouter()
  const [data, setData] = useState<ProfileData>(profileMock)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const update = useCallback((field: keyof ProfileData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.fullName.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setToast("Cập nhật hồ sơ thành công.")
  }

  return (
    <main className={styles.page}>
      <SiteNavbar />
      <div className={styles.container}>
        <div className={styles.heading}>
          <h1>Hồ sơ cá nhân</h1>
          <p>Cập nhật thông tin cá nhân và tùy chỉnh tài khoản học tập.</p>
        </div>

        <form id="profile-form" onSubmit={handleSubmit} className={styles.card}>
          {/* Avatar */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ảnh đại diện</h2>
            <div className={styles.avatarRow}>
              <span className={styles.avatar}>
                {user.name.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase()}
              </span>
              <div>
                <button type="button" className={styles.secondaryBtn}>Thay đổi ảnh</button>
                <span className={styles.helper}>PNG / JPG<br />Maximum 2MB</span>
              </div>
            </div>
          </section>

          <div className={styles.divider} />

          {/* Personal Information */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Thông tin cá nhân</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Họ và tên</span>
                <input type="text" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input type="email" value={data.email} disabled />
                <small>Không thể thay đổi email khi đăng nhập bằng Google</small>
              </label>
              <label className={styles.field}>
                <span>Số điện thoại</span>
                <input type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Nhập số điện thoại" />
              </label>
              <label className={styles.field}>
                <span>Ngày sinh</span>
                <input type="date" value={data.dob} onChange={(e) => update("dob", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Giới tính</span>
                <select value={data.gender} onChange={(e) => update("gender", e.target.value)}>
                  {genders.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span>Quốc gia</span>
                <select value={data.country} onChange={(e) => update("country", e.target.value)}>
                  {countries.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
          </section>

          <div className={styles.divider} />

          {/* Learning Preferences */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Sở thích học tập</h2>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Trình độ</span>
                <select value={data.level} onChange={(e) => update("level", e.target.value)}>
                  {levels.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span>Mục tiêu</span>
                <select value={data.goal} onChange={(e) => update("goal", e.target.value)}>
                  {goals.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span>Mục tiêu học mỗi ngày</span>
                <select value={data.dailyTarget} onChange={(e) => update("dailyTarget", e.target.value)}>
                  {dailyTargets.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
            </div>
          </section>
        </form>

        {/* Membership */}
        <section className={styles.membershipCard}>
          <div className={styles.membershipInfo}>
            <h2>Gói thành viên</h2>
            {user.isPro ? (
              <>
                <p className={styles.planName}>Pro</p>
                <p className={styles.expiry}>Hết hạn: 20/12/2027</p>
              </>
            ) : (
              <>
                <p className={styles.planName}>Free</p>
                <p className={styles.expiry}>Nâng cấp để mở khóa toàn bộ tính năng</p>
              </>
            )}
          </div>
          <Link href="/pricing" className={styles.upgradeBtn}>
            {user.isPro ? "Gia hạn" : "Nâng cấp lên Pro"}
          </Link>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving} form="profile-form" onClick={handleSubmit}>
            {saving ? <><span className={styles.spinner} /> Đang lưu...</> : "Lưu thay đổi"}
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.back()}>Hủy</button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={styles.toast}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            {toast}
          </div>
        )}
      </div>
    </main>
  )
}
