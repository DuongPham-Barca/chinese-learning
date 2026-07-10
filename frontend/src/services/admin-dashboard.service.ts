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
  type: string
  title: string
  text: string
  time: string
}

export interface DashboardData {
  stats: DashboardStats
  revenueChart: RevenuePoint[]
  weeklyNewUsers: WeeklyNewUser[]
  recentActivities: Activity[]
}

export async function getDashboard() {
  const response = await api.get<{ success: true; data: DashboardData }>("/admin/dashboard")
  return response.data
}
