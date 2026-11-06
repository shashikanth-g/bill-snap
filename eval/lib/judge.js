import { UNSURE_BELOW, DATE_MAX_AGE_DAYS, BIG_AMOUNT } from '../../src/lib/config.js'

/**
 * Computes standard Levenshtein edit distance between two strings.
 */
export function levenshteinDistance(s1 = '', s2 = '') {
  const m = s1.length
  const n = s2.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Computes Levenshtein similarity ratio between 0.0 and 1.0.
 */
export function levenshteinSimilarity(s1 = '', s2 = '') {
  if (s1 === s2) return 1
  const maxLen = Math.max(s1.length, s2.length)
  if (maxLen === 0) return 1
  const dist = levenshteinDistance(s1, s2)
  return 1 - dist / maxLen
}

/**
 * Normalizes merchant string: lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeMerchant(str = '') {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Evaluates merchant prediction against ground truth.
 * Rules:
 * 1. Exact match normalized
 * 2. Substring match (either contains the other, min length 3)
 * 3. Levenshtein similarity ratio >= 0.8
 */
export function judgeMerchant(pred, truth) {
  const p = normalizeMerchant(pred)
  const t = normalizeMerchant(truth)

  if (!p && !t) return true
  if (!p || !t) return false
  if (p === t) return true
  if (p.length >= 3 && t.length >= 3 && (p.includes(t) || t.includes(p))) return true

  return levenshteinSimilarity(p, t) >= 0.8
}

/**
 * Evaluates date prediction: exact YYYY-MM-DD match.
 */
export function judgeDate(pred, truth) {
  const p = String(pred || '').trim()
  const t = String(truth || '').trim()
  if (!p || !t) return false
  return p === t
}

/**
 * Evaluates total prediction: within 1.0 Rupee difference.
 */
export function judgeTotal(pred, truth) {
  if (pred === null || pred === undefined || truth === null || truth === undefined) return false
  const p = typeof pred === 'number' ? pred : parseFloat(String(pred).replace(/[^0-9.]/g, ''))
  const t = typeof truth === 'number' ? truth : parseFloat(String(truth).replace(/[^0-9.]/g, ''))

  if (Number.isNaN(p) || Number.isNaN(t)) return false
  return Math.abs(p - t) <= 1.0
}

/**
 * Evaluates category prediction: exact match (case-insensitive).
 */
export function judgeCategory(pred, truth) {
  const p = String(pred || '').trim().toLowerCase()
  const t = String(truth || '').trim().toLowerCase()
  if (!p || !t) return false
  return p === t
}

/**
 * Determines whether a field is marked "unsure" under a given confidence threshold.
 */
export function isFieldUnsure(field, value, confidence, threshold = UNSURE_BELOW, today = new Date()) {
  if (value === null || value === undefined || value === '') return true
  if (typeof confidence === 'number' && confidence < threshold) return true

  if (field === 'date') {
    const refDate = today instanceof Date ? new Date(today) : new Date(today)
    refDate.setHours(0, 0, 0, 0)
    const parsedDate = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) return true
    const diffDays = (refDate.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (parsedDate > refDate || diffDays > DATE_MAX_AGE_DAYS) return true
  }

  if (field === 'total') {
    const num = Number(value)
    if (Number.isNaN(num) || num <= 0 || num > BIG_AMOUNT) return true
  }

  return false
}

/**
 * Judges a single image prediction against ground truth and optional overrides.
 */
export function judgeRecord({ truth, prediction, overrides = {}, threshold = UNSURE_BELOW, today = new Date() }) {
  const file = truth.file
  const condition = truth.condition || ''
  const truthIsBill = String(truth.is_bill || '').trim().toLowerCase() === 'yes'
  const predIsBill = Boolean(prediction?.is_bill)

  // 1. Detection judgement
  let detectionStatus = 'OK'
  let detectionType = 'TN' // TP, TN, FP, FN

  if (truthIsBill && predIsBill) {
    detectionType = 'TP'
    detectionStatus = 'OK'
  } else if (!truthIsBill && !predIsBill) {
    detectionType = 'TN'
    detectionStatus = 'OK'
  } else if (!truthIsBill && predIsBill) {
    detectionType = 'FP'
    detectionStatus = 'WRONG'
  } else if (truthIsBill && !predIsBill) {
    detectionType = 'FN'
    detectionStatus = 'WRONG'
  }

  // Check manual override for detection if present
  const detOverrideKey = `${file}:is_bill`
  if (overrides[detOverrideKey]) {
    const overrideCorrect = overrides[detOverrideKey].trim().toLowerCase() === 'correct'
    detectionStatus = overrideCorrect ? 'OK' : 'WRONG'
  }

  const fields = ['merchant', 'date', 'total', 'category']
  const judgedFields = {}

  if (!truthIsBill) {
    // Non-bill ground truth: fields are not applicable
    fields.forEach((f) => {
      judgedFields[f] = {
        truthVal: truth[f] || '',
        predVal: prediction?.[f]?.value ?? null,
        confidence: prediction?.[f]?.confidence ?? 0,
        status: 'n/a',
        isCorrect: null,
        isUnsure: false,
        overridden: false,
        honestyCategory: 'n/a',
      }
    })
  } else if (!predIsBill) {
    // True bill missed by the model (FN): all fields scored WRONG
    fields.forEach((f) => {
      judgedFields[f] = {
        truthVal: truth[f] || '',
        predVal: null,
        confidence: 0,
        status: 'WRONG (0.00)',
        isCorrect: false,
        isUnsure: false,
        overridden: false,
        honestyCategory: 'missed_bill',
      }
    })
  } else {
    // True bill detected: evaluate all fields
    fields.forEach((f) => {
      const truthVal = truth[f] ?? ''
      const rawPred = prediction?.[f]
      const predVal = rawPred?.value ?? null
      const confidence = typeof rawPred?.confidence === 'number' ? rawPred.confidence : 0

      let correct = false
      if (f === 'merchant') correct = judgeMerchant(predVal, truthVal)
      else if (f === 'date') correct = judgeDate(predVal, truthVal)
      else if (f === 'total') correct = judgeTotal(predVal, truthVal)
      else if (f === 'category') correct = judgeCategory(predVal, truthVal)

      // Apply manual override if specified
      const overrideKey = `${file}:${f}`
      let overridden = false
      if (overrides[overrideKey]) {
        correct = overrides[overrideKey].trim().toLowerCase() === 'correct'
        overridden = true
      }

      const unsure = isFieldUnsure(f, predVal, confidence, threshold, today)

      // Confidence Honesty classification
      let honestyCategory = 'correct_confident'
      if (correct) {
        honestyCategory = unsure ? 'unnecessary_flag' : 'correct_confident'
      } else {
        honestyCategory = unsure ? 'caught_error' : 'silent_error'
      }

      const confStr = confidence.toFixed(2)
      let statusStr = ''
      if (correct) {
        statusStr = `OK (${confStr})`
      } else {
        statusStr = unsure ? `WRONG (${confStr}) (unsure flag)` : `WRONG (${confStr})`
      }

      judgedFields[f] = {
        truthVal,
        predVal,
        confidence,
        status: statusStr,
        isCorrect: correct,
        isUnsure: unsure,
        overridden,
        honestyCategory,
      }
    })
  }

  return {
    file,
    condition,
    truthIsBill,
    predIsBill,
    detectionType,
    detectionStatus,
    fields: judgedFields,
    ms: prediction?._meta?.ms ?? null,
  }
}

/**
 * Judges an array of ground truth rows against prediction results.
 */
export function judgeAll({ groundTruths = [], predictions = {}, overrides = {}, threshold = UNSURE_BELOW, today = new Date() }) {
  const records = groundTruths.map((gt) => {
    const pred = predictions[gt.file] || null
    return judgeRecord({
      truth: gt,
      prediction: pred,
      overrides,
      threshold,
      today,
    })
  })

  // Compute summary metrics
  const totalImages = records.length
  const trueBills = records.filter((r) => r.truthIsBill)
  const trueNonBills = records.filter((r) => !r.truthIsBill)

  const tp = records.filter((r) => r.detectionType === 'TP').length
  const tn = records.filter((r) => r.detectionType === 'TN').length
  const fp = records.filter((r) => r.detectionType === 'FP').length
  const fn = records.filter((r) => r.detectionType === 'FN').length

  const detectionAccuracy = totalImages > 0 ? ((tp + tn) / totalImages) * 100 : 0

  // Field stats over True Bills
  const fieldNames = ['merchant', 'date', 'total', 'category']
  const fieldStatsAllTrueBills = {}
  const fieldStatsDetectedBillsOnly = {}

  const detectedBills = records.filter((r) => r.truthIsBill && r.detectionType === 'TP')

  fieldNames.forEach((f) => {
    // Over all true bills (missed bills are wrong)
    const correctCountAll = trueBills.filter((r) => r.fields[f]?.isCorrect === true).length
    fieldStatsAllTrueBills[f] = {
      correct: correctCountAll,
      total: trueBills.length,
      accuracy: trueBills.length > 0 ? (correctCountAll / trueBills.length) * 100 : 0,
    }

    // Over detected bills only
    const correctCountDetected = detectedBills.filter((r) => r.fields[f]?.isCorrect === true).length
    fieldStatsDetectedBillsOnly[f] = {
      correct: correctCountDetected,
      total: detectedBills.length,
      accuracy: detectedBills.length > 0 ? (correctCountDetected / detectedBills.length) * 100 : 0,
    }
  })

  // Confidence Honesty Metrics (over detected true bills)
  let totalEvaluatedFields = 0
  let correctConfident = 0
  let unnecessaryFlags = 0
  let caughtErrors = 0
  let silentErrors = 0

  detectedBills.forEach((r) => {
    fieldNames.forEach((f) => {
      const fData = r.fields[f]
      if (fData && fData.honestyCategory !== 'n/a') {
        totalEvaluatedFields++
        if (fData.honestyCategory === 'correct_confident') correctConfident++
        else if (fData.honestyCategory === 'unnecessary_flag') unnecessaryFlags++
        else if (fData.honestyCategory === 'caught_error') caughtErrors++
        else if (fData.honestyCategory === 'silent_error') silentErrors++
      }
    })
  })

  const totalErrors = caughtErrors + silentErrors
  const silentErrorRate = totalErrors > 0 ? (silentErrors / totalErrors) * 100 : 0
  const caughtErrorRate = totalErrors > 0 ? (caughtErrors / totalErrors) * 100 : 0

  return {
    records,
    summary: {
      totalImages,
      trueBillsCount: trueBills.length,
      trueNonBillsCount: trueNonBills.length,
      confusion: { tp, tn, fp, fn },
      detectionAccuracy,
      fieldStatsAllTrueBills,
      fieldStatsDetectedBillsOnly,
      honesty: {
        totalEvaluatedFields,
        correctConfident,
        unnecessaryFlags,
        caughtErrors,
        silentErrors,
        totalErrors,
        silentErrorRate,
        caughtErrorRate,
      },
    },
  }
}

/**
 * Runs a threshold sweep over a range of confidence thresholds.
 */
export function runThresholdSweep({ groundTruths = [], predictions = {}, overrides = {}, thresholds = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95], today = new Date() }) {
  return thresholds.map((th) => {
    const { summary } = judgeAll({ groundTruths, predictions, overrides, threshold: th, today })
    return {
      threshold: th,
      caughtErrors: summary.honesty.caughtErrors,
      silentErrors: summary.honesty.silentErrors,
      silentErrorRate: summary.honesty.silentErrorRate,
      unnecessaryFlags: summary.honesty.unnecessaryFlags,
    }
  })
}

