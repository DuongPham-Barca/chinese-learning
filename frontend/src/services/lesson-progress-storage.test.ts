import assert from "node:assert/strict"
import test from "node:test"
import {
  LEGACY_CLAIM_KEY,
  getLessonIdFromProgressKey,
  getProgressKey,
  getProgressScope,
  migrateLegacyProgress,
  type ProgressStorage,
} from "./lesson-progress-storage"

class MemoryStorage implements ProgressStorage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

test("progress keys isolate accounts and preserve lesson ids", () => {
  const firstScope = getProgressScope("user-a")
  const secondScope = getProgressScope("user-b")
  const firstKey = getProgressKey(firstScope, "lesson/1")

  assert.notEqual(firstKey, getProgressKey(secondScope, "lesson/1"))
  assert.equal(getLessonIdFromProgressKey(firstScope, firstKey), "lesson/1")
})

test("legacy progress is claimed once without overwriting scoped data", () => {
  const storage = new MemoryStorage()
  storage.setItem("lesson-progress-v2:lesson-1", '{"quiz":{"completed":1,"total":1}}')
  storage.setItem(getProgressKey(getProgressScope("user-a"), "lesson-1"), '{"existing":true}')

  assert.equal(migrateLegacyProgress(storage, "user-a"), 1)
  assert.equal(
    storage.getItem(getProgressKey(getProgressScope("user-a"), "lesson-1")),
    '{"existing":true}',
  )
  assert.equal(storage.getItem("lesson-progress-v2:lesson-1"), null)
  assert.equal(storage.getItem(LEGACY_CLAIM_KEY), "user-a")

  storage.setItem("lesson-progress-v2:lesson-2", '{"quiz":{"completed":1,"total":1}}')
  assert.equal(migrateLegacyProgress(storage, "user-b"), 0)
  assert.equal(storage.getItem("lesson-progress-v2:lesson-2") !== null, true)
})
