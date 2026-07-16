import api from "@/lib/api"

export interface DashboardStats {
  totalUsers: number
  totalLessons: number
  monthlyRevenue: number
  pendingSubscriptions: number
  newUsersThisMonth: number
  activeUsers: number
}

export interface RevenuePoint {
  date: string
  total: number
}

export interface WeeklyNewUser {
  day: string
  count: number
}

export interface Activity {
  id: string
  type: string
  title: string
  text: string
  time: string
  timestamp: string
}

export interface DashboardData {
  stats: DashboardStats
  revenueChart: RevenuePoint[]
  weeklyNewUsers: WeeklyNewUser[]
  recentActivities: Activity[]
}

export async function getDashboard(days = 30) {
  const response = await api.get<{ success: true; data: DashboardData }>("/admin/dashboard", { params: { days } })
  return response.data
}

export async function getActivities(params: Record<string, unknown> = {}) {
  const response = await api.get<{
    success: true
    data: Activity[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>("/admin/activity", { params })
  return response.data
}
