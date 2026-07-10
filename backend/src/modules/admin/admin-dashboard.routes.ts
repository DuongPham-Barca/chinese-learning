import { SubStatus } from '@prisma/client'
import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

function success(res: import('express').Response, data: unknown) {
  return res.json({ success: true, data })
}

router.get('/dashboard', asyncHandler(async (_req, res) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    totalLessons,
    monthlyRevenue,
    pendingSubscriptions,
    newUsersThisMonth,
    activeSessions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.lesson.count({ where: { isPublished: true } }),
    prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: SubStatus.CONFIRMED, createdAt: { gte: monthStart } },
    }),
    prisma.subscription.count({ where: { status: SubStatus.PENDING } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: monthStart } } }),
    prisma.session.findMany({ where: { expires: { gt: now }, user: { role: 'USER' } }, distinct: ['userId'], select: { userId: true } }),
  ])

  const activeUsers = activeSessions.length

  const [revenue30Days, weeklyNewUsers, recentActivities] = await Promise.all([
    (async () => {
      const days: { date: string; total: number }[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const next = new Date(d)
        next.setDate(next.getDate() + 1)
        days.push({ date: d.toISOString().slice(0, 10), total: 0 })
      }
      const subs = await prisma.subscription.findMany({
        where: { status: SubStatus.CONFIRMED, createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        select: { amount: true, createdAt: true },
      })
      for (const s of subs) {
        const key = s.createdAt.toISOString().slice(0, 10)
        const day = days.find((d) => d.date === key)
        if (day) day.total += s.amount
      }
      return days
    })(),
    (async () => {
      const days: { day: string; count: number }[] = []
      const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      for (let i = 0; i < 7; i++) {
        days.push({ day: dayNames[i], count: 0 })
      }
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      weekStart.setHours(0, 0, 0, 0)
      const users = await prisma.user.findMany({
        where: { role: 'USER', createdAt: { gte: weekStart } },
        select: { createdAt: true },
      })
      for (const u of users) {
        const dayIdx = (u.createdAt.getDay() + 6) % 7
        if (days[dayIdx]) days[dayIdx].count++
      }
      return days
    })(),
    (async () => {
      const items: { type: string; title: string; text: string; time: string }[] = []

      const recentUsers = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { username: true, createdAt: true },
      })
      for (const u of recentUsers) {
        items.push({
          type: 'user',
          title: 'Người dùng mới đăng ký',
          text: `${u.username} vừa gia nhập cộng đồng.`,
          time: timeAgo(u.createdAt),
        })
      }

      const recentSubs = await prisma.subscription.findMany({
        where: { status: SubStatus.CONFIRMED },
        orderBy: { confirmedAt: 'desc' },
        take: 2,
        select: { id: true, amount: true, confirmedAt: true, user: { select: { username: true } } },
      })
      for (const s of recentSubs) {
        items.push({
          type: 'payment',
          title: 'Thanh toán thành công',
          text: `${s.user.username} đã thanh toán ${(s.amount / 1000).toFixed(0)}.000đ.`,
          time: timeAgo(s.confirmedAt!),
        })
      }

      const recentLessons = await prisma.lesson.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { title: true, levelType: true, createdAt: true },
      })
      for (const l of recentLessons) {
        items.push({
          type: 'lesson',
          title: 'Bài học mới được đăng',
          text: `Bài học "${l.title}" (${l.levelType}) vừa được xuất bản.`,
          time: timeAgo(l.createdAt),
        })
      }

      items.sort((a, b) => b.time.localeCompare(a.time))
      return items.slice(0, 5)
    })(),
  ])

  return success(res, {
    stats: {
      totalUsers,
      totalLessons,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      pendingSubscriptions,
      newUsersThisMonth,
      activeUsers,
    },
    revenueChart: revenue30Days,
    weeklyNewUsers,
    recentActivities,
  })
}))

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vài giây trước'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export default router
