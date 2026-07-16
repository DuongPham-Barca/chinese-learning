import { Router } from 'express'
import { requireUser } from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/saved/:lessonId', requireUser, asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    select: { lessonOrder: true, isPublished: true, level: { select: { isPublished: true } } },
  })
  if (!lesson || !lesson.isPublished || !lesson.level.isPublished) return res.status(404).json({ error: 'Lesson not found' })
  if (!(await canAccessLesson(req, lesson.lessonOrder))) return res.status(403).json(lessonLockedResponse)

  const savedVocabulary = await prisma.savedVocabulary.findMany({
    where: { userId: req.user!.id, vocabulary: { lessonId: req.params.lessonId } },
    select: { id: true, createdAt: true, vocabulary: true },
    orderBy: { createdAt: 'desc' },
  })
  return res.json({ savedVocabulary })
}))

router.post('/saved/:vocabularyId', requireUser, asyncHandler(async (req, res) => {
  const vocabulary = await prisma.vocabulary.findUnique({
    where: { id: req.params.vocabularyId },
    select: {
      id: true,
      lesson: {
        select: { lessonOrder: true, isPublished: true, level: { select: { isPublished: true } } },
      },
    },
  })
  if (!vocabulary || !vocabulary.lesson.isPublished || !vocabulary.lesson.level.isPublished) {
    return res.status(404).json({ error: 'Vocabulary not found' })
  }
  if (!(await canAccessLesson(req, vocabulary.lesson.lessonOrder))) return res.status(403).json(lessonLockedResponse)

  const saved = await prisma.savedVocabulary.upsert({
    where: { userId_vocabularyId: { userId: req.user!.id, vocabularyId: vocabulary.id } },
    create: { userId: req.user!.id, vocabularyId: vocabulary.id },
    update: {},
    select: { id: true, createdAt: true, vocabulary: true },
  })
  return res.status(201).json({ savedVocabulary: saved })
}))

router.delete('/saved/:vocabularyId', requireUser, asyncHandler(async (req, res) => {
  const result = await prisma.savedVocabulary.deleteMany({
    where: { userId: req.user!.id, vocabularyId: req.params.vocabularyId },
  })
  return res.json({ success: true, deleted: result.count })
}))

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
