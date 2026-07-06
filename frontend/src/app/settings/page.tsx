"use client"

import Link from "next/link"
import SiteNavbar from "@/components/site-navbar"

export default function SettingsPage() {
  return (
    <main style={{ minHeight: "100vh", color: "#0f172a", background: "#fffdf8", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <SiteNavbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 64px)", gap: 16, textAlign: "center", padding: "0 24px" }}>
        <div style={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #60a5fa)", color: "#fff", boxShadow: "0 8px 20px rgba(37,99,235,0.25)" }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Cài đặt</h1>
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
