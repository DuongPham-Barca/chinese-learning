"use client"

import { useEffect } from "react"
import type { MockUpgradeUser } from "@/lib/pro-upgrade-provider"
import styles from "./pro-upgrade-modal.module.css"

type IconName = "close" | "crown" | "check"

const benefits = [
  "Mở khóa toàn bộ bài học HSK",
  "Luyện phát âm theo câu mẫu",
  "Không giới hạn câu luyện tập",
  "Theo dõi tiến độ chi tiết",
  "Flashcard & Dictation",
  "Cập nhật miễn phí trọn đời",
]

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    crown: <><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z"/><path d="M6 22h12"/></>,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export default function ProUpgradeModal({ open, user, onClose }: { open: boolean; user: MockUpgradeUser; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown) }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>

        <div className={styles.hero}>
          <div className={styles.heroIcon}><Icon name="crown" /></div>
          <h2 id="upgrade-title">Nâng cấp Pro</h2>
          <p>Mở khóa toàn bộ tính năng học tiếng Trung nâng cao.</p>
        </div>

        <div className={styles.body}>
          <div className={styles.pricing}>
            <span className={styles.priceLabel}>Thanh toán một lần</span>
            <strong>99.000đ</strong>
            <span className={styles.badge}>Sở hữu vĩnh viễn</span>
          </div>

          <div className={styles.benefits}>
            {benefits.map((benefit) => (
              <div className={styles.benefitItem} key={benefit}>
                <i><Icon name="check" /></i>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <button type="button" className={styles.ctaButton} onClick={onClose}>
            Nâng cấp ngay
          </button>

          <p className={styles.footerText}>Có thể hủy bất cứ lúc nào</p>
        </div>
      </section>
    </div>
  )
}
