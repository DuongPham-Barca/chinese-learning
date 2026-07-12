import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } })
try {
  const total = await prisma.vocabulary.count()
  const withImage = await prisma.vocabulary.count({ where: { imageUrl: { not: null } } })
  const withoutImage = await prisma.vocabulary.count({ where: { imageUrl: null } })
  console.log(`With image: ${withImage}/${total}, Missing: ${withoutImage}`)
} finally {
  await prisma.$disconnect()
}
