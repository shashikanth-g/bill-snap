/**
 * Mapping of known error codes to friendly human-readable user messages
 */
const ERROR_MESSAGES = {
  offline: "You're offline. Connect to the internet and try again.",
  timeout: 'That took too long. Please try again.',
  rate_limited: 'Too many tries. Wait a moment and try again.',
  ai_unavailable: 'The reader is busy right now. Please try again.',
  bad_request: 'Something went wrong reading this bill. Please try again.',
  too_large: 'Image is too large. Please use a smaller image.',
  bad_ai_response: 'Could not read the bill clearly. Please try again.',
  server_error: 'Something went wrong reading this bill. Please try again.',
}

function createError(code, customMessage) {
  const message = customMessage || ERROR_MESSAGES[code] || 'Something went wrong reading this bill. Please try again.'
  const err = new Error(message)
  err.code = code
  err.userMessage = message
  return err
}

/**
 * Sends bill image base64 data to /api/analyze and returns the analysis result.
 * Handles offline checks, 30s client timeout, and normalizes errors to friendly messages.
 */
export async function analyzeBill({ base64, mimeType = 'image/jpeg' }) {
  // Check online status before making the request
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw createError('offline')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, 30000) // 30 second client timeout

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, mimeType }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.ok) {
      const code = data?.code || (response.status === 429 ? 'rate_limited' : 'server_error')
      throw createError(code, data?.message)
    }

    // Return result object including timing and model info
    return {
      result: data.result,
      model: data.model,
      ms: data.ms,
      ...data.result,
    }
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      throw createError('timeout')
    }

    if (err.code && err.userMessage) {
      throw err
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw createError('offline')
    }

    throw createError('server_error', err.message)
  }
}

