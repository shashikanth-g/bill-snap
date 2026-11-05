// TEMPORARY - remove in Prompt 4

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
const todayDate = now.getDate()

// Calculates a valid "YYYY-MM-DD" date falling within the current month
const getDateWithOffset = (offset) => {
  const day = Math.max(1, todayDate - offset)
  return `${currentYear}-${currentMonth}-${String(day).padStart(2, '0')}`
}

export const sampleBills = [
  {
    id: 'bill-1',
    merchant: 'Spice Route Kitchen',
    category: 'food',
    total: 1240,
    date: getDateWithOffset(0),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 0 * 86400000).toISOString(),
  },
  {
    id: 'bill-2',
    merchant: 'FreshBasket Market',
    category: 'groceries',
    total: 3865,
    date: getDateWithOffset(1),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
  },
  {
    id: 'bill-3',
    merchant: 'City Power Board',
    category: 'utilities',
    total: 2310,
    date: getDateWithOffset(2),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
  },
  {
    id: 'bill-4',
    merchant: 'Blue Bean Cafe',
    category: 'food',
    total: 380,
    date: getDateWithOffset(3),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
  },
  {
    id: 'bill-5',
    merchant: 'Quick Cab',
    category: 'transport',
    total: 260,
    date: getDateWithOffset(4),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
  },
  {
    id: 'bill-6',
    merchant: 'Metro Pharmacy',
    category: 'health',
    total: 486,
    date: getDateWithOffset(5),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
  },
  {
    id: 'bill-7',
    merchant: 'Urban Threads',
    category: 'shopping',
    total: 2799,
    date: getDateWithOffset(6),
    imageDataUrl: '',
    createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
  },
]

export default sampleBills

