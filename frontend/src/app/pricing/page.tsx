"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SiteNavbar from "@/components/site-navbar"
import LoadingSpinner from "@/components/loading-spinner"
import QrPaymentModal from "@/components/qr-payment-modal"
import { useAuth } from "@/lib/auth-provider"
import styles from "./pricing.module.css"

type PlanId = "2months" | "6months" | "12months"

type Plan = {
  id: PlanId
  title: string
  price: string
  originalPrice: string | null
  savings: string | null
  popular: boolean
  badge: string | null
  features: string[]
  buttonLabel: string
  description: string
  durationMonths: number
}

const allFeatures = [
  "Mở khóa toàn bộ bài học HSK",
  "Luyện phát âm theo câu mẫu",
  "Không giới hạn câu luyện tập",
  "Theo dõi tiến độ học tập",
  "Sử dụng đầy đủ tính năng Pro",
]

const plans: Plan[] = [
  {
    id: "2months",
    title: "Gói 2 tháng",
    price: "49.000",
    originalPrice: null,
    savings: null,
    popular: false,
    badge: null,
    features: allFeatures,
    buttonLabel: "Chọn gói 2 tháng",
    description: "Phù hợp để trải nghiệm ngắn hạn",
    durationMonths: 2,
  },
  {
    id: "6months",
    title: "Gói 6 tháng",
    price: "119.000",
    originalPrice: "147.000",
    savings: "Tiết kiệm 20%",
    popular: true,
    badge: "Phổ biến nhất",
    features: allFeatures,
    buttonLabel: "Chọn gói 6 tháng",
    description: "Lựa chọn cân bằng cho việc học đều đặn",
    durationMonths: 6,
  },
  {
    id: "12months",
    title: "Gói 12 tháng",
    price: "189.000",
    originalPrice: "294.000",
    savings: "Tiết kiệm 35%",
    popular: false,
    badge: "Tiết kiệm nhất",
    features: allFeatures,
    buttonLabel: "Chọn gói 12 tháng",
    description: "Tiết kiệm nhất cho hành trình dài hạn",
    durationMonths: 12,
  },
]

const freeVsPro: [string, boolean, boolean][] = [
  ["Bài học HSK", false, true],
  ["Từ vựng HSK", true, true],
  ["Luyện phát âm", false, true],
  ["Luyện nghe", true, true],
  ["Bài tập không giới hạn", false, true],
  ["Theo dõi tiến độ", false, true],
  ["Hỗ trợ ưu tiên", false, true],
]

const steps: [string, string][] = [
  ["Chọn gói", "Chọn thời hạn sử dụng phù hợp với nhu cầu của bạn."],
  ["Chuyển khoản", "Quét mã QR hoặc chuyển khoản ngân hàng."],
  ["Kích hoạt", "Tài khoản Pro được kích hoạt trong vòng 24h."],
]

const faq: [string, string][] = [
  ["Khi nào tài khoản được kích hoạt?", "Tài khoản sẽ được kích hoạt trong vòng 24 giờ sau khi nhận được thanh toán. Bạn sẽ nhận được email xác nhận."],
  ["Có thể gia hạn không?", "Có. Sau khi hết hạn, bạn có thể mua gói mới để tiếp tục sử dụng ChineseDict Pro."],
  ["Có hoàn tiền không?", "Chúng tôi có chính sách hoàn tiền trong vòng 7 ngày nếu bạn không hài lòng với dịch vụ."],
  ["Thanh toán bằng hình thức nào?", "ChineseDict nhận thanh toán qua chuyển khoản VietinBank bằng thông tin hoặc mã VietQR hiển thị trong ứng dụng."],
]

function calcExpiry(months: number, currentExpiry?: string | null): string {
  const now = new Date()
  const existingExpiry = currentExpiry ? new Date(currentExpiry) : null
  const d = existingExpiry && existingExpiry > now ? existingExpiry : now
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function PricingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const selectedForModal = (() => {
    const s = plans.find((p) => p.id === selectedPlan)
    return s ? { id: s.id, title: s.title, price: s.price, durationMonths: s.durationMonths, expiry: calcExpiry(s.durationMonths, user?.subscriptionUntil) } : null
  })()
  const subscriptionExpiry = user?.subscriptionUntil ? Date.parse(user.subscriptionUntil) : Number.NaN
  const hasActiveSubscription = Boolean(
    user?.isPremium
    && Number.isFinite(subscriptionExpiry)
    && subscriptionExpiry > now,
  )
  const activePlanId = hasActiveSubscription ? user?.plan : null

  useEffect(() => {
    if (!Number.isFinite(subscriptionExpiry) || subscriptionExpiry <= now) return
    const maxTimerDelay = 2_147_000_000
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(subscriptionExpiry - now + 50, maxTimerDelay),
    )
    return () => window.clearTimeout(timer)
  }, [now, subscriptionExpiry])

  function choosePlan(planId: PlanId) {
    if (activePlanId === planId) return
    if (!user) {
      router.push("/login?next=/pricing")
      return
    }
    setSelectedPlan(planId)
    setPaymentModalOpen(true)
  }

  if (loading) {
    return <main className={styles.page}><SiteNavbar /><LoadingSpinner /></main>
  }

  return (
    <main className={styles.page}>
      <SiteNavbar />
      <QrPaymentModal open={paymentModalOpen} plan={selectedForModal} onClose={() => setPaymentModalOpen(false)} />
      <div className={styles.hero} data-motion-page>
        <h1>Đăng ký gói Pro</h1>
        <p>
          Chọn thời hạn sử dụng phù hợp. Tất cả các gói đều mở khóa đầy đủ tính năng Pro.
        </p>
      </div>

      <div className={styles.plans} data-motion-page>
        {plans.map((plan) => {
          const isRegisteredPlan = activePlanId === plan.id
          return <div
            key={plan.id}
            className={`${styles.planCard} ${plan.popular ? styles.popularCard : ""}`}
          >
            {plan.badge && <span className={styles.badge}>{plan.badge}</span>}
            <h3 className={styles.planTitle}>{plan.title}</h3>
            <div className={styles.priceRow}>
              <strong className={styles.price}>
                {plan.price}<span>đ</span>
              </strong>
              {plan.originalPrice && (
                <span className={styles.originalPrice}>{plan.originalPrice}đ</span>
              )}
            </div>
            {plan.savings && <span className={styles.savings}>{plan.savings}</span>}
            <p className={styles.planDesc}>{plan.description}</p>
            <ul className={styles.features}>
              {plan.features.map((f) => (
                <li key={f}>
                  <i>
                    <svg viewBox="0 0 24 24">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </i>
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${styles.ctaButton} ${plan.popular ? styles.ctaPrimary : ""} ${isRegisteredPlan ? styles.ctaDisabled : ""}`}
              onClick={() => choosePlan(plan.id)}
              disabled={isRegisteredPlan}
            >
              {isRegisteredPlan ? "Đã đăng ký gói" : plan.buttonLabel}
            </button>
          </div>
        })}
      </div>


      <section className={styles.section} data-motion-page>
        <h2 className={styles.sectionTitle}>So sánh Free vs Pro</h2>
        <div className={styles.comparison}>
          <div className={styles.comparisonHeader}>
            <span>Tính năng</span>
            <span>Free</span>
            <span className={styles.proCol}>Pro</span>
          </div>
          {freeVsPro.map(([feature, free, pro]) => (
            <div className={styles.comparisonRow} key={feature}>
              <span>{feature}</span>
              <span>{free ? <i className={styles.checkInline}><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></i> : <span className={styles.dash}>&mdash;</span>}</span>
              <span className={styles.proCol}>{pro ? <i className={styles.checkInline}><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></i> : <span className={styles.dash}>&mdash;</span>}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} data-motion-page>
        <h2 className={styles.sectionTitle}>Cách kích hoạt Pro</h2>
        <div className={styles.steps}>
          {steps.map(([title, description], index) => (
            <div className={styles.step} key={title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
              {index < steps.length - 1 && <span className={styles.stepArrow}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></span>}
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className={styles.section} data-motion-page>
        <h2 className={styles.sectionTitle}>Câu hỏi thường gặp</h2>
        <div className={styles.faqList}>
          {faq.map(([question, answer], i) => (
            <div
              key={question}
              className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`}
            >
              <button type="button" className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                <span>{question}</span>
                <i><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg></i>
              </button>
              {openFaq === i && <p className={styles.faqAnswer}>{answer}</p>}
            </div>
          ))}
        </div>
        <p className={styles.faqFooter}>
          Xem thêm thông tin trong <Link href="/terms">Điều khoản sử dụng</Link>.
        </p>
      </section>

    </main>
  )
}
