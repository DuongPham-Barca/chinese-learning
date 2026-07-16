import { LevelType, Prisma } from '@prisma/client'
import { Router } from 'express'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { FREE_LESSON_LIMIT } from '../../lib/lesson-access'
import { prisma } from '../../lib/prisma'
import { uploadImage } from '../../lib/cloudflare-r2'

const router = Router()
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowed.includes(file.mimetype)) return cb(null, true)
    cb(new Error('Chỉ chấp nhận file ảnh JPEG, PNG, WEBP, GIF'))
  },
})

const levelTypes = Object.values(LevelType)
const url = z.preprocess((v) => v === '' ? null : v, z.string().url().nullable().optional())
const levelSchema = z.object({
  name: z.string().trim().min(1, 'Tên cấp độ là bắt buộc'),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: url,
  order: z.coerce.number().int().min(0),
  isPublished: z.boolean().optional().default(true),
})
const lessonSchema = z.object({
  levelId: z.string().trim().min(1, 'Cấp độ là bắt buộc'),
  title: z.string().trim().min(1, 'Tên bài học là bắt buộc'),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  imageUrl: url,
  order: z.coerce.number().int().min(0),
  isPublished: z.boolean().optional().default(false),
  expReward: z.coerce.number().int().min(0),
})
const vocabSchema = z.object({
  chinese: z.string().trim().min(1, 'Từ tiếng Trung là bắt buộc'),
  pinyin: z.string().trim().min(1, 'Pinyin là bắt buộc'),
  vietnamese: z.string().trim().min(1, 'Nghĩa tiếng Việt là bắt buộc'),
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
  return error(res, 400, 'Dữ liệu không hợp lệ', errors)
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
    const normalized = type.toLowerCase().replace('hsk', 'hsk-')
    if (source.includes(type.toLowerCase()) || source.includes(normalized)) return type
  }
  return null
}

function page(req: import('express').Request) {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
  return { page, limit, skip: (page - 1) * limit }
}

function lessonOut(lesson: any, exampleCount = 0) {
  const { lessonOrder, _count, ...rest } = lesson
  return { ...rest, order: lessonOrder, isFree: lessonOrder <= FREE_LESSON_LIMIT, vocabularyCount: _count?.vocabulary ?? 0, sentenceCount: (_count?.sentences ?? 0) + exampleCount }
}

function vocabOut(vocab: any) {
  const { hanzi, meaningVi, ...rest } = vocab
  return { ...rest, chinese: hanzi, vietnamese: meaningVi }
}

function cell(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return ''
}

function normalizeColumn(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function cellFlex(row: Record<string, unknown>, keys: string[]) {
  const direct = cell(row, keys)
  if (direct) return direct

  const normalized = new Map(Object.keys(row).map((key) => [normalizeColumn(key), key]))
  for (const key of keys) {
    const originalKey = normalized.get(normalizeColumn(key))
    if (!originalKey) continue
    const value = row[originalKey]
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return ''
}

function readSheetRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
}

type ImportMode = 'global' | 'lesson'
type ImportRowStatus = 'valid' | 'warning' | 'error' | 'duplicate'

type ImportPreviewRow = {
  row: number
  status: ImportRowStatus
  action: 'create' | 'update' | 'skip'
  lessonTitle: string
  lessonId: string | null
  lessonAction: 'selected' | 'matched' | 'create' | 'missing'
  chinese: string
  pinyin: string
  vietnamese: string
  example: string
  examplePinyin: string
  exampleMeaning: string
  order: number
  issues: string[]
}

type ImportPreview = {
  mode: ImportMode
  totalRows: number
  validRows: number
  warningRows: number
  errorRows: number
  duplicateRows: number
  detectedColumns: string[]
  requiredColumns: string[]
  summary: {
    lessonsMatched: number
    lessonsToCreate: number
    vocabToCreate: number
    vocabToUpdate: number
  }
  rows: ImportPreviewRow[]
}

const globalImportColumns = ['bài học', 'từ vựng', 'phiên âm từ vựng', 'nghĩa từ vựng', 'câu luyện tập', 'phiên âm', 'nghĩa câu']
const lessonImportColumns = ['từ vựng', 'phiên âm từ vựng', 'giải thích từ vựng', 'câu luyện tập', 'phiên âm câu luyện tập', 'nghĩa câu luyện tập']

const importAliases = {
  lessonTitle: ['bai hoc', 'ten bai hoc', 'lesson', 'lessonName', 'lesson_name', 'title'],
  chinese: ['tu vung', 'tu tieng trung', 'chinese', 'hanzi', 'word'],
  pinyin: ['phien am tu vung', 'pinyin tu vung', 'vocab pinyin', 'vocabulary pinyin', 'pinyin'],
  vietnamese: ['nghia tu vung', 'giai thich tu vung', 'meaning tu vung', 'vietnamese', 'meaningVi', 'meaning_vi', 'definition'],
  example: ['cau luyen tap', 'cau vi du', 'example', 'exampleZh', 'sentenceZh', 'sentence_zh'],
  examplePinyin: ['phien am cau luyen tap', 'phien am cau', 'example pinyin', 'examplePinyin', 'example_pinyin', 'sentencePinyin', 'phien am'],
  exampleMeaning: ['nghia cau luyen tap', 'nghia cau', 'example meaning', 'exampleMeaning', 'example_meaning', 'exampleVi', 'sentenceVi', 'sentence_vi'],
  order: ['thu tu', 'order', 'stt'],
}

function importMode(req: import('express').Request): ImportMode {
  return req.body?.mode === 'global' ? 'global' : 'lesson'
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

function uniqueSlug(base: string, used: Set<string>) {
  let slug = slugify(base) || `lesson-${Date.now().toString(36)}`
  let candidate = slug
  let index = 2
  while (used.has(candidate)) {
    candidate = `${slug}-${index}`
    index += 1
  }
  used.add(candidate)
  return candidate
}

async function buildImportPreview(buffer: Buffer, mode: ImportMode, options: { levelId?: string; lessonId?: string }): Promise<ImportPreview> {
  const rows = readSheetRows(buffer)
  const detectedColumns = rows[0] ? Object.keys(rows[0]) : []
  const requiredColumns = mode === 'global' ? globalImportColumns : lessonImportColumns

  let selectedLesson: { id: string; title: string; levelId: string } | null = null
  let levelId = options.levelId || ''

  if (mode === 'lesson') {
    if (!options.lessonId) throw Object.assign(new Error('Chọn bài học trước khi xem trước'), { statusCode: 400 })
    selectedLesson = await prisma.lesson.findUnique({ where: { id: options.lessonId }, select: { id: true, title: true, levelId: true } })
    if (!selectedLesson) throw Object.assign(new Error('Không tìm thấy bài học'), { statusCode: 404 })
    levelId = selectedLesson.levelId
  } else {
    if (!levelId) throw Object.assign(new Error('Chọn cấp độ HSK trước khi xem trước'), { statusCode: 400 })
    const level = await prisma.level.findUnique({ where: { id: levelId }, select: { id: true } })
    if (!level) throw Object.assign(new Error('Không tìm thấy cấp độ'), { statusCode: 404 })
  }

  const lessons = await prisma.lesson.findMany({
    where: { levelId },
    select: { id: true, title: true, slug: true },
  })
  const lessonByTitle = new Map(lessons.map((lesson) => [normalizeColumn(lesson.title), lesson]))
  const lessonBySlug = new Map(lessons.map((lesson) => [normalizeColumn(lesson.slug), lesson]))
  const existingVocabs = await prisma.vocabulary.findMany({
    where: mode === 'lesson' && selectedLesson ? { lessonId: selectedLesson.id } : { lessonId: { in: lessons.map((lesson) => lesson.id) } },
    select: { id: true, lessonId: true, hanzi: true },
  })
  const vocabByLessonAndHanzi = new Map(existingVocabs.map((item) => [`${item.lessonId}:${normalizeColumn(item.hanzi)}`, item]))
  const fileKeys = new Set<string>()

  const previewRows: ImportPreviewRow[] = rows.map((row, index) => {
    const rowNum = index + 2
    const lessonTitle = mode === 'global' ? cellFlex(row, importAliases.lessonTitle) : selectedLesson?.title || ''
    const chinese = cellFlex(row, importAliases.chinese)
    const pinyin = cellFlex(row, importAliases.pinyin)
    const vietnamese = cellFlex(row, importAliases.vietnamese)
    const example = cellFlex(row, importAliases.example)
    const examplePinyin = cellFlex(row, importAliases.examplePinyin)
    const exampleMeaning = cellFlex(row, importAliases.exampleMeaning)
    const order = Number(cellFlex(row, importAliases.order)) || index + 1
    const issues: string[] = []

    if (mode === 'global' && !lessonTitle) issues.push('Thiếu cột bài học')
    if (!chinese) issues.push('Thiếu từ vựng')
    if (!pinyin) issues.push('Thiếu phiên âm từ vựng')
    if (!vietnamese) issues.push('Thiếu nghĩa/giải thích từ vựng')
    if (!example) issues.push('Thiếu câu luyện tập')
    if (!examplePinyin) issues.push('Thiếu phiên âm câu luyện tập')
    if (!exampleMeaning) issues.push('Thiếu nghĩa câu luyện tập')

    const matchedLesson = mode === 'lesson'
      ? selectedLesson
      : lessonByTitle.get(normalizeColumn(lessonTitle)) || lessonBySlug.get(normalizeColumn(slugify(lessonTitle)))
    const lessonKey = mode === 'lesson' && selectedLesson ? selectedLesson.id : normalizeColumn(lessonTitle)
    const fileKey = `${lessonKey}:${normalizeColumn(chinese)}`
    const duplicatedInFile = !!chinese && fileKeys.has(fileKey)
    if (chinese) fileKeys.add(fileKey)
    if (duplicatedInFile) issues.push('Trùng từ vựng trong file')

    const hasFatal = issues.some((issue) => ['Thiếu cột bài học', 'Thiếu từ vựng', 'Thiếu phiên âm từ vựng', 'Thiếu nghĩa/giải thích từ vựng'].includes(issue))
    const status: ImportRowStatus = duplicatedInFile ? 'duplicate' : hasFatal ? 'error' : issues.length ? 'warning' : 'valid'
    const lessonId = matchedLesson?.id || null
    const existingVocab = lessonId ? vocabByLessonAndHanzi.get(`${lessonId}:${normalizeColumn(chinese)}`) : null

    return {
      row: rowNum,
      status,
      action: status === 'error' || status === 'duplicate' ? 'skip' : existingVocab ? 'update' : 'create',
      lessonTitle,
      lessonId,
      lessonAction: mode === 'lesson' ? 'selected' : matchedLesson ? 'matched' : lessonTitle ? 'create' : 'missing',
      chinese,
      pinyin,
      vietnamese,
      example,
      examplePinyin,
      exampleMeaning,
      order,
      issues,
    }
  })

  const importable = previewRows.filter((row) => row.status === 'valid' || row.status === 'warning')
  const lessonsToCreate = uniqueBy(importable.filter((row) => row.lessonAction === 'create'), (row) => normalizeColumn(row.lessonTitle)).length
  const lessonsMatched = uniqueBy(importable.filter((row) => row.lessonId), (row) => row.lessonId || '').length

  return {
    mode,
    totalRows: rows.length,
    validRows: previewRows.filter((row) => row.status === 'valid').length,
    warningRows: previewRows.filter((row) => row.status === 'warning').length,
    errorRows: previewRows.filter((row) => row.status === 'error').length,
    duplicateRows: previewRows.filter((row) => row.status === 'duplicate').length,
    detectedColumns,
    requiredColumns,
    summary: {
      lessonsMatched,
      lessonsToCreate,
      vocabToCreate: importable.filter((row) => row.action === 'create').length,
      vocabToUpdate: importable.filter((row) => row.action === 'update').length,
    },
    rows: previewRows,
  }
}

async function commitImportPreview(preview: ImportPreview, options: { levelId?: string; lessonId?: string }) {
  if (preview.errorRows || preview.duplicateRows) {
    throw Object.assign(new Error('File còn dòng lỗi hoặc trùng lặp. Hãy sửa file rồi xem trước lại trước khi import.'), { statusCode: 400 })
  }

  const importedVocabs: any[] = []
  const skipped: Array<{ row: number; issue: string }> = []
  const importable = preview.rows.filter((row) => row.status === 'valid' || row.status === 'warning')

  await prisma.$transaction(async (tx) => {
    let levelId = options.levelId || ''
    if (preview.mode === 'lesson') {
      const lesson = await tx.lesson.findUnique({ where: { id: options.lessonId || '' }, select: { id: true, levelId: true } })
      if (!lesson) throw Object.assign(new Error('Không tìm thấy bài học'), { statusCode: 404 })
      levelId = lesson.levelId
    }

    const lessons = await tx.lesson.findMany({ where: { levelId }, select: { id: true, title: true, slug: true, lessonOrder: true, levelType: true } })
    const lessonByTitle = new Map(lessons.map((lesson) => [normalizeColumn(lesson.title), lesson]))
    const lessonBySlug = new Map(lessons.map((lesson) => [normalizeColumn(lesson.slug), lesson]))
    const usedSlugs = new Set(lessons.map((lesson) => lesson.slug))
    const level = await tx.level.findUnique({ where: { id: levelId }, select: { type: true } })
    let nextOrder = Math.max(0, ...lessons.map((lesson) => lesson.lessonOrder)) + 1

    const lessonIdForRow = new Map<number, string>()
    if (preview.mode === 'lesson' && options.lessonId) {
      for (const row of importable) lessonIdForRow.set(row.row, options.lessonId)
    } else {
      const rowsNeedingLesson = uniqueBy(importable.filter((row) => row.lessonTitle), (row) => normalizeColumn(row.lessonTitle))
      for (const row of rowsNeedingLesson) {
        const existing = lessonByTitle.get(normalizeColumn(row.lessonTitle)) || lessonBySlug.get(normalizeColumn(slugify(row.lessonTitle)))
        if (existing) {
          lessonIdForRow.set(row.row, existing.id)
          continue
        }

        const created = await tx.lesson.create({
          data: {
            levelId,
            levelType: level?.type || LevelType.HSK6,
            title: row.lessonTitle,
            slug: uniqueSlug(row.lessonTitle, usedSlugs),
            description: null,
            imageUrl: null,
            lessonOrder: nextOrder,
            isFree: nextOrder <= FREE_LESSON_LIMIT,
            isPublished: false,
            expReward: 10,
          },
          select: { id: true, title: true, slug: true },
        })
        nextOrder += 1
        lessonByTitle.set(normalizeColumn(created.title), created as any)
        lessonBySlug.set(normalizeColumn(created.slug), created as any)
        lessonIdForRow.set(row.row, created.id)
      }

      for (const row of importable) {
        if (!lessonIdForRow.has(row.row)) {
          const existing = lessonByTitle.get(normalizeColumn(row.lessonTitle)) || lessonBySlug.get(normalizeColumn(slugify(row.lessonTitle)))
          if (existing) lessonIdForRow.set(row.row, existing.id)
        }
      }
    }

    for (const row of importable) {
      const lessonId = lessonIdForRow.get(row.row)
      if (!lessonId) {
        skipped.push({ row: row.row, issue: 'Không tìm thấy bài học để import' })
        continue
      }

      const existing = await tx.vocabulary.findFirst({ where: { lessonId, hanzi: row.chinese } })
      const data = {
        pinyin: row.pinyin,
        meaningVi: row.vietnamese,
        ...(row.example ? { example: blankToNull(row.example) } : {}),
        ...(row.examplePinyin ? { examplePinyin: blankToNull(row.examplePinyin) } : {}),
        ...(row.exampleMeaning ? { exampleMeaning: blankToNull(row.exampleMeaning) } : {}),
        order: row.order,
      }

      if (existing) {
        importedVocabs.push(await tx.vocabulary.update({ where: { id: existing.id }, data }))
      } else {
        importedVocabs.push(await tx.vocabulary.create({
          data: {
            lessonId,
            hanzi: row.chinese,
            ...data,
          },
        }))
      }
    }
  })

  return {
    imported: importedVocabs.map(vocabOut),
    sentences: [],
    totalRows: preview.totalRows,
    added: importedVocabs.length,
    skipped,
    preview,
  }
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
  if (!level) return error(res, 404, 'Không tìm thấy cấp độ')
  return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined })
}))

router.post('/levels', asyncHandler(async (req, res) => {
  const parsed = levelSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const slug = slugify(parsed.data.slug || parsed.data.name)
  try {
    const level = await prisma.level.create({ data: { ...parsed.data, slug, type: inferLevelType(parsed.data.name, slug), description: blankToNull(parsed.data.description) }, include: { _count: { select: { lessons: true } } } })
    return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Tạo cấp độ thành công', 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug đã tồn tại', { slug: 'Slug đã tồn tại' })
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
    return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Cập nhật cấp độ thành công')
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return error(res, 404, 'Không tìm thấy cấp độ')
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug đã tồn tại', { slug: 'Slug đã tồn tại' })
    throw e
  }
}))

router.delete('/levels/:id', asyncHandler(async (req, res) => {
  const lessonCount = await prisma.lesson.count({ where: { levelId: req.params.id } })
  if (lessonCount) return error(res, 400, 'Không thể xóa cấp độ đang có bài học')
  const deleted = await prisma.level.deleteMany({ where: { id: req.params.id } })
  if (!deleted.count) return error(res, 404, 'Không tìm thấy cấp độ')
  return success(res, { id: req.params.id }, 'Xóa cấp độ thành công')
}))

router.patch('/levels/:id/status', asyncHandler(async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const level = await prisma.level.update({ where: { id: req.params.id }, data: parsed.data, include: { _count: { select: { lessons: true } } } })
  return success(res, { ...level, lessonCount: level._count.lessons, _count: undefined }, 'Cập nhật trạng thái cấp độ thành công')
}))

router.patch('/levels/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.level.update({ where: { id: i.id }, data: { order: i.order } })))
  return success(res, { count: parsed.data.items.length }, 'Sắp xếp cấp độ thành công')
}))

router.get('/lessons', asyncHandler(async (req, res) => {
  const p = page(req)
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const where: Prisma.LessonWhereInput = {
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    ...(typeof req.query.levelId === 'string' && req.query.levelId ? { levelId: req.query.levelId } : {}),
    ...(req.query.status === 'published' ? { isPublished: true } : {}),
    ...(req.query.status === 'unpublished' ? { isPublished: false } : {}),
    ...(req.query.access === 'free' ? { lessonOrder: { lte: FREE_LESSON_LIMIT } } : {}),
    ...(req.query.access === 'paid' ? { lessonOrder: { gt: FREE_LESSON_LIMIT } } : {}),
  }
  const orderBy: Prisma.LessonOrderByWithRelationInput = req.query.sort === 'title' ? { title: 'asc' } : req.query.sort === 'createdAt' ? { createdAt: 'desc' } : { lessonOrder: 'asc' }
  const [total, lessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({ where, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } }, orderBy, skip: p.skip, take: p.limit }),
  ])
  const lessonIds = lessons.map(l => l.id)
  const vocabExamples = lessonIds.length ? await prisma.vocabulary.groupBy({
    by: ['lessonId'],
    where: { lessonId: { in: lessonIds }, example: { not: null } },
    _count: true,
  }) : []
  const exampleCountMap = new Map(vocabExamples.map(v => [v.lessonId, v._count]))
  res.json({ success: true, data: lessons.map(lesson => lessonOut(lesson, exampleCountMap.get(lesson.id) || 0)), pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } })
}))

router.get('/lessons/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id }, include: { level: { select: { id: true, name: true } }, vocabulary: { orderBy: { order: 'asc' } }, sentences: true, _count: { select: { vocabulary: true, sentences: true } } } })
  if (!lesson) return error(res, 404, 'Không tìm thấy bài học')
  const exampleCount = lesson.vocabulary.filter((v) => v.example).length
  return success(res, { ...lessonOut(lesson, exampleCount), vocabulary: lesson.vocabulary.map(vocabOut), sentences: lesson.sentences })
}))

router.post('/lessons', asyncHandler(async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const level = await prisma.level.findUnique({ where: { id: parsed.data.levelId } })
  if (!level) return error(res, 404, 'Không tìm thấy cấp độ')
  const slug = slugify(parsed.data.slug || parsed.data.title)
  try {
    const lesson = await prisma.lesson.create({ data: { levelId: level.id, levelType: level.type || LevelType.HSK6, title: parsed.data.title, slug, description: blankToNull(parsed.data.description), imageUrl: parsed.data.imageUrl ?? null, lessonOrder: parsed.data.order, isFree: parsed.data.order <= FREE_LESSON_LIMIT, isPublished: parsed.data.isPublished, expReward: parsed.data.expReward }, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
    return success(res, lessonOut(lesson), 'Tạo bài học thành công', 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Slug bài học đã tồn tại trong cấp độ này', { slug: 'Slug đã tồn tại' })
    throw e
  }
}))

router.put('/lessons/:id', asyncHandler(async (req, res) => {
  const parsed = lessonSchema.partial().safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const data: any = {}
  if (parsed.data.levelId) {
    const level = await prisma.level.findUnique({ where: { id: parsed.data.levelId } })
    if (!level) return error(res, 404, 'Không tìm thấy cấp độ')
    data.levelId = level.id
    data.levelType = level.type || LevelType.HSK6
  }
  if (parsed.data.title !== undefined) data.title = parsed.data.title
  if (parsed.data.slug !== undefined) data.slug = slugify(parsed.data.slug)
  if (parsed.data.description !== undefined) data.description = blankToNull(parsed.data.description)
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl
  if (parsed.data.order !== undefined) {
    data.lessonOrder = parsed.data.order
    data.isFree = parsed.data.order <= FREE_LESSON_LIMIT
  }
  if (parsed.data.isPublished !== undefined) data.isPublished = parsed.data.isPublished
  if (parsed.data.expReward !== undefined) data.expReward = parsed.data.expReward
  const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
  const exampleCount = await prisma.vocabulary.count({ where: { lessonId: lesson.id, example: { not: null } } })
  return success(res, lessonOut(lesson, exampleCount), 'Cập nhật bài học thành công')
}))

router.delete('/lessons/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.lesson.deleteMany({ where: { id: req.params.id } })
  if (!deleted.count) return error(res, 404, 'Không tìm thấy bài học')
  return success(res, { id: req.params.id }, 'Xóa bài học thành công')
}))

router.patch('/lessons/:id/status', asyncHandler(async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data: parsed.data, include: { level: { select: { id: true, name: true } }, _count: { select: { vocabulary: true, sentences: true } } } })
  const exampleCount = await prisma.vocabulary.count({ where: { lessonId: lesson.id, example: { not: null } } })
  return success(res, lessonOut(lesson, exampleCount), 'Cập nhật trạng thái bài học thành công')
}))

router.patch('/lessons/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.required({ levelId: true }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.lesson.update({ where: { id: i.id }, data: { lessonOrder: i.order, isFree: i.order <= FREE_LESSON_LIMIT } })))
  return success(res, { count: parsed.data.items.length }, 'Sắp xếp bài học thành công')
}))

router.get('/lessons/:lessonId/vocabularies', asyncHandler(async (req, res) => {
  const items = await prisma.vocabulary.findMany({ where: { lessonId: req.params.lessonId }, orderBy: { order: 'asc' } })
  return success(res, items.map(vocabOut))
}))

router.post('/lessons/:lessonId/vocabularies', asyncHandler(async (req, res) => {
  const parsed = vocabSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Không tìm thấy bài học')
  const item = await prisma.vocabulary.create({ data: { lessonId: lesson.id, hanzi: parsed.data.chinese, pinyin: parsed.data.pinyin, meaningVi: parsed.data.vietnamese, example: blankToNull(parsed.data.example), examplePinyin: blankToNull(parsed.data.examplePinyin), exampleMeaning: blankToNull(parsed.data.exampleMeaning), audioUrl: parsed.data.audioUrl ?? null, imageUrl: parsed.data.imageUrl ?? null, order: parsed.data.order } })
  return success(res, vocabOut(item), 'Tạo từ vựng thành công', 201)
}))

router.post('/lessons/:lessonId/vocabularies/bulk', asyncHandler(async (req, res) => {
  const parsed = z.object({ items: z.array(vocabSchema).min(1) }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Không tìm thấy bài học')
  const items = await prisma.$transaction(parsed.data.items.map((i) => prisma.vocabulary.create({ data: { lessonId: lesson.id, hanzi: i.chinese, pinyin: i.pinyin, meaningVi: i.vietnamese, example: blankToNull(i.example), examplePinyin: blankToNull(i.examplePinyin), exampleMeaning: blankToNull(i.exampleMeaning), audioUrl: i.audioUrl ?? null, imageUrl: i.imageUrl ?? null, order: i.order } })))
  return success(res, items.map(vocabOut), 'Thêm nhiều từ vựng thành công', 201)
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
  return success(res, vocabOut(item), 'Cập nhật từ vựng thành công')
}))

router.delete('/vocabularies/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.$transaction(async (tx) => {
    await tx.progress.updateMany({
      where: { vocabId: req.params.id },
      data: { vocabId: null },
    })

    return tx.vocabulary.deleteMany({ where: { id: req.params.id } })
  })
  if (!deleted.count) return error(res, 404, 'Không tìm thấy từ vựng')
  return success(res, { id: req.params.id }, 'Xóa từ vựng thành công')
}))

router.patch('/vocabularies/reorder', asyncHandler(async (req, res) => {
  const parsed = reorderSchema.required({ lessonId: true }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  await prisma.$transaction(parsed.data.items.map((i) => prisma.vocabulary.update({ where: { id: i.id }, data: { order: i.order } })))
  return success(res, { count: parsed.data.items.length }, 'Sắp xếp từ vựng thành công')
}))

router.post('/lessons/:lessonId/vocabularies/import-examples', importUpload.single('file'), asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Không tìm thấy bài học')
  if (!req.file) return error(res, 400, 'Chọn file Excel hoặc CSV để import', { file: 'File is required' })

  const rows = readSheetRows(req.file.buffer)
  const candidates = rows.map((row, index) => ({
    row: index + 2,
    id: cell(row, ['id', 'vocabularyId', 'vocabId']),
    chinese: cell(row, ['chinese', 'hanzi', 'Chinese', 'Hanzi']),
    pinyin: cell(row, ['pinyin', 'Pinyin']),
    vietnamese: cell(row, ['vietnamese', 'meaningVi', 'meaning_vi', 'Vietnamese']),
    example: cell(row, ['example', 'exampleZh', 'sentenceZh', 'Example']),
    examplePinyin: cell(row, ['example_pinyin', 'examplePinyin', 'sentencePinyin', 'ExamplePinyin']),
    exampleMeaning: cell(row, ['example_meaning', 'exampleMeaning', 'exampleVi', 'sentenceVi', 'ExampleMeaning']),
    audioUrl: cell(row, ['audioUrl', 'audio', 'Audio']) || null,
    imageUrl: cell(row, ['imageUrl', 'image', 'Image']) || null,
    order: Number(cell(row, ['order', 'Order'])) || index + 1,
  }))
  const valid = candidates.filter((item) => item.example)
  const skipped = candidates.filter((item) => !item.example).map((item) => ({
    row: item.row,
    issue: 'Thiếu cột example',
  }))

  const imported = await prisma.$transaction(async (tx) => {
    const existing = await tx.vocabulary.findMany({ where: { lessonId: lesson.id } })
    const byHanzi = new Map(existing.map((item) => [item.hanzi.trim().toLowerCase(), item]))
    const output = []
    for (const item of valid) {
      const data = {
        example: blankToNull(item.example),
        examplePinyin: blankToNull(item.examplePinyin),
        exampleMeaning: blankToNull(item.exampleMeaning),
        ...(item.audioUrl !== null ? { audioUrl: item.audioUrl } : {}),
        ...(item.imageUrl !== null ? { imageUrl: item.imageUrl } : {}),
      }
      const target = item.id ? existing.find((v) => v.id === item.id) : byHanzi.get(item.chinese.trim().toLowerCase())
      if (target) {
        output.push(await tx.vocabulary.update({ where: { id: target.id }, data }))
      } else {
        output.push(await tx.vocabulary.create({
          data: {
            lessonId: lesson.id,
            hanzi: item.chinese || item.example,
            pinyin: item.pinyin || item.examplePinyin || '',
            meaningVi: item.vietnamese || item.exampleMeaning || '',
            audioUrl: item.audioUrl,
            imageUrl: item.imageUrl,
            order: item.order,
            ...data,
          },
        }))
      }
    }
    return output
  })
  return success(res, { imported: imported.map(vocabOut), totalRows: candidates.length, added: imported.length, skipped }, 'Import câu luyện tập vào example thành công', 201)
}))

router.post('/lessons/import/preview', importUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'Chọn file Excel hoặc CSV để xem trước', { file: 'Vui lòng chọn file' })
  try {
    const preview = await buildImportPreview(req.file.buffer, importMode(req), {
      levelId: typeof req.body?.levelId === 'string' ? req.body.levelId : undefined,
      lessonId: typeof req.body?.lessonId === 'string' ? req.body.lessonId : undefined,
    })
    return success(res, preview, 'Xem trước dữ liệu import thành công')
  } catch (e) {
    const status = typeof (e as any)?.statusCode === 'number' ? (e as any).statusCode : 400
    return error(res, status, e instanceof Error ? e.message : 'Không thể xem trước file')
  }
}))

router.post('/lessons/import/commit', importUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'Chọn file Excel hoặc CSV để import', { file: 'Vui lòng chọn file' })
  try {
    const mode = importMode(req)
    const options = {
      levelId: typeof req.body?.levelId === 'string' ? req.body.levelId : undefined,
      lessonId: typeof req.body?.lessonId === 'string' ? req.body.lessonId : undefined,
    }
    const preview = await buildImportPreview(req.file.buffer, mode, options)
    const result = await commitImportPreview(preview, options)
    return success(res, result, 'Import thành công', 201)
  } catch (e) {
    const status = typeof (e as any)?.statusCode === 'number' ? (e as any).statusCode : 400
    return error(res, status, e instanceof Error ? e.message : 'Không thể import file')
  }
}))

router.post('/lessons/:lessonId/import', importUpload.single('file'), asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId }, select: { id: true } })
  if (!lesson) return error(res, 404, 'Không tìm thấy bài học')
  if (!req.file) return error(res, 400, 'Chọn file Excel hoặc CSV để import', { file: 'File is required' })
  try {
    const options = { lessonId: lesson.id }
    const preview = await buildImportPreview(req.file.buffer, 'lesson', options)
    const result = await commitImportPreview(preview, options)
    return success(res, result, 'Import thành công', 201)
  } catch (e) {
    const status = typeof (e as any)?.statusCode === 'number' ? (e as any).statusCode : 400
    return error(res, status, e instanceof Error ? e.message : 'Không thể import file')
  }
}))

router.post('/upload', imageUpload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 400, 'Chọn file ảnh để upload', { file: 'File is required' })
  try {
    const url = await uploadImage('vocab', req.file.buffer, req.file.mimetype)
    return success(res, { url }, 'Upload ảnh thành công', 201)
  } catch (e) {
    return error(res, 500, 'Không thể upload ảnh lên server')
  }
}))

async function fetchImageUrls(query: string): Promise<string[]> {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  })
  const html = await res.text()
  const images: string[] = []

  const vqdMatch = html.match(/vqd=([^"&]+)/)
  if (!vqdMatch) return images

  const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqdMatch[1]}&f=,,,&o=json`
  const apiRes = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  })
  const data = await apiRes.json() as { results?: Array<{ image: string }> }
  if (data.results) {
    for (const r of data.results) {
      if (r.image) images.push(r.image)
    }
  }
  return images
}

router.post('/vocabularies/fetch-image', asyncHandler(async (req, res) => {
  const { query } = req.body || {}
  if (!query || !query.trim()) return error(res, 400, 'Nhập từ cần tìm ảnh', { query: 'Query is required' })

  const urls = await fetchImageUrls(query.trim())
  if (!urls.length) return error(res, 404, 'Không tìm thấy ảnh phù hợp')

  for (const imageUrl of urls) {
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
      if (!imgRes.ok) continue
      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      if (buffer.length < 1024) continue
      const url = await uploadImage('vocab', buffer, contentType)
      return success(res, { url, source: imageUrl }, 'Tìm ảnh thành công', 201)
    } catch {
      continue
    }
  }

  return error(res, 404, 'Không thể tải ảnh từ các nguồn tìm được')
}))

router.post('/vocabularies/fetch-images-bulk', asyncHandler(async (req, res) => {
  const { lessonId } = req.body || {}
  if (!lessonId) return error(res, 400, 'Thiếu lessonId')

  const vocabularies = await prisma.vocabulary.findMany({
    where: { lessonId, imageUrl: null },
    orderBy: { order: 'asc' },
  })

  if (!vocabularies.length) return success(res, { updated: 0, total: 0, results: [] }, 'Không có từ vựng nào thiếu ảnh')

  const results: Array<{ id: string; chinese: string; imageUrl: string | null; error?: string }> = []

  for (const vocab of vocabularies) {
    try {
      const urls = await fetchImageUrls(vocab.hanzi)
      let uploadedUrl: string | null = null
      for (const imageUrl of urls) {
        try {
          const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
          if (!imgRes.ok) continue
          const buffer = Buffer.from(await imgRes.arrayBuffer())
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
          if (buffer.length < 1024) continue
          uploadedUrl = await uploadImage('vocab', buffer, contentType)
          break
        } catch {
          continue
        }
      }
      if (uploadedUrl) {
        await prisma.vocabulary.update({ where: { id: vocab.id }, data: { imageUrl: uploadedUrl } })
        results.push({ id: vocab.id, chinese: vocab.hanzi, imageUrl: uploadedUrl })
      } else {
        results.push({ id: vocab.id, chinese: vocab.hanzi, imageUrl: null, error: 'Không tìm thấy ảnh' })
      }
    } catch {
      results.push({ id: vocab.id, chinese: vocab.hanzi, imageUrl: null, error: 'Lỗi xử lý' })
    }
  }

  return success(res, { updated: results.filter((r) => r.imageUrl).length, total: vocabularies.length, results }, 'Hoàn tất tìm ảnh hàng loạt')
}))

export default router
