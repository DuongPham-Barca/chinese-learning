import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/:lessonId', asyncHandler(async (req, res) => {
  const sentences = await prisma.sentence.findMany({
    where: { lessonId: req.params.lessonId },
  })
  res.json({ sentences })
}))

export default router
