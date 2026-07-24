import { useSyncExternalStore } from "react"
import api from "@/lib/api"
import {
  GUEST_PROGRESS_SCOPE,
  getLessonIdFromProgressKey,
  getProgressKey,
  getProgressPrefix,
  getProgressScope,
  listKeys,
  migrateLegacyProgress,
} from "./lesson-progress-storage"

export type LessonModuleId = "flashcard" | "dictation" | "word-arrangement" | "reflex" | "speaking" | "quiz"

export type LessonModuleProgress = {
  completed: number
  total: number
  completedAt?: string
}

export type LessonProgressState = Partial<Record<LessonModuleId, LessonModuleProgress>>

export const lessonModuleOrder: LessonModuleId[] = ["flashcard", "dictation", "word-arrangement", "reflex", "speaking", "quiz"]

let activeProgressScope = GUEST_PROGRESS_SCOPE
const syncing = new Set<string>()

function progressKey(lessonId: string) {
  return getProgressKey(activeProgressScope, lessonId)
}

function notifyProgressChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent("lesson-progress:update"))
}

export function setLessonProgressScope(userId: string | null) {
  if (typeof window !== "undefined" && userId) {
    migrateLegacyProgress(window.localStorage, userId)
  }

  const nextScope = getProgressScope(userId)
  if (nextScope === activeProgressScope) return

  activeProgressScope = nextScope
  cachedKey = ""
  cachedRaw = ""
  cachedState = {}
  syncing.clear()
  notifyProgressChanged()
}

export function useLessonProgressScope() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined
      window.addEventListener("lesson-progress:update", onStoreChange)
      return () => window.removeEventListener("lesson-progress:update", onStoreChange)
    },
    () => activeProgressScope,
    () => GUEST_PROGRESS_SCOPE,
  )
}

async function syncModuleCompletion(lessonId: string, moduleId: LessonModuleId) {
  const key = `${lessonId}:${moduleId}`
  if (syncing.has(key)) return
  syncing.add(key)
  try {
    await api.post("/progress", { lessonId, moduleId })
  } catch {
    // Local progress remains available offline and will be retried from /progress.
  } finally {
    syncing.delete(key)
  }
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
  if (next.total > 0 && next.completed >= next.total && (previous?.completed ?? 0) < next.total) {
    void syncModuleCompletion(lessonId, moduleId)
  }
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

export async function syncLocalLessonProgress() {
  if (typeof window === "undefined") return
  const tasks: Promise<void>[] = []
  const prefix = getProgressPrefix(activeProgressScope)

  for (const key of listKeys(window.localStorage)) {
    if (!key.startsWith(prefix)) continue
    const lessonId = getLessonIdFromProgressKey(activeProgressScope, key)
    if (!lessonId) continue
    const state = readLessonProgress(lessonId)
    for (const moduleId of lessonModuleOrder) {
      const progress = state[moduleId]
      if (progress?.total && progress.completed >= progress.total) {
        tasks.push(syncModuleCompletion(lessonId, moduleId))
      }
    }
  }

  await Promise.all(tasks)
}

export function clearLocalLessonProgress() {
  if (typeof window === "undefined") return
  const prefix = getProgressPrefix(activeProgressScope)
  const keys = listKeys(window.localStorage).filter((key) => key.startsWith(prefix))
  keys.forEach((key) => window.localStorage.removeItem(key))
  cachedKey = ""
  cachedRaw = ""
  cachedState = {}
  notifyProgressChanged()
}
