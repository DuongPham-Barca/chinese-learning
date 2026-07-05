"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import api from "@/lib/api"
import Link from "next/link"
import type { LessonDetail } from "@/types/api"

export default function LessonDetailPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [lesson, setLesson] = useState<LessonDetail | null>(null)

  useEffect(() => {
    api.get(`/lessons/${id}`).then((res) => setLesson(res.data.lesson))
  }, [id])

  if (!lesson) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <Link href={`/lessons/${level}`} className="text-sm text-gray-500 hover:underline mb-4 block">
        ← Quay lại
      </Link>
      <h1 className="text-xl font-bold mb-6">{lesson.title}</h1>
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">📖 Học từ vựng — Flashcard</h2>
          <p className="text-gray-500 mb-4">{lesson.vocabulary.length} từ vựng trong bài</p>
          <Link
            href={`/lessons/${level}/${id}/flashcard`}
            className="inline-block bg-[#3B82F6] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Bắt đầu
          </Link>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">✍️ Luyện câu — Dictation</h2>
          <p className="text-gray-500 mb-4">{lesson.sentences.length} câu luyện tập</p>
          <Link
            href={`/lessons/${level}/${id}/dictation`}
            className="inline-block border-2 border-[#3B82F6] text-[#3B82F6] px-6 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            Bắt đầu
          </Link>
        </div>
      </div>
    </div>
  )
}
