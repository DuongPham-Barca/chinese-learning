"use client"

import { motion, type Variants } from "framer-motion"
import { PageHeader, AdminButton } from "@/components/admin/admin-ui"

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function AdminProfilePage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={itemVariants}>
        <PageHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản quản trị" />
      </motion.div>
      <motion.div variants={itemVariants} style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#fff", padding: 32, boxShadow: "0 16px 40px rgba(37,99,235,0.06)" }}>
        <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", margin: "48px 0" }}>Trang đang được phát triển.</p>
      </motion.div>
    </motion.div>
  )
}
