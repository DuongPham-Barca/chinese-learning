import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-provider"
import { ProUpgradeProvider } from "@/lib/pro-upgrade-provider"

export const metadata: Metadata = {
  title: "ChineseDict",
  description: "Học tiếng Trung qua Flashcard và Dictation",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className="min-h-full flex flex-col">
        <AuthProvider><ProUpgradeProvider>{children}</ProUpgradeProvider></AuthProvider>
      </body>
    </html>
  )
}
