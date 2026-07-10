import api from "@/lib/api"
import type { AdminItemResponse, AdminListResponse } from "./admin-level.service"

export interface AdminVocabulary {
  id: string
  lessonId: string
  chinese: string
  pinyin: string
  vietnamese: string
  example: string | null
  examplePinyin: string | null
  exampleMeaning: string | null
  audioUrl: string | null
  imageUrl: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface AdminLesson {
  id: string
  levelId: string
  levelType: string
  title: string
  slug: string
  description: string | null
  imageUrl: string | null
  order: number
  isFree: boolean
  isPublished: boolean
  expReward: number
  vocabularyCount: number
  sentenceCount: number
  level: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface AdminLessonDetail extends AdminLesson { vocabulary: AdminVocabulary[] }

export type LessonPayload = {
  levelId: string
  title: string
  slug?: string
  description?: string | null
  imageUrl?: string | null
  order: number
  isFree: boolean
  isPublished: boolean
  expReward: number
}

export async function getLessons(params: Record<string, unknown> = {}) {
  const response = await api.get<AdminListResponse<AdminLesson>>("/admin/lessons", { params })
  return response.data
}
export async function getLessonById(id: string) {
  const response = await api.get<AdminItemResponse<AdminLessonDetail>>(`/admin/lessons/${id}`)
  return response.data
}
export async function createLesson(payload: LessonPayload) {
  const response = await api.post<AdminItemResponse<AdminLesson>>("/admin/lessons", payload)
  return response.data
}
export async function updateLesson(id: string, payload: Partial<LessonPayload>) {
  const response = await api.put<AdminItemResponse<AdminLesson>>(`/admin/lessons/${id}`, payload)
  return response.data
}
export async function deleteLesson(id: string) {
  const response = await api.delete<AdminItemResponse<{ id: string }>>(`/admin/lessons/${id}`)
  return response.data
}
export async function toggleLessonStatus(id: string, payload: { isPublished: boolean }) {
  const response = await api.patch<AdminItemResponse<AdminLesson>>(`/admin/lessons/${id}/status`, payload)
  return response.data
}
export async function reorderLessons(payload: { levelId: string; items: Array<{ id: string; order: number }> }) {
  const response = await api.patch<AdminItemResponse<{ count: number }>>("/admin/lessons/reorder", payload)
  return response.data
}
