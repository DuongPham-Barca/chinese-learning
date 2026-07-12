import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-provider"
import { ProUpgradeProvider } from "@/lib/pro-upgrade-provider"

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" })

export const metadata: Metadata = {
  title: "ChineseDict",
  description: "Học tiếng Trung qua Flashcard & Dictation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={inter.className}>
      <body className="min-h-full flex flex-col">
        <AuthProvider><ProUpgradeProvider>{children}</ProUpgradeProvider></AuthProvider>
      </body>
    </html>
  )
}
