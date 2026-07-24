import assert from 'node:assert/strict'
import test from 'node:test'
import { addCalendarMonthsClamped } from './date'

test('clamps January 31 to the last day of February', () => {
  assert.equal(
    addCalendarMonthsClamped(new Date('2025-01-31T09:30:45.000Z'), 1).toISOString(),
    '2025-02-28T09:30:45.000Z',
  )
})

test('clamps leap day when adding a year', () => {
  assert.equal(
    addCalendarMonthsClamped(new Date('2024-02-29T23:15:00.000Z'), 12).toISOString(),
    '2025-02-28T23:15:00.000Z',
  )
})

test('clamps a six-month extension and preserves its time', () => {
  assert.equal(
    addCalendarMonthsClamped(new Date('2025-08-31T12:00:00.000Z'), 6).toISOString(),
    '2026-02-28T12:00:00.000Z',
  )
})
