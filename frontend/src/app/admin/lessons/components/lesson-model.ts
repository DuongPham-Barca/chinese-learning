import type { AdminLesson } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"
import type { HskLevelKey, LessonTopic, LevelSummary, PracticeSentence, TopicDraft } from "./types"

export const HSK_ORDER: HskLevelKey[] = ["hsk1", "hsk2", "hsk3", "hsk4", "hsk5", "hsk6", "communication"]

export const HSK_META: Record<HskLevelKey, { label: string; description: string; accent: string; soft: string }> = {
  hsk1: { label: "HSK1", description: "Nen tang phat am, chao hoi va cau rat ngan.", accent: "#16a34a", soft: "#ecfdf5" },
  hsk2: { label: "HSK2", description: "Giao tiep doi song, gia dinh, mua sam co ban.", accent: "#2563eb", soft: "#eef6ff" },
  hsk3: { label: "HSK3", description: "Mo rong ngu phap, sinh hoat va cong viec.", accent: "#7c3aed", soft: "#f5f3ff" },
  hsk4: { label: "HSK4", description: "Chu de xa hoi, hoc tap va quan diem ca nhan.", accent: "#ea580c", soft: "#fff7ed" },
  hsk5: { label: "HSK5", description: "Doc hieu dai, thanh ngu va bieu dat truu tuong.", accent: "#dc2626", soft: "#fef2f2" },
  hsk6: { label: "HSK6", description: "Ngon ngu hoc thuat, tin tuc va van phong nang cao.", accent: "#9333ea", soft: "#faf5ff" },
  communication: { label: "Giao tiep", description: "Tinh huong nghe noi thuc te ngoai khung HSK.", accent: "#0f766e", soft: "#f0fdfa" },
}

export const DEFAULT_TOPIC_DRAFT: TopicDraft = {
  title: "",
  levelId: "",
  description: "",
  coverUrl: "",
  icon: "book",
  order: 1,
  status: "draft",
  color: "#2563eb",
}

export const SAMPLE_SENTENCES: PracticeSentence[] = [
  { id: "sen-1", order: 1, sentenceVi: "Day la bo cua toi.", sentenceZh: "这是我的爸爸。", audioUrl: "/audio/example.mp3", modes: ["pronunciation", "dictation"] },
  { id: "sen-2", order: 2, sentenceVi: "Gia dinh ban co may nguoi?", sentenceZh: "你家有几口人？", modes: ["arrange", "reaction"] },
  { id: "sen-3", order: 3, sentenceVi: "Toi la hoc sinh.", sentenceZh: "我是学生。", modes: ["pronunciation"] },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "")
}

export function levelKey(level: AdminLevel | { name: string; slug?: string; order?: number }): HskLevelKey {
  const raw = normalize(`${level.slug || ""}${level.name || ""}`)
  if (raw.includes("hsk1") || level.order === 1) return "hsk1"
  if (raw.includes("hsk2") || level.order === 2) return "hsk2"
  if (raw.includes("hsk3") || level.order === 3) return "hsk3"
  if (raw.includes("hsk4") || level.order === 4) return "hsk4"
  if (raw.includes("hsk5") || level.order === 5) return "hsk5"
  if (raw.includes("hsk6") || level.order === 6) return "hsk6"
  return "communication"
}

export function getHskMeta(level: AdminLevel | { name: string; slug?: string; order?: number }) {
  return HSK_META[levelKey(level)]
}

export function makeTopicId() {
  return `topic-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildTopics(levels: AdminLevel[], lessons: AdminLesson[], localTopics: LessonTopic[]) {
  const topicsByLevel = new Map<string, LessonTopic[]>()
  for (const level of levels) topicsByLevel.set(level.id, [])
  for (const topic of localTopics) {
    const list = topicsByLevel.get(topic.levelId) || []
    list.push({ ...topic, lessons: [] })
    topicsByLevel.set(topic.levelId, list)
  }

  for (const level of levels) {
    const current = topicsByLevel.get(level.id) || []
    const unassignedLessons = lessons.filter((lesson) => lesson.levelId === level.id)
    if (unassignedLessons.length) {
      current.unshift({
        id: `unassigned-${level.id}`,
        levelId: level.id,
        title: "Chua phan chu de",
        description: "Cac bai hoc dang co trong he thong nhung chua co topic backend de gan chinh thuc.",
        icon: "list",
        order: 0,
        status: "draft",
        color: getHskMeta(level).accent,
        lessons: unassignedLessons.sort((a, b) => a.order - b.order),
      })
    }
    topicsByLevel.set(level.id, current.sort((a, b) => a.order - b.order))
  }
  return topicsByLevel
}

export function buildLevelSummaries(levels: AdminLevel[], lessons: AdminLesson[], topicsByLevel: Map<string, LessonTopic[]>): LevelSummary[] {
  return levels
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((level) => {
      const levelLessons = lessons.filter((lesson) => lesson.levelId === level.id)
      const topicCount = (topicsByLevel.get(level.id) || []).length
      return {
        level,
        key: levelKey(level),
        description: level.description || getHskMeta(level).description,
        topics: topicCount,
        lessons: levelLessons.length || level.lessonCount || 0,
        vocabulary: levelLessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0),
      }
    })
}

export function completionPercent(lesson: AdminLesson) {
  const info = lesson.title && lesson.description ? 20 : 10
  const vocabulary = Math.min(30, lesson.vocabularyCount * 2)
  const sentences = Math.min(20, lesson.sentenceCount * 3)
  const media = lesson.imageUrl ? 20 : 8
  return Math.min(100, info + vocabulary + sentences + media)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

export function slugify(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
