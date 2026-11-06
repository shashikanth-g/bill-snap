import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { parseCSV } from './lib/csv.js'
import { judgeAll, runThresholdSweep } from './lib/judge.js'
import { saveReports } from './lib/report.js'
import { analyzeImage } from '../api/_analyze-core.js'
import { UNSURE_BELOW } from '../src/lib/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const evalDir = __dirname
const imagesDir = path.join(evalDir, 'images')
const groundTruthPath = path.join(evalDir, 'ground-truth.csv')
const overridesPath = path.join(evalDir, 'overrides.csv')

// Parse command line arguments
const args = process.argv.slice(2)
let modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
let runs = 1
let dryRun = false

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--model' && args[i + 1]) {
    modelName = args[i + 1]
    i++
  } else if (args[i] === '--runs' && args[i + 1]) {
    runs = parseInt(args[i + 1], 10) || 1
    i++
  } else if (args[i] === '--dry-run') {
    dryRun = true
  }
}

// Redact helper to ensure API key is never printed or saved to disk
function redact(str) {
  if (!str) return ''
  const key = process.env.GEMINI_API_KEY
  if (key && typeof str === 'string') {
    return str.split(key).join('[redacted]')
  }
  return String(str)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log(`\n========================================`)
  console.log(` BillSnap Evaluation Suite`)
  console.log(`========================================`)
  console.log(`Model:       ${modelName}`)
  console.log(`Runs:        ${runs}`)
  console.log(`Mode:        ${dryRun ? 'Dry Run (Offline)' : 'Live API'}`)

  // 1. Verify ground-truth.csv exists
  if (!fs.existsSync(groundTruthPath)) {
    console.error(`\nError: eval/ground-truth.csv not found.`)
    console.error(`Run 'npm run eval:init' to create the template, then add your labels.`)
    process.exit(1)
  }

  const groundTruthText = fs.readFileSync(groundTruthPath, 'utf-8')
  const groundTruths = parseCSV(groundTruthText)

  if (groundTruths.length === 0) {
    console.error(`\nError: eval/ground-truth.csv contains no rows.`)
    process.exit(1)
  }

  console.log(`Images in ground truth: ${groundTruths.length}`)

  // 2. Read optional overrides
  const overrides = {}
  let overridesAppliedCount = 0
  if (fs.existsSync(overridesPath)) {
    const overridesText = fs.readFileSync(overridesPath, 'utf-8')
    const overrideRows = parseCSV(overridesText)
    overrideRows.forEach((r) => {
      if (r.file && r.field && r.verdict) {
        overrides[`${r.file.trim()}:${r.field.trim()}`] = r.verdict.trim()
      }
    })
    console.log(`Loaded ${Object.keys(overrides).length} manual overrides from eval/overrides.csv`)
  }

  // 3. Prepare output directory
  const safeModelDir = modelName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outDir = path.join(evalDir, 'out', safeModelDir)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const rawJsonPath = path.join(outDir, 'raw.json')
  let predictionsMap = {}
  let apiErrors = 0
  let consistencyStats = null

  if (dryRun) {
    if (!fs.existsSync(rawJsonPath)) {
      console.error(`\nError: Cannot dry-run without pre-existing ${rawJsonPath}`)
      process.exit(1)
    }
    console.log(`Loading cached responses from ${rawJsonPath}...`)
    const rawText = fs.readFileSync(rawJsonPath, 'utf-8').replace(/^\uFEFF/, '')
    const rawData = JSON.parse(rawText)
    predictionsMap = rawData.predictions || {}
    apiErrors = rawData.apiErrors || 0
  } else {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
      console.error('\nError: Valid GEMINI_API_KEY is required in .env.local')
      process.exit(1)
    }

    const allRunPredictions = []

    for (let runIdx = 1; runIdx <= runs; runIdx++) {
      if (runs > 1) {
        console.log(`\n--- Starting Run ${runIdx} of ${runs} ---`)
      }

      const runMap = {}

      for (let i = 0; i < groundTruths.length; i++) {
        const row = groundTruths[i]
        const filename = row.file
        const imgPath = path.join(imagesDir, filename)

        if (!fs.existsSync(imgPath)) {
          console.warn(`[${i + 1}/${groundTruths.length}] Skipping ${filename} (file not found in eval/images/)`)
          continue
        }

        process.stdout.write(`[${i + 1}/${groundTruths.length}] Analyzing ${filename}... `)

        let processedBase64
        try {
          // Sharp pipeline: EXIF rotation, resize max 1600, JPEG quality 80
          const buffer = await sharp(imgPath)
            .rotate()
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer()

          processedBase64 = buffer.toString('base64')
        } catch (err) {
          console.log(`IMAGE ERROR`)
          console.error(`  Failed processing image ${filename}: ${err.message}`)
          apiErrors++
          continue
        }

        try {
          const { result, ms, attempts } = await analyzeImage({
            base64: processedBase64,
            mimeType: 'image/jpeg',
            apiKey,
            model: modelName,
          })

          runMap[filename] = {
            ...result,
            _meta: { ms, model: modelName, attempts },
          }

          console.log(`OK (${ms}ms, attempts: ${attempts})`)
        } catch (err) {
          const safeMsg = redact(err.message || 'API Call Failed')
          console.log(`API ERROR (${safeMsg})`)
          apiErrors++
          runMap[filename] = {
            error: safeMsg,
            attempts: err.attempts || 2,
          }
        }

        // Sequential delay between images
        if (i < groundTruths.length - 1) {
          await sleep(1500)
        }
      }

      allRunPredictions.push(runMap)
    }

    predictionsMap = allRunPredictions[allRunPredictions.length - 1] || {}

    // Evaluate consistency if runs > 1
    if (runs > 1) {
      let identicalCount = 0
      let totalComparisons = 0

      groundTruths.forEach((gt) => {
        const file = gt.file
        const first = allRunPredictions[0][file]
        if (!first) return

        let allMatch = true
        for (let r = 1; r < allRunPredictions.length; r++) {
          const comp = allRunPredictions[r][file]
          if (!comp) {
            allMatch = false
            break
          }
          if (
            first.is_bill !== comp.is_bill ||
            first.merchant?.value !== comp.merchant?.value ||
            first.date?.value !== comp.date?.value ||
            first.total?.value !== comp.total?.value ||
            first.category?.value !== comp.category?.value
          ) {
            allMatch = false
            break
          }
        }
        totalComparisons++
        if (allMatch) identicalCount++
      })

      const identicalPct = totalComparisons > 0 ? (identicalCount / totalComparisons) * 100 : 100
      consistencyStats = {
        identicalPct,
        notes: `${identicalCount}/${totalComparisons} files gave identical predictions across ${runs} passes.`,
      }
    }

    // Save untouched raw JSON output
    const rawPayload = {
      model: modelName,
      timestamp: new Date().toISOString(),
      runs,
      apiErrors,
      predictions: predictionsMap,
    }
    const rawSafeString = redact(JSON.stringify(rawPayload, null, 2))
    fs.writeFileSync(rawJsonPath, rawSafeString, 'utf-8')
    console.log(`\nRaw outputs saved to: ${rawJsonPath}`)
  }

  // 4. Run judging
  const { records, summary } = judgeAll({
    groundTruths,
    predictions: predictionsMap,
    overrides,
    threshold: UNSURE_BELOW,
    today: new Date(),
  })

  // Count overrides applied
  records.forEach((r) => {
    Object.values(r.fields).forEach((f) => {
      if (f.overridden) overridesAppliedCount++
    })
  })

  // 5. Run threshold sweep
  const sweepResults = runThresholdSweep({
    groundTruths,
    predictions: predictionsMap,
    overrides,
    thresholds: [0.5, 0.6, 0.7, 0.8, 0.9, 0.95],
    today: new Date(),
  })

  // 6. Save reports
  saveReports({
    outDir,
    model: modelName,
    records,
    summary,
    sweepResults,
    apiErrors,
    overridesApplied: overridesAppliedCount,
    runs,
    consistencyStats,
  })

  // 7. Terminal Summary Table
  console.log(`\n========================================`)
  console.log(` Evaluation Summary: ${modelName}`)
  console.log(`========================================`)
  console.log(`Bill Detection Accuracy:    ${summary.detectionAccuracy.toFixed(1)}%`)
  console.log(`  TP: ${summary.confusion.tp} | TN: ${summary.confusion.tn} | FP: ${summary.confusion.fp} | FN: ${summary.confusion.fn}`)
  console.log(`----------------------------------------`)
  console.log(`Field Accuracy (Detected True Bills):`)
  const fNames = ['merchant', 'date', 'total', 'category']
  fNames.forEach((f) => {
    const stat = summary.fieldStatsDetectedBillsOnly[f]
    const label = (f.charAt(0).toUpperCase() + f.slice(1)).padEnd(12)
    console.log(`  ${label}: ${stat.accuracy.toFixed(1)}% (${stat.correct}/${stat.total})`)
  })
  console.log(`----------------------------------------`)
  console.log(`Confidence Honesty Analysis (Threshold = ${UNSURE_BELOW}):`)
  const h = summary.honesty
  console.log(`  Caught Errors:       ${h.caughtErrors} (Flagged unsure - Safe)`)
  console.log(`  Silent Errors:       ${h.silentErrors} (Unflagged - Dangerous)`)
  console.log(`  Silent Error Rate:   ${h.silentErrorRate.toFixed(1)}%`)
  console.log(`  Unnecessary Flags:   ${h.unnecessaryFlags} (Correct but unsure)`)
  console.log(`========================================`)
  console.log(`Reports successfully generated:`)
  console.log(`  - ${path.join(outDir, 'RESULTS.md')}`)
  console.log(`  - ${path.join(outDir, 'failures.md')}`)
  console.log(`  - ${path.join(outDir, 'results.csv')}`)
  console.log(`  - ${path.join(outDir, 'raw.json')}\n`)
}

main().catch((err) => {
  console.error(`Fatal error: ${redact(err.stack || err.message)}`)
  process.exit(1)
})
