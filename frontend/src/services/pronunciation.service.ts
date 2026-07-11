import api from "@/lib/api"

export type PronunciationUnitStatus = "correct" | "needs_improvement" | "incorrect"

export type PronunciationUnitResult = {
  text: string
  expectedPinyin?: string
  detectedPinyin?: string
  score?: number
  status: PronunciationUnitStatus
  feedback?: string
}

export type PronunciationEvaluationResult = {
  overallScore: number
  transcript?: string
  pronunciationAccuracy?: number
  toneAccuracy?: number
  fluency?: number
  weakUnits: PronunciationUnitResult[]
  suggestion?: string
}

export type PronunciationEvaluation =
  | { status: "scored"; result: PronunciationEvaluationResult }
  | { status: "unavailable"; message: string }

type EvaluatePronunciationInput = {
  audio: Blob
  expectedText: string
  expectedPinyin?: string | null
  scope: "word" | "sentence"
}

const pronunciationApiPath = process.env.NEXT_PUBLIC_PRONUNCIATION_API_PATH

export async function evaluatePronunciation(input: EvaluatePronunciationInput): Promise<PronunciationEvaluation> {
  if (!pronunciationApiPath) {
    return {
      status: "unavailable",
      message: "Chức năng chấm phát âm đang được kết nối.",
    }
  }

  const formData = new FormData()
  formData.append("audio", input.audio)
  formData.append("expectedText", input.expectedText)
  formData.append("scope", input.scope)
  if (input.expectedPinyin) formData.append("expectedPinyin", input.expectedPinyin)

  // TODO: Align this payload with the real pronunciation scoring backend contract.
  const response = await api.post<PronunciationEvaluationResult>(pronunciationApiPath, formData)
  return { status: "scored", result: response.data }
}
