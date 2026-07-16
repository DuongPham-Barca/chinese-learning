import { LevelType } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, FREE_LESSON_LIMIT, hasActivePremium, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const parsedQuery = z.object({ level: z.nativeEnum(LevelType).optional() }).safeParse(req.query)
  if (!parsedQuery.success) return res.status(400).json({ error: 'Invalid HSK level' })
  const { level } = parsedQuery.data
  const where = {
    isPublished: true,
    level: { isPublished: true },
    ...(level ? { levelType: level } : {}),
  }
  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: { lessonOrder: 'asc' },
    include: {
      _count: { select: { vocabulary: true, sentences: true } },
    },
  })
  const lessonIds = lessons.map(l => l.id)
  const vocabExamples = lessonIds.length ? await prisma.vocabulary.groupBy({
    by: ['lessonId'],
    where: { lessonId: { in: lessonIds }, example: { not: null } },
    _count: true,
  }) : []
  const exampleCountMap = new Map(vocabExamples.map(v => [v.lessonId, v._count]))
  const hasPremium = await hasActivePremium(req)
  res.json({
    lessons: lessons.map((lesson) => {
      const isFree = lesson.lessonOrder <= FREE_LESSON_LIMIT
      return {
        ...lesson,
        _count: {
          ...lesson._count,
          sentences: lesson._count.sentences + (exampleCountMap.get(lesson.id) || 0),
        },
        isFree,
        isLocked: !isFree && !hasPremium,
      }
    }),
  })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id },
    include: {
      level: { select: { isPublished: true } },
      vocabulary: { orderBy: { order: 'asc' } },
      sentences: true,
    },
  })
  if (!lesson || !lesson.isPublished || !lesson.level.isPublished) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) {
    return res.status(403).json(lessonLockedResponse)
  }
  const totalSentences = lesson.sentences.length + lesson.vocabulary.filter((v) => v.example).length
  const { level: _level, ...publicLesson } = lesson
  res.json({ lesson: { ...publicLesson, isFree: lesson.lessonOrder <= FREE_LESSON_LIMIT, isLocked: false, totalSentences } })
}))

export default router
