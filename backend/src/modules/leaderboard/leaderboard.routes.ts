import { Role } from '@prisma/client'
import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const { period } = req.query

  let dateFilter: Date | undefined
  const now = new Date()
  if (period === 'week') dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  else if (period === 'month') {
    dateFilter = new Date(now)
    dateFilter.setMonth(dateFilter.getMonth() - 1)
  }

  if (dateFilter) {
    const scores = await prisma.progress.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: dateFilter } },
      _sum: { expGained: true },
      orderBy: { _sum: { expGained: 'desc' } },
      take: 50,
    })

    const users = await prisma.user.findMany({
      where: { id: { in: scores.map((score) => score.userId) }, role: Role.USER },
      select: { id: true, username: true, avatarUrl: true, level: true },
    })
    const usersById = new Map(users.map((user) => [user.id, user]))
    const leaderboard = scores.flatMap((score) => {
      const user = usersById.get(score.userId)
      return user ? [{ ...user, expPoints: score._sum.expGained || 0 }] : []
    })

    return res.json({ leaderboard })
  }

  const leaderboard = await prisma.user.findMany({
    where: { role: Role.USER },
    orderBy: { expPoints: 'desc' },
    take: 50,
    select: { id: true, username: true, avatarUrl: true, level: true, expPoints: true },
  })

  res.json({ leaderboard })
}))

export default router
