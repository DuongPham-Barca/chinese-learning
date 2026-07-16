import api from "@/lib/api"
import type { AdminItemResponse } from "./admin-level.service"
import type { AdminSentence, AdminVocabulary } from "./admin-lesson.service"

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
export async function importVocabularyExamples(lessonId: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post<AdminItemResponse<{ imported: AdminVocabulary[]; totalRows: number; added: number; skipped: Array<{ row: number; issue: string }> }>>(`/admin/lessons/${lessonId}/vocabularies/import-examples`, formData)
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
export type ImportAllResult = {
  imported: AdminVocabulary[]
  sentences: AdminSentence[]
  totalRows: number
  added: number
  skipped: Array<{ row: number; issue: string }>
  preview?: ImportPreviewResult
}

export type ImportMode = "global" | "lesson"

export type ImportPreviewRow = {
  row: number
  status: "valid" | "warning" | "error" | "duplicate"
  action: "create" | "update" | "skip"
  lessonTitle: string
  lessonId: string | null
  lessonAction: "selected" | "matched" | "create" | "missing"
  chinese: string
  pinyin: string
  vietnamese: string
  example: string
  examplePinyin: string
  exampleMeaning: string
  order: number
  issues: string[]
}

export type ImportPreviewResult = {
  mode: ImportMode
  totalRows: number
  validRows: number
  warningRows: number
  errorRows: number
  duplicateRows: number
  detectedColumns: string[]
  requiredColumns: string[]
  summary: {
    lessonsMatched: number
    lessonsToCreate: number
    vocabToCreate: number
    vocabToUpdate: number
  }
  rows: ImportPreviewRow[]
}

export type ImportFilePayload = {
  mode: ImportMode
  levelId?: string
  lessonId?: string
  file: File
}

export async function importAll(lessonId: string, file: File) {
  const formData = new FormData()
  formData.append("file", file)
  const response = await api.post<AdminItemResponse<ImportAllResult>>(`/admin/lessons/${lessonId}/import`, formData)
  return response.data
}

function importFormData(payload: ImportFilePayload) {
  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("mode", payload.mode)
  if (payload.levelId) formData.append("levelId", payload.levelId)
  if (payload.lessonId) formData.append("lessonId", payload.lessonId)
  return formData
}

export async function previewImport(payload: ImportFilePayload) {
  const response = await api.post<AdminItemResponse<ImportPreviewResult>>("/admin/lessons/import/preview", importFormData(payload))
  return response.data
}

export async function commitImport(payload: ImportFilePayload) {
  const response = await api.post<AdminItemResponse<ImportAllResult>>("/admin/lessons/import/commit", importFormData(payload))
  return response.data
}

export async function fetchVocabularyImage(query: string) {
  const response = await api.post<AdminItemResponse<{ url: string; source: string }>>("/admin/vocabularies/fetch-image", { query })
  return response.data.data
}

export async function fetchBulkVocabularyImages(lessonId: string) {
  const response = await api.post<AdminItemResponse<{ updated: number; total: number; results: Array<{ id: string; chinese: string; imageUrl: string | null; error?: string }> }>>("/admin/vocabularies/fetch-images-bulk", { lessonId })
  return response.data.data
}

export async function reorderVocabularies(payload: { lessonId: string; items: Array<{ id: string; order: number }> }) {
  const response = await api.patch<AdminItemResponse<{ count: number }>>("/admin/vocabularies/reorder", payload)
  return response.data
}
