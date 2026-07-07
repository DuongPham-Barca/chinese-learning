"use client"

import Image from "next/image"
import { API_BASE_URL } from "@/lib/api"
import styles from "./login.module.css"

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" />
    </svg>
  )
}

export default function LoginPage() {
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
            <header className={styles.formHeader}>
              <h2>Chào mừng đến với ChineseDict</h2>
              <p>Đăng nhập bằng tài khoản Google để tiếp tục hành trình học tiếng Trung.</p>
            </header>

            <button
              type="button"
              className={styles.googleButton}
              onClick={() => window.location.assign(`${API_BASE_URL}/auth/google`)}
            >
              <GoogleIcon />
              <span>Tiếp tục với Google</span>
            </button>
          </div>

          <p className={styles.terms}>Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản sử dụng</a> và <a href="#">Chính sách bảo mật</a> của ChineseDict.</p>
        </div>
      </section>
    </main>
  )
}
