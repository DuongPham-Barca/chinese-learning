import api from "@/lib/api"
import type { AdminItemResponse } from "./admin-level.service"
import type { AdminVocabulary } from "./admin-lesson.service"

export type VocabularyPayload = {
  chinese: string
  pinyin: string
  vietnamese: string
  example?: string | null
  examplePinyin?: string | null
  exampleMeaning?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  order: number
}

export async function getVocabularies(lessonId: string) {
  const response = await api.get<AdminItemResponse<AdminVocabulary[]>>(`/admin/lessons/${lessonId}/vocabularies`)
  return response.data
}
export async function createVocabulary(lessonId: string, payload: VocabularyPayload) {
  const response = await api.post<AdminItemResponse<AdminVocabulary>>(`/admin/lessons/${lessonId}/vocabularies`, payload)
  return response.data
}
export async function bulkCreateVocabularies(lessonId: string, payload: { items: VocabularyPayload[] }) {
  const response = await api.post<AdminItemResponse<AdminVocabulary[]>>(`/admin/lessons/${lessonId}/vocabularies/bulk`, payload)
  return response.data
}
export async function updateVocabulary(id: string, payload: Partial<VocabularyPayload>) {
  const response = await api.put<AdminItemResponse<AdminVocabulary>>(`/admin/vocabularies/${id}`, payload)
  return response.data
}
export async function deleteVocabulary(id: string) {
  const response = await api.delete<AdminItemResponse<{ id: string }>>(`/admin/vocabularies/${id}`)
  return response.data
}
export async function reorderVocabularies(payload: { lessonId: string; items: Array<{ id: string; order: number }> }) {
  const response = await api.patch<AdminItemResponse<{ count: number }>>("/admin/vocabularies/reorder", payload)
  return response.data
}
