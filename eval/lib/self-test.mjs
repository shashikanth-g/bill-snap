import assert from 'node:assert'
import { UNSURE_BELOW } from '../../src/lib/config.js'
import { isFieldUnsure, evaluateFields } from '../../src/lib/fieldState.js'
import { judgeAll, runThresholdSweep } from './judge.js'
import { generateResultsMarkdown, generateFailuresMarkdown } from './report.js'

const today = new Date('2026-11-06T00:00:00')

// Calculate date 500 days ago relative to reference today
const date500DaysAgo = new Date(today.getTime() - 500 * 24 * 60 * 60 * 1000)
const date500DaysAgoStr = date500DaysAgo.toISOString().slice(0, 10)

// Calculate future date (4 days ahead)
const futureDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)
const futureDateStr = futureDate.toISOString().slice(0, 10)

const testCases = [
  // 1. Null / empty values
  { field: 'merchant', value: null, confidence: 0.95, expectedUnsure: true, label: 'merchant null value' },
  { field: 'merchant', value: '', confidence: 0.95, expectedUnsure: true, label: 'merchant empty string' },
  { field: 'date', value: null, confidence: 0.95, expectedUnsure: true, label: 'date null value' },
  { field: 'total', value: null, confidence: 0.95, expectedUnsure: true, label: 'total null value' },
  { field: 'category', value: null, confidence: 0.95, expectedUnsure: true, label: 'category null value' },

  // 2. Confidence thresholds (0.79 vs 0.8)
  { field: 'merchant', value: 'Starbucks', confidence: 0.79, expectedUnsure: true, label: 'merchant conf 0.79 (< 0.8)' },
  { field: 'merchant', value: 'Starbucks', confidence: 0.8, expectedUnsure: false, label: 'merchant conf 0.8 (boundary ok)' },
  { field: 'date', value: '2026-11-05', confidence: 0.79, expectedUnsure: true, label: 'date conf 0.79 (< 0.8)' },
  { field: 'date', value: '2026-11-05', confidence: 0.8, expectedUnsure: false, label: 'date conf 0.8 (boundary ok)' },
  { field: 'total', value: 450.5, confidence: 0.79, expectedUnsure: true, label: 'total conf 0.79 (< 0.8)' },
  { field: 'total', value: 450.5, confidence: 0.8, expectedUnsure: false, label: 'total conf 0.8 (boundary ok)' },
  { field: 'category', value: 'food', confidence: 0.79, expectedUnsure: true, label: 'category conf 0.79 (< 0.8)' },
  { field: 'category', value: 'food', confidence: 0.8, expectedUnsure: false, label: 'category conf 0.8 (boundary ok)' },

  // 3. Date rules: future date and date 500 days old
  { field: 'date', value: futureDateStr, confidence: 0.95, expectedUnsure: true, label: 'date in future (2026-11-10)' },
  { field: 'date', value: date500DaysAgoStr, confidence: 0.95, expectedUnsure: true, label: 'date 500 days old (> 400)' },

  // 4. Total rules: total equal to 0, total above BIG_AMOUNT (100001)
  { field: 'total', value: 0, confidence: 0.95, expectedUnsure: true, label: 'total equal to 0' },
  { field: 'total', value: 100001, confidence: 0.95, expectedUnsure: true, label: 'total of 100001 (> BIG_AMOUNT)' },
  { field: 'total', value: 100000, confidence: 0.85, expectedUnsure: false, label: 'total of 100000 (boundary ok)' },

  // 5. Normal good values
  { field: 'merchant', value: 'Apollo Pharmacy', confidence: 0.95, expectedUnsure: false, label: 'normal good merchant' },
  { field: 'date', value: '2026-11-05', confidence: 0.92, expectedUnsure: false, label: 'normal good date (yesterday)' },
  { field: 'total', value: 750.25, confidence: 0.88, expectedUnsure: false, label: 'normal good total' },
  { field: 'category', value: 'groceries', confidence: 0.91, expectedUnsure: false, label: 'normal good category' },
]

console.log('Running self-test: comparing isFieldUnsure with evaluateFields...\n')

const resultsTable = []
let passedCount = 0

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i]

  // 1. Test isFieldUnsure directly
  const directUnsure = isFieldUnsure(tc.field, tc.value, tc.confidence, UNSURE_BELOW, today)

  // 2. Test via evaluateFields with the same input
  const baseAnalysis = {
    merchant: { value: 'Default Store', confidence: 0.9 },
    date: { value: '2026-11-05', confidence: 0.9 },
    total: { value: 100, confidence: 0.9 },
    category: { value: 'food', confidence: 0.9 },
  }
  baseAnalysis[tc.field] = {
    value: tc.value,
    confidence: tc.confidence,
  }

  const evaluated = evaluateFields(baseAnalysis, today)
  const evalFieldState = evaluated[tc.field].state
  const evalUnsure = evalFieldState === 'unsure'

  // 3. Compare direct and evaluateFields results
  assert.strictEqual(
    directUnsure,
    evalUnsure,
    `Disagreement on case #${i + 1} (${tc.label}): isFieldUnsure=${directUnsure} vs evaluateFields=${evalUnsure}`
  )

  // 4. Compare with expected unsure state
  assert.strictEqual(
    directUnsure,
    tc.expectedUnsure,
    `Unexpected unsure result on case #${i + 1} (${tc.label}): got ${directUnsure}, expected ${tc.expectedUnsure}`
  )

  passedCount++
  resultsTable.push({
    '#': String(i + 1).padStart(2, '0'),
    Field: tc.field.padEnd(8),
    'Input Value': String(tc.value ?? 'null').slice(0, 16).padEnd(16),
    Conf: tc.confidence.toFixed(2),
    isFieldUnsure: directUnsure ? 'unsure' : 'ok    ',
    evaluateFields: evalFieldState.padEnd(6),
    Verdict: 'MATCH',
    Case: tc.label,
  })
}

// Print formatted test results
console.log('#  | Field    | Input Value      | Conf | isFieldUnsure | evaluateFields | Verdict | Description')
console.log('---|----------|------------------|------|---------------|----------------|---------|---------------------------------')
resultsTable.forEach((r) => {
  console.log(`${r['#']} | ${r.Field} | ${r['Input Value']} | ${r.Conf} | ${r.isFieldUnsure}        | ${r.evaluateFields}         | ${r.Verdict}   | ${r.Case}`)
})

console.log(`\nField tests PASSED: ${passedCount}/${testCases.length} cases matched perfectly. Zero disagreements.\n`)

// 6. Test API errors exclusion, correctly left blank, and confidence distribution
console.log('Testing evaluation scoring logic (API errors exclusion, blank fields, distribution, sweep)...')

const mockGroundTruth = [
  {
    file: 'b01.jpg',
    is_bill: 'yes',
    merchant: 'Apollo Pharmacy',
    date: '2026-11-05',
    total: '100.00',
    category: 'health',
    condition: 'clean',
  },
  {
    file: 'b02.jpg',
    is_bill: 'yes',
    merchant: '', // Blank ground truth!
    date: '2026-11-05',
    total: '200.00',
    category: 'food',
    condition: 'clean',
  },
  {
    file: 'b03.jpg',
    is_bill: 'yes',
    merchant: 'Test Store',
    date: '2026-11-05',
    total: '300.00',
    category: 'shopping',
    condition: 'clean',
  },
]

const mockPredictions = {
  'b01.jpg': {
    is_bill: true,
    merchant: { value: 'Apollo Pharmacy', confidence: 0.98 },
    date: { value: '2026-11-05', confidence: 0.90 },
    total: { value: 100.0, confidence: 0.85 },
    category: { value: 'health', confidence: 0.70 }, // Correct, but conf < 0.80 -> unnecessary flag by AI
    _meta: { ms: 1200, attempts: 1 },
  },
  'b02.jpg': {
    is_bill: true,
    merchant: { value: null, confidence: 0 }, // Correctly left blank!
    date: { value: '2025-01-01', confidence: 0.95 }, // Wrong date, conf 0.95 -> caught by app rule (old date > 400 days)
    total: { value: 999.0, confidence: 0.60 }, // Wrong total, conf 0.60 -> caught by AI confidence
    category: { value: 'other', confidence: 0.95 }, // Wrong category, conf 0.95 -> silent error
    _meta: { ms: 1500, attempts: 1 },
  },
  'b03.jpg': {
    error: 'Analysis timed out',
    attempts: 2,
  },
}

const { records, summary } = judgeAll({
  groundTruths: mockGroundTruth,
  predictions: mockPredictions,
  threshold: 0.8,
  today,
})

// Requirement 1: API error is excluded from scored records
assert.strictEqual(summary.totalImages, 3, 'Total images must be 3')
assert.strictEqual(summary.scoredImagesCount, 2, 'Scored images must be 2 (b03 excluded)')
assert.strictEqual(summary.apiErrors.length, 1, '1 API error recorded')
assert.strictEqual(summary.apiErrors[0].file, 'b03.jpg')
assert.strictEqual(summary.apiErrors[0].attempts, 2)
assert.strictEqual(summary.confusion.tp, 2, 'TP must be 2')
assert.strictEqual(summary.detectionAccuracy, 100, 'Detection accuracy must be 100% over scored images')

// Requirement 3: Correctly left blank counter
assert.strictEqual(summary.honesty.correctlyLeftBlank, 1, 'b02 merchant must be correctly left blank')

// Requirement 4: Split by source
assert.strictEqual(summary.honesty.unnecessaryFlags, 1, '1 unnecessary flag')
assert.strictEqual(summary.honesty.unnecessarySplit.byAi, 1, 'b01 category flagged by AI confidence')
assert.strictEqual(summary.honesty.caughtErrors, 2, '2 caught errors')
assert.strictEqual(summary.honesty.caughtSplit.byRules, 1, 'b02 date caught by app rules (old date)')
assert.strictEqual(summary.honesty.caughtSplit.byAi, 1, 'b02 total caught by AI confidence (0.60 < 0.8)')
assert.strictEqual(summary.honesty.silentErrors, 1, 'b02 category silent error (conf 0.95)')

// Requirement 5: Confidence distribution
const dist = summary.confidenceDistribution
assert.strictEqual(dist.correct.above95, 1, 'b01 merchant conf 0.98 in above95')
assert.strictEqual(dist.wrong.from05to08, 1, 'b02 total conf 0.60 in from05to08')
assert.strictEqual(dist.wrong.above95, 2, 'b02 date (0.95) & category (0.95) in above95')

// Requirement 4: Threshold sweep uses ONLY AI confidence
const sweep = runThresholdSweep({
  groundTruths: mockGroundTruth,
  predictions: mockPredictions,
  thresholds: [0.5, 0.8, 0.95],
})
assert.strictEqual(sweep.length, 3)
// At threshold 0.8:
// b02 date has conf 0.95 -> under AI-only sweep, it is NOT caught at 0.8! (Caught only at th > 0.95)
const sweep08 = sweep.find((s) => s.threshold === 0.8)
assert.strictEqual(sweep08.caughtErrors, 1, 'Only total (0.60) caught by AI conf at threshold 0.8')

// Requirement 2: Check report markdown does NOT have literal text
const md = generateResultsMarkdown({
  model: 'test-model',
  records,
  summary,
  sweepResults: sweep,
})
assert(!md.includes('${trueBillsCount}'), 'Report must not contain literal ${trueBillsCount}')
assert(!md.includes('${confusion.tp}'), 'Report must not contain literal ${confusion.tp}')
assert(md.includes('| Field | Accuracy (All 2 True Bills) | Accuracy (Detected 2 Bills Only) |'))
assert(md.includes('- **Scored**: 2 of 3 images'))
assert(md.includes('## API Errors (not scored)'))
assert(md.includes('Analysis timed out (attempts: 2)'))
assert(md.includes('## Confidence Distribution'))

// Check failures markdown excludes API errors from scored failures
const failMd = generateFailuresMarkdown({ model: 'test-model', records })
assert(failMd.includes('## API Errors (not scored)'))
assert(failMd.includes('Analysis timed out (attempts: 2)'))
assert(!failMd.includes('- [ ] **b03.jpg**: Detection: Expected `bill`'), 'API error must not be listed as a missed bill')

console.log('✓ API errors correctly excluded from scoring and confidence stats')
console.log('✓ Blank ground-truth matching null AI prediction counted as "correctly left blank"')
console.log('✓ Confidence analysis split by source (AI confidence vs app rules)')
console.log('✓ Confidence distribution buckets computed')
console.log('✓ Threshold sweep uses ONLY AI confidence')
console.log('✓ Template literal interpolation in markdown reports fixed')

console.log('\nAll self-tests passed successfully!')
