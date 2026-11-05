/**
 * Pure helper functions for calculating monthly spending insights.
 */

/**
 * Calculates spending statistics for a specific year and month.
 *
 * @param {Array} bills - Array of bill objects
 * @param {number} year - 4-digit year (e.g. 2026)
 * @param {number} month - 1-based month (1 to 12)
 * @returns {Object} { total, count, average, biggest, byCategory }
 */
export function monthStats(bills = [], year, month) {
  const targetPrefix = `${year}-${String(month).padStart(2, '0')}`

  const monthBills = (bills || []).filter(
    (b) => typeof b.date === 'string' && b.date.startsWith(targetPrefix)
  )

  let total = 0
  let biggest = null
  const catMap = {}

  monthBills.forEach((b) => {
    const amount = typeof b.total === 'number' && Number.isFinite(b.total) ? b.total : 0
    total += amount

    if (!biggest || amount > biggest.total) {
      biggest = b
    }

    const catKey = (b.category || 'other').toLowerCase()
    if (!catMap[catKey]) {
      catMap[catKey] = { category: catKey, total: 0, count: 0 }
    }
    catMap[catKey].total += amount
    catMap[catKey].count += 1
  })

  const count = monthBills.length
  const average = count > 0 ? Math.round(total / count) : 0

  // Format byCategory: only categories with spending, sorted highest to lowest
  const byCategory = Object.values(catMap)
    .filter((c) => c.total > 0)
    .map((c) => ({
      category: c.category,
      total: c.total,
      count: c.count,
      percent: total > 0 ? Math.round((c.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  return {
    total,
    count,
    average,
    biggest: count > 0 ? biggest : null,
    byCategory,
  }
}

/**
 * Calculates percentage change in total spending versus the previous month.
 *
 * @param {Array} bills - Array of bill records
 * @param {number} year - 4-digit year
 * @param {number} month - 1-based month (1 to 12)
 * @returns {number|null} Whole percentage change (e.g. 12 or -8), or null if no previous bills
 */
export function changeVsPrevious(bills = [], year, month) {
  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1

  const currentStats = monthStats(bills, year, month)
  const prevStats = monthStats(bills, prevYear, prevMonth)

  // Return null if previous month has no bills or zero spending
  if (prevStats.count === 0 || prevStats.total === 0) {
    return null
  }

  const change = ((currentStats.total - prevStats.total) / prevStats.total) * 100
  return Math.round(change)
}

/**
 * Finds the earliest year and month with recorded bills, or current month if empty.
 *
 * @param {Array} bills - Array of bill records
 * @returns {Object} { year, month } (1-based month)
 */
export function earliestMonth(bills = []) {
  const now = new Date()
  const fallback = { year: now.getFullYear(), month: now.getMonth() + 1 }

  if (!bills || bills.length === 0) {
    return fallback
  }

  // Find oldest date
  let oldestDateStr = null
  bills.forEach((b) => {
    if (typeof b.date === 'string' && /^\d{4}-\d{2}/.test(b.date)) {
      if (!oldestDateStr || b.date < oldestDateStr) {
        oldestDateStr = b.date
      }
    }
  })

  if (!oldestDateStr) return fallback

  const [yStr, mStr] = oldestDateStr.split('-')
  const y = parseInt(yStr, 10)
  const m = parseInt(mStr, 10)

  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
    return fallback
  }

  return { year: y, month: m }
}

