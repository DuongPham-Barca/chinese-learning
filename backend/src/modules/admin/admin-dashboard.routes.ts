import { Prisma, SubStatus } from '@prisma/client'
import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

function success(res: import('express').Response, data: unknown) {
  return res.json({ success: true, data })
}

router.get('/dashboard', asyncHandler(async (req, res) => {
  const now = new Date()
  const requestedDays = Number(req.query.days)
  const chartDays = [7, 30, 90].includes(requestedDays) ? requestedDays : 30
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
      for (let i = chartDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        const next = new Date(d)
        next.setDate(next.getDate() + 1)
        days.push({ date: d.toISOString().slice(0, 10), total: 0 })
      }
      const subs = await prisma.subscription.findMany({
        where: { status: SubStatus.CONFIRMED, createdAt: { gte: new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000) } },
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
      const items: { id: string; type: string; title: string; text: string; time: string; timestamp: Date }[] = []

      const recentUsers = await prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true, username: true, createdAt: true },
      })
      for (const u of recentUsers) {
        items.push({
          type: 'user',
          id: `user-${u.id}`,
          title: 'Người dùng mới đăng ký',
          text: `${u.username} vừa gia nhập cộng đồng.`,
          time: timeAgo(u.createdAt),
          timestamp: u.createdAt,
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
          id: `payment-${s.id}`,
          title: 'Thanh toán thành công',
          text: `${s.user.username} đã thanh toán ${(s.amount / 1000).toFixed(0)}.000đ.`,
          time: timeAgo(s.confirmedAt!),
          timestamp: s.confirmedAt!,
        })
      }

      const recentLessons = await prisma.lesson.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true, title: true, levelType: true, createdAt: true },
      })
      for (const l of recentLessons) {
        items.push({
          type: 'lesson',
          id: `lesson-${l.id}`,
          title: 'Bài học mới được đăng',
          text: `Bài học "${l.title}" (${l.levelType}) vừa được xuất bản.`,
          time: timeAgo(l.createdAt),
          timestamp: l.createdAt,
        })
      }

      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      return items.slice(0, 5).map(({ timestamp, ...item }) => ({ ...item, timestamp: timestamp.toISOString() }))
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

router.get('/activity', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const type = typeof req.query.type === 'string' ? req.query.type : ''
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const searchFilter = search
    ? { contains: search, mode: Prisma.QueryMode.insensitive }
    : undefined

  const [users, subscriptions, lessons] = await Promise.all([
    !type || type === 'user'
      ? prisma.user.findMany({
          where: { role: 'USER', ...(searchFilter ? { username: searchFilter } : {}) },
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: { id: true, username: true, createdAt: true },
        })
      : [],
    !type || type === 'payment'
      ? prisma.subscription.findMany({
          where: {
            status: SubStatus.CONFIRMED,
            ...(searchFilter ? { user: { username: searchFilter } } : {}),
          },
          orderBy: { confirmedAt: 'desc' },
          take: 100,
          select: { id: true, amount: true, confirmedAt: true, user: { select: { username: true } } },
        })
      : [],
    !type || type === 'lesson'
      ? prisma.lesson.findMany({
          where: searchFilter ? { title: searchFilter } : {},
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: { id: true, title: true, levelType: true, createdAt: true },
        })
      : [],
  ])

  const activities = [
    ...users.map((user) => ({
      id: `user-${user.id}`,
      type: 'user',
      title: 'Người dùng mới đăng ký',
      text: `${user.username} vừa gia nhập cộng đồng.`,
      timestamp: user.createdAt,
    })),
    ...subscriptions.filter((subscription) => subscription.confirmedAt).map((subscription) => ({
      id: `payment-${subscription.id}`,
      type: 'payment',
      title: 'Thanh toán thành công',
      text: `${subscription.user.username} đã thanh toán ${subscription.amount.toLocaleString('vi-VN')}đ.`,
      timestamp: subscription.confirmedAt!,
    })),
    ...lessons.map((lesson) => ({
      id: `lesson-${lesson.id}`,
      type: 'lesson',
      title: 'Bài học mới được đăng',
      text: `Bài học "${lesson.title}" (${lesson.levelType}) vừa được tạo.`,
      timestamp: lesson.createdAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const total = activities.length
  const data = activities.slice((page - 1) * limit, page * limit).map((item) => ({
    ...item,
    time: timeAgo(item.timestamp),
    timestamp: item.timestamp.toISOString(),
  }))

  res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } })
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
