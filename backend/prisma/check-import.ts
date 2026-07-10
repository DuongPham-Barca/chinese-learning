import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const levels = await prisma.level.findMany({ orderBy: { order: "asc" } })

  let totalLessons = 0
  let totalVocab = 0

  for (const l of levels) {
    const lessons = await prisma.lesson.findMany({ where: { levelId: l.id }, orderBy: { lessonOrder: "asc" } })
    const vocabCount = await prisma.vocabulary.count({ where: { lesson: { levelId: l.id } } })
    totalLessons += lessons.length
    totalVocab += vocabCount
    console.log(`${l.name}: ${lessons.length} lessons, ${vocabCount} vocab`)
  }

  console.log(`\nTotal: ${levels.length} levels, ${totalLessons} lessons, ${totalVocab} vocabulary`)

  const sample = await prisma.vocabulary.findFirst({
    where: { hanzi: "你好" },
    include: { lesson: true },
  })
  if (sample) {
    console.log(`\nSample: ${sample.hanzi} - ${sample.pinyin} - ${sample.meaningVi}`)
    console.log(`  Lesson: ${sample.lesson.title} (${sample.lesson.levelType})`)
  }

  await prisma.$disconnect()
}

main()
