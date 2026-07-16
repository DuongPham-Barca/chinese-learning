import { PrismaClient, LevelType } from "@prisma/client"
import * as XLSX from "xlsx"
import path from "path"

const prisma = new PrismaClient()

const EXCEL_PATH = path.resolve(__dirname, "../../FULL TỪ VỰNG HSK1- HSK6.xlsx")

type VocabRow = {
  hanzi: string
  pinyin: string
  meaningVi: string
  example: string
  examplePinyin: string
  exampleMeaning: string
  topic: string
}

const LEVEL_MAP: Record<string, { type: LevelType; name: string; slug: string; order: number }> = {
  HSK1: { type: "HSK1", name: "HSK 1", slug: "hsk-1", order: 1 },
  HSK2: { type: "HSK2", name: "HSK 2", slug: "hsk-2", order: 2 },
  HSK3: { type: "HSK3", name: "HSK 3", slug: "hsk-3", order: 3 },
  HSK4: { type: "HSK4", name: "HSK 4", slug: "hsk-4", order: 4 },
  HSK5: { type: "HSK5", name: "HSK 5", slug: "hsk-5", order: 5 },
  HSK6: { type: "HSK6", name: "HSK 6", slug: "hsk-6", order: 6 },
}

function exactCol(header: string[], name: string): number {
  return header.findIndex((c) => c === name)
}

function normalizeSheet(data: string[][]): VocabRow[] {
  const header = data[0].map((c) => (c ? c.toString().trim() : ""))

  const hanziIdx = exactCol(header, "Từ mới")
  const meaningIdx = exactCol(header, "Giải thích")
  const exampleIdx = exactCol(header, "Ví dụ (chữ hán)")
  const exampleMeaningIdx = exactCol(header, "Dịch")
  const topicIdx = exactCol(header, "Chủ đề")

  const pinyinIdx = exactCol(header, "Phiên âm")
  const pinyin2Idx = exactCol(header, "Phiên âm2")

  const rows: VocabRow[] = []
  let lastTopic = ""

  for (let i = 1; i < data.length; i++) {
    const r = data[i]
    if (!r || r.length === 0) continue
    const hanzi = r[hanziIdx]?.toString().trim() || ""
    if (!hanzi || !isNaN(Number(hanzi)) && hanzi.length < 3) continue

    const pA = pinyinIdx >= 0 ? (r[pinyinIdx]?.toString().trim() || "") : ""
    const pB = pinyin2Idx >= 0 ? (r[pinyin2Idx]?.toString().trim() || "") : ""

    let pinyin = ""
    let examplePinyin = ""

    if (pA && pB) {
      if (pA.includes(" ") || pA.length > pB.length + 5) {
        pinyin = pB
        examplePinyin = pA
      } else {
        pinyin = pA
        examplePinyin = pB
      }
    } else {
      pinyin = pA || pB
    }

    const meaningVi = r[meaningIdx]?.toString().trim() || ""
    const example = r[exampleIdx]?.toString().trim() || ""
    const exampleMeaning = r[exampleMeaningIdx]?.toString().trim() || ""

    if (topicIdx >= 0) {
      const raw = r[topicIdx]?.toString().trim() || ""
      if (raw) lastTopic = raw
    }
    const topic = topicIdx >= 0 ? lastTopic : ""

    rows.push({ hanzi, pinyin, meaningVi, example, examplePinyin, exampleMeaning, topic })
  }

  return rows
}

function normalizeTopicTitle(topic: string): string {
  return topic.trim().toLowerCase() === "khác" ? "Từ vựng tổng hợp" : topic
}

function groupIntoLessons(rows: VocabRow[], wordsPerLesson = 25): { title: string; words: VocabRow[] }[] {
  const byTopic = new Map<string, VocabRow[]>()
  for (const row of rows) {
    const key = row.topic ? normalizeTopicTitle(row.topic) : "__untopiced__"
    if (!byTopic.has(key)) byTopic.set(key, [])
    byTopic.get(key)!.push(row)
  }

  const lessons: { title: string; words: VocabRow[] }[] = []

  for (const [topic, group] of byTopic) {
    if (topic === "__untopiced__") {
      for (let i = 0; i < group.length; i += wordsPerLesson) {
        const chunk = group.slice(i, i + wordsPerLesson)
        const lessonNum = Math.floor(i / wordsPerLesson) + 1
        lessons.push({ title: `Bài ${lessonNum}`, words: chunk })
      }
    } else if (group.length <= wordsPerLesson) {
      lessons.push({ title: topic, words: group })
    } else {
      const partCount = Math.ceil(group.length / wordsPerLesson)
      const perPart = Math.ceil(group.length / partCount)
      for (let i = 0; i < group.length; i += perPart) {
        const chunk = group.slice(i, i + perPart)
        const label = partCount <= 1 ? topic : `${topic} (${Math.floor(i / perPart) + 1}/${partCount})`
        lessons.push({ title: label, words: chunk })
      }
    }
  }

  return lessons
}

function lessonSlug(sheetName: string, order: number): string {
  return `${sheetName.toLowerCase()}-bai-${order}`
}

async function importSheet(sheetName: string, rawData: string[][]) {
  const levelInfo = LEVEL_MAP[sheetName]
  if (!levelInfo) return

  process.stdout.write(`📄 ${sheetName}... `)

  const level = await prisma.level.upsert({
    where: { slug: levelInfo.slug },
    update: { type: levelInfo.type, name: levelInfo.name, description: `Từ vựng ${levelInfo.name}`, order: levelInfo.order, isPublished: true },
    create: { type: levelInfo.type, name: levelInfo.name, slug: levelInfo.slug, description: `Từ vựng ${levelInfo.name}`, order: levelInfo.order, isPublished: true },
  })

  const rows = normalizeSheet(rawData)
  const lessons = groupIntoLessons(rows)
  console.log(`${rows.length} words, ${lessons.length} lessons`)

  for (let lessonIdx = 0; lessonIdx < lessons.length; lessonIdx++) {
    const { title, words } = lessons[lessonIdx]
    const slug = lessonSlug(sheetName, lessonIdx + 1)

    const lesson = await prisma.lesson.upsert({
      where: { levelId_slug: { levelId: level.id, slug } },
      update: { title, lessonOrder: lessonIdx + 1, isPublished: true },
      create: {
        levelId: level.id,
        levelType: levelInfo.type,
        lessonOrder: lessonIdx + 1,
        title,
        slug,
        isFree: lessonIdx + 1 <= 3,
        isPublished: true,
        expReward: 10,
      },
    })

    const existingVocabs = await prisma.vocabulary.findMany({ where: { lessonId: lesson.id } })
    const existingHanzi = new Set(existingVocabs.map((v) => v.hanzi))

    const toCreate = words
      .filter((w) => !existingHanzi.has(w.hanzi))
      .map((w, i) => ({
        lessonId: lesson.id,
        hanzi: w.hanzi,
        pinyin: w.pinyin,
        meaningVi: w.meaningVi,
        example: w.example || null,
        examplePinyin: w.examplePinyin || null,
        exampleMeaning: w.exampleMeaning || null,
        order: i + 1,
      }))

    if (toCreate.length > 0) {
      await prisma.vocabulary.createMany({ data: toCreate })
    }

    process.stdout.write(".")
  }

  console.log(` ✓`)
}

async function main() {
  console.log("📚 Importing vocabulary from Excel...\n")

  const wb = XLSX.readFile(EXCEL_PATH)

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name]
    const rawData: string[][] = XLSX.utils.sheet_to_json(ws, { defval: "", header: 1 })
    await importSheet(name, rawData)
  }

  console.log("\n✅ Import complete!")
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
