"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import axios from "axios"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SiteNavbar from "@/components/site-navbar"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
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
  phone: string
  dob: string
  gender: string
  country: string
  level: string
  goal: string
  dailyTarget: string
}

const profileMock: ProfileData = {
  phone: "",
  dob: "",
  gender: "Nam",
  country: "Việt Nam",
  level: "HSK3",
  goal: "Giao tiếp",
  dailyTarget: "20",
}

export default function ProfilePage() {
  const { user: authUser, refresh } = useAuth()
  const { user: upgradeUser } = useProUpgrade()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<ProfileData>(profileMock)
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const update = useCallback((field: keyof ProfileData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setToast("Ảnh phải có định dạng JPG, PNG hoặc WebP.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast("Ảnh phải có dung lượng không quá 5MB.")
      return
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  const handleRemoveAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authUser) {
      router.replace("/login")
      return
    }
    const username = (usernameDraft ?? authUser.username).trim()
    if (!username) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("username", username)
      if (avatarFile) formData.append("avatar", avatarFile)
      else if (removeAvatar) formData.append("avatar", "")

      await api.put("/auth/me", formData)
      await refresh()
      setUsernameDraft(null)
      setAvatarFile(null)
      setAvatarPreview(null)
      setRemoveAvatar(false)
      setToast("Cập nhật hồ sơ thành công.")
    } catch (error) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        if (error.response?.status === 401) router.replace("/login")
        setToast(error.response?.data.error || "Không thể cập nhật hồ sơ.")
      } else {
        setToast("Không thể cập nhật hồ sơ.")
      }
    } finally {
      setSaving(false)
    }
  }

  const avatarUrl = removeAvatar ? null : avatarPreview || authUser?.avatarUrl
  const initials = (usernameDraft ?? authUser?.username ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase()

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
              <span
                className={styles.avatar}
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
              >
                {!avatarUrl && initials}
              </span>
              <div className={styles.avatarControls}>
                <input
                  ref={fileInputRef}
                  className={styles.fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
                <div className={styles.avatarButtons}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()}>Thay đổi ảnh</button>
                  {avatarUrl && <button type="button" className={styles.removeAvatarBtn} onClick={handleRemoveAvatar}>Xóa ảnh</button>}
                </div>
                <span className={styles.helper}>PNG / JPG / WebP<br />Tối đa 5MB</span>
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
                <input type="text" value={usernameDraft ?? authUser?.username ?? ""} onChange={(e) => setUsernameDraft(e.target.value)} required />
              </label>
              <label className={styles.field}>
                <span>Email</span>
                <input type="email" value={authUser?.email || ""} disabled />
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
            {upgradeUser.isPro ? (
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
            {upgradeUser.isPro ? "Gia hạn" : "Nâng cấp lên Pro"}
          </Link>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving} form="profile-form">
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
