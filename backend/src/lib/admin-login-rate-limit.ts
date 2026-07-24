const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5
const MAX_TRACKED_CLIENTS = 10_000

type Attempt = {
  failures: number
  resetAt: number
}

const attempts = new Map<string, Attempt>()

function cleanup(now: number) {
  for (const [key, attempt] of attempts) {
    if (attempt.resetAt <= now) attempts.delete(key)
  }

  if (attempts.size <= MAX_TRACKED_CLIENTS) return
  const overflow = attempts.size - MAX_TRACKED_CLIENTS
  for (const key of [...attempts.keys()].slice(0, overflow)) attempts.delete(key)
}

export function getAdminLoginLimit(key: string, now = Date.now()) {
  cleanup(now)
  const attempt = attempts.get(key)
  if (!attempt || attempt.failures < MAX_FAILURES) {
    return { blocked: false, retryAfterSeconds: 0 }
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
  }
}

export function recordAdminLoginFailure(key: string, now = Date.now()) {
  cleanup(now)
  const current = attempts.get(key)
  const next = !current || current.resetAt <= now
    ? { failures: 1, resetAt: now + ATTEMPT_WINDOW_MS }
    : { ...current, failures: current.failures + 1 }
  attempts.set(key, next)
  return getAdminLoginLimit(key, now)
}

export function clearAdminLoginFailures(key: string) {
  attempts.delete(key)
}

export function resetAdminLoginLimitsForTests() {
  attempts.clear()
}
