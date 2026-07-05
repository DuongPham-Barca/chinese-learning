import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/:lessonId', asyncHandler(async (req, res) => {
  const vocab = await prisma.vocabulary.findMany({
    where: { lessonId: req.params.lessonId },
  })
  res.json({ vocabulary: vocab })
}))

export default router
