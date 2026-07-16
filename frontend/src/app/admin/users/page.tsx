"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable, PageHeader, StatCard } from "@/components/admin/admin-ui"
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  getUserStats,
  unlockUserPremium,
  updateUser,
  type AdminPlan,
  type AdminUser,
  type AdminUserPayload,
  type AdminUserStats,
} from "@/services/admin-user.service"
import styles from "./users.module.css"

type Toast = { variant: "success" | "error"; message: string } | null
type Errors = Record<string, string>

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } } }
const plans: Array<{ id: AdminPlan; label: string; price: string; chip: string }> = [
  { id: "2months", label: "2 tháng", price: "49.000đ", chip: "Phổ biến" },
  { id: "6months", label: "6 tháng", price: "119.000đ", chip: "Tiết kiệm" },
  { id: "12months", label: "12 tháng", price: "189.000đ", chip: "Tốt nhất" },
]
const planLabels: Record<AdminPlan, string> = { "2months": "2 tháng", "6months": "6 tháng", "12months": "12 tháng" }
const emptyUser: AdminUserPayload = { username: "", email: "", password: "", phone: "", role: "USER" }

function apiMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    return data?.message || data?.error || fallback
  }
  return fallback
}

function apiErrors(error: unknown) {
  return error instanceof AxiosError
    ? ((error.response?.data as { errors?: Errors } | undefined)?.errors || null)
    : null
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
    : "-"
}

function initials(user: AdminUser) {
  return user.username.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"
}

function avatarColor(id: string) {
  const colors = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"]
  return colors[id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length]
}

function PlanBadge({ user }: { user: AdminUser }) {
  return user.isPremium
    ? <span className={styles.premiumYes}>{user.plan ? planLabels[user.plan] : "Premium"}</span>
    : <span className={styles.premiumNo}>Free</span>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <button className={styles.scrim} onClick={onClose} aria-label="Đóng" />
      <section className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.modalClose} onClick={onClose} type="button" aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>
        {children}
      </section>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}{error && <small>{error}</small>}</label>
}

function UserModal({ user, saving, onClose, onSubmit }: { user: AdminUser | null; saving: boolean; onClose: () => void; onSubmit: (payload: AdminUserPayload) => Promise<Errors | null> }) {
  const [form, setForm] = useState<AdminUserPayload>(() => user
    ? { username: user.username, email: user.email || "", password: "", phone: user.phone || "", role: user.role === "ADMIN" ? "ADMIN" : "USER" }
    : emptyUser)
  const [errors, setErrors] = useState<Errors>({})

  function set<K extends keyof AdminUserPayload>(key: K, value: AdminUserPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  async function submit() {
    const nextErrors: Errors = {}
    if (!form.username.trim()) nextErrors.username = "Nhập tên người dùng"
    if (!user && !form.password) nextErrors.password = "Nhập mật khẩu cho người dùng mới"
    else if (form.password && form.password.length < 6) nextErrors.password = "Mật khẩu tối thiểu 6 ký tự"
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)

    const payload = { ...form }
    if (user && !payload.password) delete payload.password
    if (!payload.email) payload.email = null
    if (!payload.phone) payload.phone = null
    const result = await onSubmit(payload)
    if (result) setErrors(result)
  }

  return (
    <Modal title={user ? "Sửa người dùng" : "Thêm người dùng"} onClose={onClose}>
      <div className={styles.formGrid}>
        <Field label="Tên người dùng" error={errors.username}><input value={form.username} onChange={(event) => set("username", event.target.value)} /></Field>
        <Field label="Email" error={errors.email}><input value={form.email || ""} onChange={(event) => set("email", event.target.value)} /></Field>
        <Field label={user ? "Mật khẩu mới" : "Mật khẩu"} error={errors.password}><input type="password" value={form.password || ""} onChange={(event) => set("password", event.target.value)} /></Field>
        <Field label="Số điện thoại" error={errors.phone}><input value={form.phone || ""} onChange={(event) => set("phone", event.target.value)} /></Field>
        <Field label="Vai trò" error={errors.role}><select value={form.role || "USER"} onChange={(event) => set("role", event.target.value as "USER" | "ADMIN")}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></Field>
      </div>
      <div className={styles.modalActions}>
        <button className={styles.modalCancel} onClick={onClose} disabled={saving} type="button">Hủy</button>
        <button className={styles.modalSubmit} onClick={submit} disabled={saving} type="button">{saving ? "Đang lưu..." : "Lưu"}</button>
      </div>
    </Modal>
  )
}

function UnlockModal({ user, saving, onClose, onUnlock }: { user: AdminUser; saving: boolean; onClose: () => void; onUnlock: (plan: AdminPlan) => void }) {
  const [plan, setPlan] = useState<AdminPlan>(() => user.plan || "2months")
  return (
    <Modal title="Mở khóa Premium" onClose={onClose}>
      <div className={styles.modalUser}>
        <span className={styles.modalAvatar} style={{ background: avatarColor(user.id) }}>{initials(user)}</span>
        <div className={styles.modalUserInfo}><h3>{user.username}</h3><p>{user.email || "Chưa có email"}</p></div>
        <div className={styles.modalUserMeta}><small>Hiện tại</small><strong>{user.isPremium ? "Premium" : "Free"}</strong></div>
      </div>
      <div className={styles.planGrid}>
        {plans.map((item) => (
          <label key={item.id} className={`${styles.planCard} ${plan === item.id ? styles.planActive : ""}`}>
            <input type="radio" checked={plan === item.id} onChange={() => setPlan(item.id)} />
            <span className={styles.planName}>{item.label}</span>
            <span className={styles.planPrice}>{item.price}</span>
            <span className={styles.planChip}>{item.chip}</span>
          </label>
        ))}
      </div>
      <div className={styles.modalActions}>
        <button className={styles.modalCancel} disabled={saving} onClick={onClose} type="button">Hủy</button>
        <button className={styles.modalSubmit} disabled={saving} onClick={() => onUnlock(plan)} type="button">{saving ? "Đang xử lý..." : user.isPremium ? "Gia hạn" : "Xác nhận"}</button>
      </div>
    </Modal>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [account, setAccount] = useState("")
  const [sort, setSort] = useState("new")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<Toast>(null)
  const [saving, setSaving] = useState(false)
  const [formTarget, setFormTarget] = useState<AdminUser | "create" | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [detail, setDetail] = useState<AdminUser | null>(null)
  const premiumRate = useMemo(() => stats?.total ? `${Math.round((stats.premium / stats.total) * 100)}%` : "0%", [stats])
  const activeRate = useMemo(() => stats?.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", [stats])
  const loadStats = useCallback(async () => setStats((await getUserStats()).data), [])
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getUsers({ page, limit: 10, search, status, account, sort })
      setUsers(response.data)
      setTotal(response.pagination.total)
      setTotalPages(Math.max(1, response.pagination.totalPages))
    } catch (loadError) {
      setError(apiMessage(loadError, "Không thể tải danh sách người dùng"))
    } finally {
      setLoading(false)
    }
  }, [account, page, search, sort, status])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) loadStats().catch((loadError) => setToast({ variant: "error", message: apiMessage(loadError, "Không thể tải thống kê") })) })
    return () => { active = false }
  }, [loadStats])

  useEffect(() => {
    let active = true
    queueMicrotask(() => { if (active) void loadUsers() })
    return () => { active = false }
  }, [loadUsers])

  async function saveUser(payload: AdminUserPayload) {
    setSaving(true)
    try {
      if (formTarget && formTarget !== "create") await updateUser(formTarget.id, payload)
      else await createUser(payload)
      setFormTarget(null)
      setToast({ variant: "success", message: "Đã lưu người dùng" })
      await Promise.all([loadUsers(), loadStats()])
      return null
    } catch (saveError) {
      setToast({ variant: "error", message: apiMessage(saveError, "Không thể lưu người dùng") })
      return apiErrors(saveError)
    } finally {
      setSaving(false)
    }
  }

  async function unlock(planId: AdminPlan) {
    if (!unlockTarget) return
    setSaving(true)
    try {
      await unlockUserPremium(unlockTarget.id, { planId })
      setUnlockTarget(null)
      setToast({ variant: "success", message: `Đã mở khóa ${planLabels[planId]}` })
      await Promise.all([loadUsers(), loadStats()])
    } catch (unlockError) {
      setToast({ variant: "error", message: apiMessage(unlockError, "Không thể mở khóa Premium") })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteUser(deleteTarget.id)
      setDeleteTarget(null)
      setToast({ variant: "success", message: "Đã xóa người dùng" })
      await Promise.all([loadUsers(), loadStats()])
    } catch (deleteError) {
      setToast({ variant: "error", message: apiMessage(deleteError, "Không thể xóa người dùng") })
    } finally {
      setSaving(false)
    }
  }

  async function openDetail(id: string) {
    try {
      setDetail((await getUserById(id)).data)
    } catch (detailError) {
      setToast({ variant: "error", message: apiMessage(detailError, "Không thể tải chi tiết") })
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader eyebrow={<span>Dashboard / <b>Người dùng</b></span>} title="Người dùng" actions={<AdminButton icon="plus" onClick={() => setFormTarget("create")}>Thêm người dùng</AdminButton>} />
      </motion.div>

      <motion.section className={styles.statsGrid} variants={containerVariants}>
        <motion.div variants={itemVariants}><StatCard icon="users" label="TỔNG NGƯỜI DÙNG" value={(stats?.total || 0).toLocaleString("en-US")} /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="check" label="ĐANG HOẠT ĐỘNG" value={(stats?.active || 0).toLocaleString("en-US")} meta={activeRate} tone="green" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="wallet" label="PREMIUM" value={(stats?.premium || 0).toLocaleString("en-US")} meta={premiumRate} tone="orange" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="clock" label="MỚI TRONG THÁNG" value={(stats?.newThisMonth || 0).toLocaleString("en-US")} /></motion.div>
      </motion.section>

      <motion.div variants={itemVariants}>
        <section className={styles.filters}>
          <label><AdminIcon name="search" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm kiếm theo tên, email hoặc ID..." /></label>
          <div>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Không hoạt động</option></select>
            <select value={account} onChange={(event) => { setAccount(event.target.value); setPage(1) }}><option value="">Tài khoản</option><option value="free">Free</option><option value="premium">Premium</option></select>
            <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="new">Mới nhất</option><option value="old">Cũ nhất</option><option value="exp">EXP cao nhất</option></select>
            <button type="button" onClick={() => void loadUsers()}>Tải lại</button>
          </div>
        </section>
      </motion.div>

      <motion.div variants={itemVariants}>
        <section className={styles.tableCard}>
          {loading && <div className={styles.skeletonList}><span /><span /><span /></div>}
          {!loading && error && <div className={styles.stateBox}>{error}<button type="button" onClick={() => void loadUsers()}>Tải lại</button></div>}
          {!loading && !error && !users.length && <div className={styles.stateBox}>Không có người dùng.</div>}
          {!loading && !error && users.length > 0 && (
            <>
              <AdminTable>
                <thead><tr><th>Người dùng</th><th>EXP</th><th>Gói</th><th>Hết hạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><div className={styles.userInfo}><span className={styles.avatar} style={{ background: avatarColor(user.id) }}>{initials(user)}</span><span><strong className={styles.userName}>{user.username}</strong><small className={styles.userEmail}>{user.email || "Chưa có email"}</small></span></div></td>
                      <td><span className={styles.expText}>{user.expPoints.toLocaleString("en-US")}</span></td>
                      <td><PlanBadge user={user} /></td>
                      <td><span className={styles.joinDate}>{formatDate(user.subscriptionUntil)}</span></td>
                      <td><span className={styles.statusCol}><i className={`${styles.statusDot} ${user.status === "active" ? styles.statusActive : styles.statusInactive}`} />{user.status === "active" ? "Đang hoạt động" : "Không hoạt động"}</span></td>
                      <td><div className={styles.actions}>
                        <button className={styles.unlockBtn} type="button" aria-label="Mở khóa Premium" onClick={() => setUnlockTarget(user)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg></button>
                        <button type="button" aria-label="Xem chi tiết" onClick={() => void openDetail(user.id)}><AdminIcon name="eye" /></button>
                        <button type="button" aria-label="Sửa người dùng" onClick={() => setFormTarget(user)}><AdminIcon name="edit" /></button>
                        <button type="button" aria-label="Xóa người dùng" onClick={() => setDeleteTarget(user)}><AdminIcon name="alert" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <footer>
                <span>Đang xem {users.length ? (page - 1) * 10 + 1 : 0} đến {(page - 1) * 10 + users.length} trong số {total} người dùng</span>
                <div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">‹</button><strong>{page}/{totalPages}</strong><button disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} type="button">›</button></div>
              </footer>
            </>
          )}
        </section>
      </motion.div>

      {formTarget && <UserModal user={formTarget === "create" ? null : formTarget} saving={saving} onClose={() => setFormTarget(null)} onSubmit={saveUser} />}
      {unlockTarget && <UnlockModal user={unlockTarget} saving={saving} onClose={() => setUnlockTarget(null)} onUnlock={(plan) => void unlock(plan)} />}
      {detail && (
        <Modal title="Chi tiết người dùng" onClose={() => setDetail(null)}>
          <div className={styles.detailGrid}>
            <div><span>ID</span><strong>{detail.id}</strong></div>
            <div><span>Tên</span><strong>{detail.username}</strong></div>
            <div><span>Email</span><strong>{detail.email || "-"}</strong></div>
            <div><span>EXP</span><strong>{detail.expPoints.toLocaleString("en-US")}</strong></div>
            <div><span>Premium đến</span><strong>{formatDate(detail.subscriptionUntil)}</strong></div>
            <div><span>Tiến độ</span><strong>{detail.progressCount}</strong></div>
            <div><span>Phiên đăng nhập</span><strong>{detail.activeSessionCount}</strong></div>
            <div><span>Ngày tạo</span><strong>{formatDate(detail.createdAt)}</strong></div>
          </div>
          <h3 className={styles.sectionTitle}>Tiến độ gần đây</h3>
          {!detail.recentProgress?.length
            ? <div className={styles.stateBox}>Chưa có tiến độ học tập.</div>
            : <div className={styles.progressList}>{detail.recentProgress.map((progress) => <article key={progress.id}><strong>{progress.lesson.title}</strong><span>{progress.lesson.levelType} / Bài {progress.lesson.lessonOrder} / +{progress.expGained} EXP</span></article>)}</div>}
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Xóa người dùng" onClose={() => setDeleteTarget(null)}>
          <div className={styles.stateBox}>Bạn có chắc muốn xóa người dùng &quot;{deleteTarget.username}&quot;? Hành động này không thể hoàn tác.</div>
          <div className={styles.modalActions}><button className={styles.modalCancel} disabled={saving} onClick={() => setDeleteTarget(null)} type="button">Hủy</button><button className={styles.dangerButton} disabled={saving} onClick={() => void confirmDelete()} type="button">{saving ? "Đang xóa..." : "Xóa"}</button></div>
        </Modal>
      )}
      {toast && <div className={`${styles.toast} ${toast.variant === "success" ? styles.toastSuccess : styles.toastError}`}><span>{toast.message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setToast(null)}>x</button></div>}
    </motion.div>
  )
}
