import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const levels = await prisma.level.findMany({ orderBy: { order: "asc" } })
  for (const l of levels) {
    const lessons = await prisma.lesson.findMany({ where: { levelId: l.id }, orderBy: { lessonOrder: "asc" } })
    console.log("\n" + l.name + ":")
    for (const les of lessons) {
      const count = await prisma.vocabulary.count({ where: { lessonId: les.id } })
      console.log("  " + les.lessonOrder + ". " + les.title + " (" + count + " từ)")
    }
  }
  await prisma.$disconnect()
}

main()
