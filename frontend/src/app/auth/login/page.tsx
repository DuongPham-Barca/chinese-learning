import { redirect } from "next/navigation"

export default async function AuthLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login")
}
