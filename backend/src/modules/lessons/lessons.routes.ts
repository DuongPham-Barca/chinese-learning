import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, FREE_LESSON_LIMIT, hasActivePremium, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const { level } = req.query
  const where = {
    isPublished: true,
    ...(level ? { levelType: level as any } : {}),
  }
  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: { lessonOrder: 'asc' },
    include: {
      _count: { select: { vocabulary: true, sentences: true } },
    },
  })
  const hasPremium = await hasActivePremium(req)
  res.json({
    lessons: lessons.map((lesson) => ({
      ...lesson,
      isFree: lesson.lessonOrder <= FREE_LESSON_LIMIT,
      isLocked: lesson.lessonOrder > FREE_LESSON_LIMIT && !hasPremium,
    })),
  })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id },
    include: { vocabulary: { orderBy: { order: 'asc' } }, sentences: true },
  })
  if (!lesson || !lesson.isPublished) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) {
    return res.status(403).json(lessonLockedResponse)
  }
  res.json({ lesson: { ...lesson, isFree: lesson.lessonOrder <= FREE_LESSON_LIMIT, isLocked: false } })
}))

export default router
