import { redirect } from "next/navigation"

export default async function LegacyLearnPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = await params
  redirect(`/lessons/${level}/${id}/flashcard`)
}
