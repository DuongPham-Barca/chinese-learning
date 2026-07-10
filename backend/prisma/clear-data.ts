import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Deleting learning content data...")

  await prisma.progress.deleteMany()
  console.log("  ✓ Progress deleted")

  await prisma.sentence.deleteMany()
  console.log("  ✓ Sentences deleted")

  await prisma.vocabulary.deleteMany()
  console.log("  ✓ Vocabulary deleted")

  await prisma.lesson.deleteMany()
  console.log("  ✓ Lessons deleted")

  await prisma.level.deleteMany()
  console.log("  ✓ Levels deleted")

  console.log("✅ Done! Account data (User, Account, Session, Subscription) preserved.")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
