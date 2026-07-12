import type { SharedIconName } from "@/components/shared-icon"
import type { LessonModuleId } from "@/services/lesson-progress.service"
import type { LessonDetail } from "@/types/api"

export type LearningModuleStatus = "active" | "coming_soon"

export type LearningModule = {
  id: LessonModuleId
  title: string
  description: string
  checklist: string[]
  duration: string
  href: string
  icon: SharedIconName
  image: string
  status: LearningModuleStatus
  totalItems: number
}

function minutes(_value: number) { return "" }

export function getLearningModules(lesson: LessonDetail, level: string): LearningModule[] {
  const wordCount = lesson.vocabulary.length
  const sentenceCount = lesson.sentences.length
  const exampleCount = lesson.vocabulary.filter((item) => item.example).length
  const quizCount = exampleCount >= 2 ? exampleCount * 4 : 0
  const baseHref = `/lessons/${level}/${lesson.id}`

  return [
    {
      id: "flashcard",
      title: "Thẻ từ vựng & Phát âm",
      description: "Học từ mới và nghe phát âm mẫu từng từ.",
      checklist: [
        "Chữ Hán, pinyin và nghĩa tiếng Việt",
        "Nghe audio phát âm mẫu",
        "Câu ví dụ và ngữ cảnh sử dụng",
      ],
      duration: minutes(wordCount),
      href: `${baseHref}/flashcard`,
      icon: "layers",
      image: "/lesson-flashcard.png",
      status: "active",
      totalItems: wordCount,
    },
    {
      id: "dictation",
      title: "Nghe chép",
      description: "Nghe từ hoặc câu tiếng Trung và nhập lại bằng chữ Hán.",
      checklist: [
        "Nghe audio tiếng Trung",
        "Nhập chữ Hán",
        "So sánh và sửa lỗi",
      ],
      duration: minutes(Math.ceil(exampleCount * 1.5)),
      href: `${baseHref}/dictation`,
      icon: "headphones",
      image: "/lesson-dictation.png",
      status: "active",
      totalItems: exampleCount,
    },
    {
      id: "word-arrangement",
      title: "Sắp xếp câu",
      description: "Sắp xếp các từ thành câu tiếng Trung hoàn chỉnh.",
      checklist: [
        "Kéo thả hoặc bấm chọn từ",
        "Kiểm tra trật tự câu",
        "Hiển thị đáp án và giải thích",
      ],
      duration: minutes(exampleCount),
      href: `${baseHref}/word-arrangement`,
      icon: "keyboard",
      image: "/lesson-flashcard.png",
      status: "active",
      totalItems: exampleCount,
    },
    {
      id: "reflex",
      title: "Phản xạ",
      description: "Dịch câu tiếng Việt sang tiếng Trung để rèn phản xạ.",
      checklist: [
        "Dịch Việt sang Trung",
        "Kiểm tra đáp án",
        "Xem giải thích",
      ],
      duration: minutes(exampleCount),
      href: `${baseHref}/reflex`,
      icon: "translate",
      image: "/lesson-dictation.png",
      status: "active",
      totalItems: exampleCount,
    },
    {
      id: "speaking",
      title: "Luyện nói",
      description: "Đọc câu tiếng Trung và nhận điểm phát âm.",
      checklist: [
        "Nghe câu tiếng Trung mẫu",
        "Ghi âm và chấm phát âm",
        "Nhận phản hồi từng chữ",
      ],
      duration: minutes(exampleCount * 1.5),
      href: `${baseHref}/speaking`,
      icon: "mic",
      image: "/lesson-dictation.png",
      status: "active",
      totalItems: exampleCount,
    },
    {
      id: "quiz",
      title: "Trắc nghiệm",
      description: "Ôn tập tổng hợp từ vựng, nghĩa và cấu trúc câu.",
      checklist: [
        "Chọn nghĩa đúng",
        "Chọn câu đúng",
        "Xem kết quả cuối bài",
      ],
      duration: minutes(Math.ceil((wordCount + sentenceCount) * 0.8)),
      href: `${baseHref}/quiz`,
      icon: "target",
      image: "/lesson-flashcard.png",
      status: "active",
      totalItems: quizCount,
    },
  ]
}

export const lessonProgressSteps = [
  "Thẻ từ vựng & Phát âm",
  "Nghe chép",
  "Sắp xếp câu",
  "Phản xạ",
  "Luyện nói",
  "Trắc nghiệm",
]
