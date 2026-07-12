"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PageHeader, AdminButton } from "@/components/admin/admin-ui"
import { getAdminSession, getUserById, updateUser, type AdminUser } from "@/services/admin-user.service"
import styles from "./profile.module.css"

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const levels = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function avatarColor(id: string) {
  const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"]
  return colors[id.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length]
}

function initials(username: string) {
  return username.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "A"
}

type Toast = { type: "success" | "error"; message: string } | null

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    level: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  })

  const syncForm = useCallback((user: AdminUser) => {
    setForm({
      username: user.username,
      email: user.email || "",
      phone: user.phone || "",
      level: user.level || "HSK1",
    })
  }, [])

  useEffect(() => {
    let active = true
    getAdminSession()
      .then((session) => getUserById(session.user.id))
      .then((res) => {
        if (!active) return
        setProfile(res.data)
        syncForm(res.data)
      })
      .catch(() => {
        if (active) setToast({ type: "error", message: "Không thể tải thông tin hồ sơ" })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [syncForm])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    try {
      const result = await updateUser(profile.id, {
        username: form.username,
        email: form.email || null,
        phone: form.phone || null,
        level: form.level as AdminUser["level"],
      })
      setProfile(result.data)
      syncForm(result.data)
      setToast({ type: "success", message: "Đã cập nhật hồ sơ" })
    } catch {
      setToast({ type: "error", message: "Không thể cập nhật hồ sơ" })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!profile) return
    if (!passwordForm.newPass) {
      setToast({ type: "error", message: "Vui lòng nhập mật khẩu mới" })
      return
    }
    if (passwordForm.newPass.length < 6) {
      setToast({ type: "error", message: "Mật khẩu tối thiểu 6 ký tự" })
      return
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setToast({ type: "error", message: "Mật khẩu xác nhận không khớp" })
      return
    }
    setSaving(true)
    try {
      await updateUser(profile.id, { password: passwordForm.newPass })
      setPasswordForm({ current: "", newPass: "", confirm: "" })
      setToast({ type: "success", message: "Đã đổi mật khẩu thành công" })
    } catch {
      setToast({ type: "error", message: "Không thể đổi mật khẩu" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <motion.div variants={variants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <PageHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản quản trị" />
        </motion.div>
        <motion.div variants={itemVariants} className={styles.skeleton}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLine} style={{ width: "60%" }} />
          <div className={styles.skeletonLine} style={{ width: "40%" }} />
          <div className={styles.skeletonLine} style={{ width: "80%" }} />
        </motion.div>
      </motion.div>
    )
  }

  if (!profile) {
    return (
      <motion.div variants={variants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <PageHeader title="Hồ sơ cá nhân" />
        </motion.div>
        <motion.div variants={itemVariants} className={styles.errorState}>
          <p>Không thể tải thông tin hồ sơ.</p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Hồ sơ cá nhân"
          subtitle="Quản lý thông tin tài khoản quản trị"
          actions={
            <AdminButton icon="download" secondary onClick={() => window.print()}>
              XUẤT PDF
            </AdminButton>
          }
        />
      </motion.div>

      <div className={styles.grid}>
        {/* Avatar Card */}
        <motion.div variants={itemVariants} className={styles.card}>
          <div className={styles.avatarSection}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.username} className={styles.avatar} />
            ) : (
              <span className={styles.avatarInitials} style={{ background: avatarColor(profile.id) }}>
                {initials(profile.username)}
              </span>
            )}
            <h2 className={styles.adminName}>{profile.username}</h2>
            <span className={styles.adminRole}>Administrator</span>
            <span className={styles.adminBadge}>Quản trị viên</span>
            
          </div>
          <div className={styles.avatarStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Điểm EXP</span>
              <strong className={styles.statValue}>{profile.expPoints.toLocaleString()}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Ngày tham gia</span>
              <strong className={styles.statValue}>{formatDate(profile.createdAt)}</strong>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Trạng thái</span>
              <strong className={styles.statValue}>{profile.isPremium ? "Premium" : "Free"}</strong>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div variants={itemVariants} className={styles.card}>
          <h3 className={styles.cardTitle}>Thông tin cá nhân</h3>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Họ và tên</span>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Email</span>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Số điện thoại</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Cấp độ</span>
              <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}>
              <span>Giới tính</span>
              <strong>{profile.gender || "Chưa cập nhật"}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Quốc gia</span>
              <strong>{profile.country || "Chưa cập nhật"}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Mục tiêu</span>
              <strong>{profile.learningGoal || "Chưa cập nhật"}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Mục tiêu ngày</span>
              <strong>{profile.dailyTarget || "Chưa cập nhật"}</strong>
            </div>
          </div>
          <div className={styles.formActions}>
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </AdminButton>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div variants={itemVariants} className={styles.card}>
          <h3 className={styles.cardTitle}>Đổi mật khẩu</h3>
          <div className={styles.passwordGrid}>
            <label className={styles.field}>
              <span>Mật khẩu hiện tại</span>
              <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Mật khẩu mới</span>
              <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm((f) => ({ ...f, newPass: e.target.value }))} />
            </label>
            <label className={styles.field}>
              <span>Xác nhận mật khẩu</span>
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} />
            </label>
          </div>
          <div className={styles.formActions}>
            <AdminButton onClick={handleChangePassword} disabled={saving || !passwordForm.newPass}>
              {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </AdminButton>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className={styles.card}>
          <h3 className={styles.cardTitle}>Hoạt động gần đây</h3>
          {!profile.recentProgress?.length ? (
            <p className={styles.emptyState}>Chưa có hoạt động nào.</p>
          ) : (
            <div className={styles.activityList}>
              {profile.recentProgress.map((p) => (
                <div key={p.id} className={styles.activityItem}>
                  <span className={styles.activityDot} />
                  <div className={styles.activityInfo}>
                    <strong>{p.lesson.title}</strong>
                    <span>{p.lesson.levelType} • Bài {p.lesson.lessonOrder}</span>
                  </div>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityExp}>+{p.expGained} EXP</span>
                    <small>{formatDate(p.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </motion.div>
  )
}
