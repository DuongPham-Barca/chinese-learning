"use client"

import { use, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import StudyCompletion from "@/components/study-completion"
import StudySessionWorkspace from "@/components/study-session-workspace"
import api from "@/lib/api"
import { completeLessonModule, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"

type QuizQuestion = {
  prompt: string
  support: string
  answer: string
  choices: string[]
  type: "word-meaning" | "meaning-word" | "example-zh" | "example-meaning"
}

function shuffleArray<T>(items: T[]): T[] {
  const output = [...items]
  for (let i = output.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[output[i], output[j]] = [output[j], output[i]]
  }
  return output
}

function buildQuestions(items: Vocabulary[]): QuizQuestion[] {
  const usable = items.filter((item) => item.example && item.exampleMeaning)
  if (usable.length < 2) return []

  const questions = usable.flatMap((item) => {
    const others = usable.filter((candidate) => candidate.id !== item.id)
    const choices = (correct: string, getValue: (item: Vocabulary) => string) => {
      const distractors = shuffleArray(others).map(getValue)
      return shuffleArray([correct, ...distractors]).slice(0, Math.min(4, distractors.length + 1))
    }

    return [
      {
        type: "word-meaning" as const,
        prompt: `Từ "${item.hanzi}" có nghĩa là gì?`,
        support: item.pinyin,
        answer: item.meaningVi,
        choices: choices(item.meaningVi, (candidate) => candidate.meaningVi),
      },
      {
        type: "meaning-word" as const,
        prompt: `Nghĩa "${item.meaningVi}" là chữ Hán nào?`,
        support: "",
        answer: item.hanzi,
        choices: choices(item.hanzi, (candidate) => candidate.hanzi),
      },
      {
        type: "example-zh" as const,
        prompt: `Dịch "${item.exampleMeaning}" sang tiếng Trung?`,
        support: "",
        answer: item.example!,
        choices: choices(item.example!, (candidate) => candidate.example!),
      },
      {
        type: "example-meaning" as const,
        prompt: `Câu "${item.example}" có nghĩa là gì?`,
        support: "",
        answer: item.exampleMeaning!,
        choices: choices(item.exampleMeaning!, (candidate) => candidate.exampleMeaning!),
      },
    ]
  })

  return shuffleArray(questions).filter((question) => question.choices.length >= 2)
}

export default function QuizStagePage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const returnHref = `/lessons/${level}/${id}`
  const [items, setItems] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState("")
  const [answers, setAnswers] = useState<string[]>([])
  const [complete, setComplete] = useState(false)

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setItems(response.data.vocabulary)
      })
      .catch(() => {
        if (active) setError("Không thể tải bài kiểm tra.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  const questions = useMemo(() => buildQuestions(items), [items])
  const question = questions[current]
  const score = questions.length ? answers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0) : 0
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0
  const progress = questions.length ? Math.round(((current + (selected ? 1 : 0)) / questions.length) * 100) : 0
  const answerAccuracy = answers.length ? Math.round((score / answers.length) * 100) : 100

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
    updateLessonModuleProgress(id, "quiz", current + 1, questions.length)
    if (current + 1 >= questions.length) {
      completeLessonModule(id, "quiz", questions.length)
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

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải kiểm tra...</p></div></div></LessonLayout>
  if (error || items.length === 0 || questions.length === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa đủ dữ liệu kiểm tra."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>

  if (complete) return (
    <LessonLayout>
      <StudyCompletion title="Trắc nghiệm" description={percent >= 70 ? "Bạn đã nắm được phần lớn nội dung bài học." : "Hãy luyện lại một vòng để củng cố từ vựng và câu."} stats={[{ label: "Điểm số", value: `${percent}%` }, { label: "Câu đúng", value: `${score}/${questions.length}` }, { label: "Câu đã làm", value: questions.length }]}>
        <button className={styles.primaryButton} type="button" onClick={retry}><SharedIcon name="rotateCcw" size={17} />Làm lại</button>
        <Link className={styles.secondaryButton} href={returnHref}>Về tổng quan</Link>
      </StudyCompletion>
    </LessonLayout>
  )

  return (
    <LessonLayout>
      <section className={`${styles.studyWrap} ${styles.enhancedStudyWrap}`}>
        <header className={styles.studyHeader}>
          <div className={styles.studyHeaderInner}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng kiểm tra"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Trắc nghiệm {current + 1} / {questions.length}</strong><span>Từ vựng & Câu ví dụ</span></div>
            <span className={styles.iconButton}><SharedIcon name="target" size={18} /></span>
          </div>
          <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i /></div>
        </header>

        <StudySessionWorkspace
          current={current + 1}
          total={questions.length}
          progress={progress}
          stateLabel={selected ? "Đã chọn đáp án" : "Chờ lựa chọn"}
          stateTone={selected ? "good" : "neutral"}
          metrics={[
            { label: "Độ chính xác", value: `${answerAccuracy}%`, tone: answerAccuracy >= 70 ? "good" : "warn" },
            { label: "Câu đúng", value: score, tone: score > 0 ? "good" : "neutral" },
            { label: "Đã trả lời", value: `${answers.length}/${questions.length}` },
          ]}
        >
          <AnimatePresence mode="wait">
            <motion.section key={current} className={styles.quizCard} variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -18 }}>
            <span className={styles.wordEyebrow}>Trắc nghiệm</span>
            <h1>{question.prompt}</h1>
            <div className={styles.quizSupport}>
              <strong>{question.support || "选择"}</strong>
              {question.type === "word-meaning" && <button className={styles.audioButton} type="button" onClick={() => speak(question.answer)} aria-label="Nghe câu hỏi"><SharedIcon name="volume2" size={24} /></button>}
            </div>
            <div className={styles.choiceGrid}>
              {question.choices.map((choice) => <button type="button" className={`${styles.quizChoice} ${selected === choice ? styles.quizChoiceSelected : ""}`} key={choice} onClick={() => setSelected(choice)}>{choice}</button>)}
            </div>
            <div className={styles.actionRow}>
              <button className={styles.primaryButton} type="button" onClick={submit} disabled={!selected}>{current + 1 >= questions.length ? "Nộp bài" : "Câu tiếp theo"} <SharedIcon name="arrowRight" size={15} /></button>
            </div>
            </motion.section>
          </AnimatePresence>
        </StudySessionWorkspace>
      </section>
    </LessonLayout>
  )
}
