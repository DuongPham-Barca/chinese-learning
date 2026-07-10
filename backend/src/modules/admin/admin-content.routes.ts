import { LevelType, Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

const levelTypes = Object.values(LevelType)
const url = z.preprocess((v) => v === '' ? null : v, z.string().url().nullable().optional())
const levelSchema = z.object({
  name: z.string().trim().min(1, 'Ten cap do la bat buoc'),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: url,
  order: z.coerce.number().int().min(0),
  isPublished: z.boolean().optional().default(true),
})
const lessonSchema = z.object({
  levelId: z.string().trim().min(1, 'Cap do la bat buoc'),
  title: z.string().trim().min(1, 'Ten bai hoc la bat buoc'),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: url,
  order: z.coerce.number().int().min(0),
  isFree: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
  expReward: z.coerce.number().int().min(0),
})
const vocabSchema = z.object({
  chinese: z.string().trim().min(1, 'Tu tieng Trung la bat buoc'),
  pinyin: z.string().trim().min(1, 'Pinyin la bat buoc'),
  vietnamese: z.string().trim().min(1, 'Nghia tieng Viet la bat buoc'),
  example: z.string().trim().nullable().optional(),
  examplePinyin: z.string().trim().nullable().optional(),
  exampleMeaning: z.string().trim().nullable().optional(),
  audioUrl: url,
  imageUrl: url,
  order: z.coerce.number().int().min(0),
})
const statusSchema = z.object({ isPublished: z.boolean() })
const reorderSchema = z.object({
  levelId: z.string().trim().min(1).optional(),
  lessonId: z.string().trim().min(1).optional(),
  items: z.array(z.object({ id: z.string().trim().min(1), order: z.coerce.number().int().min(0) })).min(1),
})

function success(res: import('express').Response, data: unknown, message?: string, status = 200) {
  return res.status(status).json({ success: true, ...(message ? { message } : {}), data })
}

function error(res: import('express').Response, status: number, message: string, errors?: Record<string, string>) {
  return res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) })
}

function invalid(res: import('express').Response, parsed: { error: z.ZodError }) {
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] || 'form')
    if (!errors[field]) errors[field] = issue.message
  }
  return error(res, 400, 'Du lieu khong hop le', errors)
}

function slugify(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function blankToNull(value?: string | null) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed || null
}

function inferLevelType(name: string, slug: string): LevelType | null {
  const source = `${name} ${slug}`.toLowerCase()
  for (const type of levelTypes) {
    const normalized = type === 'COMMUNICATION' ? 'giao' : type.toLowerCase().replace('hsk', 'hsk-')
    if (source.includes(type.toLowerCase()) || source.includes(normalized)) return type
  }
  return null
}

function page(req: import('express').Request) {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
  return { page, limit, skip: (page - 1) * limit }
}

function lessonOut(lesson: any) {
  const { lessonOrder, _count, ...rest } = lesson
  return { ...rest, order: lessonOrder, vocabularyCount: _count?.vocabulary ?? 0, sentenceCount: _count?.sentences ?? 0 }
}

function vocabOut(vocab: any) {
  const { hanzi, meaningVi, ...rest } = vocab
  return { ...rest, chinese: hanzi, vietnamese: meaningVi }
}

router.get('/levels', asyncHandler(async (req, res) => {
  const p = page(req)
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const status = req.query.status
  const where: Prisma.LevelWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(status === 'published' ? { isPublished: true } : {}),
    ...(status === 'unpublished' ? { isPublished: false } : {}),
  }
  const [total, levels] = await Promise.all([
    prisma.level.count({ where }),
    prisma.level.findMany({ where, include: { _count: { select: { lessons: true } } }, orderBy: req.query.sort === 'createdAt' ? { createdAt: 'desc' } : { order: 'asc' }, skip: p.skip, take: p.limit }),
  ])
  res.json({ success: true, data: levels.map((l) => ({ ...l, lessonCount: l._count.lessons, _count: undefined })), pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } })
}))

router.get('/levels/:id', asyncHandler(async (req, res) => {
  const level = await prisma.level.findUnique({ where: { id: req.params.id }, include: { _count: { select: { lessons: true } } } })
  if (!level) return error(res, 404, 'Khong tim thay cap do')
  return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined })
}))

router.post('/levels', asyncHandler(async (req, res) => {
  const parsed = levelSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const slug = slugify(parsed.data.slug || parsed.data.name)
  try {
    const level = await prisma.level.create({ data: { ...parsed.data, slug, type: inferLevelType(parsed.data.name, slug), description: blankToNull(parsed.data.description) }, include: { _count: { select: { lessons: true } } } })
    return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Tao cap do thanh cong', 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug da ton tai', { slug: 'Slug da ton tai' })
    throw e
  }
}))

router.put('/levels/:id', asyncHandler(async (req, res) => {
  const parsed = levelSchema.partial().safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const data: any = { ...parsed.data }
  if (parsed.data.slug !== undefined) data.slug = slugify(parsed.data.slug)
  if (parsed.data.description !== undefined) data.description = blankToNull(parsed.data.description)
  try {
    const level = await prisma.level.update({ where: { id: req.params.id }, data, include: { _count: { select: { lessons: true } } } })
    return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Cap nhat cap do thanh cong')
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return error(res, 404, 'Khong tim thay cap do')
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug da ton tai', { slug: 'Slug da ton tai' })
    throw e
  }
}))

router.delete('/levels/:id', asyncHandler(async (req, res) => {
  const lessonCount = await prisma.lesson.count({ where: { levelId: req.params.id } })
  if (lessonCount) return error(res, 400, 'Khong the xoa cap do dang co bai hoc')
  const deleted = await prisma.level.deleteMany({ where: { id: req.params.id } })
  if (!deleted.count) return error(res, 404, 'Khong tim thay cap do')
  return success(res, { id: req.params.id }, 'Xoa cap do thanh cong')
}))

router.patch('/levels/:id/status', asyncHandler(async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const level = await prisma.level.update({ where: { id: req.params.id }, data: parsed.data, include: { _count: { select: { lessons: true } } } })
  return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Cap nhat trang thai cap do thanh cong')
}))

router.patch('/levels/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.level.update({ where: { id: i.id }, data: { order: i.order } })))
  return success(res, { count: parsed.data.items.length }, 'Sap xep cap do thanh cong')
}))

router.get('/lessons', asyncHandler(async (req, res) => {
  const p = page(req)
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const where: Prisma.LessonWhereInput = {
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    ...(typeof req.query.levelId === 'string' && req.query.levelId ? { levelId: req.query.levelId } : {}),
    ...(req.query.status === 'published' ? { isPublished: true } : {}),
    ...(req.query.status === 'unpublished' ? { isPublished: false } : {}),
    ...(req.query.access === 'free' ? { isFree: true } : {}),
    ...(req.query.access === 'paid' ? { isFree: false } : {}),
  }
  const orderBy: Prisma.LessonOrderByWithRelationInput = req.query.sort === 'title' ? { title: 'asc' } : req.query.sort === 'createdAt' ? { createdAt: 'desc' } : { lessonOrder: 'asc' }
  const [total, lessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({ where, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } }, orderBy, skip: p.skip, take: p.limit }),
  ])
  res.json({ success: true, data: lessons.map(lessonOut), pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } })
}))

router.get('/lessons/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id }, include: { level: { select: { id: true, name: true } }, vocabulary: { orderBy: { order: 'asc' } }, _count: { select: { vocabulary: true, sentences: true } } } })
  if (!lesson) return error(res, 404, 'Khong tim thay bai hoc')
  return success(res, { ...lessonOut(lesson), vocabulary: lesson.vocabulary.map(vocabOut) })
}))

router.post('/lessons', asyncHandler(async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const level = await prisma.level.findUnique({ where: { id: parsed.data.levelId } })
  if (!level) return error(res, 404, 'Khong tim thay cap do')
  const slug = slugify(parsed.data.slug || parsed.data.title)
  try {
    const lesson = await prisma.lesson.create({ data: { levelId: level.id, levelType: level.type || LevelType.COMMUNICATION, title: parsed.data.title, slug, description: blankToNull(parsed.data.description), imageUrl: parsed.data.imageUrl ?? null, lessonOrder: parsed.data.order, isFree: parsed.data.isFree, isPublished: parsed.data.isPublished, expReward: parsed.data.expReward }, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
    return success(res, lessonOut(lesson), 'Tao bai hoc thanh cong', 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug bai hoc da ton tai trong cap do nay', { slug: 'Slug da ton tai' })
    throw e
  }
}))

router.put('/lessons/:id', asyncHandler(async (req, res) => {
  const parsed = lessonSchema.partial().safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const data: any = {}
  if (parsed.data.levelId) {
    const level = await prisma.level.findUnique({ where: { id: parsed.data.levelId } })
    if (!level) return error(res, 404, 'Khong tim thay cap do')
    data.levelId = level.id
    data.levelType = level.type || LevelType.COMMUNICATION
  }
  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.slug !== undefined) data.slug = slugify(parsed.data.slug)
  if (parsed.data.description !== undefined) data.description = blankToNull(parsed.data.description)
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl
  if (parsed.data.order !== undefined) data.lessonOrder = parsed.data.order
  if (parsed.data.isFree !== undefined) data.isFree = parsed.data.isFree
  if (parsed.data.isPublished !== undefined) data.isPublished = parsed.data.isPublished
  if (parsed.data.expReward !== undefined) data.expReward = parsed.data.expReward
  const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
  return success(res, lessonOut(lesson), 'Cap nhat bai hoc thanh cong')
}))

router.delete('/lessons/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.lesson.deleteMany({ where: { id: req.params.id } })
  if (!deleted.count) return error(res, 404, 'Khong tim thay bai hoc')
  return success(res, { id: req.params.id }, 'Xoa bai hoc thanh cong')
}))

router.patch('/lessons/:id/status', asyncHandler(async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data: parsed.data, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
  return success(res, lessonOut(lesson), 'Cap nhat trang thai bai hoc thanh cong')
}))

router.patch('/lessons/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.required({ levelId: true }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.lesson.update({ where: { id: i.id }, data: { lessonOrder: i.order } })))
  return success(res, { count: parsed.data.items.length }, 'Sap xep bai hoc thanh cong')
}))

router.get('/lessons/:lessonId/vocabularies', asyncHandler(async (req, res) => {
  const items = await prisma.vocabulary.findMany({ where: { lessonId: req.params.lessonId }, orderBy: { order: 'asc' } })
  return success(res, items.map(vocabOut))
}))

router.post('/lessons/:lessonId/vocabularies', asyncHandler(async (req, res) => {
  const parsed = vocabSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Khong tim thay bai hoc')
  const item = await prisma.vocabulary.create({ data: { lessonId: lesson.id, hanzi: parsed.data.chinese, pinyin: parsed.data.pinyin, meaningVi: parsed.data.vietnamese, example: blankToNull(parsed.data.example), examplePinyin: blankToNull(parsed.data.examplePinyin), exampleMeaning: blankToNull(parsed.data.exampleMeaning), audioUrl: parsed.data.audioUrl ?? null, imageUrl: parsed.data.imageUrl ?? null, order: parsed.data.order } })
  return success(res, vocabOut(item), 'Tao tu vung thanh cong', 201)
}))

router.post('/lessons/:lessonId/vocabularies/bulk', asyncHandler(async (req, res) => {
  const parsed = z.object({ items: z.array(vocabSchema).min(1) }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Khong tim thay bai hoc')
  const items = await prisma.$transaction(parsed.data.items.map((i) => prisma.vocabulary.create({ data: { lessonId: lesson.id, hanzi: i.chinese, pinyin: i.pinyin, meaningVi: i.vietnamese, example: blankToNull(i.example), examplePinyin: blankToNull(i.examplePinyin), exampleMeaning: blankToNull(i.exampleMeaning), audioUrl: i.audioUrl ?? null, imageUrl: i.imageUrl ?? null, order: i.order } })))
  return success(res, items.map(vocabOut), 'Them nhieu tu vung thanh cong', 201)
}))

router.put('/vocabularies/:id', asyncHandler(async (req, res) => {
  const parsed = vocabSchema.partial().safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const data: any = {}
  if (parsed.data.chinese !== undefined) data.hanzi = parsed.data.chinese
  if (parsed.data.pinyin !== undefined) data.pinyin = parsed.data.pinyin
  if (parsed.data.vietnamese !== undefined) data.meaningVi = parsed.data.vietnamese
  if (parsed.data.example !== undefined) data.example = blankToNull(parsed.data.example)
  if (parsed.data.examplePinyin !== undefined) data.examplePinyin = blankToNull(parsed.data.examplePinyin)
  if (parsed.data.exampleMeaning !== undefined) data.exampleMeaning = blankToNull(parsed.data.exampleMeaning)
  if (parsed.data.audioUrl !== undefined) data.audioUrl = parsed.data.audioUrl
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl
  if (parsed.data.order !== undefined) data.order = parsed.data.order
  const item = await prisma.vocabulary.update({ where: { id: req.params.id }, data })
  return success(res, vocabOut(item), 'Cap nhat tu vung thanh cong')
}))

router.delete('/vocabularies/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.vocabulary.deleteMany({ where: { id: req.params.id } })
  if (!deleted.count) return error(res, 404, 'Khong tim thay tu vung')
  return success(res, { id: req.params.id }, 'Xoa tu vung thanh cong')
}))

router.patch('/vocabularies/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.required({ lessonId: true }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.vocabulary.update({ where: { id: i.id }, data: { order: i.order } })))
  return success(res, { count: parsed.data.items.length }, 'Sap xep tu vung thanh cong')
}))

export default router
