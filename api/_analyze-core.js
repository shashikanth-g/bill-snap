import { GoogleGenAI } from '@google/genai'
import { SYSTEM_PROMPT, RESPONSE_SCHEMA } from './_prompt.js'

const VALID_CATEGORIES = new Set([
  'food', 'groceries', 'utilities', 'shopping', 'health', 'transport', 'other'
])

const TIMEOUT_MS = 12000 // 12 seconds per attempt (worst case with 1 retry: 12 + 0.8 + 12 = 24.8s < 28s)

/**
 * Validates whether a string is a real calendar date in YYYY-MM-DD format.
 */
function isValidCalendarDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [yearStr, monthStr, dayStr] = str.split('-')
  const y = parseInt(yearStr, 10)
  const m = parseInt(monthStr, 10)
  const d = parseInt(dayStr, 10)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const dateObj = new Date(y, m - 1, d)
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  )
}

/**
 * Clamps confidence score to 0.0 .. 1.0
 */
function clampConfidence(val) {
  const num = Number(val)
  if (Number.isNaN(num) || !Number.isFinite(num)) return 0
  return Math.max(0, Math.min(1, Math.round(num * 100) / 100))
}

/**
 * Core image analyzer that calls Gemini with structured output.
 * Can be reused in HTTP routes and evaluation scripts without HTTP dependencies.
 */
export async function analyzeImage({ base64, mimeType = 'image/jpeg', apiKey, model }) {
  if (!apiKey) {
    const error = new Error('Gemini API key is missing.')
    error.code = 'server_error'
    throw error
  }

  const modelName = model || 'gemini-3.8-flash'
  const ai = new GoogleGenAI({ apiKey })

  const makeAttempt = async () => {
    return await Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
          'Read this bill or receipt image and return the structured JSON as specified.',
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0,
        },
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          const timeoutErr = new Error('Analysis timed out')
          timeoutErr.code = 'ai_unavailable'
          reject(timeoutErr)
        }, TIMEOUT_MS)
      }),
    ])
  }

  const startTime = Date.now()
  let response
  let attempts = 0

  const executeCall = async () => {
    attempts++
    return await makeAttempt()
  }

  try {
    response = await executeCall()
  } catch (err) {
    const status = err.status || err.statusCode
    const isTimeout = err.code === 'ai_unavailable' && /timed out/i.test(err.message || '')
    const isRetryable =
      isTimeout ||
      status === 429 ||
      (status >= 500 && status < 600) ||
      /429|5\d{2}|RESOURCE_EXHAUSTED|UNAVAILABLE|timed? ?out/i.test(err.message || '')

    if (isRetryable && attempts === 1) {
      await new Promise((r) => setTimeout(r, 800))
      try {
        response = await executeCall()
      } catch (retryErr) {
        const error = new Error('The reader is busy right now. Please try again.')
        error.code = retryErr.status === 429 ? 'rate_limited' : 'ai_unavailable'
        error.status = retryErr.status || retryErr.statusCode || status
        error.rawMessage = retryErr.message || err.message
        error.attempts = attempts
        throw error
      }
    } else {
      const error = new Error(err.message || 'AI service unavailable')
      error.code = err.code || 'ai_unavailable'
      error.status = status
      error.rawMessage = err.message
      error.attempts = attempts
      throw error
    }
  }

  const durationMs = Date.now() - startTime

  // Parse structured JSON response
  let raw
  try {
    raw = JSON.parse(response.text)
  } catch (parseErr) {
    const error = new Error('Invalid JSON response returned from reader.')
    error.code = 'bad_ai_response'
    throw error
  }

  // Sanitize and validate every field
  const isBill = Boolean(raw.is_bill)
  let notBillReason = isBill ? null : (raw.not_bill_reason || 'not a bill')

  let merchantVal = raw.merchant?.value ? String(raw.merchant.value).trim() : null
  let merchantConf = clampConfidence(raw.merchant?.confidence)

  let dateVal = raw.date?.value
  let dateConf = clampConfidence(raw.date?.confidence)
  if (dateVal && !isValidCalendarDate(dateVal)) {
    dateVal = null
    dateConf = 0
  }

  let totalVal = raw.total?.value
  let totalConf = clampConfidence(raw.total?.confidence)
  if (typeof totalVal !== 'number' || !Number.isFinite(totalVal) || totalVal <= 0) {
    totalVal = null
    totalConf = 0
  }

  let categoryVal = String(raw.category?.value || 'other').toLowerCase()
  if (!VALID_CATEGORIES.has(categoryVal)) {
    categoryVal = 'other'
  }
  let categoryConf = clampConfidence(raw.category?.confidence)

  // Edge case: is_bill was true, but merchant, date and total are ALL null
  if (isBill && !merchantVal && !dateVal && totalVal === null) {
    const result = {
      is_bill: false,
      not_bill_reason: 'no bill details found',
      merchant: { value: null, confidence: 0 },
      date: { value: null, confidence: 0 },
      total: { value: null, confidence: 0 },
      category: { value: 'other', confidence: 0 },
    }
    return { result, model: modelName, ms: durationMs, attempts }
  }

  // If not a bill, ensure all fields are null with 0 confidence
  if (!isBill) {
    const result = {
      is_bill: false,
      not_bill_reason: notBillReason,
      merchant: { value: null, confidence: 0 },
      date: { value: null, confidence: 0 },
      total: { value: null, confidence: 0 },
      category: { value: 'other', confidence: 0 },
    }
    return { result, model: modelName, ms: durationMs, attempts }
  }

  const result = {
    is_bill: true,
    not_bill_reason: null,
    merchant: {
      value: merchantVal,
      confidence: merchantVal ? merchantConf : 0,
    },
    date: {
      value: dateVal,
      confidence: dateVal ? dateConf : 0,
    },
    total: {
      value: totalVal,
      confidence: totalVal !== null ? totalConf : 0,
    },
    category: {
      value: categoryVal,
      confidence: categoryConf,
    },
  }

  return { result, model: modelName, ms: durationMs, attempts }
}

