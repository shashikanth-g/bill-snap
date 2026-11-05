import { GoogleGenAI } from '@google/genai'
import { analyzeImage } from '../api/_analyze-core.js'

// 1x1 transparent PNG
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function redact(text) {
  if (!text) return ''
  let s = String(text)
  const key = process.env.GEMINI_API_KEY
  if (key) {
    s = s.replaceAll(key, '[redacted]')
  }
  return s.replace(/AIza[0-9A-Za-z-_]{35}/g, '[redacted]')
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY
  const hasKey = Boolean(apiKey && apiKey.trim().length > 0)

  console.log(`GEMINI_API_KEY set: ${hasKey ? 'yes' : 'no'}`)

  if (!hasKey) {
    console.log('Error: GEMINI_API_KEY is not set in .env.local.')
    process.exit(1)
  }

  if (apiKey === 'PASTE_YOUR_KEY_HERE' || apiKey === 'your_key_here') {
    console.log('API key is still the placeholder text. Please replace it with your actual Gemini API key.')
    process.exit(1)
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  console.log(`Model: ${model}`)

  const startTime = Date.now()

  try {
    const { result, ms, model: usedModel } = await analyzeImage({
      base64: TINY_PNG_BASE64,
      mimeType: 'image/png',
      apiKey,
      model,
    })

    console.log('Status: Success')
    console.log(`Call time: ${ms} ms`)
    console.log(`Returned model: ${usedModel}`)
    console.log('Result:', JSON.stringify(result, null, 2))
  } catch (err) {
    const elapsed = Date.now() - startTime
    console.log('Status: Failure')
    console.log(`Call time: ${elapsed} ms`)
    const status = err.status || err.statusCode || 'N/A'
    console.log(`HTTP Status: ${status}`)
    const errMsg = err.rawMessage || err.message || 'Unknown error'
    console.log(`Error: ${redact(errMsg)}`)

    // Always query available models on failure to diagnose and recommend
    try {
      console.log('\nQuerying available models from Gemini API...')
      const ai = new GoogleGenAI({ apiKey })
      const pager = await ai.models.list()
      const flashModels = []

      for await (const m of pager) {
        const id = m.name?.replace(/^models\//, '') || ''
        if (id.toLowerCase().includes('flash')) {
          flashModels.push(id)
        }
      }

      console.log('\nAvailable models containing "flash":')
      flashModels.forEach((id) => console.log(` - ${id}`))

      // Pick the best stable flash model for vision + JSON
      // Priority: gemini-2.5-flash > gemini-2.0-flash > gemini-1.5-flash
      const recommended =
        flashModels.find((id) => id === 'gemini-2.5-flash') ||
        flashModels.find((id) => id === 'gemini-2.0-flash') ||
        flashModels.find((id) => id === 'gemini-1.5-flash') ||
        flashModels[0] ||
        'gemini-2.5-flash'

      console.log(`\nRecommended model for image input + structured JSON output: ${recommended}`)
    } catch (listErr) {
      console.log(`Could not list models: ${redact(listErr.message)}`)
    }

    process.exit(1)
  }
}

run()
