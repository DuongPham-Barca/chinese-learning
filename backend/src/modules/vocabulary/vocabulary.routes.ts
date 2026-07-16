import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/:lessonId', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    select: { lessonOrder: true, isPublished: true, level: { select: { isPublished: true } } },
  })
  if (!lesson || !lesson.isPublished || !lesson.level.isPublished) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) {
    return res.status(403).json(lessonLockedResponse)
  }

  const vocab = await prisma.vocabulary.findMany({
    where: { lessonId: req.params.lessonId },
    orderBy: { order: 'asc' },
  })
  res.json({ vocabulary: vocab })
}))

export default router
