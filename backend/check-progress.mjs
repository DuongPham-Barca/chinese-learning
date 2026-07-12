import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const total = await prisma.vocabulary.count()
const withImage = await prisma.vocabulary.count({ where: { imageUrl: { not: null } } })
const withoutImage = await prisma.vocabulary.count({ where: { imageUrl: null } })
const lessonsMissing = await prisma.lesson.count({ where: { vocabulary: { some: { imageUrl: null } } } })
console.log(`Total: ${total}`)
console.log(`With image: ${withImage}`)
console.log(`Without image: ${withoutImage}`)
console.log(`Lessons with missing images: ${lessonsMissing}`)

if (withoutImage > 0) {
  const next = await prisma.vocabulary.findFirst({
    where: { imageUrl: null },
    include: { lesson: { select: { title: true } } },
    orderBy: { order: 'asc' },
  })
  console.log(`Next vocab to process: ${next?.hanzi} (lesson: ${next?.lesson?.title})`)
}
await prisma.$disconnect()
