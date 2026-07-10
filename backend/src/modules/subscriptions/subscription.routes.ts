import { Router } from 'express'
import { z } from 'zod'
import { requireUser } from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'
import { createSubscription } from './subscription.service'

const router = Router()

const createSubscriptionSchema = z.object({
  planId: z.enum(['2months', '6months', '12months']),
  transferContent: z.string().trim().min(1).max(200),
})

router.post('/subscriptions', requireUser, asyncHandler(async (req, res) => {
  const parsed = createSubscriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid subscription data' })
  }

  const sub = await createSubscription(req.user!.id, parsed.data.planId, parsed.data.transferContent)
  return res.status(201).json({ subscription: { id: sub.id, status: sub.status } })
}))

router.get('/subscriptions/my', requireUser, asyncHandler(async (req, res) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ subscriptions })
}))

export default router
