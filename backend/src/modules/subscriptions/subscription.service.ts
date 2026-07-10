import { SubStatus, SubscriptionPlan } from '@prisma/client'
import { prisma } from '../../lib/prisma'

export type SubscriptionPlanId = '2months' | '6months' | '12months'

const planConfig: Record<SubscriptionPlanId, { enumValue: SubscriptionPlan; amount: number; months: number }> = {
  '2months': { enumValue: SubscriptionPlan.TWO_MONTHS, amount: 49000, months: 2 },
  '6months': { enumValue: SubscriptionPlan.SIX_MONTHS, amount: 119000, months: 6 },
  '12months': { enumValue: SubscriptionPlan.TWELVE_MONTHS, amount: 189000, months: 12 },
}

function enumToPlanId(plan: SubscriptionPlan): SubscriptionPlanId {
  if (plan === SubscriptionPlan.SIX_MONTHS) return '6months'
  if (plan === SubscriptionPlan.TWELVE_MONTHS) return '12months'
  return '2months'
}

function getPlanConfig(planId: SubscriptionPlanId) {
  const config = planConfig[planId]
  if (!config) throw new Error('Invalid subscription plan')
  return config
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export async function createSubscription(userId: string, planId: SubscriptionPlanId, transferContent: string) {
  const plan = getPlanConfig(planId)
  const sub = await prisma.subscription.create({
    data: {
      userId,
      planId: plan.enumValue,
      amount: plan.amount,
      transferContent,
      status: SubStatus.PENDING,
    },
    include: {
      user: { select: { username: true, email: true } },
    },
  })

  try {
    const { notifyNewSubscription } = await import('../../lib/telegram-handler')
    await notifyNewSubscription({
      id: sub.id,
      user: sub.user.username,
      email: sub.user.email,
      plan: planId,
      amount: sub.amount,
      transferContent: sub.transferContent,
    })
  } catch (error) {
    console.error('Failed to send Telegram subscription notification:', error)
  }

  return sub
}

export async function confirmSubscription(id: string, confirmedBy: string) {
  const sub = await prisma.subscription.findUnique({ where: { id } })
  if (!sub) throw new Error('Subscription not found')
  if (sub.status !== SubStatus.PENDING) throw new Error('Subscription is not pending')

  const plan = getPlanConfig(enumToPlanId(sub.planId))
  const startedAt = new Date()
  const expiresAt = addMonths(startedAt, plan.months)

  return prisma.$transaction(async (tx) => {
    const confirmed = await tx.subscription.update({
      where: { id },
      data: {
        status: SubStatus.CONFIRMED,
        startedAt,
        expiresAt,
        confirmedAt: startedAt,
        confirmedBy,
      },
    })

    await tx.user.update({
      where: { id: sub.userId },
      data: { isPremium: true, subscriptionUntil: expiresAt },
    })

    return confirmed
  })
}

export async function rejectSubscription(id: string, confirmedBy: string) {
  const sub = await prisma.subscription.findUnique({ where: { id } })
  if (!sub) throw new Error('Subscription not found')
  if (sub.status !== SubStatus.PENDING) throw new Error('Subscription is not pending')

  return prisma.subscription.update({
    where: { id },
    data: {
      status: SubStatus.REJECTED,
      confirmedAt: new Date(),
      confirmedBy,
    },
  })
}
