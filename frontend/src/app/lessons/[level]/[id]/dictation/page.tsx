"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import api from "@/lib/api"
import Link from "next/link"
import type { Sentence } from "@/types/api"

export default function DictationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState("")
  const [result, setResult] = useState<"correct" | "wrong" | null>(null)

  useEffect(() => {
    api.get(`/sentences/${id}`).then((res) => setSentences(res.data.sentences))
  }, [id])

  if (sentences.length === 0) return <div className="p-6">Loading...</div>
  if (current >= sentences.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold mb-4">Hoàn thành bài dictation! 🎉</h2>
        <Link href={`/lessons/${level}/${id}`} className="text-[#3B82F6] hover:underline">
          ← Quay lại bài học
        </Link>
      </div>
    )
  }

  const sentence = sentences[current]

  const check = () => {
    if (input.trim() === sentence.sentenceZh) {
      setResult("correct")
    } else {
      setResult("wrong")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-6">
      <div className="text-sm text-gray-500 mb-4">Dictation {current + 1}/{sentences.length}</div>
      <div className="bg-gray-100 rounded-xl p-4 mb-6 text-gray-600">{sentence.sentenceVi}</div>
      <input
        value={input}
        onChange={(e) => { setInput(e.target.value); setResult(null) }}
        placeholder="Gõ chữ Hán tại đây..."
        className={`w-full p-4 rounded-xl border-2 text-lg outline-none transition ${
          result === "correct" ? "border-green-500 bg-green-50" :
          result === "wrong" ? "border-red-500 bg-red-50" :
          "border-gray-200"
        }`}
      />
      {!result && (
        <button
          onClick={check}
          className="mt-4 bg-[#3B82F6] text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition self-start cursor-pointer"
        >
          Kiểm tra
        </button>
      )}
      {result === "correct" && (
        <button
          onClick={() => { setCurrent(c => c + 1); setInput(""); setResult(null) }}
          className="mt-4 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition self-start cursor-pointer"
        >
          Tiếp tục ➜
        </button>
      )}
      {result === "wrong" && (
        <p className="mt-2 text-red-500">Sai rồi! Hãy thử lại.</p>
      )}
    </div>
  )
}
