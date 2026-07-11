import { LevelType, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: {
      levelType: { in: [LevelType.HSK3, LevelType.HSK4] },
      title: { startsWith: "Khác" },
    },
    orderBy: [{ levelType: "asc" }, { lessonOrder: "asc" }],
  })

  for (const lesson of lessons) {
    const title = lesson.title.replace(/^Khác/, "Từ vựng tổng hợp")
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { title },
    })
    console.log(`${lesson.levelType} ${lesson.lessonOrder}: ${lesson.title} -> ${title}`)
  }

  console.log(`Renamed ${lessons.length} lessons.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
