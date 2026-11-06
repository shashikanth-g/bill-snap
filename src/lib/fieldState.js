import { UNSURE_BELOW, DATE_MAX_AGE_DAYS, BIG_AMOUNT } from './config.js'

/**
 * Checks whether an extracted field is flagged as unsure by app heuristic rules:
 * - Missing / null / empty value
 * - Invalid, future, or older than DATE_MAX_AGE_DAYS date
 * - Total non-finite, equal to 0, or greater than BIG_AMOUNT
 *
 * @param {string} fieldName - 'merchant' | 'date' | 'total' | 'category'
 * @param {any} value - Field value
 * @param {Date|string} [today=new Date()] - Reference date
 * @returns {boolean} True if flagged by rules, false otherwise
 */
export function isFieldUnsureByRules(fieldName, value, today = new Date()) {
  // 1. Missing or empty value
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true

  // 2. Total-specific validations
  if (fieldName === 'total') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return true
    if (value === 0 || value > BIG_AMOUNT) return true
  }

  // 3. Date-specific validations
  if (fieldName === 'date') {
    const dateStr = String(value).trim()
    const parsedDate = new Date(`${dateStr}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) return true

    const refDate = today instanceof Date ? new Date(today) : new Date(today)
    refDate.setHours(0, 0, 0, 0)
    const diffDays = (refDate.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (parsedDate > refDate || diffDays > DATE_MAX_AGE_DAYS) return true
  }

  return false
}

/**
 * Pure decision function that determines whether a single extracted field is unsure.
 * Combines app heuristic rules with the AI confidence threshold check.
 *
 * @param {string} fieldName - 'merchant' | 'date' | 'total' | 'category'
 * @param {any} value - Field value
 * @param {number} [confidence=0] - Confidence score (0.0 to 1.0)
 * @param {number} [threshold=UNSURE_BELOW] - Confidence threshold
 * @param {Date|string} [today=new Date()] - Reference date
 * @returns {boolean} True if unsure, false if ok
 */
export function isFieldUnsure(
  fieldName,
  value,
  confidence = 0,
  threshold = UNSURE_BELOW,
  today = new Date()
) {
  if (isFieldUnsureByRules(fieldName, value, today)) return true

  const conf = typeof confidence === 'number' ? confidence : 0
  if (conf < threshold) return true

  return false
}

/**
 * Pure evaluation function that assesses extracted field values and confidence scores.
 * Determines whether each field is "ok" or "unsure", along with an explanation hint.
 *
 * @param {Object} analysis - AI extracted result object containing merchant, date, total, category
 * @param {Date|string} [today=new Date()] - Reference date for age calculations
 * @returns {Object} Object with evaluated merchant, date, total, and category states
 */
export function evaluateFields(analysis = {}, today = new Date()) {
  const refDate = today instanceof Date ? new Date(today) : new Date(today)
  refDate.setHours(0, 0, 0, 0)

  // 1. Merchant evaluation
  const rawMerchant = analysis?.merchant
  const merchantVal = rawMerchant?.value != null ? String(rawMerchant.value).trim() : null
  const merchantConf = typeof rawMerchant?.confidence === 'number' ? rawMerchant.confidence : 0

  const merchantUnsure = isFieldUnsure('merchant', merchantVal, merchantConf, UNSURE_BELOW, refDate)
  let merchantState = merchantUnsure ? 'unsure' : 'ok'
  let merchantHint = null

  if (merchantUnsure) {
    merchantHint = !merchantVal
      ? "We couldn't read this. Please type it in."
      : 'Not sure about this one. Please check.'
  }

  // 2. Date evaluation
  const rawDate = analysis?.date
  const dateVal = rawDate?.value ? String(rawDate.value).trim() : null
  const dateConf = typeof rawDate?.confidence === 'number' ? rawDate.confidence : 0

  const dateUnsure = isFieldUnsure('date', dateVal, dateConf, UNSURE_BELOW, refDate)
  let dateState = dateUnsure ? 'unsure' : 'ok'
  let dateHint = null

  if (dateUnsure) {
    if (!dateVal) {
      dateHint = "We couldn't read this. Please type it in."
    } else {
      const parsedDate = new Date(`${dateVal}T00:00:00`)
      if (Number.isNaN(parsedDate.getTime())) {
        dateHint = 'Not sure about this one. Please check.'
      } else {
        const diffDays = (refDate.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
        if (parsedDate > refDate || diffDays > DATE_MAX_AGE_DAYS) {
          dateHint = 'This date looks far from today. Please check.'
        } else {
          dateHint = 'Check the day and month.'
        }
      }
    }
  }

  // 3. Total evaluation
  const rawTotal = analysis?.total
  const totalVal =
    typeof rawTotal?.value === 'number' && Number.isFinite(rawTotal.value) ? rawTotal.value : null
  const totalConf = typeof rawTotal?.confidence === 'number' ? rawTotal.confidence : 0

  const totalUnsure = isFieldUnsure('total', totalVal, totalConf, UNSURE_BELOW, refDate)
  let totalState = totalUnsure ? 'unsure' : 'ok'
  let totalHint = null

  if (totalUnsure) {
    if (totalVal === null) {
      totalHint = "We couldn't read this. Please type it in."
    } else if (totalVal === 0 || totalVal > BIG_AMOUNT) {
      totalHint = 'This amount looks unusual. Please check.'
    } else {
      totalHint = 'Not sure about this one. Please check.'
    }
  }

  // 4. Category evaluation
  const rawCategory = analysis?.category
  const categoryVal = rawCategory?.value ? String(rawCategory.value).toLowerCase() : null
  const categoryConf = typeof rawCategory?.confidence === 'number' ? rawCategory.confidence : 0

  const categoryUnsure = isFieldUnsure('category', categoryVal, categoryConf, UNSURE_BELOW, refDate)
  let categoryState = categoryUnsure ? 'unsure' : 'ok'
  let categoryHint = null

  if (categoryUnsure) {
    categoryHint = !categoryVal
      ? "We couldn't read this. Please type it in."
      : 'Suggested, but not sure. Pick one.'
  }

  return {
    merchant: {
      value: merchantVal,
      confidence: merchantConf,
      state: merchantState,
      hint: merchantHint,
    },
    date: {
      value: dateVal,
      confidence: dateConf,
      state: dateState,
      hint: dateHint,
    },
    total: {
      value: totalVal,
      confidence: totalConf,
      state: totalState,
      hint: totalHint,
    },
    category: {
      value: categoryVal || 'other',
      confidence: categoryConf,
      state: categoryState,
      hint: categoryHint,
    },
  }
}
