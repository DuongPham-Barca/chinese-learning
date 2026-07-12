import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  const lessons = await prisma.lesson.findMany({ take: 5, select: { id: true, title: true, _count: { select: { vocabulary: true } } } })
  console.log('Lessons:', JSON.stringify(lessons, null, 2))
  const missing = await prisma.vocabulary.count({ where: { imageUrl: null } })
  const total = await prisma.vocabulary.count()
  console.log(`Vocab without image: ${missing} / ${total}`)
} finally {
  await prisma.$disconnect()
}
