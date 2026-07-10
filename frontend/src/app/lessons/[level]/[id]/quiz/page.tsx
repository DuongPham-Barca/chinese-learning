"use client"

import { use, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import type { LessonDetail } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type QuizQuestion = {
  prompt: string
  support: string
  answer: string
  choices: string[]
  type: "vocabulary" | "listening" | "sentence"
}

function stageProgressKey(lessonId: string) {
  return `lesson-stage-progress:${lessonId}`
}

function hasQuizAccess(lessonId: string) {
  if (typeof window === "undefined") return false
  try {
    const progress = JSON.parse(window.localStorage.getItem(stageProgressKey(lessonId)) || "{}")
    return Boolean(progress.practice)
  } catch {
    return false
  }
}

function saveQuizComplete(lessonId: string) {
  if (typeof window === "undefined") return
  const current = JSON.parse(window.localStorage.getItem(stageProgressKey(lessonId)) || "{}")
  window.localStorage.setItem(stageProgressKey(lessonId), JSON.stringify({ ...current, quiz: true }))
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(lesson: LessonDetail): QuizQuestion[] {
  const vocabQuestions = lesson.vocabulary.slice(0, 4).map((word, index) => {
    const distractors = lesson.vocabulary.filter((item) => item.id !== word.id).slice(index, index + 3).map((item) => item.meaningVi)
    return {
      type: "vocabulary" as const,
      prompt: `Từ "${word.hanzi}" nghĩa là gì?`,
      support: word.pinyin,
      answer: word.meaningVi,
      choices: shuffleArray([word.meaningVi, ...distractors]).slice(0, 4),
    }
  })

  const listeningQuestions = lesson.vocabulary.slice(4, 7).map((word, index) => {
    const distractors = lesson.vocabulary.filter((item) => item.id !== word.id).slice(index, index + 3).map((item) => item.hanzi)
    return {
      type: "listening" as const,
      prompt: "Nghe và chọn từ đúng.",
      support: word.hanzi,
      answer: word.hanzi,
      choices: shuffleArray([word.hanzi, ...distractors]).slice(0, 4),
    }
  })

  const sentenceQuestions = lesson.sentences.slice(0, 3).map((sentence, index) => {
    const distractors = lesson.sentences.filter((item) => item.id !== sentence.id).slice(index, index + 3).map((item) => item.sentenceVi)
    return {
      type: "sentence" as const,
      prompt: "Câu này có nghĩa là gì?",
      support: sentence.sentenceZh,
      answer: sentence.sentenceVi,
      choices: shuffleArray([sentence.sentenceVi, ...distractors]).slice(0, 4),
    }
  })

  return [...vocabQuestions, ...listeningQuestions, ...sentenceQuestions].filter((question) => question.choices.length >= 2)
}

export default function QuizStagePage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [allowed, setAllowed] = useState(false)
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState("")
  const [answers, setAnswers] = useState<string[]>([])
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAllowed(hasQuizAccess(id)), 0)
    return () => window.clearTimeout(timer)
  }, [id])

  useEffect(() => {
    let active = true
    api.get<{ lesson: LessonDetail }>(`/lessons/${id}`)
      .then((response) => {
        if (active) setLesson(response.data.lesson)
      })
      .catch(() => {
        if (active) setError("Không thể tải bài kiểm tra.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const questions = useMemo(() => lesson ? buildQuestions(lesson) : [], [lesson])
  const question = questions[current]
  const score = questions.length ? answers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0) : 0
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0
  const progress = questions.length ? Math.round(((current + (selected ? 1 : 0)) / questions.length) * 100) : 0

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = 0.85
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  const submit = useCallback(() => {
    if (!selected) return
    const nextAnswers = [...answers, selected]
    setAnswers(nextAnswers)
    setSelected("")
    if (current + 1 >= questions.length) {
      saveQuizComplete(id)
      setComplete(true)
      return
    }
    setCurrent((value) => value + 1)
  }, [answers, current, id, questions.length, selected])

  const retry = useCallback(() => {
    setCurrent(0)
    setSelected("")
    setAnswers([])
    setComplete(false)
  }, [])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (!allowed) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.stateCard}>
          <p>Hãy hoàn thành phần Luyện tập trước khi vào Kiểm tra.</p>
          <Link className={styles.primaryButton} href={`/lessons/${level}/${id}/practice`}>Luyện tập</Link>
        </div>
      </div>
    </LessonLayout>
  )

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải kiểm tra...</p></div></div></LessonLayout>
  if (error || !lesson || questions.length === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa đủ dữ liệu kiểm tra."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>

  if (complete) return (
    <LessonLayout>
      <div className={styles.studyWrap}>
        <div className={styles.completionCard}>
          <div className={styles.completionMark}><SharedIcon name={percent >= 70 ? "check" : "rotateCcw"} size={34} /></div>
          <h2 className={styles.completionTitle}>Hoàn thành Kiểm tra</h2>
          <div className={styles.quizScore}><strong>{percent}%</strong><span>{score}/{questions.length} câu đúng</span></div>
          <p>{percent >= 70 ? "Bạn đã nắm được phần lớn nội dung bài học." : "Hãy luyện lại một vòng để củng cố từ vựng và câu."}</p>
          <div className={styles.actionRow}>
            <button className={styles.secondaryButton} type="button" onClick={retry}>Retry</button>
            <Link className={styles.primaryButton} href={returnHref}>Về tổng quan</Link>
          </div>
        </div>
      </div>
    </LessonLayout>
  )

  return (
    <LessonLayout>
      <section className={styles.studyWrap}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng kiểm tra"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Kiểm tra {current + 1} / {questions.length}</strong><span>Vocabulary - Listening - Sentence understanding</span></div>
            <span className={styles.iconButton}><SharedIcon name="target" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section key={current} className={styles.quizCard} variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
            <span className={styles.wordEyebrow}>{question.type === "vocabulary" ? "Vocabulary" : question.type === "listening" ? "Listening" : "Sentence understanding"}</span>
            <h1>{question.prompt}</h1>
            <div className={styles.quizSupport}>
              <strong>{question.type === "listening" ? "•••" : question.support}</strong>
              {question.type === "listening" && <button className={styles.audioButton} type="button" onClick={() => speak(question.support)} aria-label="Nghe câu hỏi"><SharedIcon name="volume2" size={24} /></button>}
            </div>
            <div className={styles.choiceGrid}>
              {question.choices.map((choice) => <button type="button" className={`${styles.quizChoice} ${selected === choice ? styles.quizChoiceSelected : ""}`} key={choice} onClick={() => setSelected(choice)}>{choice}</button>)}
            </div>
          </motion.section>
        </AnimatePresence>
      </section>

      <aside className={styles.stickyStudyBar}>
        <div className={styles.stickyStudyInner}>
          <span>{selected ? "Sẵn sàng chấm câu trả lời" : "Chọn một đáp án"}</span>
          <button className={styles.primaryButton} type="button" onClick={submit} disabled={!selected}>{current + 1 >= questions.length ? "Nộp bài" : "Câu tiếp theo"} <SharedIcon name="arrowRight" size={15} /></button>
        </div>
      </aside>
    </LessonLayout>
  )
}
