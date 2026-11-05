import { UNSURE_BELOW, DATE_MAX_AGE_DAYS, BIG_AMOUNT } from './config'

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

  let merchantState = 'ok'
  let merchantHint = null

  if (!merchantVal) {
    merchantState = 'unsure'
    merchantHint = "We couldn't read this. Please type it in."
  } else if (merchantConf < UNSURE_BELOW) {
    merchantState = 'unsure'
    merchantHint = 'Not sure about this one. Please check.'
  }

  // 2. Date evaluation
  const rawDate = analysis?.date
  const dateVal = rawDate?.value ? String(rawDate.value).trim() : null
  const dateConf = typeof rawDate?.confidence === 'number' ? rawDate.confidence : 0

  let dateState = 'ok'
  let dateHint = null

  if (!dateVal) {
    dateState = 'unsure'
    dateHint = "We couldn't read this. Please type it in."
  } else {
    const parsedDate = new Date(`${dateVal}T00:00:00`)
    const isValidDate = !Number.isNaN(parsedDate.getTime())

    if (isValidDate) {
      const diffDays = (refDate.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
      if (parsedDate > refDate || diffDays > DATE_MAX_AGE_DAYS) {
        dateState = 'unsure'
        dateHint = 'This date looks far from today. Please check.'
      } else if (dateConf < UNSURE_BELOW) {
        dateState = 'unsure'
        dateHint = 'Check the day and month.'
      }
    } else {
      dateState = 'unsure'
      dateHint = 'Not sure about this one. Please check.'
    }
  }

  // 3. Total evaluation
  const rawTotal = analysis?.total
  const totalVal = typeof rawTotal?.value === 'number' && Number.isFinite(rawTotal.value) ? rawTotal.value : null
  const totalConf = typeof rawTotal?.confidence === 'number' ? rawTotal.confidence : 0

  let totalState = 'ok'
  let totalHint = null

  if (totalVal === null) {
    totalState = 'unsure'
    totalHint = "We couldn't read this. Please type it in."
  } else if (totalVal === 0 || totalVal > BIG_AMOUNT) {
    totalState = 'unsure'
    totalHint = 'This amount looks unusual. Please check.'
  } else if (totalConf < UNSURE_BELOW) {
    totalState = 'unsure'
    totalHint = 'Not sure about this one. Please check.'
  }

  // 4. Category evaluation
  const rawCategory = analysis?.category
  const categoryVal = rawCategory?.value ? String(rawCategory.value).toLowerCase() : null
  const categoryConf = typeof rawCategory?.confidence === 'number' ? rawCategory.confidence : 0

  let categoryState = 'ok'
  let categoryHint = null

  if (!categoryVal) {
    categoryState = 'unsure'
    categoryHint = "We couldn't read this. Please type it in."
  } else if (categoryConf < UNSURE_BELOW) {
    categoryState = 'unsure'
    categoryHint = 'Suggested, but not sure. Pick one.'
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

