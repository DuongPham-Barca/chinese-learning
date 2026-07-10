import api from "@/lib/api"

export interface PaginationMeta { page: number; limit: number; total: number; totalPages: number }
export interface AdminListResponse<T> { success: boolean; data: T[]; pagination: PaginationMeta; message?: string }
export interface AdminItemResponse<T> { success: boolean; data: T; message?: string }

export interface AdminLevel {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  order: number
  isPublished: boolean
  lessonCount: number
  createdAt: string
  updatedAt: string
}

export type LevelPayload = {
  name: string
  slug?: string
  description?: string | null
  imageUrl?: string | null
  order: number
  isPublished?: boolean
}

export async function getLevels(params: Record<string, unknown> = {}) {
  const response = await api.get<AdminListResponse<AdminLevel>>("/admin/levels", { params })
  return response.data
}
export async function getLevelById(id: string) {
  const response = await api.get<AdminItemResponse<AdminLevel>>(`/admin/levels/${id}`)
  return response.data
}
export async function createLevel(payload: LevelPayload) {
  const response = await api.post<AdminItemResponse<AdminLevel>>("/admin/levels", payload)
  return response.data
}
export async function updateLevel(id: string, payload: Partial<LevelPayload>) {
  const response = await api.put<AdminItemResponse<AdminLevel>>(`/admin/levels/${id}`, payload)
  return response.data
}
export async function deleteLevel(id: string) {
  const response = await api.delete<AdminItemResponse<{ id: string }>>(`/admin/levels/${id}`)
  return response.data
}
export async function toggleLevelStatus(id: string, payload: { isPublished: boolean }) {
  const response = await api.patch<AdminItemResponse<AdminLevel>>(`/admin/levels/${id}/status`, payload)
  return response.data
}
export async function reorderLevels(payload: { items: Array<{ id: string; order: number }> }) {
  const response = await api.patch<AdminItemResponse<{ count: number }>>("/admin/levels/reorder", payload)
  return response.data
}
