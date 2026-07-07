"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable, PageHeader, Pagination, StatCard } from "@/components/admin/admin-ui"
import styles from "./users.module.css"

type Toast = { variant: "success" | "error"; message: string } | null

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
}

const plans = [
  { id: "2months", months: 2, label: "2 tháng", price: "49.000đ", chip: "Phổ biến" },
  { id: "6months", months: 6, label: "6 tháng", price: "119.000đ", chip: "Tiết kiệm 20%" },
  { id: "12months", months: 12, label: "12 tháng", price: "189.000đ", chip: "Tiết kiệm 35%" },
]

function calcExpiry(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const initialUsers: User[] = [
  { id:"#U-1024",name:"Nguyễn Văn An",email:"an.nguyen@email.com",initials:"NA",color:"#2563eb",level:"HSK4",exp:18540,plan:"12months",premiumUntil:"20/12/2026",unlocked:["HSK1","HSK2","HSK3","HSK4"],joined:"12/03/2024",status:"active" },
  { id:"#U-1023",name:"Trần Thị Bình",email:"binh.tran@email.com",initials:"TB",color:"#059669",level:"HSK2",exp:9420,plan:null,premiumUntil:null,unlocked:["HSK1"],joined:"05/02/2024",status:"active" },
  { id:"#U-1022",name:"Lê Quang Cường",email:"cuong.le@edu.vn",initials:"LC",color:"#d97706",level:"HSK5",exp:23100,plan:"6months",premiumUntil:"15/03/2027",unlocked:["HSK1","HSK2","HSK3","HSK4","HSK5"],joined:"20/01/2024",status:"active" },
  { id:"#U-1021",name:"Phạm Mỹ Dung",email:"dung.pham@design.co",initials:"PD",color:"#dc2626",level:"HSK3",exp:7650,plan:null,premiumUntil:null,unlocked:["HSK1","HSK2"],joined:"15/12/2023",status:"inactive" },
  { id:"#U-1020",name:"Hoàng Minh Đức",email:"duc.hoang@gmail.com",initials:"HĐ",color:"#7c3aed",level:"HSK1",exp:3200,plan:null,premiumUntil:null,unlocked:["HSK1"],joined:"08/11/2023",status:"active" },
  { id:"#U-1019",name:"Vũ Thị Hoa",email:"hoa.vu@email.com",initials:"VH",color:"#0891b2",level:"HSK6",exp:45600,plan:"12months",premiumUntil:"10/08/2027",unlocked:["HSK1","HSK2","HSK3","HSK4","HSK5","HSK6"],joined:"02/10/2023",status:"active" },
]

type PlanValue = "2months" | "6months" | "12months"
type PlanId = PlanValue | null
type UserStatus = "active" | "inactive"

interface User {
  id: string
  name: string
  email: string
  initials: string
  color: string
  level: string
  exp: number
  plan: PlanId
  premiumUntil: string | null
  unlocked: string[]
  joined: string
  status: UserStatus
}

const allLevels = ["HSK1","HSK2","HSK3","HSK4","HSK5","HSK6"]

function FiltersCard() {
  return <section className={styles.filters}><label><AdminIcon name="search" /><input placeholder="Tìm kiếm theo tên, email hoặc ID người dùng..." /></label><div><select defaultValue=""><option value="">Cấp độ (Level)</option><option>HSK1</option><option>HSK2</option><option>HSK3</option><option>HSK4</option><option>HSK5</option><option>HSK6</option></select><select defaultValue=""><option value="">Trạng thái</option><option>Đang hoạt động</option><option>Không hoạt động</option></select><select defaultValue=""><option value="">Loại tài khoản</option><option>Free</option><option>Premium</option></select><select defaultValue="new"><option value="new">Sắp xếp: Mới nhất</option><option>Cũ nhất</option><option>EXP cao nhất</option></select></div></section>
}

const planLabels: Record<PlanValue, string> = { "2months": "2 tháng", "6months": "6 tháng", "12months": "12 tháng" }

function PlanBadge({ plan }: { plan: PlanId }) {
  if (!plan) return <span className={styles.premiumNo}>Free</span>
  return <span className={styles.premiumYes}>{planLabels[plan]}</span>
}

function UnlockModal({ user, onUnlock, onClose }: { user: User; onUnlock: (planMonths: number) => void; onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<number>(2)
  const [submitting, setSubmitting] = useState(false)

  function submit() {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      onUnlock(selectedPlan)
      onClose()
    }, 1000)
  }

  const expiry = calcExpiry(selectedPlan)
  const plan = plans.find((p) => p.months === selectedPlan)

  return (
    <>
      <button className={styles.scrim} onClick={onClose} aria-label="Đóng" />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Xác nhận mở khóa">
        <div className={styles.modalHeader}>
          <div>
            <h2>Mở khóa khóa học</h2>
            <p>Chọn gói và xác nhận mở khóa toàn bộ khóa học cho người dùng.</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className={styles.modalUser}>
          <span className={styles.modalAvatar} style={{ background: user.color }}>{user.initials}</span>
          <div className={styles.modalUserInfo}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <div className={styles.modalUserMeta}>
            <small>ID</small>
            <strong>{user.id}</strong>
          </div>
          <div className={styles.modalUserMeta}>
            <small>Gói hiện tại</small>
            <strong className={user.plan ? styles.premiumYes : styles.premiumNo}>{user.plan ? planLabels[user.plan] : "Free"}</strong>
          </div>
        </div>

        <p className={styles.planLabel}>Gói đã đăng ký</p>
        <div className={styles.planGrid}>
          {plans.map((p) => (
            <label
              key={p.id}
              className={`${styles.planCard} ${selectedPlan === p.months ? styles.planActive : ""}`}
            >
              <input
                type="radio"
                name="plan"
                checked={selectedPlan === p.months}
                onChange={() => setSelectedPlan(p.months)}
              />
              <span className={styles.planName}>{p.label}</span>
              <span className={styles.planPrice}>{p.price}</span>
              <span className={styles.planChip}>{p.chip}</span>
            </label>
          ))}
        </div>

        <div className={styles.expiryPreview}>
          <span>Ngày hết hạn</span>
          <strong>{expiry}</strong>
        </div>

        <div style={{ margin: "0 0 20px", padding: "14px 16px", borderRadius: 12, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <p style={{ margin: 0, color: "#92400E", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
            Xác nhận mở khóa toàn bộ khóa học cho <strong>{user.name}</strong> với gói <strong>{plan?.label}</strong>?
          </p>
          <p style={{ margin: "6px 0 0", color: "#A16207", fontSize: 12, lineHeight: 1.4 }}>
            Tài khoản sẽ hết hạn vào <strong>{expiry}</strong>.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.modalCancel} onClick={onClose}>Hủy</button>
          <button className={styles.modalSubmit} disabled={submitting} onClick={submit}>
            {submitting ? (
              <><span className={styles.modalSpinner} /> Đang xử lý...</>
            ) : (
              <><AdminIcon name="check" /> Xác nhận mở khóa</>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [unlockTarget, setUnlockTarget] = useState<User | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  function handleUnlocked(target: User, planMonths: number) {
    const planId = (plans.find((p) => p.months === planMonths)?.id || "2months") as PlanValue
    setUsers((prev) => prev.map((u) => u.id === target.id ? { ...u, plan: planId, premiumUntil: calcExpiry(planMonths), unlocked: [...allLevels] } : u))
    showToast("success", `Đã mở khóa gói ${planLabels[planId]} cho ${target.name}, hết hạn ${calcExpiry(planMonths)}`)
  }

  function showToast(variant: "success" | "error", message: string) {
    setToast({ variant, message })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader eyebrow={<span>Dashboard › <b>Người dùng</b></span>} title="Người dùng" actions={<AdminButton icon="plus">Thêm người dùng</AdminButton>} />
      </motion.div>
      <motion.section className={styles.statsGrid} variants={containerVariants}>
        <motion.div variants={itemVariants}><StatCard icon="users" label="TỔNG NGƯỜI DÙNG" value="12,540" meta="+8.2%" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="check" label="ĐANG HOẠT ĐỘNG" value="8,320" meta="66.3%" tone="green" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="wallet" label="PREMIUM" value="1,847" meta="14.7%" tone="orange" /></motion.div>
        <motion.div variants={itemVariants}><StatCard icon="clock" label="MỚI TRONG THÁNG" value="423" meta="+12%" tone="blue" /></motion.div>
      </motion.section>
      <motion.div variants={itemVariants}><FiltersCard /></motion.div>
      <motion.div variants={itemVariants}>
        <section className={styles.tableCard}><AdminTable><thead><tr><th>ID</th><th>Người dùng</th><th>EXP</th><th>Gói</th><th>Hết hạn</th><th>Trạng thái</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><b>{user.id}</b></td><td><div className={styles.userInfo}><span className={styles.avatar} style={{ background: user.color }}>{user.initials}</span><span><strong className={styles.userName}>{user.name}</strong><small className={styles.userEmail}>{user.email}</small></span></div></td><td><span className={styles.expText}>{user.exp.toLocaleString("en-US")}</span></td><td><PlanBadge plan={user.plan} /></td><td><span className={styles.joinDate}>{user.premiumUntil || "—"}</span></td><td><span className={styles.statusCol}><i className={`${styles.statusDot} ${user.status === "active" ? styles.statusActive : styles.statusInactive}`} />{user.status === "active" ? "Hoạt động" : "Không hoạt động"}</span></td><td><div className={styles.actions}><button type="button" className={styles.unlockBtn} onClick={() => setUnlockTarget(user)} aria-label="Mở khóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></button><button type="button" aria-label="Xem"><AdminIcon name="eye" /></button><button type="button" aria-label="Sửa"><AdminIcon name="edit" /></button></div></td></tr>)}</tbody></AdminTable><footer><span>Đang xem 1 đến 6 trong số 12,540 người dùng</span><Pagination /></footer></section>
      </motion.div>

      {unlockTarget && <UnlockModal user={unlockTarget} onUnlock={(m) => handleUnlocked(unlockTarget, m)} onClose={() => setUnlockTarget(null)} />}

      {toast && (
        <div className={`${styles.toast} ${toast.variant === "success" ? styles.toastSuccess : styles.toastError}`}>
          {toast.variant === "success" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></svg>
          )}
          {toast.message}
        </div>
      )}
    </motion.div>
  )
}
