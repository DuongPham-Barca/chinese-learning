export function addCalendarMonthsClamped(date: Date, months: number): Date {
  if (!Number.isInteger(months)) throw new TypeError('months must be an integer')

  const next = new Date(date)
  const originalDay = next.getUTCDate()
  next.setUTCDate(1)
  next.setUTCMonth(next.getUTCMonth() + months)

  const lastDayOfTargetMonth = new Date(Date.UTC(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    0,
  )).getUTCDate()
  next.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth))
  return next
}
