"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import api from "@/lib/api"
import Link from "next/link"
import type { Vocabulary } from "@/types/api"

export default function FlashcardPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [vocab, setVocab] = useState<Vocabulary[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<string>>(new Set())
  const [review, setReview] = useState<Set<string>>(new Set())

  useEffect(() => {
    api.get(`/vocabulary/${id}`).then((res) => setVocab(res.data.vocabulary))
  }, [id])

  if (vocab.length === 0) return <div className="p-6">Loading...</div>
  if (current >= vocab.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold mb-4">Hoàn thành! 🎉</h2>
        <p className="mb-4">Đã thuộc: {known.size} | Cần ôn: {review.size}</p>
        <Link href={`/lessons/${level}/${id}`} className="text-[#3B82F6] hover:underline">
          ← Quay lại bài học
        </Link>
      </div>
    )
  }

  const word = vocab[current]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-6">
      <div className="mb-4 text-sm text-gray-500">Từ vựng {current + 1}/{vocab.length}</div>
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-md h-64 flex flex-col items-center justify-center cursor-pointer p-6 select-none"
        onClick={() => setFlipped(!flipped)}
      >
        {flipped ? (
          <p className="text-lg font-medium">{word.meaningVi}</p>
        ) : (
          <>
            <p className="text-4xl font-bold mb-2">{word.hanzi}</p>
            <p className="text-lg text-gray-500">{word.pinyin}</p>
          </>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">Nhấn vào thẻ để lật</p>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => { setReview(new Set(review.add(word.id))); setCurrent(c => c + 1); setFlipped(false) }}
          className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition cursor-pointer"
        >
          Cần ôn lại
        </button>
        <button
          onClick={() => { setKnown(new Set(known.add(word.id))); setCurrent(c => c + 1); setFlipped(false) }}
          className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition cursor-pointer"
        >
          Đã thuộc
        </button>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        Đã thuộc: {known.size} | Cần ôn: {review.size} | Còn lại: {vocab.length - current - 1}
      </div>
    </div>
  )
}
