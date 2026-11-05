// Formatting utilities for currency, dates, and greetings

/**
 * Formats a number in Indian Rupees (INR) with no decimals unless paise exist.
 * Example: 1240 -> "₹1,240", 1240.5 -> "₹1,240.50"
 */
export function formatINR(n) {
  const num = Number(n) || 0
  const hasPaise = num % 1 !== 0

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(num)
}

/**
 * Formats a date string to short format like "3 Nov".
 */
export function formatShortDate(iso) {
  if (!iso) return ''

  // Split YYYY-MM-DD cleanly to avoid timezone shifting
  const dateParts = iso.split('T')[0].split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (dateParts.length === 3) {
    const monthIndex = parseInt(dateParts[1], 10) - 1
    const day = parseInt(dateParts[2], 10)
    return `${day} ${months[monthIndex]}`
  }

  const d = new Date(iso)
  return `${d.getDate()} ${months[d.getMonth()]}`
}

/**
 * Formats a date string to long format like "3 November 2026".
 */
export function formatLongDate(iso) {
  if (!iso) return ''

  const dateParts = iso.split('T')[0].split('-')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (dateParts.length === 3) {
    const year = dateParts[0]
    const monthIndex = parseInt(dateParts[1], 10) - 1
    const day = parseInt(dateParts[2], 10)
    return `${day} ${months[monthIndex]} ${year}`
  }

  const d = new Date(iso)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Returns greeting based on current local hour.
 */
export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

