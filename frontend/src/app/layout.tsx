import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-provider"

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
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
