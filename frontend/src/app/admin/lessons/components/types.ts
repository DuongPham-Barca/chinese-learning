import type { AdminLesson, AdminLessonDetail, AdminVocabulary } from "@/services/admin-lesson.service"
import type { AdminLevel } from "@/services/admin-level.service"

export type HskLevelKey = "hsk1" | "hsk2" | "hsk3" | "hsk4" | "hsk5" | "hsk6" | "communication"
export type PublishStatus = "published" | "draft"
export type ViewMode = "grid" | "table"
export type EditorTab = "basic" | "vocabulary" | "sentences" | "settings" | "preview"
export type ImportStep = 1 | 2 | 3 | 4 | 5 | 6

export type LevelSummary = {
  level: AdminLevel
  key: HskLevelKey
  description: string
  lessons: number
  vocabulary: number
}

export type LessonEditorTarget = {
  lesson: AdminLesson | null
  detail: AdminLessonDetail | null
}

export type PracticeMode = "speaking" | "dictation" | "arrange" | "reaction"

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
