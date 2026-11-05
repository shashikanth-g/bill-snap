// Summary calculation for the hero card

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Bar segment colours specified in prompt
const getSegmentColor = (categoryKey) => {
  const key = String(categoryKey).toLowerCase()
  if (key === 'food') return '#FDBA74'
  if (key === 'groceries') return '#86EFAC'
  if (key === 'utilities') return '#93C5FD'
  return '#E0E7FF' // Everything else
}

const getCategoryName = (categoryKey) => {
  const key = String(categoryKey).toLowerCase()
  const names = {
    food: 'Food',
    groceries: 'Groceries',
    utilities: 'Utilities',
    shopping: 'Shopping',
    health: 'Health',
    transport: 'Transport',
    other: 'Other',
  }
  return names[key] || (key.charAt(0).toUpperCase() + key.slice(1))
}

/**
 * Summarizes bills for the current month.
 * Returns { monthLabel, total, count, segments }
 */
export function summarize(bills = []) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthIdx = now.getMonth()
  const monthLabel = MONTH_NAMES[currentMonthIdx]

  // Filter bills strictly in current calendar month
  const currentMonthBills = bills.filter((bill) => {
    if (!bill || !bill.date) return false
    const parts = bill.date.split('T')[0].split('-')
    if (parts.length < 2) return false
    const bYear = parseInt(parts[0], 10)
    const bMonth = parseInt(parts[1], 10) - 1
    return bYear === currentYear && bMonth === currentMonthIdx
  })

  const total = currentMonthBills.reduce((sum, bill) => sum + (Number(bill.total) || 0), 0)
  const count = currentMonthBills.length

  if (count === 0) {
    return {
      monthLabel,
      total: 0,
      count: 0,
      segments: [],
    }
  }

  // Aggregate by category
  const categoryMap = {}
  for (const bill of currentMonthBills) {
    const cat = (bill.category || 'other').toLowerCase()
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(bill.total) || 0)
  }

  // Sort high to low
  const sorted = Object.entries(categoryMap)
    .map(([catKey, catTotal]) => ({
      key: catKey,
      name: getCategoryName(catKey),
      total: catTotal,
      color: getSegmentColor(catKey),
    }))
    .sort((a, b) => b.total - a.total)

  // Keep top 3 and merge rest into "Other"
  let segments = []
  if (sorted.length <= 3) {
    segments = sorted
  } else {
    const top3 = sorted.slice(0, 3)
    const rest = sorted.slice(3)
    const restTotal = rest.reduce((sum, item) => sum + item.total, 0)
    segments = [
      ...top3,
      {
        key: 'other',
        name: 'Other',
        total: restTotal,
        color: '#E0E7FF',
      },
    ]
  }

  return {
    monthLabel,
    total,
    count,
    segments,
  }
}

export default summarize

