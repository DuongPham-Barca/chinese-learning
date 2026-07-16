import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { getUserId } from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

const moduleIds = ['flashcard', 'dictation', 'word-arrangement', 'reflex', 'speaking', 'quiz'] as const
const moduleProgressSchema = z.object({
  lessonId: z.string().trim().min(1),
  moduleId: z.enum(moduleIds),
})

function requireUserId(req: import('express').Request, res: import('express').Response) {
  const userId = getUserId(req)
  if (!userId) res.status(401).json({ error: 'Unauthorized' })
  return userId
}

router.post('/', asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res)
  if (!userId) return

  const parsed = moduleProgressSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid progress data' })

  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    select: {
      id: true,
      expReward: true,
      isPublished: true,
      lessonOrder: true,
      level: { select: { isPublished: true } },
    },
  })
  if (!lesson || !lesson.isPublished || !lesson.level.isPublished) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) {
    return res.status(403).json(lessonLockedResponse)
  }

  const status = `module:${parsed.data.moduleId}`
  let result: { progress: Awaited<ReturnType<typeof prisma.progress.create>>; created: boolean }
  try {
    result = await prisma.$transaction(async (tx) => {
      const existing = await tx.progress.findFirst({ where: { userId, lessonId: lesson.id, status } })
      if (existing) return { progress: existing, created: false }

      const expGained = Math.max(1, Math.ceil(lesson.expReward / moduleIds.length))
      const progress = await tx.progress.create({
        data: { userId, lessonId: lesson.id, status, expGained },
      })
      await tx.user.update({
        where: { id: userId },
        data: { expPoints: { increment: expGained } },
      })
      return { progress, created: true }
    })
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
    const existing = await prisma.progress.findFirst({ where: { userId, lessonId: lesson.id, status } })
    if (!existing) throw error
    result = { progress: existing, created: false }
  }

  return res.status(result.created ? 201 : 200).json(result)
}))

router.get('/me', asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res)
  if (!userId) return

  const progress = await prisma.progress.findMany({
    where: { userId },
    include: { lesson: { select: { id: true, title: true, levelType: true, lessonOrder: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ progress })
}))

router.delete('/', asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res)
  if (!userId) return

  const deleted = await prisma.$transaction(async (tx) => {
    const aggregate = await tx.progress.aggregate({ where: { userId }, _sum: { expGained: true }, _count: true })
    await tx.progress.deleteMany({ where: { userId } })
    const user = await tx.user.findUnique({ where: { id: userId }, select: { expPoints: true } })
    const expToRemove = Math.min(user?.expPoints ?? 0, aggregate._sum.expGained ?? 0)
    if (expToRemove > 0) {
      await tx.user.update({ where: { id: userId }, data: { expPoints: { decrement: expToRemove } } })
    }
    return aggregate._count
  })

  return res.json({ success: true, deleted })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = requireUserId(req, res)
  if (!userId) return

  const deleted = await prisma.$transaction(async (tx) => {
    const progress = await tx.progress.findFirst({ where: { id: req.params.id, userId } })
    if (!progress) return null
    await tx.progress.delete({ where: { id: progress.id } })
    const user = await tx.user.findUnique({ where: { id: userId }, select: { expPoints: true } })
    const expToRemove = Math.min(user?.expPoints ?? 0, progress.expGained)
    if (expToRemove > 0) {
      await tx.user.update({ where: { id: userId }, data: { expPoints: { decrement: expToRemove } } })
    }
    return progress
  })
  if (!deleted) return res.status(404).json({ error: 'Progress not found' })
  return res.json({ success: true, progress: deleted })
}))

router.get('/:userId', asyncHandler(async (req, res) => {
  const authenticatedUserId = requireUserId(req, res)
  if (!authenticatedUserId) return
  if (authenticatedUserId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' })

  const progress = await prisma.progress.findMany({
    where: { userId: req.params.userId },
    include: { lesson: true },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ progress })
}))

export default router
