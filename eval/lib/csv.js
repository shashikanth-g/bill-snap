/**
 * Lightweight, dependency-free CSV parser and serializer.
 */

/**
 * Parses a CSV string into an array of objects keyed by header names.
 *
 * @param {string} text - Raw CSV content
 * @returns {Array<Object>} Array of row objects
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return []

  const rows = []
  let currentRow = []
  let currentField = ''
  let inQuotes = false

  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField.trim())
        currentField = ''
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        currentField = ''
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
      } else {
        currentField += char
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow)
    }
  }

  if (rows.length === 0) return []

  const headers = rows[0].map((h) => h.trim())
  const records = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const obj = {}
    headers.forEach((header, idx) => {
      obj[header] = row[idx] !== undefined ? row[idx] : ''
    })
    records.push(obj)
  }

  return records
}

/**
 * Serializes an array of objects or rows into a standard CSV string.
 *
 * @param {Array<Object>} records - Array of records
 * @param {Array<string>} [headers] - Optional explicit headers order
 * @returns {string} Formatted CSV string
 */
export function toCSV(records = [], headers = null) {
  if (!records || records.length === 0) {
    return headers ? headers.join(',') + '\n' : ''
  }

  const columnHeaders = headers || Object.keys(records[0])

  const escapeField = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const headerLine = columnHeaders.map(escapeField).join(',')
  const dataLines = records.map((record) =>
    columnHeaders.map((col) => escapeField(record[col])).join(',')
  )

  return [headerLine, ...dataLines].join('\n') + '\n'
}

