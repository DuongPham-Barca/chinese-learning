import { Role } from '@prisma/client'
import type { Request } from 'express'
import { getUserId } from './auth'
import { prisma } from './prisma'

export const FREE_LESSON_LIMIT = 3

export async function hasActivePremium(req: Request): Promise<boolean> {
  const userId = getUserId(req)
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isPremium: true, subscriptionUntil: true },
  })

  if (!user) return false
  if (user.role === Role.ADMIN) return true
  if (!user.isPremium) return false
  return user.subscriptionUntil === null || user.subscriptionUntil > new Date()
}

export async function canAccessLesson(req: Request, lessonOrder: number): Promise<boolean> {
  return lessonOrder <= FREE_LESSON_LIMIT || hasActivePremium(req)
}

export const lessonLockedResponse = {
  error: 'Bài học này yêu cầu tài khoản Pro',
  code: 'LESSON_LOCKED',
} as const
