"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import Link from "next/link"
import type { LeaderboardUser } from "@/types/api"

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [period, setPeriod] = useState("all")

  useEffect(() => {
    api.get(`/leaderboard?period=${period}`).then((res) => setUsers(res.data.leaderboard))
  }, [period])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:underline mb-4 block">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-6">Bảng xếp hạng</h1>
      <div className="flex gap-2 mb-6">
        {[["all", "Toàn thời gian"], ["month", "Tháng này"], ["week", "Tuần này"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition ${
              period === key ? "bg-[#3B82F6] text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {users.map((user, i) => (
          <div key={user.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <span className="text-lg font-bold w-8">{i + 1}</span>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
              {user.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-gray-500">{user.expPoints} EXP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
