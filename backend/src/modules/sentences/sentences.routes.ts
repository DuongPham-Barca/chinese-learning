import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/:lessonId', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    select: { lessonOrder: true },
  })
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) {
    return res.status(403).json(lessonLockedResponse)
  }

  const sentences = await prisma.sentence.findMany({
    where: { lessonId: req.params.lessonId },
  })
  res.json({ sentences })
}))

export default router
