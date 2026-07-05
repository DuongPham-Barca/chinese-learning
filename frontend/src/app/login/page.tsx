"use client"

import Image from "next/image"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./login.module.css"

type AuthMode = "login" | "register"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  )
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15.2 15.2 0 0 1-2.1 2.8M6.4 6.4C3.9 8.2 2.5 12 2.5 12s3.5 6 9.5 6a9.6 9.6 0 0 0 3.1-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [showPassword, setShowPassword] = useState(false)

  const isLogin = mode === "login"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push("/")
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-label="Giới thiệu ChineseDict">
        <div className={styles.brand}>
          <span className={styles.brandIcon}>中</span>
          <span>
            <strong>ChineseDict</strong>
            <small>Học tiếng Trung dễ hơn mỗi ngày</small>
          </span>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.illustrationWrap}>
            <Image
              className={styles.illustration}
              src="/chinese-learning-hero.png"
              alt="Bạn nhỏ đang học tiếng Trung"
              fill
              priority
              sizes="420px"
            />
            <div className={`${styles.floatCard} ${styles.helloCard}`}>
              <strong>你好</strong><small>nǐ hǎo · xin chào</small>
            </div>
            <div className={`${styles.floatCard} ${styles.studyCard}`}>
              <strong>学习</strong><small>xué xí · học tập</small>
            </div>
            <div className={`${styles.floatCard} ${styles.listenCard}`}>
              <span className={styles.headphone}>♬</span>
              <span><strong>Luyện nghe</strong><small>HSK 1-6</small></span>
            </div>
          </div>

          <div className={styles.heroCopy}>
            <h1>Hành trình chinh phục tiếng Trung <span>bắt đầu từ đây.</span></h1>
            <p>Học từ vựng, luyện phát âm và ghi nhớ chữ Hán với phương pháp thông minh, cá nhân hóa theo trình độ của bạn.</p>
          </div>
        </div>
      </section>

      <section className={styles.authSide}>
        <div className={styles.authArea}>
          <div className={styles.authCard}>
            <div className={styles.tabs} role="tablist" aria-label="Chọn hình thức xác thực">
              <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? styles.activeTab : ""} onClick={() => setMode("login")}>Đăng nhập</button>
              <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? styles.activeTab : ""} onClick={() => setMode("register")}>Đăng ký</button>
            </div>

            <header className={styles.formHeader}>
              <h2>{isLogin ? "Chào mừng đến với ChineseDict" : "Bắt đầu với ChineseDict"}</h2>
              <p>{isLogin ? "Đăng nhập để tiếp tục lộ trình học tiếng Trung của bạn" : "Tạo tài khoản để bắt đầu hành trình học tiếng Trung"}</p>
            </header>

            <button type="button" className={styles.googleButton} onClick={() => router.push("/")}>
              <GoogleIcon />
              <span>{isLogin ? "Tiếp tục với Google" : "Đăng ký với Google"}</span>
            </button>

            <div className={styles.divider}><span>HOẶC</span></div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {!isLogin && (
                <label>
                  Họ và tên
                  <input name="name" type="text" autoComplete="name" placeholder="Nguyễn Văn An" required />
                </label>
              )}
              <label>
                Email
                <input name="email" type="email" autoComplete="email" placeholder="ban@email.com" required />
              </label>
              <label>
                Mật khẩu
                <span className={styles.passwordField}>
                  <input name="password" type={showPassword ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••" minLength={6} required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </span>
              </label>

              {isLogin && (
                <div className={styles.optionsRow}>
                  <label className={styles.remember}><input type="checkbox" name="remember" /> Ghi nhớ tôi</label>
                  <button type="button" className={styles.textButton}>Quên mật khẩu?</button>
                </div>
              )}

              <button type="submit" className={styles.submitButton}>{isLogin ? "Đăng nhập bằng email" : "Tạo tài khoản"}</button>
            </form>

            <p className={styles.cardFooter}>
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
              <button type="button" onClick={() => setMode(isLogin ? "register" : "login")}>{isLogin ? "Đăng ký miễn phí" : "Đăng nhập"}</button>
            </p>
          </div>

          <p className={styles.terms}>Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a> của ChineseDict.</p>
        </div>
      </section>
    </main>
  )
}
