"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <path d="m1 1 22 22" />
        </>
      )}
    </svg>
  )
}

function Spinner() {
  return (
    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Đăng nhập thất bại")
      }

      sessionStorage.setItem("admin-route-session", "active")
      router.replace("/admin")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.lockIcon}>
            <ShieldIcon />
          </span>
          <h1>Admin Panel</h1>
          <p>Trang quản trị ChineseDict. Vui lòng đăng nhập để tiếp tục.</p>
        </div>
      </section>

      <section className={styles.authSide}>
        <div className={styles.authCard}>
          <div className={styles.formHeader}>
            <h2>Đăng nhập Admin</h2>
            <p>Chỉ dành cho quản trị viên hệ thống.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">Tên đăng nhập</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Mật khẩu</label>
              <div className={styles.inputWrap}>
                <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePw}
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <><Spinner /> Đang đăng nhập...</>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
