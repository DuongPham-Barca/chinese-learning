import { redirect } from "next/navigation"

export default async function LegacyPracticePage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = await params
  redirect(`/lessons/${level}/${id}/dictation`)
}
