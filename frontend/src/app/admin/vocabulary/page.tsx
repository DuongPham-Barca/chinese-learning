"use client"

import { motion } from "framer-motion"
import { PageHeader } from "@/components/admin/admin-ui"

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export default function AdminVocabularyPage() {
  return (
    <motion.div variants={variants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader eyebrow={<span>Dashboard / <b>Từ vựng</b></span>} title="Từ vựng" />
      </motion.div>
      <motion.div variants={itemVariants} style={{ display: "grid", placeItems: "center", minHeight: "50vh", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚧</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Đang phát triển</h2>
        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 400, lineHeight: 1.6, margin: 0 }}>
          Trang quản lý từ vựng đang được xây dựng. Tính năng này sẽ sớm được hoàn thiện.
        </p>
      </motion.div>
    </motion.div>
  )
}
