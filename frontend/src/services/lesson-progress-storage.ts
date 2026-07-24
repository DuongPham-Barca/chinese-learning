export const LEGACY_PROGRESS_PREFIX = "lesson-progress-v2:"
export const PROGRESS_PREFIX = "lesson-progress-v3:"
export const LEGACY_CLAIM_KEY = "lesson-progress-v3:legacy-claimed"
export const GUEST_PROGRESS_SCOPE = "guest"

export interface ProgressStorage {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function getProgressScope(userId: string | null) {
  return userId ? `user:${userId}` : GUEST_PROGRESS_SCOPE
}

export function getProgressPrefix(scope: string) {
  return `${PROGRESS_PREFIX}${encodeURIComponent(scope)}:`
}

export function getProgressKey(scope: string, lessonId: string) {
  return `${getProgressPrefix(scope)}${encodeURIComponent(lessonId)}`
}

export function getLessonIdFromProgressKey(scope: string, key: string) {
  const prefix = getProgressPrefix(scope)
  if (!key.startsWith(prefix)) return null

  try {
    return decodeURIComponent(key.slice(prefix.length))
  } catch {
    return null
  }
}

export function listKeys(storage: ProgressStorage) {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key) keys.push(key)
  }
  return keys
}

export function migrateLegacyProgress(storage: ProgressStorage, userId: string) {
  if (storage.getItem(LEGACY_CLAIM_KEY)) return 0

  const scope = getProgressScope(userId)
  const legacyKeys = listKeys(storage).filter((key) => key.startsWith(LEGACY_PROGRESS_PREFIX))
  let migrated = 0

  for (const legacyKey of legacyKeys) {
    const lessonId = legacyKey.slice(LEGACY_PROGRESS_PREFIX.length)
    const raw = storage.getItem(legacyKey)
    if (!lessonId || !raw) continue

    const scopedKey = getProgressKey(scope, lessonId)
    if (!storage.getItem(scopedKey)) storage.setItem(scopedKey, raw)
    storage.removeItem(legacyKey)
    migrated += 1
  }

  storage.setItem(LEGACY_CLAIM_KEY, userId)
  return migrated
}
