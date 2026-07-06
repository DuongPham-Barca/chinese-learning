"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
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
}

const plans: Plan[] = [
  {
    id: "2months",
    title: "2 tháng",
    price: "49.000",
    originalPrice: null,
    savings: null,
    popular: false,
    badge: null,
    features: [
      "Toàn bộ bài học HSK",
      "Luyện phát âm AI",
      "Bài tập không giới hạn",
      "Thống kê học tập",
    ],
    buttonLabel: "Chọn gói",
  },
  {
    id: "6months",
    title: "6 tháng",
    price: "119.000",
    originalPrice: "147.000",
    savings: "Tiết kiệm 20%",
    popular: true,
    badge: "🔥 Phổ biến nhất",
    features: [
      "Toàn bộ bài học HSK",
      "Luyện phát âm AI",
      "Bài tập không giới hạn",
      "Thống kê học tập",
      "Flashcard & Dictation",
    ],
    buttonLabel: "Nâng cấp ngay",
  },
  {
    id: "12months",
    title: "12 tháng",
    price: "189.000",
    originalPrice: "294.000",
    savings: "Tiết kiệm 35%",
    popular: false,
    badge: "⭐ Tiết kiệm nhất",
    features: [
      "Toàn bộ bài học HSK",
      "Luyện phát âm AI",
      "Bài tập không giới hạn",
      "Thống kê học tập",
      "Flashcard & Dictation",
      "Ưu tiên hỗ trợ",
    ],
    buttonLabel: "Chọn gói",
  },
]

const comparisonRows: [string, boolean, boolean][] = [
  ["Bài học HSK", false, true],
  ["Từ vựng HSK", true, true],
  ["Luyện phát âm AI", false, true],
  ["Luyện nghe", true, true],
  ["Bài tập không giới hạn", false, true],
  ["Theo dõi tiến độ", false, true],
  ["Hỗ trợ ưu tiên", false, true],
]

const steps: [string, string][] = [
  ["Chọn gói", "Chọn gói phù hợp với nhu cầu học của bạn."],
  ["Chuyển khoản", "Quét mã QR hoặc chuyển khoản ngân hàng."],
  ["Kích hoạt", "Tài khoản Pro được kích hoạt trong vòng 24h."],
]

const faq: [string, string][] = [
  ["Khi nào tài khoản được kích hoạt?", "Tài khoản sẽ được kích hoạt trong vòng 24 giờ sau khi nhận được thanh toán. Bạn sẽ nhận được email xác nhận."],
  ["Có thể gia hạn không?", "Có. Sau khi hết hạn, bạn có thể mua gói mới để tiếp tục sử dụng ChineseDict Pro."],
  ["Có hoàn tiền không?", "Chúng tôi có chính sách hoàn tiền trong vòng 7 ngày nếu bạn không hài lòng với dịch vụ."],
  ["Thanh toán bằng hình thức nào?", "Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng nội địa (Vietcombank, VietQR)."],
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const selected = plans.find((p) => p.id === selectedPlan)

  return (
    <main className={styles.page}>
      <motion.div
        className={styles.hero}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.heroIcon} variants={itemVariants}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z" />
            <path d="M6 22h12" />
          </svg>
        </motion.div>
        <motion.h1 variants={itemVariants}>Nâng cấp ChineseDict Pro</motion.h1>
        <motion.p variants={itemVariants}>
          Mở khóa toàn bộ nội dung học tiếng Trung và tiếp tục hành trình học của bạn.
        </motion.p>
      </motion.div>

      <motion.div
        className={styles.plans}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            variants={itemVariants}
            className={`${styles.planCard} ${plan.popular ? styles.popularCard : ""}`}
            whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(37,99,235,0.15)" }}
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
              className={`${styles.ctaButton} ${plan.popular ? styles.ctaPrimary : ""}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.buttonLabel}
            </button>
          </motion.div>
        ))}
      </motion.div>

      <motion.section
        className={styles.section}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 variants={itemVariants} className={styles.sectionTitle}>So sánh gói</motion.h2>
        <motion.div variants={itemVariants} className={styles.comparison}>
          <div className={styles.comparisonHeader}>
            <span>Tính năng</span>
            <span>Free</span>
            <span className={styles.proCol}>Pro</span>
          </div>
          {comparisonRows.map(([feature, free, pro]) => (
            <div className={styles.comparisonRow} key={feature}>
              <span>{feature}</span>
              <span>{free ? <i className={styles.checkInline}><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></i> : <span className={styles.dash}>&mdash;</span>}</span>
              <span className={styles.proCol}>{pro ? <i className={styles.checkInline}><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></i> : <span className={styles.dash}>&mdash;</span>}</span>
            </div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.section}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 variants={itemVariants} className={styles.sectionTitle}>Cách thanh toán</motion.h2>
        <motion.div variants={containerVariants} className={styles.steps}>
          {steps.map(([title, desc], i) => (
            <motion.div key={title} variants={itemVariants} className={styles.step}>
              <div className={styles.stepNumber}>{i + 1}</div>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              {i < steps.length - 1 && <div className={styles.stepArrow}><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg></div>}
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.section}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2 variants={itemVariants} className={styles.sectionTitle}>Câu hỏi thường gặp</motion.h2>
        <motion.div variants={itemVariants} className={styles.faqList}>
          {faq.map(([question, answer], i) => (
            <div
              key={question}
              className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ""}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className={styles.faqQuestion}>
                <span>{question}</span>
                <i><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg></i>
              </div>
              {openFaq === i && <p className={styles.faqAnswer}>{answer}</p>}
            </div>
          ))}
        </motion.div>
        <motion.p variants={itemVariants} className={styles.faqFooter}>
          Vẫn còn thắc mắc? <Link href="#contact">Liên hệ chúng tôi</Link>
        </motion.p>
      </motion.section>

      {selected && (
        <motion.div
          className={styles.stickyBar}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className={styles.stickyInner}>
            <div>
              <strong>{selected.title}</strong>
              <span>{selected.price}đ {selected.savings && ` · ${selected.savings}`}</span>
            </div>
            <button type="button" className={styles.stickyButton} onClick={() => { /* payment flow */ }}>
              Tiếp tục thanh toán
            </button>
          </div>
        </motion.div>
      )}
    </main>
  )
}
