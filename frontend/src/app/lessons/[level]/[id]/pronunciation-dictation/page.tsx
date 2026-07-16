import { redirect } from "next/navigation"

export default async function LegacyPronunciationDictationPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = await params
  redirect(`/lessons/${level}/${id}/speaking`)
}
