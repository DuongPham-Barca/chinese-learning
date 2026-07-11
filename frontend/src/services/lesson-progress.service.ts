export type LessonModuleId = "flashcard" | "dictation" | "word-arrangement" | "reflex" | "speaking" | "quiz"

export type LessonModuleProgress = {
  completed: number
  total: number
  completedAt?: string
}

export type LessonProgressState = Partial<Record<LessonModuleId, LessonModuleProgress>>

export const lessonModuleOrder: LessonModuleId[] = ["flashcard", "dictation", "word-arrangement", "reflex", "speaking", "quiz"]

function progressKey(lessonId: string) {
  return `lesson-progress-v2:${lessonId}`
}

let cachedKey = ""
let cachedRaw = ""
let cachedState: LessonProgressState = {}

function normalizeProgress(value: LessonModuleProgress): LessonModuleProgress {
  const total = Math.max(0, Number.isFinite(value.total) ? value.total : 0)
  const completed = Math.min(Math.max(0, Number.isFinite(value.completed) ? value.completed : 0), total)
  return {
    completed,
    total,
    ...(completed >= total && total > 0 ? { completedAt: value.completedAt || new Date().toISOString() } : {}),
  }
}

export function readLessonProgress(lessonId: string): LessonProgressState {
  if (typeof window === "undefined") return {}

  try {
    const key = progressKey(lessonId)
    const raw = window.localStorage.getItem(key) || ""
    if (cachedKey === key && cachedRaw === raw) return cachedState
    if (!raw) {
      cachedKey = key
      cachedRaw = raw
      cachedState = {}
      return cachedState
    }
    cachedKey = key
    cachedRaw = raw
    cachedState = JSON.parse(raw) as LessonProgressState
    return cachedState
  } catch {
    return {}
  }
}

export function writeLessonProgress(lessonId: string, state: LessonProgressState) {
  if (typeof window === "undefined") return
  const key = progressKey(lessonId)
  const raw = JSON.stringify(state)
  cachedKey = key
  cachedRaw = raw
  cachedState = state
  window.localStorage.setItem(key, raw)
  window.dispatchEvent(new CustomEvent("lesson-progress:update", { detail: { lessonId } }))
}

export function useLessonProgress(lessonId: string): LessonProgressState {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined
      const handleUpdate = (event: Event) => {
        const detail = (event as CustomEvent<{ lessonId?: string }>).detail
        if (!detail?.lessonId || detail.lessonId === lessonId) onStoreChange()
      }
      const handleStorage = (event: StorageEvent) => {
        if (event.key === progressKey(lessonId)) onStoreChange()
      }
      window.addEventListener("lesson-progress:update", handleUpdate)
      window.addEventListener("storage", handleStorage)
      return () => {
        window.removeEventListener("lesson-progress:update", handleUpdate)
        window.removeEventListener("storage", handleStorage)
      }
    },
    () => readLessonProgress(lessonId),
    () => ({} as LessonProgressState),
  )
}

export function updateLessonModuleProgress(
  lessonId: string,
  moduleId: LessonModuleId,
  completed: number,
  total: number,
) {
  const current = readLessonProgress(lessonId)
  const previous = current[moduleId]
  const next = normalizeProgress({
    completed: Math.max(completed, previous?.completed ?? 0),
    total: Math.max(total, previous?.total ?? 0),
    completedAt: previous?.completedAt,
  })

  writeLessonProgress(lessonId, { ...current, [moduleId]: next })
}

export function completeLessonModule(lessonId: string, moduleId: LessonModuleId, total: number) {
  updateLessonModuleProgress(lessonId, moduleId, total, total)
}

export function getModulePercent(progress?: LessonModuleProgress) {
  if (!progress?.total) return 0
  return Math.round((progress.completed / progress.total) * 100)
}

export function getLessonPercent(progress: LessonProgressState, totals: Record<LessonModuleId, number>) {
  const aggregate = lessonModuleOrder.reduce((sum, moduleId) => {
    const total = totals[moduleId] || 0
    const completed = Math.min(progress[moduleId]?.completed ?? 0, total)
    return {
      completed: sum.completed + completed,
      total: sum.total + total,
    }
  }, { completed: 0, total: 0 })

  return aggregate.total ? Math.round((aggregate.completed / aggregate.total) * 100) : 0
}
import { useSyncExternalStore } from "react"
