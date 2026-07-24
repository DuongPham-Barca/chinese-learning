import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearAdminLoginFailures,
  getAdminLoginLimit,
  recordAdminLoginFailure,
  resetAdminLoginLimitsForTests,
} from './admin-login-rate-limit'

test('blocks after five failures and expires after the window', () => {
  resetAdminLoginLimitsForTests()
  const now = 1_000
  for (let index = 0; index < 4; index += 1) {
    assert.equal(recordAdminLoginFailure('client', now).blocked, false)
  }
  assert.equal(recordAdminLoginFailure('client', now).blocked, true)
  assert.equal(getAdminLoginLimit('client', now + 15 * 60 * 1000).blocked, false)
})

test('successful login clears failures', () => {
  resetAdminLoginLimitsForTests()
  recordAdminLoginFailure('client')
  clearAdminLoginFailures('client')
  assert.equal(getAdminLoginLimit('client').blocked, false)
})
