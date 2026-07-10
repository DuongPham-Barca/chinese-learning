export interface AuthUser {
  id: string
  username: string
  email: string | null
  avatarUrl: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: string
  country: string
  level: string
  learningGoal: string
  dailyTarget: number
  expPoints: number
  isPremium: boolean
  subscriptionUntil: string | null
  plan: "2months" | "6months" | "12months" | null
}

export interface LeaderboardUser {
  id: string
  username: string
  avatarUrl: string | null
  level: string
  expPoints: number
}

export interface LessonSummary {
  id: string
  levelType: string
  lessonOrder: number
  title: string
  isFree: boolean
  isLocked: boolean
  _count: {
    vocabulary: number
    sentences: number
  }
}

export interface Vocabulary {
  id: string
  lessonId: string
  hanzi: string
  pinyin: string
  meaningVi: string
  example?: string | null
  examplePinyin?: string | null
  exampleMeaning?: string | null
  audioUrl: string | null
}

export interface Sentence {
  id: string
  lessonId: string
  sentenceVi: string
  sentenceZh: string
  audioUrl: string | null
}

export interface LessonDetail {
  id: string
  levelType: string
  lessonOrder: number
  title: string
  isFree: boolean
  vocabulary: Vocabulary[]
  sentences: Sentence[]
}
