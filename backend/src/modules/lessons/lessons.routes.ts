import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const { level } = req.query
  const where = level ? { levelType: level as any } : {}
  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: { lessonOrder: 'asc' },
    include: {
      _count: { select: { vocabulary: true, sentences: true } },
    },
  })
  res.json({ lessons })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id },
    include: { vocabulary: true, sentences: true },
  })
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' })
  res.json({ lesson })
}))

export default router
