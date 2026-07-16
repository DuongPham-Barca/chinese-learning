import { Prisma, Role, SubscriptionPlan, SubStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

const levelSchema = z.enum(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'])
const roleSchema = z.enum(['USER', 'ADMIN'])
const planSchema = z.enum(['2months', '6months', '12months'])
const userSchema = z.object({
  username: z.string().trim().min(1, 'Tên người dùng là bắt buộc').max(50),
  email: z.preprocess((v) => v === '' ? null : v, z.string().trim().email('Email không hợp lệ').nullable().optional()),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional(),
  phone: z.preprocess((v) => v === '' ? null : v, z.string().trim().nullable().optional()),
  level: levelSchema.optional(),
  role: roleSchema.optional().default('USER'),
  isPremium: z.boolean().optional(),
  subscriptionUntil: z.preprocess((v) => v === '' ? null : v, z.string().datetime().nullable().optional()),
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

function page(req: import('express').Request) {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))
  return { page, limit, skip: (page - 1) * limit }
}

function planToEnum(plan: z.infer<typeof planSchema>) {
  if (plan === '6months') return SubscriptionPlan.SIX_MONTHS
  if (plan === '12months') return SubscriptionPlan.TWELVE_MONTHS
  return SubscriptionPlan.TWO_MONTHS
}

function enumToPlan(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.SIX_MONTHS) return '6months'
  if (plan === SubscriptionPlan.TWELVE_MONTHS) return '12months'
  return '2months'
}

function planMonths(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.SIX_MONTHS) return 6
  if (plan === SubscriptionPlan.TWELVE_MONTHS) return 12
  return 2
}

function planAmount(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.SIX_MONTHS) return 119000
  if (plan === SubscriptionPlan.TWELVE_MONTHS) return 189000
  return 49000
}

const userInclude = {
  sessions: { orderBy: { expires: 'desc' }, take: 5, select: { id: true, expires: true } },
  subscriptions: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, planId: true, status: true, amount: true, startedAt: true, expiresAt: true, confirmedAt: true, createdAt: true } },
  _count: { select: { progress: true, subscriptions: true } },
} satisfies Prisma.UserInclude

function premiumActive(user: { isPremium: boolean; subscriptionUntil: Date | null }) {
  return Boolean(user.isPremium && user.subscriptionUntil && user.subscriptionUntil > new Date())
}

function out(user: Prisma.UserGetPayload<{ include: typeof userInclude }>) {
  const activeSessions = user.sessions.filter((s) => s.expires > new Date()).length
  const confirmed = user.subscriptions.find((s) => s.status === SubStatus.CONFIRMED)
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    country: user.country,
    level: user.level,
    learningGoal: user.learningGoal,
    dailyTarget: user.dailyTarget,
    expPoints: user.expPoints,
    isPremium: premiumActive(user),
    role: user.role,
    subscriptionUntil: user.subscriptionUntil,
    activeSessionCount: activeSessions,
    status: activeSessions > 0 ? 'active' : 'inactive',
    plan: confirmed ? enumToPlan(confirmed.planId) : null,
    latestSubscription: user.subscriptions[0] ? { ...user.subscriptions[0], planId: enumToPlan(user.subscriptions[0].planId) } : null,
    progressCount: user._count.progress,
    subscriptionCount: user._count.subscriptions,
    createdAt: user.createdAt,
  }
}

router.get('/users/stats', asyncHandler(async (_req, res) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const [total, premium, newThisMonth, active] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.user.count({ where: { role: Role.USER, isPremium: true, subscriptionUntil: { gt: now } } }),
    prisma.user.count({ where: { role: Role.USER, createdAt: { gte: monthStart } } }),
    prisma.session.findMany({ where: { expires: { gt: now }, user: { role: Role.USER } }, distinct: ['userId'], select: { userId: true } }),
  ])
  return success(res, { total, premium, newThisMonth, active: active.length })
}))

router.get('/users', asyncHandler(async (req, res) => {
  const p = page(req)
  const now = new Date()
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const level = typeof req.query.level === 'string' ? req.query.level : ''
  const where: Prisma.UserWhereInput = {
    role: Role.USER,
    ...(search ? { OR: [{ username: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { id: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(level && levelSchema.safeParse(level).success ? { level: level as any } : {}),
    ...(req.query.account === 'premium' ? { isPremium: true, subscriptionUntil: { gt: now } } : {}),
    ...(req.query.account === 'free' ? { OR: [{ isPremium: false }, { subscriptionUntil: null }, { subscriptionUntil: { lte: now } }] } : {}),
    ...(req.query.status === 'active' ? { sessions: { some: { expires: { gt: now } } } } : {}),
    ...(req.query.status === 'inactive' ? { sessions: { none: { expires: { gt: now } } } } : {}),
  }
  const orderBy: Prisma.UserOrderByWithRelationInput = req.query.sort === 'old' ? { createdAt: 'asc' } : req.query.sort === 'exp' ? { expPoints: 'desc' } : { createdAt: 'desc' }
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: userInclude, orderBy, skip: p.skip, take: p.limit }),
  ])
  res.json({ success: true, data: users.map(out), pagination: { page: p.page, limit: p.limit, total, totalPages: Math.ceil(total / p.limit) } })
}))

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, include: { ...userInclude, progress: { orderBy: { createdAt: 'desc' }, take: 10, include: { lesson: { select: { id: true, title: true, levelType: true, lessonOrder: true } } } } } })
  if (!user) return error(res, 404, 'Không tìm thấy người dùng')
  return success(res, { ...out(user), recentProgress: user.progress })
}))

router.post('/users', asyncHandler(async (req, res) => {
  const parsed = userSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const subscriptionUntil = parsed.data.subscriptionUntil ? new Date(parsed.data.subscriptionUntil) : null
  if (parsed.data.isPremium && (!subscriptionUntil || subscriptionUntil <= new Date())) {
    return error(res, 400, 'Tài khoản Premium phải có ngày hết hạn trong tương lai', { subscriptionUntil: 'Chọn ngày hết hạn hợp lệ' })
  }
  try {
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email || null,
        passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined,
        phone: parsed.data.phone || null,
        level: parsed.data.level,
        role: parsed.data.role,
        isPremium: parsed.data.isPremium ?? false,
        subscriptionUntil,
      },
      include: userInclude,
    })
    return success(res, out(user), 'Tạo người dùng thành công', 201)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Tên người dùng hoặc email đã tồn tại')
    throw e
  }
}))

router.put('/users/:id', asyncHandler(async (req, res) => {
  const parsed = userSchema.partial().safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  if (parsed.data.isPremium === true) {
    const current = await prisma.user.findUnique({ where: { id: req.params.id }, select: { subscriptionUntil: true } })
    const subscriptionUntil = parsed.data.subscriptionUntil === undefined
      ? current?.subscriptionUntil
      : parsed.data.subscriptionUntil ? new Date(parsed.data.subscriptionUntil) : null
    if (!subscriptionUntil || subscriptionUntil <= new Date()) {
      return error(res, 400, 'Tài khoản Premium phải có ngày hết hạn trong tương lai', { subscriptionUntil: 'Gia hạn bằng chức năng mở khóa Premium' })
    }
  }
  const data: Prisma.UserUpdateInput = {}
  if (parsed.data.username !== undefined) data.username = parsed.data.username
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null
  if (parsed.data.password !== undefined) data.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null
  if (parsed.data.level !== undefined) data.level = parsed.data.level
  if (parsed.data.role !== undefined) data.role = parsed.data.role
  if (parsed.data.isPremium !== undefined) data.isPremium = parsed.data.isPremium
  if (parsed.data.subscriptionUntil !== undefined) data.subscriptionUntil = parsed.data.subscriptionUntil ? new Date(parsed.data.subscriptionUntil) : null
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data, include: userInclude })
    return success(res, out(user), 'Cập nhật người dùng thành công')
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return error(res, 404, 'Không tìm thấy người dùng')
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return error(res, 409, 'Tên người dùng hoặc email đã tồn tại')
    throw e
  }
}))

router.patch('/users/:id/premium', asyncHandler(async (req, res) => {
  const parsed = z.object({ planId: planSchema }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)
  const admin = res.locals.admin as { id: string }
  const planId = planToEnum(parsed.data.planId)
  const startedAt = new Date()
  const user = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: req.params.id } })
    if (!target) return null
    const extensionBase = target.subscriptionUntil && target.subscriptionUntil > startedAt
      ? target.subscriptionUntil
      : startedAt
    const expiresAt = new Date(extensionBase)
    expiresAt.setMonth(expiresAt.getMonth() + planMonths(planId))
    await tx.subscription.create({ data: { userId: target.id, planId, amount: planAmount(planId), status: SubStatus.CONFIRMED, transferContent: `ADMIN_UNLOCK_${target.id}`, startedAt, expiresAt, confirmedAt: startedAt, confirmedBy: admin.id } })
    return tx.user.update({ where: { id: target.id }, data: { isPremium: true, subscriptionUntil: expiresAt }, include: userInclude })
  })
  if (!user) return error(res, 404, 'Không tìm thấy người dùng')
  return success(res, out(user), 'Mở khóa premium thành công')
}))

router.patch('/profile/password', asyncHandler(async (req, res) => {
  const parsed = z.object({
    currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
  }).safeParse(req.body)
  if (!parsed.success) return invalid(res, parsed)

  const admin = res.locals.admin as { id: string; passwordHash: string | null }
  if (!admin.passwordHash || !(await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash))) {
    return error(res, 400, 'Mật khẩu hiện tại không đúng', { currentPassword: 'Mật khẩu hiện tại không đúng' })
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  })
  return success(res, { changed: true }, 'Đổi mật khẩu thành công')
}))

router.delete('/users/:id', asyncHandler(async (req, res) => {
  const admin = res.locals.admin as { id: string }
  if (req.params.id === admin.id) return error(res, 400, 'Không thể xóa tài khoản admin đang đăng nhập')
  const deleted = await prisma.user.deleteMany({ where: { id: req.params.id, role: Role.USER } })
  if (!deleted.count) return error(res, 404, 'Không tìm thấy người dùng')
  return success(res, { id: req.params.id }, 'Xóa người dùng thành công')
}))

export default router
