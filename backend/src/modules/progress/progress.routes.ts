import { Router } from 'express'
import { getUserId } from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

router.post('/', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { lessonId, vocabId, sentenceId, expGained } = req.body

  const progress = await prisma.progress.create({
    data: { userId, lessonId, vocabId, sentenceId, expGained },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { expPoints: { increment: expGained || 0 } },
  })

  res.json({ progress })
}))

router.get('/:userId', asyncHandler(async (req, res) => {
  const authenticatedUserId = getUserId(req)
  if (!authenticatedUserId) return res.status(401).json({ error: 'Unauthorized' })
  if (authenticatedUserId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' })

  const progress = await prisma.progress.findMany({
    where: { userId: req.params.userId },
    include: { lesson: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ progress })
}))

export default router
