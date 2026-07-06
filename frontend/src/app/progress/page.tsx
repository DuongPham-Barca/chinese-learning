"use client"

import Link from "next/link"
import SiteNavbar from "@/components/site-navbar"

export default function ProgressPage() {
  return (
    <main style={{ minHeight: "100vh", color: "#0f172a", background: "#fffdf8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <SiteNavbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", gap: 16, textAlign: "center", padding: "0 24px" }}>
        <div style={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #60a5fa)", color: "#fff", boxShadow: "0 8px 20px rgba(37,99,235,0.25)" }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 2 4 4-4 4" />
            <path d="M18 6H8a5 5 0 0 0 0 10h8" />
            <path d="M14 18 2 18" />
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Tiến độ học tập</h1>
        <p style={{ margin: 0, maxWidth: 400, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
          Tính năng đang được phát triển. Quay lại sau nhé!
        </p>
        <Link href="/" style={{ display: "inline-flex", height: 42, alignItems: "center", padding: "0 20px", borderRadius: 10, color: "#fff", background: "linear-gradient(135deg, #2563eb, #4f8df7)", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 14px rgba(37,99,235,0.2)" }}>
          Về trang chủ
        </Link>
      </div>
    </main>
  )
}
