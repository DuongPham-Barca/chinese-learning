import { LevelType } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { getUserId } from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { canAccessLesson, FREE_LESSON_LIMIT, hasActivePremium, lessonLockedResponse } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'

const router = Router()
const curriculumModuleCount = 6

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

router.get('/curriculum', asyncHandler(async (req, res) => {
  const parsedQuery = z.object({ level: z.nativeEnum(LevelType).default(LevelType.HSK1) }).safeParse(req.query)
  if (!parsedQuery.success) return res.status(400).json({ error: 'Invalid HSK level' })

  const selectedType = parsedQuery.data.level
  const [levelRows, selectedLevel, hasPremium] = await Promise.all([
    prisma.level.findMany({
      where: { isPublished: true, type: { not: null } },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { lessons: { where: { isPublished: true } } } },
      },
    }),
    prisma.level.findFirst({
      where: { isPublished: true, type: selectedType },
      select: { id: true, type: true, name: true, slug: true, description: true },
    }),
    hasActivePremium(req),
  ])

  if (!selectedLevel?.type) return res.status(404).json({ error: 'Level not found' })

  const lessons = await prisma.lesson.findMany({
    where: {
      isPublished: true,
      levelId: selectedLevel.id,
    },
    orderBy: { lessonOrder: 'asc' },
    select: {
      id: true,
      levelType: true,
      lessonOrder: true,
      title: true,
      description: true,
      imageUrl: true,
      _count: { select: { vocabulary: true, sentences: true } },
    },
  })

  const lessonIds = lessons.map((lesson) => lesson.id)
  const userId = getUserId(req)
  const [exampleCounts, progressRows] = await Promise.all([
    lessonIds.length
      ? prisma.vocabulary.groupBy({
          by: ['lessonId'],
          where: { lessonId: { in: lessonIds }, example: { not: null } },
          _count: true,
        })
      : Promise.resolve([]),
    userId && lessonIds.length
      ? prisma.progress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds },
            status: { startsWith: 'module:' },
          },
          select: { lessonId: true, status: true },
        })
      : Promise.resolve([]),
  ])

  const exampleCountMap = new Map(exampleCounts.map((item) => [item.lessonId, item._count]))
  const completedModuleMap = new Map<string, Set<string>>()
  for (const row of progressRows) {
    const modules = completedModuleMap.get(row.lessonId) || new Set<string>()
    modules.add(row.status)
    completedModuleMap.set(row.lessonId, modules)
  }

  const curriculumLessons = lessons.map((lesson) => {
    const completedModules = Math.min(completedModuleMap.get(lesson.id)?.size || 0, curriculumModuleCount)
    const progressPercent = Math.round((completedModules / curriculumModuleCount) * 100)
    const isFree = lesson.lessonOrder <= FREE_LESSON_LIMIT
    const isLocked = !isFree && !hasPremium

    return {
      ...lesson,
      _count: {
        ...lesson._count,
        sentences: lesson._count.sentences + (exampleCountMap.get(lesson.id) || 0),
      },
      isFree,
      isLocked,
      completedModules,
      totalModules: curriculumModuleCount,
      progressPercent,
      status: isLocked
        ? 'locked'
        : progressPercent >= 100
          ? 'completed'
          : progressPercent > 0
            ? 'in_progress'
            : 'not_started',
    }
  })

  const completedLessons = curriculumLessons.filter((lesson) => lesson.status === 'completed').length
  const completedModules = curriculumLessons.reduce((total, lesson) => total + lesson.completedModules, 0)
  const totalModules = curriculumLessons.length * curriculumModuleCount
  const currentLesson = curriculumLessons.find((lesson) => !lesson.isLocked && lesson.progressPercent < 100)
    || curriculumLessons.find((lesson) => !lesson.isLocked)
    || null

  return res.json({
    levels: levelRows
      .filter((level): level is typeof level & { type: LevelType } => level.type !== null)
      .map((level) => ({
        id: level.id,
        type: level.type,
        name: level.name,
        slug: level.slug,
        description: level.description,
        lessonCount: level._count.lessons,
      })),
    level: selectedLevel,
    lessons: curriculumLessons,
    currentLessonId: currentLesson?.id || null,
    summary: {
      totalLessons: curriculumLessons.length,
      completedLessons,
      totalVocabulary: curriculumLessons.reduce((total, lesson) => total + lesson._count.vocabulary, 0),
      totalSentences: curriculumLessons.reduce((total, lesson) => total + lesson._count.sentences, 0),
      completedModules,
      totalModules,
      progressPercent: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
    },
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
