import { UNSURE_BELOW } from '../../src/lib/config.js'
import { isFieldUnsure, isFieldUnsureByRules } from '../../src/lib/fieldState.js'

export { isFieldUnsure, isFieldUnsureByRules }

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
 * Judges a single image prediction against ground truth and optional overrides.
 */
export function judgeRecord({
  truth,
  prediction,
  overrides = {},
  threshold = UNSURE_BELOW,
  today = new Date(),
}) {
  const file = truth.file
  const condition = truth.condition || ''
  const truthIsBill = String(truth.is_bill || '').trim().toLowerCase() === 'yes'
  const fields = ['merchant', 'date', 'total', 'category']

  // Handle API Error: must NOT be treated as a model prediction
  if (prediction?.error) {
    const errorFields = {}
    fields.forEach((f) => {
      errorFields[f] = {
        truthVal: truth[f] || '',
        predVal: null,
        confidence: 0,
        status: 'API ERROR',
        isCorrect: null,
        isUnsure: null,
        flagSource: 'none',
        overridden: false,
        honestyCategory: 'api_error',
      }
    })

    return {
      file,
      condition,
      truthIsBill,
      predIsBill: null,
      detectionType: 'API_ERROR',
      detectionStatus: 'API ERROR',
      isApiError: true,
      apiError: prediction.error,
      attempts: prediction.attempts || null,
      fields: errorFields,
      ms: null,
    }
  }

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
        flagSource: 'none',
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
        flagSource: 'none',
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

      const truthEmpty = truthVal === null || truthVal === undefined || String(truthVal).trim() === ''
      const predEmpty = predVal === null || predVal === undefined || String(predVal).trim() === ''

      // Evaluate flag sources
      const flaggedByAi = confidence < threshold
      const flaggedByRules = isFieldUnsureByRules(f, predVal, today)
      const unsure = isFieldUnsure(f, predVal, confidence, threshold, today)

      let flagSource = 'none'
      if (flaggedByAi && flaggedByRules) flagSource = 'both'
      else if (flaggedByAi) flagSource = 'ai_confidence'
      else if (flaggedByRules) flagSource = 'app_rule'

      let correct = false
      let honestyCategory = 'correct_confident'
      let statusStr = ''
      let overridden = false

      // Requirement 3: When ground-truth is EMPTY and AI returned null -> correctly left blank!
      if (truthEmpty && predEmpty) {
        correct = true
        honestyCategory = 'correctly_blank'
        statusStr = 'OK (blank)'
      } else {
        if (f === 'merchant') correct = judgeMerchant(predVal, truthVal)
        else if (f === 'date') correct = judgeDate(predVal, truthVal)
        else if (f === 'total') correct = judgeTotal(predVal, truthVal)
        else if (f === 'category') correct = judgeCategory(predVal, truthVal)

        // Apply manual override if specified
        const overrideKey = `${file}:${f}`
        if (overrides[overrideKey]) {
          correct = overrides[overrideKey].trim().toLowerCase() === 'correct'
          overridden = true
        }

        const confStr = confidence.toFixed(2)

        if (correct) {
          if (unsure) {
            honestyCategory = 'unnecessary_flag'
            statusStr = `OK (${confStr}) (unsure: ${flagSource})`
          } else {
            honestyCategory = 'correct_confident'
            statusStr = `OK (${confStr})`
          }
        } else {
          if (unsure) {
            honestyCategory = 'caught_error'
            statusStr = `WRONG (${confStr}) (caught: ${flagSource})`
          } else {
            honestyCategory = 'silent_error'
            statusStr = `WRONG (${confStr})`
          }
        }
      }

      judgedFields[f] = {
        truthVal,
        predVal,
        confidence,
        status: statusStr,
        isCorrect: correct,
        isUnsure: honestyCategory === 'correctly_blank' ? false : unsure,
        flagSource: honestyCategory === 'correctly_blank' ? 'none' : flagSource,
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
    isApiError: false,
    apiError: null,
    attempts: prediction?._meta?.attempts || prediction?.attempts || 1,
    fields: judgedFields,
    ms: prediction?._meta?.ms ?? null,
  }
}

/**
 * Judges an array of ground truth rows against prediction results.
 * Excludes API errors from all accuracy, confusion matrix, and confidence statistics.
 */
export function judgeAll({
  groundTruths = [],
  predictions = {},
  overrides = {},
  threshold = UNSURE_BELOW,
  today = new Date(),
}) {
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

  // Separate API errors from scored records
  const apiErrorRecords = records.filter((r) => r.isApiError)
  const scoredRecords = records.filter((r) => !r.isApiError)

  const totalImages = records.length
  const scoredImagesCount = scoredRecords.length

  const trueBills = scoredRecords.filter((r) => r.truthIsBill)
  const trueNonBills = scoredRecords.filter((r) => !r.truthIsBill)

  const tp = scoredRecords.filter((r) => r.detectionType === 'TP').length
  const tn = scoredRecords.filter((r) => r.detectionType === 'TN').length
  const fp = scoredRecords.filter((r) => r.detectionType === 'FP').length
  const fn = scoredRecords.filter((r) => r.detectionType === 'FN').length

  const detectionAccuracy = scoredImagesCount > 0 ? ((tp + tn) / scoredImagesCount) * 100 : 0

  // Field stats over True Bills (from scored records only)
  const fieldNames = ['merchant', 'date', 'total', 'category']
  const fieldStatsAllTrueBills = {}
  const fieldStatsDetectedBillsOnly = {}

  const detectedBills = scoredRecords.filter((r) => r.truthIsBill && r.detectionType === 'TP')

  fieldNames.forEach((f) => {
    // Over all scored true bills (missed bills count as wrong)
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
  let correctlyLeftBlank = 0
  let unnecessaryFlags = 0
  const unnecessarySplit = { byAi: 0, byRules: 0, byBoth: 0 }
  let caughtErrors = 0
  const caughtSplit = { byAi: 0, byRules: 0, byBoth: 0 }
  let silentErrors = 0

  // Confidence Distribution buckets: <0.5, 0.5-0.8, 0.8-0.95, >=0.95
  const confidenceDistribution = {
    correct: { below05: 0, from05to08: 0, from08to95: 0, above95: 0 },
    wrong: { below05: 0, from05to08: 0, from08to95: 0, above95: 0 },
    total: { below05: 0, from05to08: 0, from08to95: 0, above95: 0 },
  }

  detectedBills.forEach((r) => {
    fieldNames.forEach((f) => {
      const fData = r.fields[f]
      if (fData && fData.honestyCategory !== 'n/a' && fData.honestyCategory !== 'api_error') {
        totalEvaluatedFields++

        // Confidence distribution
        const conf = typeof fData.confidence === 'number' ? fData.confidence : 0
        let bucket = 'below05'
        if (conf >= 0.95) bucket = 'above95'
        else if (conf >= 0.8) bucket = 'from08to95'
        else if (conf >= 0.5) bucket = 'from05to08'

        if (fData.isCorrect) {
          confidenceDistribution.correct[bucket]++
        } else {
          confidenceDistribution.wrong[bucket]++
        }
        confidenceDistribution.total[bucket]++

        // Categorize honesty
        if (fData.honestyCategory === 'correct_confident') {
          correctConfident++
        } else if (fData.honestyCategory === 'correctly_blank') {
          correctlyLeftBlank++
        } else if (fData.honestyCategory === 'unnecessary_flag') {
          unnecessaryFlags++
          if (fData.flagSource === 'both') unnecessarySplit.byBoth++
          else if (fData.flagSource === 'ai_confidence') unnecessarySplit.byAi++
          else if (fData.flagSource === 'app_rule') unnecessarySplit.byRules++
        } else if (fData.honestyCategory === 'caught_error') {
          caughtErrors++
          if (fData.flagSource === 'both') caughtSplit.byBoth++
          else if (fData.flagSource === 'ai_confidence') caughtSplit.byAi++
          else if (fData.flagSource === 'app_rule') caughtSplit.byRules++
        } else if (fData.honestyCategory === 'silent_error') {
          silentErrors++
        }
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
      scoredImagesCount,
      apiErrors: apiErrorRecords.map((r) => ({ file: r.file, error: r.apiError, attempts: r.attempts })),
      trueBillsCount: trueBills.length,
      trueNonBillsCount: trueNonBills.length,
      confusion: { tp, tn, fp, fn },
      detectionAccuracy,
      fieldStatsAllTrueBills,
      fieldStatsDetectedBillsOnly,
      honesty: {
        totalEvaluatedFields,
        correctConfident,
        correctlyLeftBlank,
        unnecessaryFlags,
        unnecessarySplit,
        caughtErrors,
        caughtSplit,
        silentErrors,
        totalErrors,
        silentErrorRate,
        caughtErrorRate,
      },
      confidenceDistribution,
    },
  }
}

/**
 * Runs a threshold sweep over a range of confidence thresholds.
 * Evaluates ONLY raw AI confidence scores without app heuristic rules.
 */
export function runThresholdSweep({
  groundTruths = [],
  predictions = {},
  overrides = {},
  thresholds = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95],
}) {
  // Use a base judge run to get scored detected bills and field correctness
  const { records } = judgeAll({ groundTruths, predictions, overrides })
  const detectedBills = records.filter((r) => !r.isApiError && r.truthIsBill && r.detectionType === 'TP')
  const fieldNames = ['merchant', 'date', 'total', 'category']

  return thresholds.map((th) => {
    let caughtErrors = 0
    let silentErrors = 0
    let unnecessaryFlags = 0

    detectedBills.forEach((r) => {
      fieldNames.forEach((f) => {
        const item = r.fields[f]
        if (!item || item.honestyCategory === 'n/a' || item.honestyCategory === 'correctly_blank') {
          return
        }

        const conf = item.confidence
        const isFlaggedByAi = conf < th

        if (item.isCorrect) {
          if (isFlaggedByAi) unnecessaryFlags++
        } else {
          if (isFlaggedByAi) caughtErrors++
          else silentErrors++
        }
      })
    })

    const totalErrors = caughtErrors + silentErrors
    const silentErrorRate = totalErrors > 0 ? (silentErrors / totalErrors) * 100 : 0

    return {
      threshold: th,
      caughtErrors,
      silentErrors,
      silentErrorRate,
      unnecessaryFlags,
    }
  })
}
