import fs from 'node:fs'
import path from 'node:path'
import { toCSV } from './csv.js'

/**
 * Builds the comprehensive RESULTS.md report.
 */
export function generateResultsMarkdown({
  model,
  timestamp = new Date().toISOString(),
  records = [],
  summary,
  sweepResults = [],
  overridesApplied = 0,
  runs = 1,
  consistencyStats = null,
}) {
  const lines = []
  const apiErrorsList = summary.apiErrors || []

  lines.push(`# Evaluation Report: ${model}`)
  lines.push('')
  lines.push(`- **Date/Time**: ${timestamp}`)
  lines.push(`- **Model**: \`${model}\``)
  lines.push(`- **Total Images**: ${records.length}`)
  lines.push(`- **Scored**: ${summary.scoredImagesCount} of ${records.length} images`)
  lines.push(`- **API Errors**: ${apiErrorsList.length} (not scored)`)
  lines.push(`- **Runs Evaluated**: ${runs}`)
  if (overridesApplied > 0) {
    lines.push(`- **Manual Overrides Applied**: ${overridesApplied}`)
  }

  // Latency stats for scored images
  const validTimes = records
    .filter((r) => !r.isApiError && typeof r.ms === 'number')
    .map((r) => r.ms)

  if (validTimes.length > 0) {
    const avgMs = Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length)
    const maxMs = Math.max(...validTimes)
    lines.push(`- **Average Latency**: ${avgMs} ms`)
    lines.push(`- **Max Latency**: ${maxMs} ms`)
  }
  lines.push('')

  // API Errors (not scored) section if any exist
  if (apiErrorsList.length > 0) {
    lines.push('## API Errors (not scored)')
    lines.push(
      `The following ${apiErrorsList.length} image(s) encountered API errors and are excluded from all accuracy and confidence metrics:`
    )
    apiErrorsList.forEach((e) => {
      const attemptsStr = e.attempts ? ` (attempts: ${e.attempts})` : ''
      lines.push(`- \`${e.file}\`: ${e.error}${attemptsStr}`)
    })
    lines.push('')
  }

  // 1. Judging Rules Header
  lines.push('## Judging Rules')
  lines.push('- **Exclusions**: API errors (timeout, 429, 5xx) are excluded from scoring.')
  lines.push('- **Bill Detection**: Exact match (`yes`/`no` vs AI `is_bill`).')
  lines.push('- **Merchant**: Case-insensitive normalized; correct if exact match, either contains other (length >= 3), or Levenshtein similarity ratio >= 0.8.')
  lines.push('- **Date**: Exact calendar match in `YYYY-MM-DD`.')
  lines.push('- **Total**: Number within 1.0 Rupee difference (`|pred - truth| <= 1.0`).')
  lines.push('- **Category**: Exact case-insensitive match against standard categories.')
  lines.push('- **Empty Ground Truth**: When truth is empty and AI returns null, it is counted as "correctly left blank", not an unnecessary flag.')
  lines.push('- **Non-Bills**: Field evaluations are marked `n/a`.')
  lines.push('- **Missed Bills**: Marked `WRONG` across all 4 fields.')
  lines.push('- **Confidence Flag**: Split by source (AI confidence < 0.8 vs App rules).')
  lines.push('')

  // 2. Bill Detection & Confusion Matrix
  const { confusion, detectionAccuracy, trueBillsCount } = summary
  lines.push('## Bill Detection')
  lines.push(
    `- **Accuracy**: ${detectionAccuracy.toFixed(1)}% (${confusion.tp + confusion.tn}/${summary.scoredImagesCount} scored images)`
  )
  lines.push('')
  lines.push('| Metric | Value | Meaning |')
  lines.push('| :--- | :--- | :--- |')
  lines.push(`| **TP** | ${confusion.tp} | True bills correctly recognized |`)
  lines.push(`| **TN** | ${confusion.tn} | Non-bills correctly rejected |`)
  lines.push(`| **FP** | ${confusion.fp} | Non-bills falsely classified as bills |`)
  lines.push(`| **FN** | ${confusion.fn} | True bills missed as non-bills |`)
  lines.push('')

  // 3. Field Accuracy Over True Bills
  lines.push('## Field Extraction Accuracy (True Bills)')
  lines.push('')
  lines.push(
    `| Field | Accuracy (All ${trueBillsCount} True Bills) | Accuracy (Detected ${confusion.tp} Bills Only) |`
  )
  lines.push('| :--- | :--- | :--- |')

  const fields = ['merchant', 'date', 'total', 'category']
  fields.forEach((f) => {
    const allStat = summary.fieldStatsAllTrueBills[f]
    const detStat = summary.fieldStatsDetectedBillsOnly[f]
    const allStr = `${allStat.accuracy.toFixed(1)}% (${allStat.correct}/${allStat.total})`
    const detStr = `${detStat.accuracy.toFixed(1)}% (${detStat.correct}/${detStat.total})`
    lines.push(`| **${f.charAt(0).toUpperCase() + f.slice(1)}** | ${allStr} | ${detStr} |`)
  })
  lines.push('')

  // 4. Main Results Table
  lines.push('## Detailed Image Results')
  lines.push('')
  lines.push('| # | File | Condition | Truth | Pred | Detection | Merchant | Date | Total | Category | ms |')
  lines.push('| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- | :---: |')

  records.forEach((r, idx) => {
    const num = idx + 1
    const truthStr = r.truthIsBill ? 'bill' : 'not bill'

    if (r.isApiError) {
      lines.push(
        `| ${num} | ${r.file} | ${r.condition} | ${truthStr} | - | API ERROR | API ERROR | API ERROR | API ERROR | API ERROR | - |`
      )
      return
    }

    const predStr = r.predIsBill ? 'bill' : 'not bill'
    const detStr = r.detectionStatus
    const mStr = r.fields.merchant.status
    const dStr = r.fields.date.status
    const tStr = r.fields.total.status
    const cStr = r.fields.category.status
    const msStr = r.ms != null ? String(r.ms) : '-'

    lines.push(
      `| ${num} | ${r.file} | ${r.condition} | ${truthStr} | ${predStr} | ${detStr} | ${mStr} | ${dStr} | ${tStr} | ${cStr} | ${msStr} |`
    )
  })
  lines.push('')

  // 5. Confidence Honesty Analysis (Split by Source)
  const h = summary.honesty
  lines.push('## Confidence Honesty Analysis (Threshold = 0.8)')
  lines.push('')
  lines.push('Categorizes every predicted field on true detected bills with flag source breakdown:')
  lines.push(`- **Total Fields Evaluated**: ${h.totalEvaluatedFields}`)
  lines.push(`- **Correct & Confident**: ${h.correctConfident} (Ideal - model was right and sure)`)
  lines.push(`- **Correctly Left Blank**: ${h.correctlyLeftBlank} (Model correctly returned null when ground truth was blank)`)
  lines.push(`- **Caught Errors**: ${h.caughtErrors} (Safe - model error was caught and flagged for review)`)
  lines.push(`  - Flagged by AI confidence (< 0.80): ${h.caughtSplit.byAi}`)
  lines.push(`  - Flagged by app rules (null, date age, unusual amount): ${h.caughtSplit.byRules}`)
  lines.push(`  - Flagged by both: ${h.caughtSplit.byBoth}`)
  lines.push(`- **Silent Errors**: ${h.silentErrors} (Dangerous - model made an error with high confidence)`)
  lines.push(`- **Unnecessary Flags**: ${h.unnecessaryFlags} (Inconvenient - model was correct but flagged unsure)`)
  lines.push(`  - Flagged by AI confidence (< 0.80): ${h.unnecessarySplit.byAi}`)
  lines.push(`  - Flagged by app rules: ${h.unnecessarySplit.byRules}`)
  lines.push(`  - Flagged by both: ${h.unnecessarySplit.byBoth}`)
  lines.push(`- **Caught Error Rate**: ${h.caughtErrorRate.toFixed(1)}% of all errors caught`)
  lines.push(`- **Silent Error Rate**: ${h.silentErrorRate.toFixed(1)}% of all errors went unnoticed`)
  lines.push('')

  // 6. Confidence Distribution
  const dist = summary.confidenceDistribution
  lines.push('## Confidence Distribution')
  lines.push('')
  lines.push('| Confidence Range | Correct Predictions | Wrong Predictions | Total |')
  lines.push('| :--- | :---: | :---: | :---: |')
  lines.push(
    `| **Below 0.50** | ${dist.correct.below05} | ${dist.wrong.below05} | ${dist.total.below05} |`
  )
  lines.push(
    `| **0.50 to 0.80** | ${dist.correct.from05to08} | ${dist.wrong.from05to08} | ${dist.total.from05to08} |`
  )
  lines.push(
    `| **0.80 to 0.95** | ${dist.correct.from08to95} | ${dist.wrong.from08to95} | ${dist.total.from08to95} |`
  )
  lines.push(
    `| **0.95 and above** | ${dist.correct.above95} | ${dist.wrong.above95} | ${dist.total.above95} |`
  )
  lines.push('')
  lines.push(
    'A well-calibrated model concentrates correct predictions above 0.80 and wrong predictions below 0.80, preventing silent errors while avoiding false alarms.'
  )
  lines.push('')

  // 7. Threshold Sweep Table (AI Confidence Only)
  lines.push('## Confidence Threshold Sweep (AI Confidence Only)')
  lines.push('')
  lines.push(
    'Tuning the threshold over raw AI confidence scores (excluding app rules) demonstrates how confidence alone separates correct predictions from errors:'
  )
  lines.push('')
  lines.push('| Threshold | Caught Errors | Silent Errors | Silent Error Rate | Unnecessary Flags |')
  lines.push('| :---: | :---: | :---: | :---: | :---: |')

  sweepResults.forEach((s) => {
    lines.push(
      `| ${s.threshold.toFixed(2)} | ${s.caughtErrors} | ${s.silentErrors} | ${s.silentErrorRate.toFixed(1)}% | ${s.unnecessaryFlags} |`
    )
  })
  lines.push('')

  // 8. Consistency Section (if runs > 1)
  if (runs > 1 && consistencyStats) {
    lines.push('## Consistency Across Runs')
    lines.push(`- Evaluated over **${runs}** independent repeated passes.`)
    lines.push(`- **Identical Predictions**: ${consistencyStats.identicalPct.toFixed(1)}%`)
    lines.push(`- **Output Variance**: ${consistencyStats.notes}`)
    lines.push('')
  }

  // 9. Failures Summary (excluding API errors)
  const failures = records.filter((r) => {
    if (r.isApiError) return false
    if (r.detectionStatus === 'WRONG') return true
    return fields.some((f) => r.fields[f].isCorrect === false)
  })

  lines.push(`## Failures (${failures.length})`)
  if (failures.length === 0) {
    lines.push('No detection or field failures encountered.')
  } else {
    lines.push('List of all images requiring attention. See `failures.md` for the full checklist.')
    lines.push('')
    failures.forEach((f) => {
      lines.push(`### \`${f.file}\` (${f.condition || 'clean'})`)
      if (f.detectionStatus === 'WRONG') {
        lines.push(
          `- **Detection Error**: Expected ${f.truthIsBill ? 'bill' : 'not bill'}, got ${f.predIsBill ? 'bill' : 'not bill'}`
        )
      }
      fields.forEach((field) => {
        const item = f.fields[field]
        if (item && item.isCorrect === false) {
          lines.push(
            `- **${field}**: Expected \`${item.truthVal}\` | Predicted \`${item.predVal}\` (${item.confidence.toFixed(2)}) [${item.honestyCategory}]`
          )
        }
      })
      lines.push('- Why (my notes): ')
      lines.push('')
    })
  }

  return lines.join('\n')
}

/**
 * Builds the standalone failures.md document.
 */
export function generateFailuresMarkdown({ model, records = [] }) {
  const fields = ['merchant', 'date', 'total', 'category']
  const apiErrors = records.filter((r) => r.isApiError)
  const failures = records.filter((r) => {
    if (r.isApiError) return false
    if (r.detectionStatus === 'WRONG') return true
    return fields.some((f) => r.fields[f].isCorrect === false)
  })

  const lines = []
  lines.push(`# Failures Checklist: ${model}`)
  lines.push('')

  if (apiErrors.length > 0) {
    lines.push(`## API Errors (not scored)`)
    lines.push(
      `These ${apiErrors.length} image(s) encountered network/service errors and are not scored:`
    )
    lines.push('')
    apiErrors.forEach((e) => {
      const attemptsStr = e.attempts ? ` (attempts: ${e.attempts})` : ''
      lines.push(`- [ ] **${e.file}**: ${e.apiError}${attemptsStr}`)
    })
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  lines.push(`## Scored Failures (${failures.length})`)
  lines.push('')

  if (failures.length === 0) {
    lines.push('All scored test images passed detection and field extraction.')
    return lines.join('\n')
  }

  failures.forEach((f, idx) => {
    lines.push(`### ${idx + 1}. \`${f.file}\` (${f.condition || 'clean'})`)
    if (f.detectionStatus === 'WRONG') {
      lines.push(
        `- [ ] **Detection**: Expected \`${f.truthIsBill ? 'bill' : 'not bill'}\`, got \`${f.predIsBill ? 'bill' : 'not bill'}\``
      )
    }
    fields.forEach((field) => {
      const item = f.fields[field]
      if (item && item.isCorrect === false) {
        const stateTag = item.isUnsure ? `CAUGHT (${item.flagSource})` : 'SILENT (confident)'
        lines.push(
          `- [ ] **${field}**: Expected \`${item.truthVal}\` vs Got \`${item.predVal}\` (conf: ${item.confidence.toFixed(2)}) [${stateTag}]`
        )
      }
    })
    lines.push('')
    lines.push('Why (my notes): ')
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Generates results.csv content.
 */
export function generateResultsCSV(records = []) {
  const rows = records.map((r) => {
    if (r.isApiError) {
      return {
        file: r.file,
        condition: r.condition,
        truth_is_bill: r.truthIsBill ? 'yes' : 'no',
        pred_is_bill: 'error',
        detection_status: 'API ERROR',
        truth_merchant: r.fields.merchant.truthVal,
        pred_merchant: '',
        merchant_conf: '',
        merchant_status: 'API ERROR',
        truth_date: r.fields.date.truthVal,
        pred_date: '',
        date_conf: '',
        date_status: 'API ERROR',
        truth_total: r.fields.total.truthVal,
        pred_total: '',
        total_conf: '',
        total_status: 'API ERROR',
        truth_category: r.fields.category.truthVal,
        pred_category: '',
        category_conf: '',
        category_status: 'API ERROR',
        ms: '',
      }
    }

    return {
      file: r.file,
      condition: r.condition,
      truth_is_bill: r.truthIsBill ? 'yes' : 'no',
      pred_is_bill: r.predIsBill ? 'yes' : 'no',
      detection_status: r.detectionStatus,
      truth_merchant: r.fields.merchant.truthVal,
      pred_merchant: r.fields.merchant.predVal ?? '',
      merchant_conf: r.fields.merchant.confidence,
      merchant_status: r.fields.merchant.status,
      truth_date: r.fields.date.truthVal,
      pred_date: r.fields.date.predVal ?? '',
      date_conf: r.fields.date.confidence,
      date_status: r.fields.date.status,
      truth_total: r.fields.total.truthVal,
      pred_total: r.fields.total.predVal ?? '',
      total_conf: r.fields.total.confidence,
      total_status: r.fields.total.status,
      truth_category: r.fields.category.truthVal,
      pred_category: r.fields.category.predVal ?? '',
      category_conf: r.fields.category.confidence,
      category_status: r.fields.category.status,
      ms: r.ms ?? '',
    }
  })

  return toCSV(rows)
}

/**
 * Saves all reports to eval/out/<model-name>/
 */
export function saveReports({
  outDir,
  model,
  records,
  summary,
  sweepResults,
  overridesApplied,
  runs,
  consistencyStats,
}) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // 1. RESULTS.md
  const mdContent = generateResultsMarkdown({
    model,
    records,
    summary,
    sweepResults,
    overridesApplied,
    runs,
    consistencyStats,
  })
  fs.writeFileSync(path.join(outDir, 'RESULTS.md'), mdContent, 'utf-8')

  // 2. failures.md
  const failContent = generateFailuresMarkdown({ model, records })
  fs.writeFileSync(path.join(outDir, 'failures.md'), failContent, 'utf-8')

  // 3. results.csv
  const csvContent = generateResultsCSV(records)
  fs.writeFileSync(path.join(outDir, 'results.csv'), csvContent, 'utf-8')
}
