"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useProUpgrade } from "@/lib/pro-upgrade-provider"
import styles from "./qr-payment-modal.module.css"

type PlanInfo = {
  id: string
  title: string
  price: string
  durationMonths: number
  expiry: string
}

type QrPaymentModalProps = {
  open: boolean
  plan: PlanInfo | null
  onClose: () => void
}

const bankInfo = {
  bank: "Vietcombank",
  accountNumber: "1012345678",
  accountName: "CONG TY CHINESE DICT",
}

export default function QrPaymentModal({ open, plan, onClose }: QrPaymentModalProps) {
  const { user } = useProUpgrade()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const transferContent = plan ? `PRO-${user.id}-${plan.id}` : ""

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      // fallback
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setSubmitted(true)
  }, [])

  const handleClose = useCallback(() => {
    setSubmitted(false)
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {open && plan && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2>Yêu cầu đã được gửi</h2>
                <p>Yêu cầu thanh toán đã được gửi. Tài khoản của bạn sẽ được kích hoạt sau khi admin xác nhận.</p>
                <button type="button" className={styles.doneButton} onClick={handleClose}>Đã hiểu</button>
              </div>
            ) : (
              <>
                <div className={styles.header}>
                  <div>
                    <h2>Thanh toán gói Pro</h2>
                    <p>Quét mã QR hoặc chuyển khoản theo thông tin bên dưới.</p>
                  </div>
                  <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Đóng">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className={styles.body}>
                  <div className={styles.qrSection}>
                    <div className={styles.qrBox}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.qrIcon}>
                        <rect x="3" y="3" width="5" height="5" rx="1" />
                        <rect x="16" y="3" width="5" height="5" rx="1" />
                        <rect x="3" y="16" width="5" height="5" rx="1" />
                        <rect x="13" y="13" width="2" height="2" />
                        <rect x="17" y="13" width="2" height="2" />
                        <rect x="13" y="17" width="2" height="2" />
                        <rect x="16" y="16" width="5" height="5" rx="1" />
                        <path d="M8 3v2M8 19v2M3 8h2M19 8h2M3 16h2M19 16h2M16 3v2" />
                      </svg>
                      <span>QR thanh toán</span>
                    </div>
                    <p className={styles.qrNote}>Vui lòng chuyển khoản đúng nội dung để được xác nhận nhanh hơn.</p>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.planSummary}>
                      <h3>Thông tin gói</h3>
                      <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                          <span>Gói đã chọn</span>
                          <strong>{plan.title}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Thời hạn</span>
                          <strong>{plan.durationMonths} tháng</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Số tiền</span>
                          <strong className={styles.summaryPrice}>{plan.price}đ</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Hết hạn dự kiến</span>
                          <strong>{plan.expiry}</strong>
                        </div>
                      </div>
                    </div>

                    <div className={styles.bankInfo}>
                      <h3>Thông tin chuyển khoản</h3>
                      <div className={styles.bankRow}>
                        <span>Ngân hàng</span>
                        <strong>{bankInfo.bank}</strong>
                      </div>
                      <div className={styles.bankRow}>
                        <span>Số tài khoản</span>
                        <strong>{bankInfo.accountNumber}</strong>
                        <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(bankInfo.accountNumber, "account")}>
                          {copiedField === "account" ? "Đã sao chép" : "Sao chép"}
                        </button>
                      </div>
                      <div className={styles.bankRow}>
                        <span>Chủ tài khoản</span>
                        <strong>{bankInfo.accountName}</strong>
                      </div>
                      <div className={styles.bankRow}>
                        <span>Nội dung</span>
                        <code className={styles.transferCode}>{transferContent}</code>
                        <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(transferContent, "content")}>
                          {copiedField === "content" ? "Đã sao chép" : "Sao chép"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button type="button" className={styles.confirmBtn} onClick={handleConfirm} disabled={submitting}>
                        {submitting ? "Đang xử lý..." : "Xác nhận đã chuyển khoản"}
                      </button>
                      <button type="button" className={styles.cancelBtn} onClick={handleClose}>Hủy</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
