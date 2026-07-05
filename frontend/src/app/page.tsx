import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold mb-4">ChineseDict</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Học tiếng Trung chủ động — Flashcard & Dictation trong tay bạn
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-[#3B82F6] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition"
        >
          Bắt đầu học miễn phí
        </Link>
        <Link
          href="/login"
          className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  )
}
