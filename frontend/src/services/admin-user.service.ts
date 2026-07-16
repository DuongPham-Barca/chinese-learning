import api from "@/lib/api"
import type { AdminItemResponse, AdminListResponse } from "./admin-level.service"

export interface AdminSession {
  id: string
  username: string
  role: string
}

export async function getAdminSession() {
  const response = await api.get<{ user: AdminSession }>("/auth/admin/session")
  return response.data
}

export type AdminPlan = "2months" | "6months" | "12months"
export type AdminUserStatus = "active" | "inactive"

export interface AdminUser {
  id: string
  username: string
  email: string | null
  avatarUrl: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: string
  country: string
  level: string
  learningGoal: string
  dailyTarget: number
  expPoints: number
  isPremium: boolean
  role: string
  subscriptionUntil: string | null
  activeSessionCount: number
  status: AdminUserStatus
  plan: AdminPlan | null
  progressCount: number
  subscriptionCount: number
  createdAt: string
  recentProgress?: Array<{ id: string; expGained: number; status: string; createdAt: string; lesson: { id: string; title: string; levelType: string; lessonOrder: number } }>
}

export interface AdminUserStats { total: number; active: number; premium: number; newThisMonth: number }

export type AdminUserPayload = {
  username: string
  email?: string | null
  password?: string
  phone?: string | null
  level?: string
  role?: "USER" | "ADMIN"
  isPremium?: boolean
  subscriptionUntil?: string | null
}

export async function getUserStats() {
  const response = await api.get<AdminItemResponse<AdminUserStats>>("/admin/users/stats")
  return response.data
}
export async function getUsers(params: Record<string, unknown> = {}) {
  const response = await api.get<AdminListResponse<AdminUser>>("/admin/users", { params })
  return response.data
}
export async function getUserById(id: string) {
  const response = await api.get<AdminItemResponse<AdminUser>>(`/admin/users/${id}`)
  return response.data
}
export async function createUser(payload: AdminUserPayload) {
  const response = await api.post<AdminItemResponse<AdminUser>>("/admin/users", payload)
  return response.data
}
export async function updateUser(id: string, payload: Partial<AdminUserPayload>) {
  const response = await api.put<AdminItemResponse<AdminUser>>(`/admin/users/${id}`, payload)
  return response.data
}
export async function unlockUserPremium(id: string, payload: { planId: AdminPlan }) {
  const response = await api.patch<AdminItemResponse<AdminUser>>(`/admin/users/${id}/premium`, payload)
  return response.data
}
export async function deleteUser(id: string) {
  const response = await api.delete<AdminItemResponse<{ id: string }>>(`/admin/users/${id}`)
  return response.data
}

export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string }) {
  const response = await api.patch<AdminItemResponse<{ changed: true }>>("/admin/profile/password", payload)
  return response.data
}
