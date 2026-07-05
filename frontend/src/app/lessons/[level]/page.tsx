"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import api from "@/lib/api"
import Link from "next/link"
import type { LessonSummary } from "@/types/api"

export default function LessonListPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params)
  const [lessons, setLessons] = useState<LessonSummary[]>([])

  useEffect(() => {
    api.get(`/lessons?level=${level.toUpperCase()}`).then((res) => {
      setLessons(res.data.lessons)
    })
  }, [level])

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <Link href="/" className="text-sm text-gray-500 hover:underline mb-4 block">
        ← Trang chủ
      </Link>
      <h1 className="text-2xl font-bold mb-6">{level.toUpperCase().replace("COMMUNICATION", "GIAO TIẾP")}</h1>
      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/lessons/${level}/${lesson.id}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Bài {lesson.lessonOrder}: {lesson.title}</h3>
                  <p className="text-sm text-gray-500">{lesson._count.vocabulary} từ vựng</p>
                </div>
                {lesson.isFree ? (
                  <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">Miễn phí</span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">Pro</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
