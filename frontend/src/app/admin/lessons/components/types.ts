import type { AdminLesson, AdminLessonDetail, AdminVocabulary } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"

export type HskLevelKey = "hsk1" | "hsk2" | "hsk3" | "hsk4" | "hsk5" | "hsk6" | "communication"
export type PublishStatus = "published" | "draft"
export type ViewMode = "grid" | "table"
export type EditorTab = "basic" | "vocabulary" | "sentences" | "settings" | "preview"
export type ImportDataType = "lessons" | "vocabulary" | "sentences"
export type ImportStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type LessonTopic = {
  id: string
  levelId: string
  title: string
  description: string
  coverUrl?: string
  icon: string
  order: number
  status: PublishStatus
  color: string
  lessons: AdminLesson[]
}

export type LevelSummary = {
  level: AdminLevel
  key: HskLevelKey
  description: string
  topics: number
  lessons: number
  vocabulary: number
}

export type TopicDraft = {
  title: string
  levelId: string
  description: string
  coverUrl: string
  icon: string
  order: number
  status: PublishStatus
  color: string
}

export type LessonEditorTarget = {
  lesson: AdminLesson | null
  detail: AdminLessonDetail | null
  topicId: string
}

export type PracticeMode = "pronunciation" | "dictation" | "arrange" | "reaction"

export type PracticeSentence = {
  id: string
  order: number
  sentenceVi: string
  sentenceZh: string
  audioUrl?: string
  modes: PracticeMode[]
}

export type VocabularyLike = AdminVocabulary & {
  status?: "complete" | "missing-image" | "missing-audio" | "missing-example"
}

export type ImportPreviewRow = {
  id: string
  status: "valid" | "warning" | "error" | "duplicate"
  chinese?: string
  pinyin?: string
  vietnamese?: string
  sentenceVi?: string
  sentenceZh?: string
  issue: string
}
