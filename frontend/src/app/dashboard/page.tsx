"use client"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import Link from "next/link"

const levels = [
  { key: "HSK1", label: "HSK 1", color: "bg-green-100 text-green-800" },
  { key: "HSK2", label: "HSK 2", color: "bg-blue-100 text-blue-800" },
  { key: "HSK3", label: "HSK 3", color: "bg-yellow-100 text-yellow-800" },
  { key: "HSK4", label: "HSK 4", color: "bg-orange-100 text-orange-800" },
  { key: "HSK5", label: "HSK 5", color: "bg-red-100 text-red-800" },
  { key: "HSK6", label: "HSK 6", color: "bg-purple-100 text-purple-800" },
  { key: "COMMUNICATION", label: "Giao Tiếp", color: "bg-pink-100 text-pink-800" },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [lessonsCount, setLessonsCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) router.replace("/login")
  }, [loading, user, router])

  useEffect(() => {
    api.get("/lessons").then((res) => setLessonsCount(res.data.lessons.length))
  }, [])

  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <h1 className="text-2xl font-bold mb-6">Chào bạn, {user.username} 👋</h1>

      <h2 className="text-lg font-semibold mb-4">Chọn cấp độ</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {levels.map((level) => (
          <Link key={level.key} href={`/lessons/${level.key}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${level.color}`}>
                {level.label}
              </div>
              <p className="text-sm text-gray-500">{lessonsCount} bài học</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/leaderboard" className="text-[#3B82F6] hover:underline">
          Xem bảng xếp hạng →
        </Link>
      </div>
    </div>
  )
}
