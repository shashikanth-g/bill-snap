import { analyzeImage } from './_analyze-core.js'

// In-memory rate limiting: at most 20 requests per minute per IP
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20

/**
 * Checks in-memory rate limit for a client IP.
 * Cleans up expired timestamps on each check.
 */
function isRateLimited(ip) {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Keep only requests from the last minute
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent)
    return true
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return false
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BASE64_LENGTH = 5_500_000 // ~4MB image threshold

/**
 * Vercel Serverless Function Handler for POST /api/analyze
 */
export default async function handler(req, res) {
  // 1. Method validation (POST only)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      ok: false,
      code: 'bad_request',
      message: 'Method not allowed. Only POST is supported.',
    })
  }

  // 2. Best-effort in-memory rate limiting
  const forwarded = req.headers['x-forwarded-for']
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || '127.0.0.1'

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      ok: false,
      code: 'rate_limited',
      message: 'Too many requests. Please wait a minute and try again.',
    })
  }

  // 3. Request body validation
  const body = req.body || {}
  const { image, mimeType } = body

  if (!image || typeof image !== 'string') {
    return res.status(400).json({
      ok: false,
      code: 'bad_request',
      message: 'Missing or invalid image base64 data.',
    })
  }

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return res.status(400).json({
      ok: false,
      code: 'bad_request',
      message: 'Invalid mimeType. Only image/jpeg, image/png, and image/webp are allowed.',
    })
  }

  // 4. Payload size check
  if (image.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({
      ok: false,
      code: 'too_large',
      message: 'Image is too large. Please use an image under 4MB.',
    })
  }

  // 5. Environment configuration (server-side only)
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

  if (!apiKey) {
    console.error('[Analyze Error] code: server_error, status: 500 (missing API key)')
    return res.status(500).json({
      ok: false,
      code: 'server_error',
      message: 'Gemini API key is not configured on the server.',
    })
  }

  // 6. Execute Gemini Vision analysis
  try {
    const { result, model: usedModel, ms, attempts } = await analyzeImage({
      base64: image,
      mimeType,
      apiKey,
      model,
    })

    return res.status(200).json({
      ok: true,
      result,
      model: usedModel,
      ms,
      attempts,
    })
  } catch (err) {
    const code = err.code || 'server_error'
    const status =
      code === 'rate_limited' ? 429 :
      code === 'ai_unavailable' ? 503 :
      code === 'bad_ai_response' ? 502 : 500

    // Log only code and status, never secrets or raw stack traces to the client
    console.error(`[Analyze Error] code: ${code}, status: ${status}`)

    return res.status(status).json({
      ok: false,
      code,
      message: err.message || 'Something went wrong reading this bill. Please try again.',
    })
  }
}

