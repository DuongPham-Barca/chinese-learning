"use client"

import { useEffect, useState } from "react"
import type { MockUpgradeUser } from "@/lib/pro-upgrade-provider"
import styles from "./pro-upgrade-modal.module.css"

type IconName = "close" | "crown" | "check" | "copy" | "refresh" | "shield" | "sparkles"

const benefits = ["Toàn bộ HSK1 → HSK6", "Khóa học Giao Tiếp", "70+ bài học chi tiết", "Flashcard không giới hạn", "Dictation & Sắp xếp câu", "Quiz cuối bài", "Cập nhật miễn phí trọn đời", "Không quảng cáo"]

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    crown: <><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z"/><path d="M6 22h12"/></>,
    check: <path d="m5 12 4 4L19 6" />,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    sparkles: <><path d="m12 3-1 3.3a3 3 0 0 1-2 2L5.7 9.4 9 10.5a3 3 0 0 1 2 2l1 3.3 1-3.3a3 3 0 0 1 2-2l3.3-1.1L15 8.3a3 3 0 0 1-2-2L12 3Z"/><path d="m5 15-.5 1.5A2 2 0 0 1 3 18l1.5.5A2 2 0 0 1 6 20l.5-1.5A2 2 0 0 1 8 17l-1.5-.5A2 2 0 0 1 5 15Z"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function MockQrCode() {
  const modules = Array.from({ length: 29 * 29 }, (_, index) => {
    const x = index % 29
    const y = Math.floor(index / 29)
    const finder = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21)
    const finderHole = ((x >= 1 && x <= 5 && y >= 1 && y <= 5) || (x >= 23 && x <= 27 && y >= 1 && y <= 5) || (x >= 1 && x <= 5 && y >= 23 && y <= 27))
    const finderCore = ((x >= 2 && x <= 4 && y >= 2 && y <= 4) || (x >= 24 && x <= 26 && y >= 2 && y <= 4) || (x >= 2 && x <= 4 && y >= 24 && y <= 26))
    return (finder && (!finderHole || finderCore)) || (!finder && ((x * 7 + y * 11 + x * y) % 5 < 2))
  })
  return <div className={styles.qrBox}><strong><span>V</span>IETQR</strong><svg viewBox="0 0 29 29" aria-label="Mã VietQR minh họa">{modules.map((filled, index) => filled ? <rect key={index} x={index % 29} y={Math.floor(index / 29)} width="1" height="1" /> : null)}</svg><small>napas 247 · Vietcombank</small><b>NGUYEN VAN A · 99.000 VND</b></div>
}

function CopyButton({ label, value, onCopied }: { label: string; value: string; onCopied: () => void }) {
  async function copy() {
    try { await navigator.clipboard.writeText(value) } catch { /* Clipboard can be unavailable on HTTP. */ }
    onCopied()
  }
  return <button type="button" className={styles.copyButton} onClick={copy}><Icon name="copy" />{label}</button>
}

export default function ProUpgradeModal({ open, user, onClose }: { open: boolean; user: MockUpgradeUser; onClose: () => void }) {
  const [toast, setToast] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown) }
  }, [open, onClose])

  function showCopied() {
    setToast(true)
    window.setTimeout(() => setToast(false), 1400)
  }

  function refresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 700)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        {toast && <div className={styles.toast}><Icon name="check" />Đã copy</div>}

        <header className={styles.hero}>
          <Icon name="sparkles" />
          <div className={styles.crown}><Icon name="crown" /></div>
          <span><i />ChineseDict Pro</span>
          <h2 id="upgrade-title">Mở khóa toàn bộ ChineseDict Pro</h2>
          <p>Học không giới hạn toàn bộ HSK1 → HSK6 và Giao Tiếp.</p>
        </header>

        <div className={styles.modalBody}>
          <section className={styles.priceCard}><div><span>Thanh toán một lần</span><span><Icon name="crown" />Sở hữu vĩnh viễn</span></div><strong>99.000đ</strong><p>Không phí hằng tháng · Không tự động gia hạn</p></section>

          <section className={styles.benefitsCard}><h3><Icon name="sparkles" />Bạn sẽ nhận được</h3><div>{benefits.map((benefit) => <p key={benefit}><i><Icon name="check" /></i>{benefit}</p>)}</div></section>

          <section className={styles.paymentCard}>
            <header><h3>Thanh toán bằng VietQR</h3><span>MODULAR</span></header>
            <MockQrCode />
            <p className={styles.scanText}>Quét mã QR bằng ứng dụng ngân hàng để thanh toán</p>
            <div className={styles.bankInfo}>
              <div><span>NGÂN HÀNG</span><strong>Vietcombank</strong></div>
              <div><span>SỐ TÀI KHOẢN</span><strong>123456789</strong><CopyButton label="Copy STK" value="123456789" onCopied={showCopied} /></div>
              <div><span>TÊN TÀI KHOẢN</span><strong>NGUYEN VAN A</strong></div>
              <div><span>SỐ TIỀN</span><strong className={styles.blueValue}>99.000đ</strong><CopyButton label="Copy" value="99.000đ" onCopied={showCopied} /></div>
              <div><span>NỘI DUNG CK</span><strong className={styles.blueValue}>APPCHINESE_{user.id}</strong><CopyButton label="Copy nội dung" value={`APPCHINESE_${user.id}`} onCopied={showCopied} /></div>
            </div>
          </section>

          <section className={styles.waitingCard}><i /><div><h3>{confirmed ? "Đang xác nhận thanh toán..." : "Đang chờ thanh toán..."}</h3><p>Sau khi chuyển khoản hãy nhấn “Tôi đã chuyển khoản”.</p></div></section>
          <section className={styles.securityCard}><i><Icon name="shield" /></i><div><h3>Thanh toán được bảo mật</h3><p>Vui lòng ghi đúng <strong>nội dung chuyển khoản</strong> để hệ thống xác nhận nhanh hơn.</p></div></section>
        </div>

        <footer className={styles.footer}><div><button type="button" onClick={() => setConfirmed(true)}>Tôi đã chuyển khoản</button><button type="button" className={refreshing ? styles.refreshing : ""} onClick={refresh}><Icon name="refresh" />Làm mới</button></div><button type="button" onClick={onClose}>Đóng</button></footer>
      </section>
    </div>
  )
}
